import { program } from "../cli";

describe("CLI Command Line Interface", () => {
  describe("Program Configuration", () => {
    it("should have correct program name", () => {
      expect(program.name()).toBe("csv-converter");
    });

    it("should have correct description", () => {
      expect(program.description()).toBe(
        "A flexible CSV transformation tool with configurable rules"
      );
    });

    it("should have correct version", () => {
      expect(program.version()).toBe("1.0.0");
    });
  });

  describe("Help Text", () => {
    it("should include basic help information", () => {
      const helpText = program.helpInformation();

      expect(helpText).toContain("Usage: csv-converter [options]");
      expect(helpText).toContain(
        "A flexible CSV transformation tool with configurable rules"
      );
      expect(helpText).toContain("-i, --input <file>");
      expect(helpText).toContain("-o, --output <file>");
      expect(helpText).toContain("-c, --config <file>");
      expect(helpText).toContain("-v, --verbose");
    });

    it("should show required options", () => {
      const helpText = program.helpInformation();

      expect(helpText).toContain("-i, --input <file>");
      expect(helpText).toContain("-o, --output <file>");
      expect(helpText).toContain("input CSV file path");
      expect(helpText).toContain("output CSV file path");
    });

    it("should show optional options", () => {
      const helpText = program.helpInformation();

      expect(helpText).toContain("-c, --config <file>");
      expect(helpText).toContain("-v, --verbose");
      expect(helpText).toContain("configuration JSON file path (optional)");
      expect(helpText).toContain("enable verbose logging");
    });
  });

  describe("Option Definitions", () => {
    it("should have input option defined", () => {
      const inputOption = program.options.find((opt) => opt.long === "--input");
      expect(inputOption).toBeDefined();
      expect(inputOption?.description).toBe("input CSV file path");
    });

    it("should have output option defined", () => {
      const outputOption = program.options.find((opt) => opt.long === "--output");
      expect(outputOption).toBeDefined();
      expect(outputOption?.description).toBe("output CSV file path");
    });

    it("should have config option defined", () => {
      const configOption = program.options.find((opt) => opt.long === "--config");
      expect(configOption).toBeDefined();
      expect(configOption?.description).toBe("configuration JSON file path (optional)");
    });

    it("should have verbose option defined", () => {
      const verboseOption = program.options.find((opt) => opt.long === "--verbose");
      expect(verboseOption).toBeDefined();
      expect(verboseOption?.description).toBe("enable verbose logging");
    });
  });

  describe("Command Structure", () => {
    it("should have options defined", () => {
      expect(program.options.length).toBeGreaterThan(0);
    });

    it("should have all required options", () => {
      const optionNames = program.options.map((opt) => opt.long);
      expect(optionNames).toContain("--input");
      expect(optionNames).toContain("--output");
      expect(optionNames).toContain("--config");
      expect(optionNames).toContain("--verbose");
    });
  });
});
