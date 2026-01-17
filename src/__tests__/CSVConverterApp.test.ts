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
      expect(outputData).toBe(
        "full_name,years_old,city\nJohn,25,Tokyo\nJane,30,Osaka"
      );
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

      const inputData =
        "name,age,status,city\nJohn,25,yes,Tokyo\nJane,30,no,Osaka";
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
      expect(outputData).toBe(
        "full_name,city,is_active\nJohn,Tokyo,1\nJane,Osaka,0"
      );
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

      await expect(
        app.execute(inputPath, outputPath, configPath)
      ).rejects.toThrow();
    });

    it("should handle invalid JSON configuration", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "invalid.json");

      const inputData = "name,age\nJohn,25";
      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, "{ invalid json }");

      await expect(
        app.execute(inputPath, outputPath, configPath)
      ).rejects.toThrow();
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

      await expect(
        app.execute(inputPath, outputPath, configPath)
      ).rejects.toThrow();
    });

    it("should handle write permission errors", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      // Windows環境では存在しないドライブを使用してエラーを発生させる
      const outputPath =
        process.platform === "win32"
          ? "Z:\\nonexistent\\output.csv"
          : "/root/readonly/output.csv";

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

  describe("Deletion Functionality", () => {
    it("should delete rows based on single value condition", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,status,age\nJohn,active,25\nJane,inactive,30\nBob,active,35";
      const config = {
        deleteConditions: [
          {
            column: "status",
            value: "inactive",
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe("name,status,age\nJohn,active,25\nBob,active,35");
    });

    it("should delete rows based on array value condition", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,category,age\nJohn,test,25\nJane,production,30\nBob,debug,35\nAlice,production,28";
      const config = {
        deleteConditions: [
          {
            column: "category",
            value: ["test", "debug"],
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe(
        "name,category,age\nJane,production,30\nAlice,production,28"
      );
    });

    it("should delete rows based on multiple conditions (AND logic)", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,status,department,age\nJohn,inactive,IT,25\nJane,active,HR,30\nBob,inactive,HR,35\nAlice,active,IT,28";
      const config = {
        deleteConditions: [
          {
            column: "status",
            value: "inactive",
          },
          {
            column: "department",
            value: "HR",
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      // Only Bob should be deleted (inactive AND HR)
      expect(outputData).toBe(
        "name,status,department,age\nJohn,inactive,IT,25\nJane,active,HR,30\nAlice,active,IT,28"
      );
    });

    it("should combine deletion with other transformations", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,status,age,city\nJohn,active,25,Tokyo\nJane,inactive,30,Osaka\nBob,active,35,Kyoto";
      const config = {
        deleteConditions: [
          {
            column: "status",
            value: "inactive",
          },
        ],
        headerMappings: {
          name: "full_name",
          status: "is_active",
        },
        columnOrder: ["full_name", "city", "is_active"],
        valueReplacements: {
          is_active: {
            active: "1",
          },
        },
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      // Jane should be deleted, then transformations applied
      expect(outputData).toBe(
        "full_name,city,is_active\nJohn,Tokyo,1\nBob,Kyoto,1"
      );
    });

    it("should handle deletion with no matching rows", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,status,age\nJohn,active,25\nJane,active,30\nBob,active,35";
      const config = {
        deleteConditions: [
          {
            column: "status",
            value: "inactive",
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      // No rows should be deleted
      expect(outputData).toBe(inputData);
    });

    it("should handle deletion with all rows matching", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "name,status,age\nJohn,inactive,25\nJane,inactive,30\nBob,inactive,35";
      const config = {
        deleteConditions: [
          {
            column: "status",
            value: "inactive",
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      // Only headers should remain
      expect(outputData).toBe("name,status,age");
    });

    it("should handle deletion error when column does not exist", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,status,age\nJohn,active,25\nJane,inactive,30";
      const config = {
        deleteConditions: [
          {
            column: "nonexistent_column",
            value: "some_value",
          },
        ],
      };

      fs.writeFileSync(inputPath, inputData);
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await expect(
        app.execute(inputPath, outputPath, configPath)
      ).rejects.toThrow(
        "Invalid delete conditions: Delete condition references non-existent column: 'nonexistent_column'"
      );
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

  describe("Encoding Functionality", () => {
    it("should encode output file to Shift_JIS", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "名前,年齢,都市\n太郎,25,東京\n花子,30,大阪";
      const config = {
        outputEncoding: "shift_jis",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);

      // Read as buffer to check encoding
      const buffer = fs.readFileSync(outputPath);
      expect(buffer).toBeInstanceOf(Buffer);

      // The buffer should be different from UTF-8
      const utf8Buffer = Buffer.from(inputData, "utf8");
      expect(buffer.equals(utf8Buffer)).toBe(false);
    });

    it("should encode output file to EUC-JP", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "名前,年齢\n太郎,25\n花子,30";
      const config = {
        outputEncoding: "euc-jp",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const buffer = fs.readFileSync(outputPath);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it("should keep UTF-8 encoding when not specified", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "名前,年齢\n太郎,25\n花子,30";
      const config = {
        columnOrder: ["名前", "年齢"],
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toContain("名前");
      expect(outputData).toContain("太郎");
    });

    it("should apply encoding with other transformations", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData =
        "名前,状態,年齢\n太郎,有効,25\n花子,無効,30\n次郎,有効,35";
      const config = {
        headerMappings: {
          名前: "氏名",
          状態: "ステータス",
        },
        columnOrder: ["氏名", "ステータス", "年齢"],
        valueReplacements: {
          ステータス: {
            有効: "1",
            無効: "0",
          },
        },
        deleteConditions: [
          {
            column: "状態", // Use original column name before mapping
            value: "無効",
          },
        ],
        outputEncoding: "shift_jis",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const buffer = fs.readFileSync(outputPath);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("should handle ASCII-only content with encoding", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age,city\nJohn,25,Tokyo\nJane,30,Osaka";
      const config = {
        outputEncoding: "shift_jis",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      // ASCII content should be the same in both encodings
      const outputData = fs.readFileSync(outputPath, "utf8");
      expect(outputData).toBe(inputData);
    });

    it("should throw error for unsupported encoding", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age\nJohn,25";
      const config = {
        outputEncoding: "invalid-encoding",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await expect(
        app.execute(inputPath, outputPath, configPath)
      ).rejects.toThrow(/not supported/);
    });

    it("should handle empty file with encoding", async () => {
      const inputPath = path.join(tempDir, "input.csv");
      const outputPath = path.join(tempDir, "output.csv");
      const configPath = path.join(tempDir, "config.json");

      const inputData = "name,age,city";
      const config = {
        outputEncoding: "shift_jis",
      };

      fs.writeFileSync(inputPath, inputData, "utf8");
      fs.writeFileSync(configPath, JSON.stringify(config));

      await app.execute(inputPath, outputPath, configPath);

      expect(fs.existsSync(outputPath)).toBe(true);
      const buffer = fs.readFileSync(outputPath);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
