#!/usr/bin/env node

import { Command } from "commander";

/**
 * CLI entry point for CSV Converter
 * This will be implemented in later tasks
 */
const program = new Command();

program
  .name("csv-converter")
  .description("A flexible CSV transformation tool with configurable rules")
  .version("1.0.0");

program
  .option("-i, --input <file>", "input CSV file path")
  .option("-o, --output <file>", "output CSV file path")
  .option("-c, --config <file>", "configuration JSON file path")
  .option("-v, --verbose", "enable verbose logging");

// CLI implementation will be added in task 6.1
program.parse();
