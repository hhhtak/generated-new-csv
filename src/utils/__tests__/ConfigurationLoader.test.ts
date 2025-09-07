import { promises as fs } from "fs";
import { TransformationConfig } from "../../models";
import { JSONConfigurationLoader } from "../ConfigurationLoader";

// Mock fs module
jest.mock("fs", () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe("JSONConfigurationLoader", () => {
  let loader: JSONConfigurationLoader;

  beforeEach(() => {
    loader = new JSONConfigurationLoader();
    jest.clearAllMocks();
  });

  describe("load", () => {
    it("should load valid configuration from JSON file", async () => {
      const validConfig: TransformationConfig = {
        headerMappings: { old_name: "new_name" },
        columnOrder: ["col1", "col2"],
        valueReplacements: { status: { あり: "1", なし: "0" } },
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(validConfig));

      const result = await loader.load("config.json");

      expect(result).toEqual(validConfig);
      expect(mockFs.readFile).toHaveBeenCalledWith("config.json", "utf-8");
    });

    it("should throw error for file not found", async () => {
      const error = new Error("File not found") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      mockFs.readFile.mockRejectedValue(error);

      await expect(loader.load("nonexistent.json")).rejects.toThrow(
        "Configuration file not found: nonexistent.json"
      );
    });

    it("should throw error for permission denied", async () => {
      const error = new Error("Permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";
      mockFs.readFile.mockRejectedValue(error);

      await expect(loader.load("config.json")).rejects.toThrow(
        "Permission denied reading configuration file: config.json"
      );
    });

    it("should throw error for invalid JSON", async () => {
      mockFs.readFile.mockResolvedValue("{ invalid json }");

      await expect(loader.load("config.json")).rejects.toThrow(
        "Invalid JSON in configuration file:"
      );
    });

    it("should throw error for invalid configuration structure", async () => {
      const invalidConfig = {
        headerMappings: "not an object",
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(loader.load("config.json")).rejects.toThrow(
        "Invalid configuration: headerMappings must be an object"
      );
    });

    it("should load empty configuration successfully", async () => {
      const emptyConfig = {};
      mockFs.readFile.mockResolvedValue(JSON.stringify(emptyConfig));

      const result = await loader.load("config.json");

      expect(result).toEqual(emptyConfig);
    });
  });

  describe("validate", () => {
    describe("valid configurations", () => {
      it("should validate empty configuration", () => {
        const config: TransformationConfig = {};

        const result = loader.validate(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toContain(
          "Configuration is empty - no transformations will be applied"
        );
      });

      it("should validate configuration with all fields", () => {
        const config: TransformationConfig = {
          headerMappings: { old_name: "new_name", another: "mapped" },
          columnOrder: ["col1", "col2", "col3"],
          valueReplacements: {
            status: { あり: "1", なし: "0" },
            type: { A: "Alpha", B: "Beta" },
          },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate configuration with only headerMappings", () => {
        const config: TransformationConfig = {
          headerMappings: { old: "new" },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate configuration with only columnOrder", () => {
        const config: TransformationConfig = {
          columnOrder: ["col1", "col2"],
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate configuration with only valueReplacements", () => {
        const config: TransformationConfig = {
          valueReplacements: { status: { yes: "1", no: "0" } },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("invalid configurations", () => {
      it("should reject null configuration", () => {
        const result = loader.validate(null as any);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Configuration must be an object");
      });

      it("should reject non-object configuration", () => {
        const result = loader.validate("not an object" as any);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Configuration must be an object");
      });

      it("should reject invalid headerMappings type", () => {
        const config: TransformationConfig = {
          headerMappings: "not an object" as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("headerMappings must be an object");
      });

      it("should reject headerMappings with non-string keys or values", () => {
        const config: TransformationConfig = {
          headerMappings: { valid: 123 } as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("headerMappings keys and values must be strings");
      });

      it("should reject headerMappings with empty strings", () => {
        const config: TransformationConfig = {
          headerMappings: { "": "value" },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "headerMappings keys and values cannot be empty strings"
        );
      });

      it("should reject invalid columnOrder type", () => {
        const config: TransformationConfig = {
          columnOrder: "not an array" as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("columnOrder must be an array");
      });

      it("should reject columnOrder with non-string elements", () => {
        const config: TransformationConfig = {
          columnOrder: ["valid", 123] as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("columnOrder must contain only strings");
      });

      it("should reject columnOrder with empty strings", () => {
        const config: TransformationConfig = {
          columnOrder: ["valid", ""],
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("columnOrder cannot contain empty strings");
      });

      it("should reject columnOrder with duplicates", () => {
        const config: TransformationConfig = {
          columnOrder: ["col1", "col2", "col1"],
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "columnOrder cannot contain duplicate column names"
        );
      });

      it("should reject invalid valueReplacements type", () => {
        const config: TransformationConfig = {
          valueReplacements: "not an object" as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("valueReplacements must be an object");
      });

      it("should reject valueReplacements with empty column name", () => {
        const config: TransformationConfig = {
          valueReplacements: { "": { old: "new" } },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "valueReplacements column names must be non-empty strings"
        );
      });

      it("should reject valueReplacements with invalid replacement object", () => {
        const config: TransformationConfig = {
          valueReplacements: { column: "not an object" as any },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "valueReplacements for column 'column' must be an object"
        );
      });

      it("should reject valueReplacements with non-string replacement values", () => {
        const config: TransformationConfig = {
          valueReplacements: { column: { old: 123 } as any },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "valueReplacements for column 'column' must have string keys and values"
        );
      });
    });

    describe("edge cases", () => {
      it("should handle whitespace-only strings in headerMappings", () => {
        const config: TransformationConfig = {
          headerMappings: { "  ": "value" },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "headerMappings keys and values cannot be empty strings"
        );
      });

      it("should handle whitespace-only strings in columnOrder", () => {
        const config: TransformationConfig = {
          columnOrder: ["valid", "  "],
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("columnOrder cannot contain empty strings");
      });

      it("should handle null values in headerMappings", () => {
        const config: TransformationConfig = {
          headerMappings: null as any,
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("headerMappings must be an object");
      });

      it("should handle null values in valueReplacements", () => {
        const config: TransformationConfig = {
          valueReplacements: { column: null as any },
        };

        const result = loader.validate(config);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain(
          "valueReplacements for column 'column' must be an object"
        );
      });
    });
  });
});
