import { CSVData, DeleteCondition } from "../../models";
import { DataDeleter } from "../DataDeleter";

describe("DataDeleter", () => {
  let dataDeleter: DataDeleter;

  beforeEach(() => {
    dataDeleter = new DataDeleter();
  });

  describe("matchesCondition", () => {
    it("should match single string value exactly", () => {
      const condition: DeleteCondition = {
        column: "status",
        value: "inactive",
      };

      expect(dataDeleter.matchesCondition("inactive", condition)).toBe(true);
      expect(dataDeleter.matchesCondition("active", condition)).toBe(false);
      expect(dataDeleter.matchesCondition("INACTIVE", condition)).toBe(false);
      expect(dataDeleter.matchesCondition("", condition)).toBe(false);
    });

    it("should match any value in array", () => {
      const condition: DeleteCondition = {
        column: "category",
        value: ["削除対象", "無効", "テスト"],
      };

      expect(dataDeleter.matchesCondition("削除対象", condition)).toBe(true);
      expect(dataDeleter.matchesCondition("無効", condition)).toBe(true);
      expect(dataDeleter.matchesCondition("テスト", condition)).toBe(true);
      expect(dataDeleter.matchesCondition("有効", condition)).toBe(false);
      expect(dataDeleter.matchesCondition("", condition)).toBe(false);
    });

    it("should handle empty string values", () => {
      const singleCondition: DeleteCondition = {
        column: "status",
        value: "",
      };

      const arrayCondition: DeleteCondition = {
        column: "category",
        value: ["", "empty"],
      };

      expect(dataDeleter.matchesCondition("", singleCondition)).toBe(true);
      expect(dataDeleter.matchesCondition("", arrayCondition)).toBe(true);
      expect(dataDeleter.matchesCondition("empty", arrayCondition)).toBe(true);
      expect(dataDeleter.matchesCondition("nonempty", arrayCondition)).toBe(
        false
      );
    });
  });

  describe("deleteRows", () => {
    const sampleData: CSVData = {
      headers: ["id", "name", "status", "category"],
      rows: [
        ["1", "Alice", "active", "user"],
        ["2", "Bob", "inactive", "admin"],
        ["3", "Charlie", "active", "削除対象"],
        ["4", "David", "inactive", "削除対象"],
        ["5", "Eve", "active", "user"],
      ],
    };

    it("should delete rows matching single condition", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
      ];

      const result = dataDeleter.deleteRows(sampleData, conditions);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toHaveLength(3);
      expect(result.rows).toEqual([
        ["1", "Alice", "active", "user"],
        ["3", "Charlie", "active", "削除対象"],
        ["5", "Eve", "active", "user"],
      ]);
    });

    it("should delete rows matching array condition", () => {
      const conditions: DeleteCondition[] = [
        { column: "category", value: ["削除対象", "admin"] },
      ];

      const result = dataDeleter.deleteRows(sampleData, conditions);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toHaveLength(2);
      expect(result.rows).toEqual([
        ["1", "Alice", "active", "user"],
        ["5", "Eve", "active", "user"],
      ]);
    });

    it("should delete rows matching ALL conditions (AND logic)", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "category", value: "削除対象" },
      ];

      const result = dataDeleter.deleteRows(sampleData, conditions);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toHaveLength(4);
      expect(result.rows).toEqual([
        ["1", "Alice", "active", "user"],
        ["2", "Bob", "inactive", "admin"],
        ["3", "Charlie", "active", "削除対象"],
        ["5", "Eve", "active", "user"],
      ]);
    });

    it("should return original data when no conditions provided", () => {
      const result = dataDeleter.deleteRows(sampleData, []);

      expect(result).toEqual(sampleData);
    });

    it("should return original data when no rows match conditions", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: "nonexistent" },
      ];

      const result = dataDeleter.deleteRows(sampleData, conditions);

      expect(result.headers).toEqual(sampleData.headers);
      expect(result.rows).toEqual(sampleData.rows);
    });

    it("should handle empty data", () => {
      const emptyData: CSVData = {
        headers: ["id", "name"],
        rows: [],
      };

      const conditions: DeleteCondition[] = [{ column: "id", value: "1" }];

      const result = dataDeleter.deleteRows(emptyData, conditions);

      expect(result).toEqual(emptyData);
    });
  });

  describe("validateConditions", () => {
    const headers = ["id", "name", "status", "category"];

    it("should validate correct conditions", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "category", value: ["削除対象", "無効"] },
      ];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect non-existent columns", () => {
      const conditions: DeleteCondition[] = [
        { column: "nonexistent", value: "test" },
        { column: "another_missing", value: ["a", "b"] },
      ];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        "Delete condition references non-existent column: 'nonexistent'"
      );
      expect(result.errors[1]).toContain(
        "Delete condition references non-existent column: 'another_missing'"
      );
    });

    it("should detect missing values", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: undefined as any },
        { column: "category", value: null as any },
      ];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        "Delete condition for column 'status' has no value specified"
      );
      expect(result.errors[1]).toContain(
        "Delete condition for column 'category' has no value specified"
      );
    });

    it("should detect empty value arrays", () => {
      const conditions: DeleteCondition[] = [{ column: "status", value: [] }];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Delete condition for column 'status' has empty value array"
      );
    });

    it("should detect null/undefined values in arrays", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: ["active", null as any, "inactive"] },
        { column: "category", value: ["valid", undefined as any] },
      ];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        "Delete condition for column 'status' contains null or undefined values"
      );
      expect(result.errors[1]).toContain(
        "Delete condition for column 'category' contains null or undefined values"
      );
    });

    it("should detect non-string values", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: 123 as any },
        { column: "category", value: true as any },
      ];

      const result = dataDeleter.validateConditions(conditions, headers);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        "Delete condition for column 'status' must have string value(s)"
      );
      expect(result.errors[1]).toContain(
        "Delete condition for column 'category' must have string value(s)"
      );
    });

    it("should handle empty headers array", () => {
      const conditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
      ];

      const result = dataDeleter.validateConditions(conditions, []);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain(
        "Delete condition references non-existent column: 'status'"
      );
    });
  });

  describe("error handling in deleteRows", () => {
    const sampleData: CSVData = {
      headers: ["id", "name", "status"],
      rows: [
        ["1", "Alice", "active"],
        ["2", "Bob", "inactive"],
      ],
    };

    it("should throw error for invalid conditions", () => {
      const conditions: DeleteCondition[] = [
        { column: "nonexistent", value: "test" },
      ];

      expect(() => {
        dataDeleter.deleteRows(sampleData, conditions);
      }).toThrow(
        "Invalid delete conditions: Delete condition references non-existent column: 'nonexistent'"
      );
    });

    it("should throw error with multiple validation errors", () => {
      const conditions: DeleteCondition[] = [
        { column: "nonexistent1", value: "test" },
        { column: "nonexistent2", value: [] },
      ];

      expect(() => {
        dataDeleter.deleteRows(sampleData, conditions);
      }).toThrow("Invalid delete conditions:");
    });

    it("should handle missing column gracefully during row processing", () => {
      // This tests the edge case where validation passes but column lookup fails
      const dataWithMissingColumn: CSVData = {
        headers: ["id", "name"],
        rows: [
          ["1", "Alice"],
          ["2"], // Missing second column
        ],
      };

      const conditions: DeleteCondition[] = [
        { column: "name", value: "Alice" },
      ];

      const result = dataDeleter.deleteRows(dataWithMissingColumn, conditions);

      expect(result.headers).toEqual(dataWithMissingColumn.headers);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual(["2"]);
    });
  });
});
