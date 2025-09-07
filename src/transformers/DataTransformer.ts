import { CSVData, TransformationConfig } from "../models";

/**
 * Interface for data transformation operations
 */
export interface DataTransformer {
  /**
   * Apply all transformations based on configuration
   */
  transform(data: CSVData, config: TransformationConfig): CSVData;

  /**
   * Reorder columns according to specified order
   */
  reorderColumns(data: CSVData, order: string[]): CSVData;

  /**
   * Replace values in specified columns
   */
  replaceValues(
    data: CSVData,
    replacements: Record<string, Record<string, string>>
  ): CSVData;

  /**
   * Map headers to new names
   */
  mapHeaders(headers: string[], mappings: Record<string, string>): string[];
}
