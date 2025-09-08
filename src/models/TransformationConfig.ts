/**
 * Configuration for CSV transformation rules
 */
export interface TransformationConfig {
  /** Mapping from original header names to new header names */
  headerMappings?: Record<string, string>;

  /** Desired order of columns in output CSV */
  columnOrder?: string[];

  /** Value replacements per column */
  valueReplacements?: Record<string, Record<string, string>>;

  /** Fixed columns to add with constant values */
  fixedColumns?: Record<string, string>;
}
