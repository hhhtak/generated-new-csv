/**
 * Configuration for CSV transformation rules
 */
export interface TransformationConfig {
  /** Mapping from original header names to new header names */
  headerMappings?: Record<string, string | string[]>;

  /** Desired order of columns in output CSV */
  columnOrder?: string[];

  /** Value replacements per column */
  valueReplacements?: Record<string, Record<string, string>>;

  /** Fixed columns to add with constant values */
  fixedColumns?: Record<string, string | number>;

  /** Delete conditions to remove rows based on column values */
  deleteConditions?: DeleteCondition[];

  /** Output file encoding (utf8, shift_jis, euc-jp) */
  outputEncoding?: string;
}

/**
 * Configuration for deleting rows based on column values
 */
export interface DeleteCondition {
  /** Column name to check for deletion condition */
  column: string;

  /** Value or array of values to match for deletion */
  value: string | string[];
}
