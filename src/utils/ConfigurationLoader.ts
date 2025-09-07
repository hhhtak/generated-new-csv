import { TransformationConfig, ValidationResult } from "../models";

/**
 * Interface for loading and validating configuration files
 */
export interface ConfigurationLoader {
  /**
   * Load configuration from JSON file
   */
  load(configPath: string): Promise<TransformationConfig>;

  /**
   * Validate configuration structure and rules
   */
  validate(config: TransformationConfig): ValidationResult;
}
