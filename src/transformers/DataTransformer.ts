import { CSVData, TransformationConfig } from "../models";
import { CSVConverterError, ErrorHandler } from "../utils/ErrorHandler";
import { getLogger } from "../utils/Logger";

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

/**
 * Implementation of data transformation operations
 */
export class DataTransformerImpl implements DataTransformer {
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();
  /**
   * Apply all transformations based on configuration
   */
  transform(data: CSVData, config: TransformationConfig): CSVData {
    this.logger.debug("Starting data transformation", {
      headers: data.headers.length,
      rows: data.rows.length,
      hasHeaderMappings: !!config.headerMappings,
      hasColumnOrder: !!config.columnOrder,
      hasValueReplacements: !!config.valueReplacements,
    });

    try {
      let transformedData = { ...data };

      // Apply header mappings first
      if (config.headerMappings) {
        this.logger.debug("Applying header mappings", {
          mappings: Object.keys(config.headerMappings).length,
        });
        transformedData.headers = this.mapHeaders(
          transformedData.headers,
          config.headerMappings
        );
      }

      // Apply column reordering
      if (config.columnOrder) {
        this.logger.debug("Applying column reordering", { order: config.columnOrder });
        transformedData = this.reorderColumns(transformedData, config.columnOrder);
      }

      // Apply value replacements
      if (config.valueReplacements) {
        this.logger.debug("Applying value replacements", {
          columns: Object.keys(config.valueReplacements).length,
        });
        transformedData = this.replaceValues(transformedData, config.valueReplacements);
      }

      this.logger.info("Data transformation completed successfully", {
        originalHeaders: data.headers.length,
        transformedHeaders: transformedData.headers.length,
        rows: transformedData.rows.length,
      });

      return transformedData;
    } catch (error) {
      if (error instanceof CSVConverterError) {
        throw error;
      }

      const structuredError = this.errorHandler.handleTransformationError(
        error instanceof Error ? error.message : "Unknown transformation error",
        { originalHeaders: data.headers, config }
      );
      this.logger.error("Data transformation failed", structuredError);
      throw structuredError;
    }
  }

  /**
   * Reorder columns according to specified order
   * Validates that all specified columns exist in the input data
   */
  reorderColumns(data: CSVData, order: string[]): CSVData {
    // Validate that all specified columns exist in the input data
    const missingColumns = order.filter((col) => !data.headers.includes(col));
    if (missingColumns.length > 0) {
      throw this.errorHandler.handleTransformationError(
        `columnOrderで指定された列 '${missingColumns.join(
          ", "
        )}' が入力CSVに見つかりません`,
        { missingColumns, availableHeaders: data.headers, requestedOrder: order }
      );
    }

    // Create mapping from header name to column index
    const headerIndexMap = new Map<string, number>();
    data.headers.forEach((header, index) => {
      headerIndexMap.set(header, index);
    });

    // Get the indices for the desired column order
    const columnIndices = order.map((header) => {
      const index = headerIndexMap.get(header);
      if (index === undefined) {
        throw this.errorHandler.handleTransformationError(
          `列 '${header}' が見つかりません`,
          { header, availableHeaders: data.headers }
        );
      }
      return index;
    });

    // Reorder headers
    const reorderedHeaders = order.slice();

    // Reorder data rows
    const reorderedRows = data.rows.map((row) =>
      columnIndices.map((index) => row[index] || "")
    );

    return {
      headers: reorderedHeaders,
      rows: reorderedRows,
    };
  }

  /**
   * Replace values in specified columns
   * Applies all applicable replacement rules for each column
   */
  replaceValues(
    data: CSVData,
    replacements: Record<string, Record<string, string>>
  ): CSVData {
    // Create mapping from header name to column index
    const headerIndexMap = new Map<string, number>();
    data.headers.forEach((header, index) => {
      headerIndexMap.set(header, index);
    });

    // Create a copy of the data to avoid mutation
    const transformedRows = data.rows.map((row) => [...row]);

    // Apply replacements for each column
    Object.entries(replacements).forEach(([columnName, columnReplacements]) => {
      const columnIndex = headerIndexMap.get(columnName);

      // Skip if column doesn't exist in the data
      if (columnIndex === undefined) {
        return;
      }

      // Apply replacements to each row
      transformedRows.forEach((row) => {
        const currentValue = row[columnIndex];
        if (
          currentValue !== undefined &&
          columnReplacements.hasOwnProperty(currentValue)
        ) {
          row[columnIndex] = columnReplacements[currentValue];
        }
      });
    });

    return {
      headers: [...data.headers],
      rows: transformedRows,
    };
  }

  /**
   * Map headers to new names
   * If no mapping is provided for a header, the original name is preserved
   */
  mapHeaders(headers: string[], mappings: Record<string, string>): string[] {
    return headers.map((header) => {
      // Return mapped name if mapping exists, otherwise preserve original name
      return mappings.hasOwnProperty(header) ? mappings[header] : header;
    });
  }
}
