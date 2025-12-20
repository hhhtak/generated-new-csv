import { CSVData } from "../../models";
import { DataTransformerImpl } from "../DataTransformer";

describe("DataTransformer", () => {
  let transformer: DataTransformerImpl;

  beforeEach(() => {
    transformer = new DataTransformerImpl();
  });

  describe("reorderColumns", () => {
    const sampleData: CSVData = {
      headers: ["name", "age", "city", "country"],
      rows: [
        ["Alice", "25", "Tokyo", "Japan"],
        ["Bob", "30", "New York", "USA"],
        ["Charlie", "35", "London", "UK"],
      ],
    };

    it("should reorder columns according to specified order", () => {
      const order = ["country", "name", "age"];
      const result = transformer.reorderColumns(sampleData, order);

      expect(result.headers).toEqual(["country", "name", "age"]);
      expect(result.rows).toEqual([
        ["Japan", "Alice", "25"],
        ["USA", "Bob", "30"],
        ["UK", "Charlie", "35"],
      ]);
    });

    it("should handle single column reordering", () => {
      const order = ["city"];
      const result = transformer.reorderColumns(sampleData, order);

      expect(result.headers).toEqual(["city"]);
      expect(result.rows).toEqual([["Tokyo"], ["New York"], ["London"]]);
    });

    it("should handle all columns in different order", () => {
      const order = ["city", "country", "name", "age"];
      const result = transformer.reorderColumns(sampleData, order);

      expect(result.headers).toEqual(["city", "country", "name", "age"]);
      expect(result.rows).toEqual([
        ["Tokyo", "Japan", "Alice", "25"],
        ["New York", "USA", "Bob", "30"],
        ["London", "UK", "Charlie", "35"],
      ]);
    });

    it("should handle empty rows correctly", () => {
      const dataWithEmptyRows: CSVData = {
        headers: ["name", "age", "city"],
        rows: [
          ["Alice", "25", "Tokyo"],
          ["", "", ""],
          ["Bob", "30", ""],
        ],
      };

      const order = ["city", "name"];
      const result = transformer.reorderColumns(dataWithEmptyRows, order);

      expect(result.headers).toEqual(["city", "name"]);
      expect(result.rows).toEqual([
        ["Tokyo", "Alice"],
        ["", ""],
        ["", "Bob"],
      ]);
    });

    it("should handle missing cell values by filling with empty string", () => {
      const dataWithMissingCells: CSVData = {
        headers: ["name", "age", "city"],
        rows: [
          ["Alice", "25"], // Missing city
          ["Bob", "30", "New York"],
          ["Charlie"], // Missing age and city
        ],
      };

      const order = ["city", "name", "age"];
      const result = transformer.reorderColumns(dataWithMissingCells, order);

      expect(result.headers).toEqual(["city", "name", "age"]);
      expect(result.rows).toEqual([
        ["", "Alice", "25"],
        ["New York", "Bob", "30"],
        ["", "Charlie", ""],
      ]);
    });

    it("should throw error when specified column does not exist", () => {
      const order = ["name", "nonexistent_column", "age"];

      expect(() => {
        transformer.reorderColumns(sampleData, order);
      }).toThrow(
        "columnOrderで指定された列 'nonexistent_column' が入力CSVに見つかりません"
      );
    });

    it("should throw error when multiple specified columns do not exist", () => {
      const order = ["name", "missing1", "age", "missing2"];

      expect(() => {
        transformer.reorderColumns(sampleData, order);
      }).toThrow(
        "columnOrderで指定された列 'missing1, missing2' が入力CSVに見つかりません"
      );
    });

    it("should handle empty column order", () => {
      const order: string[] = [];
      const result = transformer.reorderColumns(sampleData, order);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([[], [], []]);
    });

    it("should handle data with no rows", () => {
      const emptyData: CSVData = {
        headers: ["name", "age", "city"],
        rows: [],
      };

      const order = ["city", "name"];
      const result = transformer.reorderColumns(emptyData, order);

      expect(result.headers).toEqual(["city", "name"]);
      expect(result.rows).toEqual([]);
    });

    it("should preserve original data immutability", () => {
      const originalHeaders = [...sampleData.headers];
      const originalRows = sampleData.rows.map((row) => [...row]);

      const order = ["country", "name"];
      transformer.reorderColumns(sampleData, order);

      expect(sampleData.headers).toEqual(originalHeaders);
      expect(sampleData.rows).toEqual(originalRows);
    });
  });

  describe("replaceValues", () => {
    const sampleData: CSVData = {
      headers: ["name", "status", "active", "category"],
      rows: [
        ["Alice", "あり", "yes", "A"],
        ["Bob", "なし", "no", "B"],
        ["Charlie", "あり", "yes", "A"],
        ["David", "なし", "maybe", "C"],
      ],
    };

    it("should replace values in single column", () => {
      const replacements = {
        status: {
          あり: "1",
          なし: "0",
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.headers).toEqual(["name", "status", "active", "category"]);
      expect(result.rows).toEqual([
        ["Alice", "1", "yes", "A"],
        ["Bob", "0", "no", "B"],
        ["Charlie", "1", "yes", "A"],
        ["David", "0", "maybe", "C"],
      ]);
    });

    it("should replace values in multiple columns", () => {
      const replacements = {
        status: {
          あり: "1",
          なし: "0",
        },
        active: {
          yes: "true",
          no: "false",
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.rows).toEqual([
        ["Alice", "1", "true", "A"],
        ["Bob", "0", "false", "B"],
        ["Charlie", "1", "true", "A"],
        ["David", "0", "maybe", "C"],
      ]);
    });

    it("should handle multiple replacement rules in same column", () => {
      const replacements = {
        category: {
          A: "Alpha",
          B: "Beta",
          C: "Gamma",
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.rows).toEqual([
        ["Alice", "あり", "yes", "Alpha"],
        ["Bob", "なし", "no", "Beta"],
        ["Charlie", "あり", "yes", "Alpha"],
        ["David", "なし", "maybe", "Gamma"],
      ]);
    });

    it("should preserve values that do not match replacement rules", () => {
      const replacements = {
        status: {
          あり: "1",
          // 'なし' is not included, so it should remain unchanged
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.rows).toEqual([
        ["Alice", "1", "yes", "A"],
        ["Bob", "なし", "no", "B"],
        ["Charlie", "1", "yes", "A"],
        ["David", "なし", "maybe", "C"],
      ]);
    });

    it("should handle empty replacement rules", () => {
      const replacements = {};

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toEqual(sampleData.rows);
    });

    it("should handle replacement rules for non-existent columns", () => {
      const replacements = {
        nonexistent_column: {
          value1: "replacement1",
        },
        status: {
          あり: "1",
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.rows).toEqual([
        ["Alice", "1", "yes", "A"],
        ["Bob", "なし", "no", "B"],
        ["Charlie", "1", "yes", "A"],
        ["David", "なし", "maybe", "C"],
      ]);
    });

    it("should handle empty string values", () => {
      const dataWithEmptyValues: CSVData = {
        headers: ["name", "status"],
        rows: [
          ["Alice", ""],
          ["Bob", "あり"],
          ["Charlie", ""],
        ],
      };

      const replacements = {
        status: {
          "": "unknown",
          あり: "1",
        },
      };

      const result = transformer.replaceValues(dataWithEmptyValues, replacements);

      expect(result.rows).toEqual([
        ["Alice", "unknown"],
        ["Bob", "1"],
        ["Charlie", "unknown"],
      ]);
    });

    it("should handle missing cell values", () => {
      const dataWithMissingValues: CSVData = {
        headers: ["name", "status"],
        rows: [
          ["Alice", "あり"],
          ["Bob"], // Missing status value
          ["Charlie", "なし"],
        ],
      };

      const replacements = {
        status: {
          あり: "1",
          なし: "0",
        },
      };

      const result = transformer.replaceValues(dataWithMissingValues, replacements);

      expect(result.rows).toEqual([
        ["Alice", "1"],
        ["Bob"], // Missing value remains unchanged
        ["Charlie", "0"],
      ]);
    });

    it("should preserve original data immutability", () => {
      const originalHeaders = [...sampleData.headers];
      const originalRows = sampleData.rows.map((row) => [...row]);

      const replacements = {
        status: {
          あり: "1",
          なし: "0",
        },
      };

      transformer.replaceValues(sampleData, replacements);

      expect(sampleData.headers).toEqual(originalHeaders);
      expect(sampleData.rows).toEqual(originalRows);
    });

    it("should handle special characters in replacement values", () => {
      const replacements = {
        status: {
          あり: "✓",
          なし: "✗",
        },
      };

      const result = transformer.replaceValues(sampleData, replacements);

      expect(result.rows[0][1]).toBe("✓");
      expect(result.rows[1][1]).toBe("✗");
    });
  });

  describe("mapHeaders", () => {
    it("should map headers to new names", () => {
      const data: CSVData = {
        headers: ["name", "age", "city"],
        rows: [
          ["Alice", "25", "Tokyo"],
          ["Bob", "30", "New York"],
        ],
      };
      const mappings = {
        name: "full_name",
        age: "years_old",
        city: "location",
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["full_name", "years_old", "location"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "Tokyo"],
        ["Bob", "30", "New York"],
      ]);
    });

    it("should preserve original names when no mapping is provided", () => {
      const data: CSVData = {
        headers: ["name", "age", "city"],
        rows: [["Alice", "25", "Tokyo"]],
      };
      const mappings = {
        name: "full_name",
        // age and city have no mappings
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["full_name", "age", "city"]);
      expect(result.rows).toEqual([["Alice", "25", "Tokyo"]]);
    });

    it("should handle empty mappings", () => {
      const data: CSVData = {
        headers: ["name", "age", "city"],
        rows: [["Alice", "25", "Tokyo"]],
      };
      const mappings = {};

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([["Alice", "25", "Tokyo"]]);
    });

    it("should handle empty headers array", () => {
      const data: CSVData = {
        headers: [],
        rows: [],
      };
      const mappings = {
        name: "full_name",
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });

    it("should handle mappings for non-existent headers", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [["Alice", "25"]],
      };
      const mappings = {
        name: "full_name",
        nonexistent: "mapped_name",
        age: "years",
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["full_name", "years"]);
      expect(result.rows).toEqual([["Alice", "25"]]);
    });

    it("should handle special characters in header names", () => {
      const data: CSVData = {
        headers: ["名前", "age-years", "city/location"],
        rows: [["Alice", "25", "Tokyo"]],
      };
      const mappings = {
        名前: "name",
        "age-years": "age",
        "city/location": "city",
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["name", "age", "city"]);
      expect(result.rows).toEqual([["Alice", "25", "Tokyo"]]);
    });

    it("should handle empty string headers", () => {
      const data: CSVData = {
        headers: ["name", "", "age"],
        rows: [["Alice", "unknown", "25"]],
      };
      const mappings = {
        name: "full_name",
        "": "empty_header",
        age: "years",
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["full_name", "empty_header", "years"]);
      expect(result.rows).toEqual([["Alice", "unknown", "25"]]);
    });

    it("should preserve original data immutability", () => {
      const data: CSVData = {
        headers: ["name", "age", "city"],
        rows: [["Alice", "25", "Tokyo"]],
      };
      const originalHeaders = [...data.headers];
      const originalRows = data.rows.map((row) => [...row]);
      const mappings = {
        name: "full_name",
      };

      transformer.mapHeaders(data, mappings);

      expect(data.headers).toEqual(originalHeaders);
      expect(data.rows).toEqual(originalRows);
    });

    it("should handle array mappings (1-to-many)", () => {
      const data: CSVData = {
        headers: ["name", "full_address"],
        rows: [
          ["Alice", "123 Main St, Tokyo, Japan"],
          ["Bob", "456 Oak Ave, New York, USA"],
        ],
      };
      const mappings = {
        full_address: ["street", "city", "country"],
      };

      const result = transformer.mapHeaders(data, mappings);

      expect(result.headers).toEqual(["name", "street", "city", "country"]);
      expect(result.rows).toEqual([
        [
          "Alice",
          "123 Main St, Tokyo, Japan",
          "123 Main St, Tokyo, Japan",
          "123 Main St, Tokyo, Japan",
        ],
        [
          "Bob",
          "456 Oak Ave, New York, USA",
          "456 Oak Ave, New York, USA",
          "456 Oak Ave, New York, USA",
        ],
      ]);
    });
  });

  describe("addFixedColumns", () => {
    const sampleData: CSVData = {
      headers: ["name", "age", "city"],
      rows: [
        ["Alice", "25", "Tokyo"],
        ["Bob", "30", "New York"],
        ["Charlie", "35", "London"],
      ],
    };

    it("should add single fixed column", () => {
      const fixedColumns = {
        status: "active",
      };

      const result = transformer.addFixedColumns(sampleData, fixedColumns);

      expect(result.headers).toEqual(["name", "age", "city", "status"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "Tokyo", "active"],
        ["Bob", "30", "New York", "active"],
        ["Charlie", "35", "London", "active"],
      ]);
    });

    it("should add multiple fixed columns with string and number values", () => {
      const fixedColumns = {
        status: "active",
        created_date: "2024-01-01",
        version: 1.0,
        count: 42,
      };

      const result = transformer.addFixedColumns(sampleData, fixedColumns);

      expect(result.headers).toEqual([
        "name",
        "age",
        "city",
        "status",
        "created_date",
        "version",
        "count",
      ]);
      expect(result.rows).toEqual([
        ["Alice", "25", "Tokyo", "active", "2024-01-01", "1", "42"],
        ["Bob", "30", "New York", "active", "2024-01-01", "1", "42"],
        ["Charlie", "35", "London", "active", "2024-01-01", "1", "42"],
      ]);
    });

    it("should handle empty fixed columns", () => {
      const fixedColumns = {};

      const result = transformer.addFixedColumns(sampleData, fixedColumns);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toEqual(sampleData.rows);
    });

    it("should handle data with no rows", () => {
      const emptyData: CSVData = {
        headers: ["name", "age"],
        rows: [],
      };

      const fixedColumns = {
        status: "active",
      };

      const result = transformer.addFixedColumns(emptyData, fixedColumns);

      expect(result.headers).toEqual(["name", "age", "status"]);
      expect(result.rows).toEqual([]);
    });

    it("should handle fixed columns with numeric values", () => {
      const fixedColumns = {
        count: 100,
        price: 99.99,
        version: 2,
      };

      const result = transformer.addFixedColumns(sampleData, fixedColumns);

      expect(result.headers).toEqual([
        "name",
        "age",
        "city",
        "count",
        "price",
        "version",
      ]);
      expect(result.rows).toEqual([
        ["Alice", "25", "Tokyo", "100", "99.99", "2"],
        ["Bob", "30", "New York", "100", "99.99", "2"],
        ["Charlie", "35", "London", "100", "99.99", "2"],
      ]);
    });

    it("should handle fixed columns with special characters", () => {
      const fixedColumns = {
        "special-column": "value with spaces",
        日本語列: "日本語値",
        symbols: "!@#$%^&*()",
      };

      const result = transformer.addFixedColumns(sampleData, fixedColumns);

      expect(result.headers).toEqual([
        "name",
        "age",
        "city",
        "special-column",
        "日本語列",
        "symbols",
      ]);
      expect(result.rows[0]).toEqual([
        "Alice",
        "25",
        "Tokyo",
        "value with spaces",
        "日本語値",
        "!@#$%^&*()",
      ]);
    });

    it("should throw error when fixed column name duplicates existing column", () => {
      const fixedColumns = {
        name: "duplicate_name", // 'name' already exists in headers
        status: "active",
      };

      expect(() => {
        transformer.addFixedColumns(sampleData, fixedColumns);
      }).toThrow("固定列の名前が既存の列と重複しています: 'name'");
    });

    it("should throw error when multiple fixed column names duplicate existing columns", () => {
      const fixedColumns = {
        name: "duplicate_name", // 'name' already exists
        age: "duplicate_age", // 'age' already exists
        status: "active",
      };

      expect(() => {
        transformer.addFixedColumns(sampleData, fixedColumns);
      }).toThrow("固定列の名前が既存の列と重複しています: 'name, age'");
    });

    it("should preserve original data immutability", () => {
      const originalHeaders = [...sampleData.headers];
      const originalRows = sampleData.rows.map((row) => [...row]);

      const fixedColumns = {
        status: "active",
      };

      transformer.addFixedColumns(sampleData, fixedColumns);

      expect(sampleData.headers).toEqual(originalHeaders);
      expect(sampleData.rows).toEqual(originalRows);
    });

    it("should handle data with missing cell values", () => {
      const dataWithMissingCells: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob"], // Missing age
          ["Charlie", "35"],
        ],
      };

      const fixedColumns = {
        status: "active",
      };

      const result = transformer.addFixedColumns(dataWithMissingCells, fixedColumns);

      expect(result.headers).toEqual(["name", "age", "status"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "active"],
        ["Bob", "active"], // Missing age cell preserved
        ["Charlie", "35", "active"],
      ]);
    });
  });

  describe("transform (integration)", () => {
    const sampleData: CSVData = {
      headers: ["name", "status", "age"],
      rows: [
        ["Alice", "あり", "25"],
        ["Bob", "なし", "30"],
      ],
    };

    it("should apply all transformations in correct order", () => {
      const config = {
        headerMappings: {
          name: "full_name",
          status: "active_status",
          age: "years_old",
        },
        columnOrder: ["active_status", "full_name"],
        valueReplacements: {
          active_status: {
            あり: "1",
            なし: "0",
          },
        },
      };

      const result = transformer.transform(sampleData, config);

      expect(result.headers).toEqual(["active_status", "full_name"]);
      expect(result.rows).toEqual([
        ["1", "Alice"],
        ["0", "Bob"],
      ]);
    });

    it("should apply all transformations including fixed columns with numbers", () => {
      const config = {
        headerMappings: {
          name: "full_name",
          status: "active_status",
        },
        valueReplacements: {
          active_status: {
            あり: "1",
            なし: "0",
          },
        },
        fixedColumns: {
          created_date: "2024-01-01",
          version: 1.0,
          count: 42,
        },
      };

      const result = transformer.transform(sampleData, config);

      expect(result.headers).toEqual([
        "full_name",
        "active_status",
        "age",
        "created_date",
        "version",
        "count",
      ]);
      expect(result.rows).toEqual([
        ["Alice", "1", "25", "2024-01-01", "1", "42"],
        ["Bob", "0", "30", "2024-01-01", "1", "42"],
      ]);
    });

    it("should handle partial configuration", () => {
      const config = {
        valueReplacements: {
          status: {
            あり: "yes",
            なし: "no",
          },
        },
      };

      const result = transformer.transform(sampleData, config);

      expect(result.headers).toEqual(["name", "status", "age"]);
      expect(result.rows).toEqual([
        ["Alice", "yes", "25"],
        ["Bob", "no", "30"],
      ]);
    });

    it("should handle empty configuration", () => {
      const config = {};

      const result = transformer.transform(sampleData, config);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toEqual(sampleData.rows);
    });

    it("should handle fixed columns only configuration with numbers", () => {
      const config = {
        fixedColumns: {
          department: "IT",
          priority: "high",
          level: 5,
          score: 98.5,
        },
      };

      const result = transformer.transform(sampleData, config);

      expect(result.headers).toEqual([
        "name",
        "status",
        "age",
        "department",
        "priority",
        "level",
        "score",
      ]);
      expect(result.rows).toEqual([
        ["Alice", "あり", "25", "IT", "high", "5", "98.5"],
        ["Bob", "なし", "30", "IT", "high", "5", "98.5"],
      ]);
    });
  });
});
