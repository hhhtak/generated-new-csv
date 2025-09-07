import { promises as fs } from "fs";
import {
  ConfigurationValidator,
  TransformationConfig,
  ValidationResult,
} from "../models";

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

/**
 * Implementation of ConfigurationLoader for JSON configuration files
 */
export class JSONConfigurationLoader implements ConfigurationLoader {
  /**
   * Load configuration from JSON file
   */
  async load(configPath: string): Promise<TransformationConfig> {
    try {
      const fileContent = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(fileContent) as TransformationConfig;

      const validationResult = this.validate(config);
      if (!validationResult.isValid) {
        throw new Error(`Invalid configuration: ${validationResult.errors.join(", ")}`);
      }

      return config;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in configuration file: ${error.message}`);
      }
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
      if ((error as NodeJS.ErrnoException).code === "EACCES") {
        throw new Error(`Permission denied reading configuration file: ${configPath}`);
      }
      throw error;
    }
  }

  /**
   * Validate configuration structure and rules
   */
  validate(config: TransformationConfig): ValidationResult {
    return ConfigurationValidator.validateConfiguration(config);
  }
}
