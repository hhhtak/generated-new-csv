import { CSVData, DeleteCondition, TransformationConfig } from "../models";
import { CSVConverterError, ErrorHandler } from "../utils/ErrorHandler";
import { getLogger } from "../utils/Logger";

/**
 * Interface for data deletion operations
 */
export interface DataDeleter {
  /**
   * Delete rows based on specified conditions
   */
  deleteRows(data: CSVData, conditions: DeleteCondition[]): CSVData;
}

/**
 * Implementation of data deletion operations
 */
export class DataDeleterImpl implements DataDeleter {
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();

  /**
   * Delete rows based on specified conditions
   */
  deleteRows(data: CSVData, conditions: DeleteCondition[]): CSVData {
    this.logger.debug("Starting row deletion", {
      originalRows: data.rows.length,
      conditions: conditions.length,
    });

    try {
      // Create mapping from header name to column index
      const headerIndexMap = new Map<string, number>();
      data.headers.forEach((header, index) => {
        headerIndexMap.set(header, index);
      });

      // Validate that all condition columns exist
      const missingColumns = conditions
        .map((condition) => condition.column)
        .filter((column) => !headerIndexMap.has(column));

      if (missingColumns.length > 0) {
        throw this.errorHandler.handleTransformationError(
          `Invalid delete conditions: Delete condition references non-existent column: '${missingColumns.join("', '")}'`,
          {
            missingColumns,
            availableHeaders: data.headers,
            conditions,
          },
        );
      }

      // Filter rows based on conditions
      const filteredRows = data.rows.filter((row) => {
        // Row is kept if it doesn't match ALL of the delete conditions
        // A row is deleted only if it matches ALL conditions (AND logic)
        const matchesAllConditions = conditions.every((condition) => {
          const columnIndex = headerIndexMap.get(condition.column);
          if (columnIndex === undefined) return false;

          const cellValue = row[columnIndex] || "";

          // Check if cell value matches any of the condition values
          if (Array.isArray(condition.value)) {
            return condition.value.includes(cellValue);
          } else {
            return cellValue === condition.value;
          }
        });

        // Keep the row if it doesn't match all conditions
        return !matchesAllConditions;
      });

      const deletedCount = data.rows.length - filteredRows.length;
      this.logger.info("Row deletion completed", {
        originalRows: data.rows.length,
        remainingRows: filteredRows.length,
        deletedRows: deletedCount,
      });

      return {
        headers: [...data.headers],
        rows: filteredRows,
      };
    } catch (error) {
      if (error instanceof CSVConverterError) {
        throw error;
      }

      const structuredError = this.errorHandler.handleTransformationError(
        error instanceof Error ? error.message : "Unknown deletion error",
        { originalHeaders: data.headers, conditions },
      );
      this.logger.error("Row deletion failed", structuredError);
      throw structuredError;
    }
  }
}

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
    replacements: Record<string, Record<string, string>>,
  ): CSVData;

  /**
   * Map headers to new names
   */
  mapHeaders(data: CSVData, mappings: Record<string, string | string[]>): CSVData;

  /**
   * Add fixed columns with constant values
   */
  addFixedColumns(data: CSVData, fixedColumns: Record<string, string | number>): CSVData;
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
        transformedData = this.mapHeaders(transformedData, config.headerMappings);
      }

      // Add fixed columns before column reordering
      if (config.fixedColumns) {
        this.logger.debug("Adding fixed columns", {
          columns: Object.keys(config.fixedColumns).length,
        });
        transformedData = this.addFixedColumns(transformedData, config.fixedColumns);
      }

      // Apply column reordering (after fixed columns are added)
      if (config.columnOrder) {
        this.logger.debug("Applying column reordering", {
          order: config.columnOrder,
        });
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
        { originalHeaders: data.headers, config },
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
          ", ",
        )}' が入力CSVに見つかりません`,
        {
          missingColumns,
          availableHeaders: data.headers,
          requestedOrder: order,
        },
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
          { header, availableHeaders: data.headers },
        );
      }
      return index;
    });

    // Reorder headers
    const reorderedHeaders = order.slice();

    // Reorder data rows
    const reorderedRows = data.rows.map((row) =>
      columnIndices.map((index) => row[index] || ""),
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
    replacements: Record<string, Record<string, string>>,
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
  mapHeaders(data: CSVData, mappings: Record<string, string | string[]>): CSVData {
    const newHeaders: string[] = [];
    const headerMap: (string | string[] | null)[] = []; // Maps old index to new header(s)

    // Determine new headers and create mapping from old index
    for (const originalHeader of data.headers) {
      const mapping = mappings[originalHeader];
      if (mapping) {
        if (Array.isArray(mapping)) {
          newHeaders.push(...mapping);
          headerMap.push(mapping);
        } else {
          newHeaders.push(mapping);
          headerMap.push(mapping);
        }
      } else {
        // Preserve original header if no mapping exists
        newHeaders.push(originalHeader);
        headerMap.push(null); // Indicates no mapping
      }
    }

    // Transform rows based on the header map
    const newRows = data.rows.map((oldRow) => {
      const newRow: string[] = [];
      oldRow.forEach((cellValue, index) => {
        const mapping = headerMap[index];
        if (Array.isArray(mapping)) {
          // 1-to-many: duplicate the value for each new column
          mapping.forEach(() => newRow.push(cellValue));
        } else {
          // 1-to-1 or no mapping: just push the value
          newRow.push(cellValue);
        }
      });
      return newRow;
    });

    return { headers: newHeaders, rows: newRows };
  }

  /**
   * Add fixed columns with constant values
   * Validates that fixed column names don't conflict with existing columns
   */
  addFixedColumns(data: CSVData, fixedColumns: Record<string, string | number>): CSVData {
    // Check for duplicate column names
    const duplicateColumns = Object.keys(fixedColumns).filter((columnName) =>
      data.headers.includes(columnName),
    );

    if (duplicateColumns.length > 0) {
      throw this.errorHandler.handleTransformationError(
        `固定列の名前が既存の列と重複しています: '${duplicateColumns.join(", ")}'`,
        {
          duplicateColumns,
          existingHeaders: data.headers,
          fixedColumns: Object.keys(fixedColumns),
        },
      );
    }

    // Add fixed column headers
    const newHeaders = [...data.headers, ...Object.keys(fixedColumns)];

    // Add fixed column values to each row
    const newRows = data.rows.map((row) => {
      const newRow = [...row];
      Object.values(fixedColumns).forEach((value) => {
        newRow.push(String(value));
      });
      return newRow;
    });

    return {
      headers: newHeaders,
      rows: newRows,
    };
  }
}
