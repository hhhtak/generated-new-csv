import csvParser from "csv-parser";
import * as fs from "fs";
import { CSVData } from "../models";

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
  /**
   * Parse a CSV file and return structured data with headers and rows separated
   */
  async parse(filePath: string): Promise<CSVData> {
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      let headers: string[] = [];
      let lineNumber = 1; // Track line numbers for error reporting

      // Check if file exists and is readable
      if (!fs.existsSync(filePath)) {
        reject(new Error(`入力ファイル '${filePath}' が見つからないか読み取れません`));
        return;
      }

      // Check file permissions
      try {
        fs.accessSync(filePath, fs.constants.R_OK);
      } catch (error) {
        reject(new Error(`入力ファイル '${filePath}' が見つからないか読み取れません`));
        return;
      }

      // Check if file is empty
      const stats = fs.statSync(filePath);
      if (stats.size === 0) {
        reject(new Error(`入力ファイル '${filePath}' は空です`));
        return;
      }

      const stream = fs.createReadStream(filePath);

      stream
        .pipe(csvParser())
        .on("headers", (headerList: string[]) => {
          headers = headerList;
          lineNumber++; // Headers are on line 1, data starts from line 2

          // Validate headers
          if (!this.validateHeaders(headers)) {
            reject(new Error(`CSV形式が無効です: ヘッダーが空または重複しています`));
            return;
          }
        })
        .on("data", (data: any) => {
          try {
            // Convert object back to array format for consistent processing
            const row = headers.map((header) => data[header] || "");

            // Validate row structure
            if (!this.validateRowStructure(row, headers.length, lineNumber)) {
              reject(new Error(`CSV形式が無効です: ${lineNumber}行目の列数が不正です`));
              return;
            }

            results.push(row);
            lineNumber++;
          } catch (error) {
            reject(
              new Error(
                `CSV解析エラー: ${lineNumber}行目で解析に失敗しました - ${
                  error instanceof Error ? error.message : String(error)
                }`
              )
            );
            return;
          }
        })
        .on("error", (error: Error) => {
          // Enhanced error reporting with line numbers when possible
          const errorMessage = error.message.includes("line")
            ? `CSV解析エラー: ${error.message}`
            : `CSV解析エラー: ${lineNumber}行目付近で解析に失敗しました - ${error.message}`;
          reject(new Error(errorMessage));
        })
        .on("end", () => {
          try {
            // Final validation of the complete dataset
            const csvData: CSVData = {
              headers,
              rows: results,
            };

            if (!this.validateCompleteData(csvData)) {
              reject(new Error(`CSV構造が無効です: データの整合性に問題があります`));
              return;
            }

            resolve(csvData);
          } catch (error) {
            reject(
              new Error(
                `CSV検証エラー: ${error instanceof Error ? error.message : String(error)}`
              )
            );
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
