import { CSVData, DeleteCondition, ValidationResult } from "../models";
import { getLogger } from "../utils/Logger";

/**
 * Interface for data deletion operations
 */
export interface IDataDeleter {
  /**
   * Delete rows from CSV data based on delete conditions
   * @param data The CSV data to process
   * @param conditions Array of delete conditions to apply
   * @returns Modified CSV data with matching rows removed
   */
  deleteRows(data: CSVData, conditions: DeleteCondition[]): CSVData;

  /**
   * Check if a value matches a delete condition
   * @param value The value to check
   * @param condition The delete condition to match against
   * @returns True if the value matches the condition
   */
  matchesCondition(value: string, condition: DeleteCondition): boolean;

  /**
   * Validate delete conditions against CSV headers
   * @param conditions Array of delete conditions to validate
   * @param headers Array of CSV headers
   * @returns Validation result with any errors
   */
  validateConditions(
    conditions: DeleteCondition[],
    headers: string[]
  ): ValidationResult;
}

/**
 * Implementation of data deletion functionality
 */
export class DataDeleter implements IDataDeleter {
  private logger = getLogger();

  /**
   * Delete rows from CSV data based on delete conditions
   * All conditions must match for a row to be deleted (AND logic)
   */
  deleteRows(data: CSVData, conditions: DeleteCondition[]): CSVData {
    if (!conditions || conditions.length === 0) {
      this.logger.debug(
        "No delete conditions provided, returning original data"
      );
      return data;
    }

    // Validate conditions first
    const validation = this.validateConditions(conditions, data.headers);
    if (!validation.isValid) {
      throw new Error(
        `Invalid delete conditions: ${validation.errors.join(", ")}`
      );
    }

    // Create column index map for efficient lookup
    const columnIndexMap = new Map<string, number>();
    data.headers.forEach((header, index) => {
      columnIndexMap.set(header, index);
    });

    // Filter rows that don't match ALL delete conditions
    const originalRowCount = data.rows.length;
    const filteredRows = data.rows.filter((row) => {
      // Check if this row matches ALL delete conditions
      const matchesAllConditions = conditions.every((condition) => {
        const columnIndex = columnIndexMap.get(condition.column);
        if (columnIndex === undefined) {
          return false; // Column not found, don't delete
        }

        const cellValue = row[columnIndex] || "";
        return this.matchesCondition(cellValue, condition);
      });

      // Return true to keep the row (i.e., it doesn't match all delete conditions)
      return !matchesAllConditions;
    });

    const deletedCount = originalRowCount - filteredRows.length;

    if (deletedCount > 0) {
      this.logger.info(
        `Deleted ${deletedCount} rows based on delete conditions`
      );
    } else {
      this.logger.debug("No rows matched delete conditions");
    }

    return {
      headers: data.headers,
      rows: filteredRows,
    };
  }

  /**
   * Check if a value matches a delete condition
   * Supports both single values and arrays of values
   */
  matchesCondition(value: string, condition: DeleteCondition): boolean {
    if (Array.isArray(condition.value)) {
      // If condition value is an array, check if the cell value matches any of them
      return condition.value.includes(value);
    } else {
      // If condition value is a single string, check for exact match
      return value === condition.value;
    }
  }

  /**
   * Validate delete conditions against CSV headers
   */
  validateConditions(
    conditions: DeleteCondition[],
    headers: string[]
  ): ValidationResult {
    const errors: string[] = [];
    const headerSet = new Set(headers);

    for (const condition of conditions) {
      // Check if column exists in headers
      if (!headerSet.has(condition.column)) {
        errors.push(
          `Delete condition references non-existent column: '${condition.column}'`
        );
      }

      // Check if condition has valid value
      if (condition.value === undefined || condition.value === null) {
        errors.push(
          `Delete condition for column '${condition.column}' has no value specified`
        );
      } else if (Array.isArray(condition.value)) {
        // If it's an array, check that it's not empty and contains valid values
        if (condition.value.length === 0) {
          errors.push(
            `Delete condition for column '${condition.column}' has empty value array`
          );
        } else if (condition.value.some((v) => v === undefined || v === null)) {
          errors.push(
            `Delete condition for column '${condition.column}' contains null or undefined values`
          );
        }
      } else if (typeof condition.value !== "string") {
        errors.push(
          `Delete condition for column '${condition.column}' must have string value(s)`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
