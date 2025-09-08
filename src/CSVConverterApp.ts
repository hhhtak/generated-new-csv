import { CSVData, TransformationConfig } from "./models";
import { CSVParserImpl } from "./parsers";
import { DataTransformerImpl } from "./transformers";
import {
  CSVConverterError,
  CSVWriterImpl,
  ErrorHandler,
  getLogger,
  JSONConfigurationLoader,
  LogLevel,
} from "./utils";

/**
 * Main application class that orchestrates the CSV transformation pipeline
 */
export class CSVConverterApp {
  private parser: CSVParserImpl;
  private transformer: DataTransformerImpl;
  private writer: CSVWriterImpl;
  private configLoader: JSONConfigurationLoader;
  private errorHandler: ErrorHandler;
  private logger = getLogger();

  constructor() {
    this.parser = new CSVParserImpl();
    this.transformer = new DataTransformerImpl();
    this.writer = new CSVWriterImpl();
    this.configLoader = new JSONConfigurationLoader();
    this.errorHandler = ErrorHandler.getInstance();
  }

  /**
   * Execute the complete CSV transformation pipeline
   * @param inputPath Path to input CSV file
   * @param outputPath Path to output CSV file
   * @param configPath Optional path to configuration file
   * @param verbose Enable verbose logging
   */
  async execute(
    inputPath: string,
    outputPath: string,
    configPath?: string,
    verbose: boolean = false
  ): Promise<void> {
    // Set log level based on verbose flag
    if (verbose) {
      this.logger.setLevel(LogLevel.DEBUG);
    }

    this.logger.info("Starting CSV transformation pipeline", {
      inputPath,
      outputPath,
      configPath,
      verbose,
    });

    try {
      // Step 1: Parse input CSV
      this.logger.info(`Reading input CSV file: ${inputPath}`);
      const csvData = await this.parser.parse(inputPath);

      this.logger.info(`Successfully parsed CSV`, {
        headers: csvData.headers.length,
        rows: csvData.rows.length,
        headerNames: csvData.headers,
      });

      // Step 2: Load configuration if provided
      let config: TransformationConfig = {};
      if (configPath) {
        this.logger.info(`Loading configuration from: ${configPath}`);
        config = await this.configLoader.load(configPath);

        this.logger.info("Configuration loaded successfully", {
          hasHeaderMappings: !!config.headerMappings,
          hasColumnOrder: !!config.columnOrder,
          hasValueReplacements: !!config.valueReplacements,
          hasFixedColumns: !!config.fixedColumns,
          headerMappingsCount: config.headerMappings
            ? Object.keys(config.headerMappings).length
            : 0,
          columnOrderCount: config.columnOrder ? config.columnOrder.length : 0,
          valueReplacementsCount: config.valueReplacements
            ? Object.keys(config.valueReplacements).length
            : 0,
          fixedColumnsCount: config.fixedColumns
            ? Object.keys(config.fixedColumns).length
            : 0,
        });
      } else {
        this.logger.info("No configuration file provided - performing direct copy");
      }

      // Step 3: Transform data
      let transformedData: CSVData;
      if (this.hasTransformations(config)) {
        this.logger.info("Applying transformations...");
        transformedData = this.transformer.transform(csvData, config);

        this.logger.info("Transformation complete", {
          outputHeaders: transformedData.headers.length,
          outputRows: transformedData.rows.length,
          headerNames: transformedData.headers,
        });
      } else {
        this.logger.info("No transformations to apply - using original data");
        transformedData = csvData;
      }

      // Step 4: Write output CSV
      this.logger.info(`Writing output CSV file: ${outputPath}`);
      await this.writer.write(transformedData, outputPath);

      this.logger.info("CSV transformation completed successfully!");
    } catch (error) {
      if (error instanceof CSVConverterError) {
        this.logger.error("CSV transformation failed", error, {
          inputPath,
          outputPath,
          configPath,
          errorCode: error.code,
        });
        throw error; // Re-throw structured errors as-is
      }

      // Handle unexpected errors
      const structuredError = this.errorHandler.createError(
        `Unexpected error during CSV transformation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        undefined,
        { inputPath, outputPath, configPath }
      );
      this.logger.error("Unexpected error during CSV transformation", structuredError);
      throw structuredError;
    }
  }

  /**
   * Check if configuration contains any transformations
   */
  private hasTransformations(config: TransformationConfig): boolean {
    return !!(
      config.headerMappings ||
      config.columnOrder ||
      config.valueReplacements ||
      config.fixedColumns
    );
  }

  /**
   * Format error messages for user-friendly display
   */
}
