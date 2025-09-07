import { constants, promises as fs } from "fs";
import { dirname, resolve } from "path";
import { CSVData } from "../models";
import { CSVConverterError, ErrorHandler } from "./ErrorHandler";
import { getLogger } from "./Logger";

/**
 * Interface for CSV output functionality
 */
export interface CSVWriter {
  /**
   * Write CSV data to output file
   */
  write(data: CSVData, outputPath: string): Promise<void>;

  /**
   * Format a row for CSV output
   */
  formatRow(row: string[]): string;
}

/**
 * Implementation of CSV writer with proper formatting and escaping
 */
export class CSVWriterImpl implements CSVWriter {
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();
  /**
   * Write CSV data to output file
   * @param data The CSV data to write
   * @param outputPath The path where to write the CSV file
   */
  async write(data: CSVData, outputPath: string): Promise<void> {
    this.logger.debug(`Writing CSV data to: ${outputPath}`);

    try {
      // Validate input data
      this.validateCSVData(data);

      // Validate output path before resolving
      await this.validateOutputPath(outputPath);

      // Resolve output path
      const resolvedPath = resolve(outputPath);

      // Ensure output directory exists and is writable
      const outputDir = dirname(resolvedPath);
      await this.ensureDirectoryWritable(outputDir);

      // Format headers and rows
      const headerRow = this.formatRow(data.headers);
      const dataRows = data.rows.map((row) => this.formatRow(row));

      // Combine all rows
      const csvContent = [headerRow, ...dataRows].join("\n");

      // Write to file with additional error handling
      await this.writeFileWithValidation(resolvedPath, csvContent);

      this.logger.info(`Successfully wrote CSV file: ${outputPath}`, {
        headers: data.headers.length,
        rows: data.rows.length,
      });
    } catch (error) {
      if (error instanceof CSVConverterError) {
        throw error; // Re-throw our structured errors
      }

      const structuredError = this.errorHandler.handleFileError(
        error,
        outputPath,
        "write"
      );
      this.logger.error(`Failed to write CSV file: ${outputPath}`, structuredError);
      throw structuredError;
    }
  }

  /**
   * Validate CSV data before writing
   * @param data The CSV data to validate
   */
  private validateCSVData(data: CSVData): void {
    if (!data) {
      throw this.errorHandler.handleValidationError(
        "CSV data cannot be null or undefined"
      );
    }

    if (!Array.isArray(data.headers)) {
      throw this.errorHandler.handleValidationError("CSV headers must be an array");
    }

    if (!Array.isArray(data.rows)) {
      throw this.errorHandler.handleValidationError("CSV rows must be an array");
    }

    if (data.headers.length === 0) {
      throw this.errorHandler.handleValidationError(
        "CSV must have at least one header column"
      );
    }

    // Validate that all rows have the same number of columns as headers
    for (let i = 0; i < data.rows.length; i++) {
      if (!Array.isArray(data.rows[i])) {
        throw this.errorHandler.handleValidationError(`Row ${i + 1} must be an array`, {
          line: i + 1,
        });
      }
      if (data.rows[i].length !== data.headers.length) {
        throw this.errorHandler.handleValidationError(
          `Row ${i + 1} has ${data.rows[i].length} columns but expected ${
            data.headers.length
          } columns`,
          { line: i + 1, expected: data.headers.length, actual: data.rows[i].length }
        );
      }
    }
  }

  /**
   * Validate output path
   * @param outputPath The output path to validate
   */
  private async validateOutputPath(outputPath: string): Promise<void> {
    if (!outputPath || typeof outputPath !== "string") {
      throw this.errorHandler.handleValidationError(
        "Output path must be a non-empty string"
      );
    }

    if (outputPath.trim().length === 0) {
      throw this.errorHandler.handleValidationError(
        "Output path cannot be empty or whitespace only"
      );
    }
  }

  /**
   * Ensure directory exists and is writable
   * @param dirPath The directory path to check
   */
  private async ensureDirectoryWritable(dirPath: string): Promise<void> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true });

      // Check if directory is writable
      await fs.access(dirPath, constants.W_OK);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
          throw new Error(
            `Permission denied: Cannot write to directory '${dirPath}'. Please check directory permissions.`
          );
        }
        if (error.message.includes("ENOTDIR")) {
          throw new Error(`Invalid path: '${dirPath}' is not a directory`);
        }
        if (error.message.includes("ENOENT")) {
          throw new Error(
            `Directory creation failed: Cannot create directory '${dirPath}'`
          );
        }
      }
      throw new Error(
        `Directory access error for '${dirPath}': ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Write file with additional validation
   * @param filePath The file path to write to
   * @param content The content to write
   */
  private async writeFileWithValidation(
    filePath: string,
    content: string
  ): Promise<void> {
    try {
      await fs.writeFile(filePath, content, "utf8");

      // Verify the file was written successfully
      const stats = await fs.stat(filePath);
      if (stats.size === 0 && content.length > 0) {
        throw new Error("File was created but appears to be empty");
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("EACCES") || error.message.includes("EPERM")) {
          throw new Error(
            `Permission denied: Cannot write to file '${filePath}'. Please check file and directory permissions.`
          );
        }
        if (error.message.includes("ENOSPC")) {
          throw new Error(`Insufficient disk space: Cannot write to file '${filePath}'`);
        }
        if (error.message.includes("EMFILE") || error.message.includes("ENFILE")) {
          throw new Error(`Too many open files: Cannot write to file '${filePath}'`);
        }
      }
      throw new Error(
        `File write error for '${filePath}': ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Format a row for CSV output with proper quoting and escaping
   * @param row Array of field values
   * @returns Formatted CSV row string
   */
  formatRow(row: string[]): string {
    return row.map((field) => this.formatField(field)).join(",");
  }

  /**
   * Format a single field with proper CSV escaping
   * @param field The field value to format
   * @returns Properly escaped and quoted field
   */
  private formatField(field: string): string {
    // Convert to string if not already
    const fieldStr = String(field);

    // Check if field needs quoting (contains comma, quote, newline, or starts/ends with whitespace)
    const needsQuoting =
      fieldStr.includes(",") ||
      fieldStr.includes('"') ||
      fieldStr.includes("\n") ||
      fieldStr.includes("\r") ||
      fieldStr.trim() !== fieldStr;

    if (needsQuoting) {
      // Escape existing quotes by doubling them
      const escapedField = fieldStr.replace(/"/g, '""');
      return `"${escapedField}"`;
    }

    return fieldStr;
  }
}
