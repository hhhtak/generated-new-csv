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
