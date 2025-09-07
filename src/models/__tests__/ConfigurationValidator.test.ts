import { ConfigurationValidator } from "../ConfigurationValidator";
import { TransformationConfig } from "../TransformationConfig";

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

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

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

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("headerMappings keys and values must be strings");
    });

    it("should reject headerMappings with empty string keys", () => {
      const headerMappings = { "": "value" };

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings keys and values cannot be empty strings"
      );
    });

    it("should reject headerMappings with empty string values", () => {
      const headerMappings = { key: "" };

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings keys and values cannot be empty strings"
      );
    });

    it("should reject headerMappings with whitespace-only strings", () => {
      const headerMappings = { "  ": "value" };

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "headerMappings keys and values cannot be empty strings"
      );
    });

    it("should detect circular mappings", () => {
      const headerMappings = { A: "B", B: "A" };

      const result = ConfigurationValidator.validateHeaderMappings(headerMappings);

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
      const result = ConfigurationValidator.validateColumnOrder("not an array" as any);

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
      expect(result.errors).toContain("columnOrder cannot contain empty strings");
    });

    it("should reject columnOrder with whitespace-only strings", () => {
      const columnOrder = ["valid", "  "];

      const result = ConfigurationValidator.validateColumnOrder(columnOrder);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("columnOrder cannot contain empty strings");
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
      const result = ConfigurationValidator.validateValueReplacements(undefined);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid valueReplacements", () => {
      const valueReplacements = {
        status: { あり: "1", なし: "0" },
        type: { A: "Alpha", B: "Beta" },
      };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

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
      const result = ConfigurationValidator.validateValueReplacements(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("valueReplacements must be an object");
    });

    it("should reject valueReplacements with empty column names", () => {
      const valueReplacements = { "": { old: "new" } };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements column names must be non-empty strings"
      );
    });

    it("should reject valueReplacements with whitespace-only column names", () => {
      const valueReplacements = { "  ": { old: "new" } };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements column names must be non-empty strings"
      );
    });

    it("should reject valueReplacements with non-object replacement values", () => {
      const valueReplacements = { column: "not an object" as any };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must be an object"
      );
    });

    it("should reject valueReplacements with null replacement values", () => {
      const valueReplacements = { column: null as any };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must be an object"
      );
    });

    it("should reject valueReplacements with non-string replacement keys or values", () => {
      const valueReplacements = { column: { old: 123 } as any };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "valueReplacements for column 'column' must have string keys and values"
      );
    });

    it("should detect circular replacements", () => {
      const valueReplacements = { column: { A: "B", B: "A" } };

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Circular replacement detected in column 'column': 'B' <-> 'A'"
      );
    });

    it("should validate empty valueReplacements object", () => {
      const valueReplacements = {};

      const result = ConfigurationValidator.validateValueReplacements(valueReplacements);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
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

    it("should validate complete valid configuration", () => {
      const config: TransformationConfig = {
        headerMappings: { old: "new" },
        columnOrder: ["new", "other"],
        valueReplacements: { status: { yes: "1", no: "0" } },
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
      const result = ConfigurationValidator.validateConfiguration("not an object" as any);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Configuration must be an object");
    });

    it("should accumulate errors from all validation functions", () => {
      const config: TransformationConfig = {
        headerMappings: "invalid" as any,
        columnOrder: "invalid" as any,
        valueReplacements: "invalid" as any,
      };

      const result = ConfigurationValidator.validateConfiguration(config);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("headerMappings must be an object");
      expect(result.errors).toContain("columnOrder must be an array");
      expect(result.errors).toContain("valueReplacements must be an object");
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
  });
});
