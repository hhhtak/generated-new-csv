import { TransformationConfig, ValidationResult } from "./index";

/**
 * Utility functions for validating transformation configuration components
 */
export class ConfigurationValidator {
  /**
   * Validate header mappings configuration
   */
  static validateHeaderMappings(
    headerMappings: Record<string, string> | undefined
  ): ValidationResult {
    const errors: string[] = [];

    if (headerMappings === undefined) {
      return { isValid: true, errors: [] };
    }

    if (typeof headerMappings !== "object" || headerMappings === null) {
      errors.push("headerMappings must be an object");
      return { isValid: false, errors };
    }

    for (const [key, value] of Object.entries(headerMappings)) {
      if (typeof key !== "string" || typeof value !== "string") {
        errors.push("headerMappings keys and values must be strings");
        break;
      }
      if (key.trim() === "" || value.trim() === "") {
        errors.push("headerMappings keys and values cannot be empty strings");
        break;
      }
    }

    // Check for circular mappings (A -> B, B -> A)
    const reverseMap = new Map<string, string>();
    for (const [key, value] of Object.entries(headerMappings)) {
      if (reverseMap.has(value) && reverseMap.get(value) === key) {
        errors.push(`Circular mapping detected: '${key}' <-> '${value}'`);
      }
      reverseMap.set(key, value);
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate column order configuration
   */
  static validateColumnOrder(columnOrder: string[] | undefined): ValidationResult {
    const errors: string[] = [];

    if (columnOrder === undefined) {
      return { isValid: true, errors: [] };
    }

    if (!Array.isArray(columnOrder)) {
      errors.push("columnOrder must be an array");
      return { isValid: false, errors };
    }

    for (const column of columnOrder) {
      if (typeof column !== "string") {
        errors.push("columnOrder must contain only strings");
        break;
      }
      if (column.trim() === "") {
        errors.push("columnOrder cannot contain empty strings");
        break;
      }
    }

    // Check for duplicates
    const uniqueColumns = new Set(columnOrder);
    if (uniqueColumns.size !== columnOrder.length) {
      errors.push("columnOrder cannot contain duplicate column names");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate value replacements configuration
   */
  static validateValueReplacements(
    valueReplacements: Record<string, Record<string, string>> | undefined
  ): ValidationResult {
    const errors: string[] = [];

    if (valueReplacements === undefined) {
      return { isValid: true, errors: [] };
    }

    if (typeof valueReplacements !== "object" || valueReplacements === null) {
      errors.push("valueReplacements must be an object");
      return { isValid: false, errors };
    }

    for (const [columnName, replacements] of Object.entries(valueReplacements)) {
      if (typeof columnName !== "string" || columnName.trim() === "") {
        errors.push("valueReplacements column names must be non-empty strings");
        break;
      }

      if (typeof replacements !== "object" || replacements === null) {
        errors.push(`valueReplacements for column '${columnName}' must be an object`);
        continue;
      }

      for (const [oldValue, newValue] of Object.entries(replacements)) {
        if (typeof oldValue !== "string" || typeof newValue !== "string") {
          errors.push(
            `valueReplacements for column '${columnName}' must have string keys and values`
          );
          break;
        }
      }

      // Check for circular replacements (A -> B, B -> A)
      const reverseMap = new Map<string, string>();
      for (const [oldValue, newValue] of Object.entries(replacements)) {
        if (reverseMap.has(newValue) && reverseMap.get(newValue) === oldValue) {
          errors.push(
            `Circular replacement detected in column '${columnName}': '${oldValue}' <-> '${newValue}'`
          );
        }
        reverseMap.set(oldValue, newValue);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate entire transformation configuration
   */
  static validateConfiguration(config: TransformationConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if config is an object
    if (!config || typeof config !== "object") {
      errors.push("Configuration must be an object");
      return { isValid: false, errors, warnings };
    }

    // Validate each component
    const headerMappingsResult = this.validateHeaderMappings(config.headerMappings);
    const columnOrderResult = this.validateColumnOrder(config.columnOrder);
    const valueReplacementsResult = this.validateValueReplacements(
      config.valueReplacements
    );

    errors.push(...headerMappingsResult.errors);
    errors.push(...columnOrderResult.errors);
    errors.push(...valueReplacementsResult.errors);

    // Cross-validation: check if columnOrder references mapped headers
    if (config.headerMappings && config.columnOrder) {
      const mappedHeaders = new Set(Object.values(config.headerMappings));
      const originalHeaders = new Set(Object.keys(config.headerMappings));

      for (const column of config.columnOrder) {
        if (originalHeaders.has(column)) {
          warnings.push(
            `columnOrder references original header '${column}' which will be mapped to '${config.headerMappings[column]}'`
          );
        }
      }
    }

    // Add warnings for empty configuration
    if (!config.headerMappings && !config.columnOrder && !config.valueReplacements) {
      warnings.push("Configuration is empty - no transformations will be applied");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
