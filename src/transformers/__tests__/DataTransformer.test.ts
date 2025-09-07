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
      const headers = ["name", "age", "city"];
      const mappings = {
        name: "full_name",
        age: "years_old",
        city: "location",
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["full_name", "years_old", "location"]);
    });

    it("should preserve original names when no mapping is provided", () => {
      const headers = ["name", "age", "city"];
      const mappings = {
        name: "full_name",
        // age and city have no mappings
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["full_name", "age", "city"]);
    });

    it("should handle empty mappings", () => {
      const headers = ["name", "age", "city"];
      const mappings = {};

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["name", "age", "city"]);
    });

    it("should handle empty headers array", () => {
      const headers: string[] = [];
      const mappings = {
        name: "full_name",
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual([]);
    });

    it("should handle mappings for non-existent headers", () => {
      const headers = ["name", "age"];
      const mappings = {
        name: "full_name",
        nonexistent: "mapped_name",
        age: "years",
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["full_name", "years"]);
    });

    it("should handle special characters in header names", () => {
      const headers = ["名前", "age-years", "city/location"];
      const mappings = {
        名前: "name",
        "age-years": "age",
        "city/location": "city",
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["name", "age", "city"]);
    });

    it("should handle empty string headers", () => {
      const headers = ["name", "", "age"];
      const mappings = {
        name: "full_name",
        "": "empty_header",
        age: "years",
      };

      const result = transformer.mapHeaders(headers, mappings);

      expect(result).toEqual(["full_name", "empty_header", "years"]);
    });

    it("should preserve original array immutability", () => {
      const headers = ["name", "age", "city"];
      const originalHeaders = [...headers];
      const mappings = {
        name: "full_name",
      };

      transformer.mapHeaders(headers, mappings);

      expect(headers).toEqual(originalHeaders);
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
  });
});
