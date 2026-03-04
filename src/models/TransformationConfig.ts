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

  /** Sequence number columns to add with auto-incrementing values */
  sequenceColumns?: SequenceColumn[];
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

/**
 * Configuration for adding sequence number columns
 */
export interface SequenceColumn {
  /** Column name for the sequence number */
  column: string;

  /** Starting value for the sequence (default: 1) */
  start?: number;

  /** Increment step for each row (default: 1) */
  step?: number;
}
