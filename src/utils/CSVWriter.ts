import { CSVData } from "../models";

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
