import csvParser from "csv-parser";
import * as fs from "fs";
import { CSVData } from "../models";
import { ErrorHandler } from "../utils/ErrorHandler";
import { getLogger } from "../utils/Logger";

/**
 * Interface for CSV parsing functionality
 */
export interface CSVParser {
  /**
   * Parse a CSV file and return structured data
   */
  parse(filePath: string): Promise<CSVData>;

  /**
   * Validate CSV data structure
   */
  validate(data: string[][]): boolean;
}

/**
 * Implementation of CSV parser with header detection and enhanced validation
 */
export class CSVParserImpl implements CSVParser {
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();
  /**
   * Parse a CSV file and return structured data with headers and rows separated
   */
  async parse(filePath: string): Promise<CSVData> {
    this.logger.debug(`Starting CSV parsing: ${filePath}`);

    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let headers: string[] = [];
      let lineNumber = 1; // Track line numbers for error reporting

      // Check if file exists and is readable
      if (!fs.existsSync(filePath)) {
        const error = this.errorHandler.handleFileError(
          { code: "ENOENT" },
          filePath,
          "read"
        );
        this.logger.error(`File not found: ${filePath}`, error);
        reject(error);
        return;
      }

      // Check file permissions
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (error) {
        const structuredError = this.errorHandler.handleFileError(
          error,
          filePath,
          "read"
        );
        this.logger.error(`File access denied: ${filePath}`, structuredError);
        reject(structuredError);
        return;
      }

      // Check if file is empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        const error = this.errorHandler.handleCSVError(
          new Error(`入力ファイル '${filePath}' は空です`),
          { file: filePath }
        );
        this.logger.error(`Empty file: ${filePath}`, error);
        reject(error);
        return;
      }

      const stream = fs.createReadStream(filePath);

      stream
        .pipe(csvParser())
        .on("headers", (headerList: string[]) => {
          // Strip BOM from first header if present
          if (headerList.length > 0 && headerList[0].charCodeAt(0) === 0xfeff) {
            headerList[0] = headerList[0].substring(1);
          }

          headers = headerList;
          lineNumber++; // Headers are on line 1, data starts from line 2

          // Validate headers
          if (!this.validateHeaders(headers)) {
            const error = this.errorHandler.handleCSVError(
              new Error(`CSV形式が無効です: ヘッダーが空または重複しています`),
              { file: filePath, line: 1 }
            );
            this.logger.error(`Invalid CSV headers: ${filePath}`, error);
            reject(error);
            return;
          }
        })
        .on("data", (data: any) => {
          try {
            // Convert object back to array format for consistent processing
            const row = headers.map((header) => data[header] || "");

            // Validate row structure
            if (!this.validateRowStructure(row, headers.length, lineNumber)) {
              const error = this.errorHandler.handleCSVError(
                new Error(`CSV形式が無効です: ${lineNumber}行目の列数が不正です`),
                { file: filePath, line: lineNumber }
              );
              this.logger.error(`Invalid CSV row structure: ${filePath}`, error);
              reject(error);
              return;
            }

            results.push(row);
            lineNumber++;
          } catch (error) {
            const structuredError = this.errorHandler.handleCSVError(
              error instanceof Error ? error : new Error(String(error)),
              { file: filePath, line: lineNumber }
            );
            this.logger.error(`CSV parsing error: ${filePath}`, structuredError);
            reject(structuredError);
            return;
          }
        })
        .on("error", (error: Error) => {
          // Enhanced error reporting with line numbers when possible
          const structuredError = this.errorHandler.handleCSVError(error, {
            file: filePath,
            line: lineNumber,
          });
          this.logger.error(`CSV stream error: ${filePath}`, structuredError);
          reject(structuredError);
        })
        .on("end", () => {
          try {
            // Final validation of the complete dataset
            const csvData: CSVData = {
              headers,
              rows: results,
            };

            if (!this.validateCompleteData(csvData)) {
              const error = this.errorHandler.handleCSVError(
                new Error(`CSV構造が無効です: データの整合性に問題があります`),
                { file: filePath, headers: headers.length, rows: results.length }
              );
              this.logger.error(`CSV validation failed: ${filePath}`, error);
              reject(error);
              return;
            }

            this.logger.info(`Successfully parsed CSV: ${filePath}`, {
              headers: headers.length,
              rows: results.length,
            });
            resolve(csvData);
          } catch (error) {
            const structuredError = this.errorHandler.handleCSVError(
              error instanceof Error ? error : new Error(String(error)),
              { file: filePath }
            );
            this.logger.error(`CSV validation error: ${filePath}`, structuredError);
            reject(structuredError);
          }
        });

      // Handle stream errors
      stream.on("error", (error: Error) => {
        reject(new Error(`ファイル読み取りエラー: ${error.message}`));
      });
    });
  }

  /**
   * Validate headers for duplicates and empty values
   */
  private validateHeaders(headers: string[]): boolean {
    if (!headers || headers.length === 0) {
      return false;
    }

    // Check for empty headers
    if (headers.some((header) => !header || header.trim() === "")) {
      return false;
    }

    // Check for duplicate headers
    const uniqueHeaders = new Set(headers);
    return uniqueHeaders.size === headers.length;
  }

  /**
   * Validate individual row structure
   */
  private validateRowStructure(
    row: string[],
    expectedColumnCount: number,
    lineNumber: number
  ): boolean {
    return row.length === expectedColumnCount;
  }

  /**
   * Validate complete CSV data structure
   */
  private validateCompleteData(data: CSVData): boolean {
    if (!data.headers || data.headers.length === 0) {
      return false;
    }

    // Empty rows are acceptable (CSV with only headers)
    if (data.rows.length === 0) {
      return true;
    }

    // Validate that all rows have consistent column count
    return this.validate(data.rows);
  }

  /**
   * Validate CSV data structure for consistency
   */
  validate(data: string[][]): boolean {
    if (!data || data.length === 0) {
      return false;
    }

    // Check if all rows have the same number of columns
    const expectedColumnCount = data[0].length;
    return data.every((row) => row.length === expectedColumnCount);
  }
}
