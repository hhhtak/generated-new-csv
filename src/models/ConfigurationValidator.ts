import {
  DeleteCondition,
  TransformationConfig,
  ValidationResult,
} from "./index";

/**
 * Utility functions for validating transformation configuration components
 */
export class ConfigurationValidator {
  /**
   * Validate header mappings configuration
   */
  static validateHeaderMappings(
    headerMappings: Record<string, string | string[]> | undefined
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
      if (typeof key !== "string" || key.trim() === "") {
        errors.push("headerMappings keys must be non-empty strings");
        break;
      }

      if (typeof value === "string") {
        if (value.trim() === "") {
          errors.push(
            `headerMappings value for key '${key}' cannot be an empty string`
          );
        }
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          errors.push(
            `headerMappings array value for key '${key}' cannot be empty`
          );
        }
        for (const v of value) {
          if (typeof v !== "string" || v.trim() === "") {
            errors.push(
              `headerMappings array for key '${key}' must only contain non-empty strings`
            );
            break;
          }
        }
      } else {
        errors.push(
          `headerMappings value for key '${key}' must be a string or an array of strings`
        );
      }
    }

    // Check for circular mappings (A -> B, B -> A)
    const reverseMap = new Map<string, string>();
    for (const [key, value] of Object.entries(headerMappings)) {
      if (typeof value === "string") {
        if (reverseMap.has(value) && reverseMap.get(value) === key) {
          errors.push(`Circular mapping detected: '${key}' <-> '${value}'`);
        }
        reverseMap.set(key, value);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate column order configuration
   */
  static validateColumnOrder(
    columnOrder: string[] | undefined
  ): ValidationResult {
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

    for (const [columnName, replacements] of Object.entries(
      valueReplacements
    )) {
      if (typeof columnName !== "string" || columnName.trim() === "") {
        errors.push("valueReplacements column names must be non-empty strings");
        break;
      }

      if (typeof replacements !== "object" || replacements === null) {
        errors.push(
          `valueReplacements for column '${columnName}' must be an object`
        );
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
   * Validate delete conditions configuration
   */
  static validateDeleteConditions(
    deleteConditions: DeleteCondition[] | undefined
  ): ValidationResult {
    const errors: string[] = [];

    if (deleteConditions === undefined) {
      return { isValid: true, errors: [] };
    }

    if (!Array.isArray(deleteConditions)) {
      errors.push("deleteConditions must be an array");
      return { isValid: false, errors };
    }

    for (let i = 0; i < deleteConditions.length; i++) {
      const condition = deleteConditions[i];

      if (!condition || typeof condition !== "object") {
        errors.push(`deleteConditions[${i}] must be an object`);
        continue;
      }

      // Validate column property
      if (typeof condition.column !== "string") {
        errors.push(`deleteConditions[${i}].column must be a non-empty string`);
      } else if (condition.column.trim() === "") {
        errors.push(
          `deleteConditions[${i}].column cannot be empty or whitespace-only`
        );
      }

      // Validate value property
      if (condition.value === undefined || condition.value === null) {
        errors.push(`deleteConditions[${i}].value is required`);
      } else if (typeof condition.value === "string") {
        // Single string value is valid (can be empty string)
      } else if (Array.isArray(condition.value)) {
        if (condition.value.length === 0) {
          errors.push(`deleteConditions[${i}].value array cannot be empty`);
        } else {
          for (let j = 0; j < condition.value.length; j++) {
            if (typeof condition.value[j] !== "string") {
              errors.push(
                `deleteConditions[${i}].value[${j}] must be a string`
              );
              break;
            }
          }
        }
      } else {
        errors.push(
          `deleteConditions[${i}].value must be a string or an array of strings`
        );
      }

      // Check for extra properties
      const allowedProperties = new Set(["column", "value"]);
      for (const prop in condition) {
        if (!allowedProperties.has(prop)) {
          errors.push(
            `deleteConditions[${i}] contains unexpected property '${prop}'`
          );
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate delete conditions against available headers
   */
  static validateDeleteConditionsWithHeaders(
    deleteConditions: DeleteCondition[] | undefined,
    headers: string[]
  ): ValidationResult {
    const errors: string[] = [];

    if (!deleteConditions || deleteConditions.length === 0) {
      return { isValid: true, errors: [] };
    }

    const headerSet = new Set(headers);

    for (let i = 0; i < deleteConditions.length; i++) {
      const condition = deleteConditions[i];

      if (condition.column && !headerSet.has(condition.column)) {
        errors.push(
          `deleteConditions[${i}] references column '${condition.column}' which does not exist in input CSV`
        );
      }
    }

    return { isValid: errors.length === 0, errors };
  }
  static validateFixedColumns(
    fixedColumns: Record<string, string | number> | undefined
  ): ValidationResult {
    const errors: string[] = [];

    if (fixedColumns === undefined) {
      return { isValid: true, errors: [] };
    }

    if (typeof fixedColumns !== "object" || fixedColumns === null) {
      errors.push("fixedColumns must be an object");
      return { isValid: false, errors };
    }

    for (const [columnName, value] of Object.entries(fixedColumns)) {
      if (typeof columnName !== "string" || columnName.trim() === "") {
        errors.push("fixedColumns column names must be non-empty strings");
        break;
      }
      if (typeof value !== "string" && typeof value !== "number") {
        errors.push(
          `fixedColumns value for column '${columnName}' must be a string or a number`
        );
        continue; // continue to find all errors
      }
    }

    // Check for duplicate column names
    const columnNames = Object.keys(fixedColumns);
    const uniqueColumns = new Set(columnNames);
    if (uniqueColumns.size !== columnNames.length) {
      errors.push("fixedColumns cannot contain duplicate column names");
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate output encoding configuration
   */
  static validateOutputEncoding(
    outputEncoding: string | undefined
  ): ValidationResult {
    const errors: string[] = [];

    if (outputEncoding === undefined) {
      return { isValid: true, errors: [] };
    }

    if (typeof outputEncoding !== "string") {
      errors.push("outputEncoding must be a string");
      return { isValid: false, errors };
    }

    if (outputEncoding.trim() === "") {
      errors.push("outputEncoding cannot be an empty string");
      return { isValid: false, errors };
    }

    // Check if encoding is supported
    const supportedEncodings = ["utf8", "shift_jis", "euc-jp"];
    if (!supportedEncodings.includes(outputEncoding.toLowerCase())) {
      errors.push(
        `outputEncoding '${outputEncoding}' is not supported. Supported encodings: ${supportedEncodings.join(
          ", "
        )}`
      );
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
    const headerMappingsResult = this.validateHeaderMappings(
      config.headerMappings
    );
    const columnOrderResult = this.validateColumnOrder(config.columnOrder);
    const valueReplacementsResult = this.validateValueReplacements(
      config.valueReplacements
    );
    const fixedColumnsResult = this.validateFixedColumns(config.fixedColumns);
    const deleteConditionsResult = this.validateDeleteConditions(
      config.deleteConditions
    );
    const outputEncodingResult = this.validateOutputEncoding(
      config.outputEncoding
    );

    errors.push(...headerMappingsResult.errors);
    errors.push(...columnOrderResult.errors);
    errors.push(...valueReplacementsResult.errors);
    errors.push(...fixedColumnsResult.errors);
    errors.push(...deleteConditionsResult.errors);
    errors.push(...outputEncodingResult.errors);

    // Cross-validation: check if columnOrder references mapped headers
    if (config.headerMappings && config.columnOrder) {
      const mappedHeaders = new Set(
        Object.values(config.headerMappings).flat()
      );
      const originalHeaders = new Set(Object.keys(config.headerMappings));

      for (const column of config.columnOrder) {
        if (originalHeaders.has(column)) {
          const mapped = config.headerMappings[column];
          warnings.push(
            `columnOrder references original header '${column}' which will be mapped to '${
              Array.isArray(mapped) ? mapped.join(", ") : mapped
            }'`
          );
        }
      }
    }

    // Cross-validation: check for conflicts between fixed columns and other configurations
    if (config.fixedColumns) {
      const fixedColumnNames = new Set(Object.keys(config.fixedColumns));

      // Check conflicts with header mappings
      if (config.headerMappings) {
        const mappedHeaders = new Set(
          Object.values(config.headerMappings).flat()
        );
        const originalHeaders = new Set(Object.keys(config.headerMappings));

        for (const fixedColumn of fixedColumnNames) {
          if (originalHeaders.has(fixedColumn)) {
            errors.push(
              `Fixed column '${fixedColumn}' conflicts with original header in headerMappings`
            );
          }
          if (mappedHeaders.has(fixedColumn)) {
            errors.push(
              `Fixed column '${fixedColumn}' conflicts with mapped header in headerMappings`
            );
          }
        }
      }

      // Check if fixed columns are referenced in columnOrder
      if (config.columnOrder) {
        for (const fixedColumn of fixedColumnNames) {
          if (!config.columnOrder.includes(fixedColumn)) {
            warnings.push(
              `Fixed column '${fixedColumn}' is not included in columnOrder and will be placed at the end`
            );
          }
        }
      }

      // Check if fixed columns are referenced in value replacements
      if (config.valueReplacements) {
        for (const fixedColumn of fixedColumnNames) {
          if (config.valueReplacements[fixedColumn]) {
            warnings.push(
              `Fixed column '${fixedColumn}' has value replacements defined, but fixed columns have constant values`
            );
          }
        }
      }
    }

    // Add warnings for empty configuration
    if (
      !config.headerMappings &&
      !config.columnOrder &&
      !config.valueReplacements &&
      !config.fixedColumns &&
      !config.deleteConditions &&
      !config.outputEncoding
    ) {
      warnings.push(
        "Configuration is empty - no transformations will be applied"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
