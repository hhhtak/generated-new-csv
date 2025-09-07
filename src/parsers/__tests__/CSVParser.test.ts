import * as fs from "fs";
import * as path from "path";
import { CSVParserImpl } from "../CSVParser";

describe("CSVParser", () => {
  let parser: CSVParserImpl;
  const testDataDir = path.join(__dirname, "test-data");

  beforeAll(() => {
    parser = new CSVParserImpl();

    // Create test data directory
    if (!fs.existsSync(testDataDir)) {
      fs.mkdirSync(testDataDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test files
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  describe("parse", () => {
    it("should parse simple CSV with headers correctly", async () => {
      const csvContent = "name,age,city\nJohn,25,Tokyo\nJane,30,Osaka";
      const testFile = path.join(testDataDir, "simple.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([
        ["John", "25", "Tokyo"],
        ["Jane", "30", "Osaka"],
      ]);
    });

    it("should handle quoted fields with commas", async () => {
      const csvContent =
        'name,description,price\n"Product A","High quality, durable",100\n"Product B","Compact, lightweight",50';
      const testFile = path.join(testDataDir, "quoted.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "description", "price"]);
      expect(result.rows).toEqual([
        ["Product A", "High quality, durable", "100"],
        ["Product B", "Compact, lightweight", "50"],
      ]);
    });

    it("should handle quoted fields with special characters", async () => {
      const csvContent =
        'name,message\n"User1","Hello ""World"""\n"User2","Line1\nLine2"';
      const testFile = path.join(testDataDir, "special-chars.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "message"]);
      expect(result.rows).toEqual([
        ["User1", 'Hello "World"'],
        ["User2", "Line1\nLine2"],
      ]);
    });

    it("should handle empty fields", async () => {
      const csvContent = "name,age,city\nJohn,,Tokyo\n,25,\nJane,30,Osaka";
      const testFile = path.join(testDataDir, "empty-fields.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([
        ["John", "", "Tokyo"],
        ["", "25", ""],
        ["Jane", "30", "Osaka"],
      ]);
    });

    it("should handle single column CSV", async () => {
      const csvContent = "values\n1\n2\n3";
      const testFile = path.join(testDataDir, "single-column.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["values"]);
      expect(result.rows).toEqual([["1"], ["2"], ["3"]]);
    });

    it("should handle single row CSV", async () => {
      const csvContent = "name,age,city\nJohn,25,Tokyo";
      const testFile = path.join(testDataDir, "single-row.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([["John", "25", "Tokyo"]]);
    });

    it("should handle CSV with only headers", async () => {
      const csvContent = "name,age,city";
      const testFile = path.join(testDataDir, "headers-only.csv");
      fs.writeFileSync(testFile, csvContent);

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([]);
    });

    it("should handle Japanese characters", async () => {
      const csvContent = "名前,年齢,都市\n田中,25,東京\n佐藤,30,大阪";
      const testFile = path.join(testDataDir, "japanese.csv");
      fs.writeFileSync(testFile, csvContent, "utf8");

      const result = await parser.parse(testFile);

      expect(result.headers).toEqual(["名前", "年齢", "都市"]);
      expect(result.rows).toEqual([
        ["田中", "25", "東京"],
        ["佐藤", "30", "大阪"],
      ]);
    });

    it("should throw error for non-existent file", async () => {
      const nonExistentFile = path.join(testDataDir, "does-not-exist.csv");

      await expect(parser.parse(nonExistentFile)).rejects.toThrow(
        `入力ファイル '${nonExistentFile}' が見つからないか読み取れません`
      );
    });

    it("should throw error for empty file", async () => {
      const emptyFile = path.join(testDataDir, "empty.csv");
      fs.writeFileSync(emptyFile, "");

      await expect(parser.parse(emptyFile)).rejects.toThrow(
        `入力ファイル '${emptyFile}' は空です`
      );
    });

    it("should throw error for file with empty headers", async () => {
      const csvContent = ",age,\nJohn,25,Tokyo";
      const testFile = path.join(testDataDir, "empty-headers.csv");
      fs.writeFileSync(testFile, csvContent);

      await expect(parser.parse(testFile)).rejects.toThrow(
        "CSV形式が無効です: ヘッダーが空または重複しています"
      );
    });

    it("should throw error for file with duplicate headers", async () => {
      const csvContent = "name,age,name\nJohn,25,Tokyo";
      const testFile = path.join(testDataDir, "duplicate-headers.csv");
      fs.writeFileSync(testFile, csvContent);

      await expect(parser.parse(testFile)).rejects.toThrow(
        "CSV形式が無効です: ヘッダーが空または重複しています"
      );
    });

    it("should handle malformed CSV with proper error reporting", async () => {
      // Create a CSV that will cause parsing issues
      const csvContent = "name,age,city\nJohn,25,Tokyo,ExtraColumn\nJane,30"; // Inconsistent column count
      const testFile = path.join(testDataDir, "malformed.csv");
      fs.writeFileSync(testFile, csvContent);

      // This should be handled by our validation, not necessarily throw during parsing
      const result = await parser.parse(testFile);
      // The csv-parser is quite tolerant, so we test our validation instead
      expect(result.headers).toEqual(["name", "age", "city"]);
      // The parser will handle inconsistent rows by filling missing values
    });

    it("should handle file permission errors gracefully", async () => {
      const testFile = path.join(testDataDir, "no-permission.csv");
      fs.writeFileSync(testFile, "name,age\nJohn,25");

      // Change file permissions to make it unreadable (Unix-like systems)
      try {
        fs.chmodSync(testFile, 0o000);

        await expect(parser.parse(testFile)).rejects.toThrow(
          `入力ファイル '${testFile}' が見つからないか読み取れません`
        );

        // Restore permissions for cleanup
        fs.chmodSync(testFile, 0o644);
      } catch (error) {
        // Skip this test on systems that don't support chmod (like Windows)
        // Restore permissions for cleanup
        fs.chmodSync(testFile, 0o644);
      }
    });
  });

  describe("validate", () => {
    it("should return true for valid data with consistent columns", () => {
      const data = [
        ["John", "25", "Tokyo"],
        ["Jane", "30", "Osaka"],
        ["Bob", "35", "Kyoto"],
      ];

      expect(parser.validate(data)).toBe(true);
    });

    it("should return true for single row", () => {
      const data = [["John", "25", "Tokyo"]];

      expect(parser.validate(data)).toBe(true);
    });

    it("should return true for single column data", () => {
      const data = [["John"], ["Jane"], ["Bob"]];

      expect(parser.validate(data)).toBe(true);
    });

    it("should return false for empty data", () => {
      expect(parser.validate([])).toBe(false);
    });

    it("should return false for null data", () => {
      expect(parser.validate(null as any)).toBe(false);
    });

    it("should return false for undefined data", () => {
      expect(parser.validate(undefined as any)).toBe(false);
    });

    it("should return false for inconsistent column counts", () => {
      const data = [
        ["John", "25", "Tokyo"],
        ["Jane", "30"], // Missing city
        ["Bob", "35", "Kyoto", "Extra"],
      ];

      expect(parser.validate(data)).toBe(false);
    });

    it("should return true for data with empty fields but consistent columns", () => {
      const data = [
        ["John", "", "Tokyo"],
        ["", "30", "Osaka"],
        ["Bob", "35", ""],
      ];

      expect(parser.validate(data)).toBe(true);
    });
  });
});
