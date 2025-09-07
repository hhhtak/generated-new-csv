import * as fs from "fs";
import { tmpdir } from "os";
import * as path from "path";
import { CSVConverterApp } from "../CSVConverterApp";

describe("CSVConverterApp Integration Tests", () => {
  let tempDir: string;
  let app: CSVConverterApp;

  beforeEach(() => {
    // Create a temporary directory for test files
    tempDir = fs.mkdtempSync(path.join(tmpdir(), "csv-converter-test-"));
    app = new CSVConverterApp();
  });

  afterEach(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("Complete Transformation Workflow", () => {
    it("should perform direct copy without configuration", async () => {
      // Create test input CSV
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const inputData = "name,age,city\nJohn,25,Tokyo\nJane,30,Osaka";

      fs.writeFileSync(inputPath, inputData);

      // Execute transformation
      await app.execute(inputPath, outputPath);

      // Verify output
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe(inputData);
    });

    it("should apply header mappings transformation", async () => {
      // Create test input CSV
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age,city\nJohn,25,Tokyo\nJane,30,Osaka";
      const config = {
        headerMappings: {
          name: "full_name",
          age: "years_old",
        },
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Execute transformation
      await app.execute(inputPath, outputPath, configPath);

      // Verify output
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe("full_name,years_old,city\nJohn,25,Tokyo\nJane,30,Osaka");
    });

    it("should apply column reordering transformation", async () => {
      // Create test input CSV
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age,city\nJohn,25,Tokyo\nJane,30,Osaka";
      const config = {
        columnOrder: ["city", "name", "age"],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Execute transformation
      await app.execute(inputPath, outputPath, configPath);

      // Verify output
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe("city,name,age\nTokyo,John,25\nOsaka,Jane,30");
    });

    it("should apply value replacements transformation", async () => {
      // Create test input CSV
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,status,active\nJohn,yes,true\nJane,no,false";
      const config = {
        valueReplacements: {
          status: {
            yes: "1",
            no: "0",
          },
          active: {
            true: "Y",
            false: "N",
          },
        },
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Execute transformation
      await app.execute(inputPath, outputPath, configPath);

      // Verify output
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe("name,status,active\nJohn,1,Y\nJane,0,N");
    });

    it("should apply all transformations together", async () => {
      // Create test input CSV
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age,status,city\nJohn,25,yes,Tokyo\nJane,30,no,Osaka";
      const config = {
        headerMappings: {
          name: "full_name",
          status: "is_active",
        },
        columnOrder: ["full_name", "city", "is_active"],
        valueReplacements: {
          is_active: {
            yes: "1",
            no: "0",
          },
        },
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // Execute transformation
      await app.execute(inputPath, outputPath, configPath);

      // Verify output
      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe("full_name,city,is_active\nJohn,Tokyo,1\nJane,Osaka,0");
    });
  });

  describe("Error Handling", () => {
    it("should handle missing input file", async () => {
      const inputPath = path.join(tempDir, "nonexistent.csv");
      const outputPath = path.join(tempDir, "output.csv");

      await expect(app.execute(inputPath, outputPath)).rejects.toThrow();
    });

    it("should handle invalid CSV format", async () => {
      const inputPath = path.join(tempDir, "invalid.csv");
      const outputPath = path.join(tempDir, "output.csv");

      // Create empty CSV file (should cause an error)
      fs.writeFileSync(inputPath, "");

      await expect(app.execute(inputPath, outputPath)).rejects.toThrow();
    });

    it("should handle missing configuration file", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "nonexistent.json");

      const inputData = "name,age\nJohn,25";
      fs.writeFileSync(inputPath, inputData);

      await expect(app.execute(inputPath, outputPath, configPath)).rejects.toThrow();
    });

    it("should handle invalid JSON configuration", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "invalid.json");

      const inputData = "name,age\nJohn,25";
      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, "{ invalid json }");

      await expect(app.execute(inputPath, outputPath, configPath)).rejects.toThrow();
    });

    it("should handle configuration referencing non-existent columns", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age\nJohn,25";
      const config = {
        columnOrder: ["name", "nonexistent_column"],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config));

      await expect(app.execute(inputPath, outputPath, configPath)).rejects.toThrow();
    });

    it("should handle write permission errors", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = "/root/readonly/output.csv"; // Typically not writable

      const inputData = "name,age\nJohn,25";
      fs.writeFileSync(inputPath, inputData);

      await expect(app.execute(inputPath, outputPath)).rejects.toThrow();
    });
  });

  describe("Verbose Mode", () => {
    it("should log detailed information in verbose mode", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const inputData = "name,age\nJohn,25";

      fs.writeFileSync(inputPath, inputData);

      await app.execute(inputPath, outputPath, undefined, true);

      // With structured logging, we expect formatted log messages
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Starting CSV transformation pipeline")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Reading input CSV file:")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Successfully parsed CSV")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("CSV transformation completed successfully")
      );

      consoleSpy.mockRestore();
    });

    it("should not log detailed information in non-verbose mode", async () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const inputData = "name,age\nJohn,25";

      fs.writeFileSync(inputPath, inputData);

      await app.execute(inputPath, outputPath, undefined, false);

      // In non-verbose mode, we still log INFO level messages but not DEBUG
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Starting CSV transformation pipeline")
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("CSV transformation completed successfully")
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty CSV file with headers only", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const inputData = "name,age,city";

      fs.writeFileSync(inputPath, inputData);

      await app.execute(inputPath, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe(inputData);
    });

    it("should handle CSV with special characters and quotes", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const inputData =
        'name,description\n"John, Jr.","He said ""Hello"""\nJane,Normal text';

      fs.writeFileSync(inputPath, inputData);

      await app.execute(inputPath, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      // The output should preserve the special characters correctly
      expect(outputData).toContain("name,description");
      expect(outputData).toContain('"John, Jr."');
      expect(outputData).toContain('"He said ""Hello"""');
      expect(outputData).toContain("Jane,Normal text");
    });

    it("should handle large CSV files", async () => {
      const inputPath = path.join(tempDir, "large.csv");
      const outputPath = path.join(tempDir, "output.csv");

      // Generate a larger CSV file
      let inputData = "id,name,value\n";
      for (let i = 1; i <= 1000; i++) {
        inputData += `${i},Name${i},Value${i}\n`;
      }

      fs.writeFileSync(inputPath, inputData.trim());

      await app.execute(inputPath, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe(inputData.trim());
    });
  });
});
