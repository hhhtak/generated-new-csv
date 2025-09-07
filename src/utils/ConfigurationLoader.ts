import { promises as fs } from "fs";
import {
  ConfigurationValidator,
  TransformationConfig,
  ValidationResult,
} from "../models";
import { CSVConverterError, ErrorHandler } from "./ErrorHandler";
import { getLogger } from "./Logger";

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
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();

  /**
   * Load configuration from JSON file
   */
  async load(configPath: string): Promise<TransformationConfig> {
    this.logger.debug(`Loading configuration from: ${configPath}`);

    try {
      const fileContent = await fs.readFile(configPath, "utf-8");
      const config = JSON.parse(fileContent) as TransformationConfig;

      const validationResult = this.validate(config);
      if (!validationResult.isValid) {
        const error = this.errorHandler.handleValidationError(
          `Invalid configuration: ${validationResult.errors.join(", ")}`,
          { file: configPath, errors: validationResult.errors }
        );
        this.logger.error(`Configuration validation failed: ${configPath}`, error, {
          errors: validationResult.errors,
        });
        throw error;
      }

      this.logger.info(`Configuration loaded successfully from: ${configPath}`);
      return config;
    } catch (error) {
      if (error instanceof CSVConverterError) {
        throw error; // Re-throw our structured errors
      }

      const structuredError = this.errorHandler.handleConfigError(error, configPath);
      this.logger.error(`Failed to load configuration: ${configPath}`, structuredError);
      throw structuredError;
    }
  }

  /**
   * Validate configuration structure and rules
   */
  validate(config: TransformationConfig): ValidationResult {
    return ConfigurationValidator.validateConfiguration(config);
  }
}
