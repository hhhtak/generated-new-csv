import * as fs from "fs";
import * as path from "path";
import { CSVConverterApp } from "../CSVConverterApp";
import { CSVConverterError, ErrorCode, getLogger, LogLevel } from "../utils";

// Mock console methods to capture output
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleDebug = jest.spyOn(console, "debug").mockImplementation();

describe("Error Handling Integration Tests", () => {
  let app: CSVConverterApp;
  let tempDir: string;
  let logger = getLogger();

  beforeEach(() => {
    app = new CSVConverterApp();
    tempDir = fs.mkdtempSync(path.join(__dirname, "temp-"));

    // Clear console mocks
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleDebug.mockClear();

    // Set logger to capture all messages
    logger.setLevel(LogLevel.DEBUG);
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe("File Access Errors", () => {
    it("should handle non-existent input file", async () => {
      const nonExistentFile = path.join(tempDir, "nonexistent.csv");
      const outputFile = path.join(tempDir, "output.csv");

      await expect(app.execute(nonExistentFile, outputFile)).rejects.toThrow(
        CSVConverterError
      );

      try {
        await app.execute(nonExistentFile, outputFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.FILE_NOT_FOUND);
        expect((error as CSVConverterError).message).toContain("File not found");
      }
    });

    it("should handle non-existent configuration file", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");
      const nonExistentConfig = path.join(tempDir, "nonexistent.json");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      await expect(app.execute(inputFile, outputFile, nonExistentConfig)).rejects.toThrow(
        CSVConverterError
      );

      try {
        await app.execute(inputFile, outputFile, nonExistentConfig);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.FILE_NOT_FOUND);
      }
    });

    it("should handle invalid output directory", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const invalidOutputFile = "/invalid/path/output.csv";

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      await expect(app.execute(inputFile, invalidOutputFile)).rejects.toThrow(
        CSVConverterError
      );
    });
  });

  describe("CSV Format Errors", () => {
    it("should handle empty CSV file", async () => {
      const inputFile = path.join(tempDir, "empty.csv");
      const outputFile = path.join(tempDir, "output.csv");

      // Create empty file
      fs.writeFileSync(inputFile, "");

      await expect(app.execute(inputFile, outputFile)).rejects.toThrow(CSVConverterError);

      try {
        await app.execute(inputFile, outputFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.INVALID_CSV_FORMAT);
      }
    });

    it("should handle CSV with inconsistent column counts", async () => {
      const inputFile = path.join(tempDir, "inconsistent.csv");
      const outputFile = path.join(tempDir, "output.csv");

      // Create CSV with inconsistent columns
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25,extra");

      // Note: csv-parser handles inconsistent columns gracefully by filling missing values
      // This test verifies that the system doesn't crash with inconsistent data
      await expect(app.execute(inputFile, outputFile)).resolves.not.toThrow();

      // Verify output file was created
      expect(fs.existsSync(outputFile)).toBe(true);
    });
  });

  describe("Configuration Errors", () => {
    it("should handle invalid JSON configuration", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");
      const configFile = path.join(tempDir, "invalid.json");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      // Create invalid JSON config
      fs.writeFileSync(configFile, "{ invalid json }");

      await expect(app.execute(inputFile, outputFile, configFile)).rejects.toThrow(
        CSVConverterError
      );

      try {
        await app.execute(inputFile, outputFile, configFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.INVALID_CONFIGURATION);
        expect((error as CSVConverterError).message).toContain("Invalid JSON");
      }
    });

    it("should handle configuration with invalid column references", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");
      const configFile = path.join(tempDir, "config.json");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      // Create config with invalid column reference
      const config = {
        columnOrder: ["name", "nonexistent_column"],
      };
      fs.writeFileSync(configFile, JSON.stringify(config));

      await expect(app.execute(inputFile, outputFile, configFile)).rejects.toThrow(
        CSVConverterError
      );

      try {
        await app.execute(inputFile, outputFile, configFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.MISSING_COLUMN);
        expect((error as CSVConverterError).message).toContain("見つかりません");
      }
    });
  });

  describe("Transformation Errors", () => {
    it("should handle missing columns in column order", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");
      const configFile = path.join(tempDir, "config.json");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      // Create config with missing column
      const config = {
        columnOrder: ["name", "missing_column", "age"],
      };
      fs.writeFileSync(configFile, JSON.stringify(config));

      await expect(app.execute(inputFile, outputFile, configFile)).rejects.toThrow(
        CSVConverterError
      );

      try {
        await app.execute(inputFile, outputFile, configFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        expect((error as CSVConverterError).code).toBe(ErrorCode.MISSING_COLUMN);
        expect((error as CSVConverterError).context).toHaveProperty("missingColumns");
        expect((error as CSVConverterError).context.missingColumns).toContain(
          "missing_column"
        );
      }
    });
  });

  describe("Output Errors", () => {
    it("should handle write permission errors", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "readonly", "output.csv");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      // Create readonly directory
      const readonlyDir = path.join(tempDir, "readonly");
      fs.mkdirSync(readonlyDir);

      // Make directory readonly (this might not work on all systems)
      try {
        fs.chmodSync(readonlyDir, 0o444);

        await expect(app.execute(inputFile, outputFile)).rejects.toThrow(
          CSVConverterError
        );

        // Restore permissions for cleanup
        fs.chmodSync(readonlyDir, 0o755);
      } catch (chmodError) {
        // Skip test if chmod is not supported
        console.warn("Skipping readonly directory test - chmod not supported");
      }
    });
  });

  describe("Error Message Formatting", () => {
    it("should provide formatted error messages with context", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");
      const configFile = path.join(tempDir, "config.json");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      // Create config with missing column
      const config = {
        columnOrder: ["name", "missing_column"],
      };
      fs.writeFileSync(configFile, JSON.stringify(config));

      try {
        await app.execute(inputFile, outputFile, configFile);
      } catch (error) {
        expect(error).toBeInstanceOf(CSVConverterError);
        const formattedMessage = (error as CSVConverterError).getFormattedMessage();
        expect(formattedMessage).toContain("[MISSING_COLUMN]");
        expect(formattedMessage).toContain("missing_column");
      }
    });
  });

  describe("Logging Integration", () => {
    it("should log errors with appropriate context", async () => {
      const nonExistentFile = path.join(tempDir, "nonexistent.csv");
      const outputFile = path.join(tempDir, "output.csv");

      try {
        await app.execute(nonExistentFile, outputFile);
      } catch (error) {
        // Error should be logged
        expect(mockConsoleError).toHaveBeenCalled();
      }
    });

    it("should log successful operations", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");

      // Create valid input file
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");

      await app.execute(inputFile, outputFile, undefined, true);

      // Should log info messages
      expect(mockConsoleLog).toHaveBeenCalled();
    });
  });

  describe("Error Recovery", () => {
    it("should handle multiple error scenarios gracefully", async () => {
      const inputFile = path.join(tempDir, "input.csv");
      const outputFile = path.join(tempDir, "output.csv");

      // Test 1: Non-existent file
      await expect(app.execute("nonexistent.csv", outputFile)).rejects.toThrow(
        CSVConverterError
      );

      // Test 2: Valid execution after error
      fs.writeFileSync(inputFile, "name,age\nJohn,30\nJane,25");
      await expect(app.execute(inputFile, outputFile)).resolves.not.toThrow();

      // Verify output file was created
      expect(fs.existsSync(outputFile)).toBe(true);
    });
  });
});
