#!/usr/bin/env node

import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import { CSVConverterApp } from "./CSVConverterApp";
import { CSVConverterError, getLogger, LogLevel } from "./utils";

/**
 * CLI entry point for CSV Converter
 * Provides command-line interface for CSV transformation with configurable rules
 */
const program = new Command();

program
  .name("csv-converter")
  .description("A flexible CSV transformation tool with configurable rules")
  .version("1.0.0");

program
  .requiredOption("-i, --input <file>", "input CSV file path")
  .requiredOption("-o, --output <file>", "output CSV file path")
  .option("-c, --config <file>", "configuration JSON file path (optional)")
  .option("-v, --verbose", "enable verbose logging")
  .addHelpText(
    "after",
    `
Examples:
  $ csv-converter -i input.csv -o output.csv
  $ csv-converter -i data.csv -o transformed.csv -c config.json
  $ csv-converter --input ./data/source.csv --output ./data/result.csv --config ./config/transform.json --verbose

Configuration File Format (JSON):
  {
    "headerMappings": {
      "original_name": "new_name"
    },
    "columnOrder": ["column1", "column2", "column3"],
    "valueReplacements": {
      "column_name": {
        "old_value": "new_value"
      }
    }
  }

For more information, visit: https://github.com/your-repo/csv-converter
`
  );

// Validate arguments and file paths
program.hook("preAction", (thisCommand) => {
  const options = thisCommand.opts();
  const logger = getLogger();

  // Set log level based on verbose flag
  if (options.verbose) {
    logger.setLevel(LogLevel.DEBUG);
  } else {
    logger.setLevel(LogLevel.ERROR); // Only show errors in CLI mode
  }

  // Validate input file exists
  if (!fs.existsSync(options.input)) {
    logger.error(`Input file '${options.input}' does not exist`);
    process.exit(1);
  }

  // Validate input file is readable
  try {
    fs.accessSync(options.input, fs.constants.R_OK);
  } catch (error) {
    logger.error(`Cannot read input file '${options.input}'. Check file permissions.`);
    process.exit(1);
  }

  // Validate output directory exists and is writable
  const outputDir = path.dirname(options.output);
  if (!fs.existsSync(outputDir)) {
    logger.error(`Output directory '${outputDir}' does not exist`);
    process.exit(1);
  }

  try {
    fs.accessSync(outputDir, fs.constants.W_OK);
  } catch (error) {
    logger.error(
      `Cannot write to output directory '${outputDir}'. Check directory permissions.`
    );
    process.exit(1);
  }

  // Validate config file if provided
  if (options.config) {
    if (!fs.existsSync(options.config)) {
      logger.error(`Configuration file '${options.config}' does not exist`);
      process.exit(1);
    }

    try {
      fs.accessSync(options.config, fs.constants.R_OK);
    } catch (error) {
      logger.error(
        `Cannot read configuration file '${options.config}'. Check file permissions.`
      );
      process.exit(1);
    }

    // Validate config file is valid JSON
    try {
      const configContent = fs.readFileSync(options.config, "utf8");
      JSON.parse(configContent);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Configuration file '${options.config}' contains invalid JSON: ${errorMessage}`
      );
      process.exit(1);
    }
  }

  logger.debug("CSV Converter starting with options", {
    inputFile: options.input,
    outputFile: options.output,
    configFile: options.config || "none (direct copy mode)",
  });
});

// Main action - execute CSV transformation
program.action(async (options) => {
  const logger = getLogger();
  const app = new CSVConverterApp();

  try {
    await app.execute(options.input, options.output, options.config, options.verbose);

    // Success message for non-verbose mode
    if (!options.verbose) {
      console.log(`CSV transformation completed: ${options.input} → ${options.output}`);
    }
  } catch (error) {
    if (error instanceof CSVConverterError) {
      // Display user-friendly error message
      console.error(`Error: ${error.getFormattedMessage()}`);
    } else {
      console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
    process.exit(1);
  }
});

// Parse command line arguments only when run directly
if (require.main === module) {
  program.parse();
}

// Export for testing
export { program };
