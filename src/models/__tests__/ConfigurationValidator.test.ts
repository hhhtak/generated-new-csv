import { ConfigurationValidator } from "../ConfigurationValidator";
import { DeleteCondition, TransformationConfig } from "../TransformationConfig";

describe("ConfigurationValidator", () => {
  describe("validateHeaderMappings", () => {
    it("should validate undefined headerMappings", () => {
      const result = ConfigurationValidator.validateHeaderMappings(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid headerMappings", () => {
      const headerMappings = {
        old_name: "new_name",
        another_old: "another_new",
      };

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-object headerMappings", () => {
      const result = ConfigurationValidator.validateHeaderMappings(
        "not an object" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("headerMappings must be an object");
    });

    it("should reject null headerMappings", () => {
      const result = ConfigurationValidator.validateHeaderMappings(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("headerMappings must be an object");
    });

    it("should reject headerMappings with non-string keys or values", () => {
      const headerMappings = { valid: 123 } as any;

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings value for key 'valid' must be a string or an array of strings"
      );
    });

    it("should reject headerMappings with empty string keys", () => {
      const headerMappings = { "": "value" };

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings keys must be non-empty strings"
      );
    });

    it("should reject headerMappings with empty string values", () => {
      const headerMappings = { key: "" };

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings value for key 'key' cannot be an empty string"
      );
    });

    it("should reject headerMappings with whitespace-only strings", () => {
      const headerMappings = { "  ": "value" };

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings keys must be non-empty strings"
      );
    });

    it("should detect circular mappings", () => {
      const headerMappings = { A: "B", B: "A" };

      const result =
        ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Circular mapping detected: 'B' <-> 'A'");
    });
  });

  describe("validateColumnOrder", () => {
    it("should validate undefined columnOrder", () => {
      const result = ConfigurationValidator.validateColumnOrder(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid columnOrder", () => {
      const columnOrder = ["col1", "col2", "col3"];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-array columnOrder", () => {
      const result = ConfigurationValidator.validateColumnOrder(
        "not an array" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("columnOrder must be an array");
    });

    it("should reject columnOrder with non-string elements", () => {
      const columnOrder = ["valid", 123] as any;

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("columnOrder must contain only strings");
    });

    it("should reject columnOrder with empty strings", () => {
      const columnOrder = ["valid", ""];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "columnOrder cannot contain empty strings"
      );
    });

    it("should reject columnOrder with whitespace-only strings", () => {
      const columnOrder = ["valid", "  "];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "columnOrder cannot contain empty strings"
      );
    });

    it("should reject columnOrder with duplicates", () => {
      const columnOrder = ["col1", "col2", "col1"];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "columnOrder cannot contain duplicate column names"
      );
    });

    it("should validate empty columnOrder array", () => {
      const columnOrder: string[] = [];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateValueReplacements", () => {
    it("should validate undefined valueReplacements", () => {
      const result =
        ConfigurationValidator.validateValueReplacements(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid valueReplacements", () => {
      const valueReplacements = {
        status: { あり: "1", なし: "0" },
        type: { A: "Alpha", B: "Beta" },
      };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-object valueReplacements", () => {
      const result = ConfigurationValidator.validateValueReplacements(
        "not an object" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("valueReplacements must be an object");
    });

    it("should reject null valueReplacements", () => {
      const result = ConfigurationValidator.validateValueReplacements(
        null as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("valueReplacements must be an object");
    });

    it("should reject valueReplacements with empty column names", () => {
      const valueReplacements = { "": { old: "new" } };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements column names must be non-empty strings"
      );
    });

    it("should reject valueReplacements with whitespace-only column names", () => {
      const valueReplacements = { "  ": { old: "new" } };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements column names must be non-empty strings"
      );
    });

    it("should reject valueReplacements with non-object replacement values", () => {
      const valueReplacements = { column: "not an object" as any };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must be an object"
      );
    });

    it("should reject valueReplacements with null replacement values", () => {
      const valueReplacements = { column: null as any };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must be an object"
      );
    });

    it("should reject valueReplacements with non-string replacement keys or values", () => {
      const valueReplacements = { column: { old: 123 } as any };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must have string keys and values"
      );
    });

    it("should detect circular replacements", () => {
      const valueReplacements = { column: { A: "B", B: "A" } };

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Circular replacement detected in column 'column': 'B' <-> 'A'"
      );
    });

    it("should validate empty valueReplacements object", () => {
      const valueReplacements = {};

      const result =
        ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateFixedColumns", () => {
    it("should validate undefined fixedColumns", () => {
      const result = ConfigurationValidator.validateFixedColumns(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid fixedColumns with string and number values", () => {
      const fixedColumns = {
        status: "active",
        created_date: "2024-01-01",
        version: 1.0,
        count: 42,
      };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-object fixedColumns", () => {
      const result = ConfigurationValidator.validateFixedColumns(
        "not an object" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("fixedColumns must be an object");
    });

    it("should reject null fixedColumns", () => {
      const result = ConfigurationValidator.validateFixedColumns(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("fixedColumns must be an object");
    });

    it("should reject fixedColumns with empty column names", () => {
      const fixedColumns = { "": "value" };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "fixedColumns column names must be non-empty strings"
      );
    });

    it("should reject fixedColumns with whitespace-only column names", () => {
      const fixedColumns = { "  ": "value" };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "fixedColumns column names must be non-empty strings"
      );
    });

    it("should handle numeric keys converted to strings", () => {
      // JavaScript automatically converts numeric keys to strings
      const fixedColumns = { 123: "value" };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject fixedColumns with non-string and non-number values", () => {
      const fixedColumns = { column: true } as any;

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "fixedColumns value for column 'column' must be a string or a number"
      );
    });

    it("should validate fixedColumns with numeric values", () => {
      const fixedColumns = {
        count: 42,
        price: 99.99,
        version: 1,
      };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate empty fixedColumns object", () => {
      const fixedColumns = {};

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle fixedColumns with special characters in values", () => {
      const fixedColumns = {
        special: 'value with spaces, commas, and "quotes"',
        unicode: "日本語テスト",
        newlines: "line1\nline2",
      };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle fixedColumns with very long column names", () => {
      const longColumnName = "a".repeat(1000);
      const fixedColumns = { [longColumnName]: "value" };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle fixedColumns with very long values", () => {
      const longValue = "value".repeat(1000);
      const fixedColumns = { column: longValue };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should handle fixedColumns with boolean-like values as strings", () => {
      const fixedColumns = {
        active: "true",
        enabled: "false",
        visible: "1",
        hidden: "0",
      };

      const result = ConfigurationValidator.validateFixedColumns(fixedColumns);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe("validateDeleteConditions", () => {
    it("should validate undefined deleteConditions", () => {
      const result = ConfigurationValidator.validateDeleteConditions(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid deleteConditions with single string values", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "type", value: "test" },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid deleteConditions with array values", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: ["inactive", "deleted", "archived"] },
        { column: "category", value: ["test", "temp"] },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate mixed single and array values", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "category", value: ["test", "temp", "debug"] },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject non-array deleteConditions", () => {
      const result = ConfigurationValidator.validateDeleteConditions(
        "not an array" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("deleteConditions must be an array");
    });

    it("should reject deleteConditions with non-object elements", () => {
      const deleteConditions = ["not an object"] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("deleteConditions[0] must be an object");
    });

    it("should reject deleteConditions with null elements", () => {
      const deleteConditions = [null] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("deleteConditions[0] must be an object");
    });

    it("should reject deleteConditions with missing column", () => {
      const deleteConditions = [{ value: "test" }] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].column must be a non-empty string"
      );
    });

    it("should reject deleteConditions with empty column", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "", value: "test" },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].column cannot be empty or whitespace-only"
      );
    });

    it("should reject deleteConditions with whitespace-only column", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "  ", value: "test" },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].column cannot be empty or whitespace-only"
      );
    });

    it("should reject deleteConditions with non-string column", () => {
      const deleteConditions = [{ column: 123, value: "test" }] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].column must be a non-empty string"
      );
    });

    it("should reject deleteConditions with missing value", () => {
      const deleteConditions = [{ column: "status" }] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("deleteConditions[0].value is required");
    });

    it("should reject deleteConditions with null value", () => {
      const deleteConditions = [{ column: "status", value: null }] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("deleteConditions[0].value is required");
    });

    it("should reject deleteConditions with empty array value", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: [] },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].value array cannot be empty"
      );
    });

    it("should reject deleteConditions with non-string array elements", () => {
      const deleteConditions = [
        { column: "status", value: ["valid", 123] },
      ] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].value[1] must be a string"
      );
    });

    it("should reject deleteConditions with non-string and non-array value", () => {
      const deleteConditions = [{ column: "status", value: 123 }] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].value must be a string or an array of strings"
      );
    });

    it("should reject deleteConditions with unexpected properties", () => {
      const deleteConditions = [
        { column: "status", value: "test", extraProp: "invalid" },
      ] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0] contains unexpected property 'extraProp'"
      );
    });

    it("should validate empty deleteConditions array", () => {
      const deleteConditions: DeleteCondition[] = [];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should allow empty string values", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "" },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should allow empty strings in array values", () => {
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: ["", "inactive", ""] },
      ];

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should accumulate multiple errors", () => {
      const deleteConditions = [
        { column: "", value: null },
        { column: 123, value: [] },
        { extraProp: "invalid" },
      ] as any;

      const result =
        ConfigurationValidator.validateDeleteConditions(deleteConditions);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0].column cannot be empty or whitespace-only"
      );
      expect(result.errors).toContain("deleteConditions[0].value is required");
      expect(result.errors).toContain(
        "deleteConditions[1].column must be a non-empty string"
      );
      expect(result.errors).toContain(
        "deleteConditions[1].value array cannot be empty"
      );
      expect(result.errors).toContain(
        "deleteConditions[2].column must be a non-empty string"
      );
      expect(result.errors).toContain("deleteConditions[2].value is required");
    });
  });

  describe("validateDeleteConditionsWithHeaders", () => {
    it("should validate undefined deleteConditions", () => {
      const headers = ["name", "status", "age"];
      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        undefined,
        headers
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate empty deleteConditions", () => {
      const headers = ["name", "status", "age"];
      const deleteConditions: DeleteCondition[] = [];
      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate deleteConditions with existing columns", () => {
      const headers = ["name", "status", "age"];
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "age", value: ["0", "1"] },
      ];

      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject deleteConditions with non-existing columns", () => {
      const headers = ["name", "status", "age"];
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
        { column: "nonexistent", value: "test" },
      ];

      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[1] references column 'nonexistent' which does not exist in input CSV"
      );
    });

    it("should handle multiple non-existing columns", () => {
      const headers = ["name", "status"];
      const deleteConditions: DeleteCondition[] = [
        { column: "missing1", value: "test" },
        { column: "status", value: "active" },
        { column: "missing2", value: ["a", "b"] },
      ];

      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0] references column 'missing1' which does not exist in input CSV"
      );
      expect(result.errors).toContain(
        "deleteConditions[2] references column 'missing2' which does not exist in input CSV"
      );
      expect(result.errors).not.toContain("status");
    });

    it("should handle empty headers array", () => {
      const headers: string[] = [];
      const deleteConditions: DeleteCondition[] = [
        { column: "status", value: "inactive" },
      ];

      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0] references column 'status' which does not exist in input CSV"
      );
    });

    it("should be case-sensitive for column names", () => {
      const headers = ["Name", "Status"];
      const deleteConditions: DeleteCondition[] = [
        { column: "name", value: "test" },
        { column: "Status", value: "active" },
      ];

      const result = ConfigurationValidator.validateDeleteConditionsWithHeaders(
        deleteConditions,
        headers
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "deleteConditions[0] references column 'name' which does not exist in input CSV"
      );
      expect(result.errors).not.toContain("Status");
    });
  });

  describe("validateConfiguration", () => {
    it("should validate empty configuration with warning", () => {
      const config: TransformationConfig = {};

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toContain(
        "Configuration is empty - no transformations will be applied"
      );
    });

    it("should validate complete valid configuration with numeric fixedColumns and deleteConditions", () => {
      const config: TransformationConfig = {
        headerMappings: { old: "new" },
        columnOrder: ["new", "other", "status", "count"],
        valueReplacements: { status: { yes: "1", no: "0" } },
        fixedColumns: { status: "active", count: 42 },
        deleteConditions: [
          { column: "type", value: "test" },
          { column: "category", value: ["temp", "debug"] },
        ],
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject null configuration", () => {
      const result = ConfigurationValidator.validateConfiguration(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Configuration must be an object");
    });

    it("should reject non-object configuration", () => {
      const result = ConfigurationValidator.validateConfiguration(
        "not an object" as any
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Configuration must be an object");
    });

    it("should accumulate errors from all validation functions", () => {
      const config: TransformationConfig = {
        headerMappings: "invalid" as any,
        columnOrder: "invalid" as any,
        valueReplacements: "invalid" as any,
        fixedColumns: "invalid" as any,
        deleteConditions: "invalid" as any,
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("headerMappings must be an object");
      expect(result.errors).toContain("columnOrder must be an array");
      expect(result.errors).toContain("valueReplacements must be an object");
      expect(result.errors).toContain("fixedColumns must be an object");
      expect(result.errors).toContain("deleteConditions must be an array");
    });

    it("should warn about columnOrder referencing original headers that will be mapped", () => {
      const config: TransformationConfig = {
        headerMappings: { old_name: "new_name" },
        columnOrder: ["old_name", "other_column"],
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "columnOrder references original header 'old_name' which will be mapped to 'new_name'"
      );
    });

    it("should validate configuration with only headerMappings", () => {
      const config: TransformationConfig = {
        headerMappings: { old: "new" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate configuration with only columnOrder", () => {
      const config: TransformationConfig = {
        columnOrder: ["col1", "col2"],
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate configuration with only valueReplacements", () => {
      const config: TransformationConfig = {
        valueReplacements: { status: { yes: "1" } },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate configuration with only fixedColumns including numbers", () => {
      const config: TransformationConfig = {
        fixedColumns: { status: "active", version: 1.0, count: 42 },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate configuration with only deleteConditions", () => {
      const config: TransformationConfig = {
        deleteConditions: [
          { column: "status", value: "inactive" },
          { column: "type", value: ["test", "temp"] },
        ],
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should detect conflict between fixedColumns and original headers in headerMappings", () => {
      const config: TransformationConfig = {
        headerMappings: { status: "new_status" },
        fixedColumns: { status: "active" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Fixed column 'status' conflicts with original header in headerMappings"
      );
    });

    it("should detect conflict between fixedColumns and mapped headers in headerMappings", () => {
      const config: TransformationConfig = {
        headerMappings: { old_status: "status" },
        fixedColumns: { status: "active" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Fixed column 'status' conflicts with mapped header in headerMappings"
      );
    });

    it("should warn when fixedColumns are not included in columnOrder", () => {
      const config: TransformationConfig = {
        columnOrder: ["name", "age"],
        fixedColumns: { status: "active", version: 1.0 },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Fixed column 'status' is not included in columnOrder and will be placed at the end"
      );
      expect(result.warnings).toContain(
        "Fixed column 'version' is not included in columnOrder and will be placed at the end"
      );
    });

    it("should warn when fixedColumns have value replacements defined", () => {
      const config: TransformationConfig = {
        valueReplacements: { status: { old: "new" } },
        fixedColumns: { status: "active" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Fixed column 'status' has value replacements defined, but fixed columns have constant values"
      );
    });

    it("should handle complex cross-validation scenarios", () => {
      const config: TransformationConfig = {
        headerMappings: { old_name: "name", old_status: "status" },
        columnOrder: ["name", "age", "department"],
        valueReplacements: {
          status: { yes: "1", no: "0" },
          department: { eng: "Engineering" },
        },
        fixedColumns: {
          status: "active",
          version: "1.0",
          department: "Unknown",
        },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Fixed column 'status' conflicts with mapped header in headerMappings"
      );
      expect(result.warnings).toContain(
        "Fixed column 'version' is not included in columnOrder and will be placed at the end"
      );
      expect(result.warnings).toContain(
        "Fixed column 'status' has value replacements defined, but fixed columns have constant values"
      );
      expect(result.warnings).toContain(
        "Fixed column 'department' has value replacements defined, but fixed columns have constant values"
      );
    });

    it("should validate configuration with fixedColumns properly included in columnOrder", () => {
      const config: TransformationConfig = {
        columnOrder: ["name", "status", "version"],
        fixedColumns: { status: "active", version: 1.0 },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle multiple conflicts between fixedColumns and headerMappings", () => {
      const config: TransformationConfig = {
        headerMappings: {
          old_status: "status",
          old_version: "version",
          name: "full_name",
        },
        fixedColumns: {
          status: "active",
          version: 1.0,
          full_name: "Unknown",
        },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Fixed column 'status' conflicts with mapped header in headerMappings"
      );
      expect(result.errors).toContain(
        "Fixed column 'version' conflicts with mapped header in headerMappings"
      );
      expect(result.errors).toContain(
        "Fixed column 'full_name' conflicts with mapped header in headerMappings"
      );
    });

    it("should handle edge case where fixedColumn name matches both original and mapped header", () => {
      const config: TransformationConfig = {
        headerMappings: { status: "status_new" },
        fixedColumns: { status: "active" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Fixed column 'status' conflicts with original header in headerMappings"
      );
    });

    it("should validate configuration with all features working together harmoniously", () => {
      const config: TransformationConfig = {
        headerMappings: { old_name: "name", old_age: "age" },
        columnOrder: ["name", "age", "department", "status", "created_date"],
        valueReplacements: {
          department: { eng: "Engineering", hr: "Human Resources" },
        },
        fixedColumns: {
          status: "active",
          created_date: "2024-01-01",
        },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should handle empty string values in fixedColumns cross-validation", () => {
      const config: TransformationConfig = {
        columnOrder: ["name", "empty_field"],
        fixedColumns: { empty_field: "" },
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe("validateOutputEncoding", () => {
    it("should validate undefined outputEncoding", () => {
      const result = ConfigurationValidator.validateOutputEncoding(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate supported encodings", () => {
      expect(
        ConfigurationValidator.validateOutputEncoding("utf8").isValid
      ).toBe(true);
      expect(
        ConfigurationValidator.validateOutputEncoding("shift_jis").isValid
      ).toBe(true);
      expect(
        ConfigurationValidator.validateOutputEncoding("euc-jp").isValid
      ).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(
        ConfigurationValidator.validateOutputEncoding("UTF8").isValid
      ).toBe(true);
      expect(
        ConfigurationValidator.validateOutputEncoding("SHIFT_JIS").isValid
      ).toBe(true);
      expect(
        ConfigurationValidator.validateOutputEncoding("EUC-JP").isValid
      ).toBe(true);
    });

    it("should reject unsupported encodings", () => {
      const result = ConfigurationValidator.validateOutputEncoding("latin1");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "outputEncoding 'latin1' is not supported. Supported encodings: utf8, shift_jis, euc-jp"
      );
    });

    it("should reject non-string outputEncoding", () => {
      const result = ConfigurationValidator.validateOutputEncoding(123 as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("outputEncoding must be a string");
    });

    it("should reject empty string outputEncoding", () => {
      const result = ConfigurationValidator.validateOutputEncoding("");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "outputEncoding cannot be an empty string"
      );
    });

    it("should reject whitespace-only outputEncoding", () => {
      const result = ConfigurationValidator.validateOutputEncoding("  ");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "outputEncoding cannot be an empty string"
      );
    });
  });
});
