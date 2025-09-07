import { promises as fs } from "fs";
import { CSVData } from "../../models";
import { CSVWriterImpl } from "../CSVWriter";

// Mock fs module
jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn(),
  },
  constants: {
    W_OK: 2,
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe("CSVWriterImpl", () => {
  let csvWriter: CSVWriterImpl;
  let testData: CSVData;

  beforeEach(() => {
    csvWriter = new CSVWriterImpl();
    testData = {
      headers: ["Name", "Age", "City"],
      rows: [
        ["John Doe", "30", "New York"],
        ["Jane Smith", "25", "Los Angeles"],
      ],
    };
    jest.clearAllMocks();

    // Setup default successful mocks
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
    mockFs.stat.mockResolvedValue({ size: 100 } as any);
  });

  describe("formatRow", () => {
    it("should format simple row without quotes", () => {
      const row = ["John", "30", "NYC"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe("John,30,NYC");
    });

    it("should quote fields containing commas", () => {
      const row = ["John Doe", "30", "New York, NY"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe('John Doe,30,"New York, NY"');
    });

    it("should escape quotes by doubling them", () => {
      const row = ['John "Johnny" Doe', "30", "NYC"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe('"John ""Johnny"" Doe",30,NYC');
    });

    it("should quote fields containing newlines", () => {
      const row = ["John\nDoe", "30", "NYC"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe('"John\nDoe",30,NYC');
    });

    it("should quote fields with leading/trailing whitespace", () => {
      const row = [" John ", "30", "NYC"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe('" John ",30,NYC');
    });

    it("should handle empty fields", () => {
      const row = ["John", "", "NYC"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe("John,,NYC");
    });

    it("should handle complex field with multiple special characters", () => {
      const row = ['John "Johnny" Doe, Jr.', "30", "New York\nNY"];
      const result = csvWriter.formatRow(row);
      expect(result).toBe('"John ""Johnny"" Doe, Jr.",30,"New York\nNY"');
    });
  });

  describe("write", () => {
    const outputPath = "/test/output.csv";

    it("should write CSV data to file successfully", async () => {
      await csvWriter.write(testData, outputPath);

      expect(mockFs.mkdir).toHaveBeenCalledWith("/test", { recursive: true });
      expect(mockFs.access).toHaveBeenCalledWith("/test", 2);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        outputPath,
        "Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles",
        "utf8"
      );
      expect(mockFs.stat).toHaveBeenCalledWith(outputPath);
    });

    it("should create output directory if it does not exist", async () => {
      await csvWriter.write(testData, "/deep/nested/path/output.csv");

      expect(mockFs.mkdir).toHaveBeenCalledWith("/deep/nested/path", { recursive: true });
      expect(mockFs.access).toHaveBeenCalledWith("/deep/nested/path", 2);
    });

    it("should handle data with special characters correctly", async () => {
      const specialData: CSVData = {
        headers: ["Name", "Description", "Notes"],
        rows: [
          ['John "Johnny" Doe', "Software, Engineer", "Works in\nNew York"],
          ["Jane Smith", "Data Analyst", "Remote worker"],
        ],
      };

      await csvWriter.write(specialData, outputPath);

      const expectedContent =
        'Name,Description,Notes\n"John ""Johnny"" Doe","Software, Engineer","Works in\nNew York"\nJane Smith,Data Analyst,Remote worker';
      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, expectedContent, "utf8");
    });

    it("should handle empty data", async () => {
      const emptyData: CSVData = {
        headers: ["Col1", "Col2"],
        rows: [],
      };

      // Mock stat to return appropriate size for the content
      mockFs.stat.mockResolvedValue({ size: 9 } as any); // "Col1,Col2" is 9 characters

      await csvWriter.write(emptyData, outputPath);

      expect(mockFs.writeFile).toHaveBeenCalledWith(outputPath, "Col1,Col2", "utf8");
    });

    describe("validation", () => {
      it("should throw error for null CSV data", async () => {
        await expect(csvWriter.write(null as any, outputPath)).rejects.toThrow(
          "CSV data cannot be null or undefined"
        );
      });

      it("should throw error for undefined CSV data", async () => {
        await expect(csvWriter.write(undefined as any, outputPath)).rejects.toThrow(
          "CSV data cannot be null or undefined"
        );
      });

      it("should throw error for non-array headers", async () => {
        const invalidData = { headers: "invalid", rows: [] } as any;
        await expect(csvWriter.write(invalidData, outputPath)).rejects.toThrow(
          "CSV headers must be an array"
        );
      });

      it("should throw error for non-array rows", async () => {
        const invalidData = { headers: ["Col1"], rows: "invalid" } as any;
        await expect(csvWriter.write(invalidData, outputPath)).rejects.toThrow(
          "CSV rows must be an array"
        );
      });

      it("should throw error for empty headers", async () => {
        const invalidData = { headers: [], rows: [] };
        await expect(csvWriter.write(invalidData, outputPath)).rejects.toThrow(
          "CSV must have at least one header column"
        );
      });

      it("should throw error for non-array row", async () => {
        const invalidData = { headers: ["Col1"], rows: ["invalid"] } as any;
        await expect(csvWriter.write(invalidData, outputPath)).rejects.toThrow(
          "Row 1 must be an array"
        );
      });

      it("should throw error for row with wrong column count", async () => {
        const invalidData = { headers: ["Col1", "Col2"], rows: [["value1"]] };
        await expect(csvWriter.write(invalidData, outputPath)).rejects.toThrow(
          "Row 1 has 1 columns but expected 2 columns"
        );
      });

      it("should throw error for empty output path", async () => {
        await expect(csvWriter.write(testData, "")).rejects.toThrow(
          "Output path must be a non-empty string"
        );
      });

      it("should throw error for whitespace-only output path", async () => {
        await expect(csvWriter.write(testData, "   ")).rejects.toThrow(
          "Output path cannot be empty or whitespace only"
        );
      });

      it("should throw error for null output path", async () => {
        await expect(csvWriter.write(testData, null as any)).rejects.toThrow(
          "Output path must be a non-empty string"
        );
      });
    });

    describe("directory and file permissions", () => {
      it("should throw permission error when directory is not writable", async () => {
        const permError = new Error("EACCES: permission denied");
        mockFs.access.mockRejectedValue(permError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Permission denied: Cannot write to directory '/test'. Please check directory permissions."
        );
      });

      it("should throw error when path is not a directory", async () => {
        const notDirError = new Error("ENOTDIR: not a directory");
        mockFs.mkdir.mockRejectedValue(notDirError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Invalid path: '/test' is not a directory"
        );
      });

      it("should throw error when directory creation fails", async () => {
        const createError = new Error("ENOENT: no such file or directory");
        mockFs.mkdir.mockRejectedValue(createError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Directory creation failed: Cannot create directory '/test'"
        );
      });

      it("should throw permission error when file write is denied", async () => {
        const writeError = new Error("EACCES: permission denied");
        mockFs.writeFile.mockRejectedValue(writeError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Permission denied: Cannot write to file '/test/output.csv'. Please check file and directory permissions."
        );
      });

      it("should throw disk space error when insufficient space", async () => {
        const spaceError = new Error("ENOSPC: no space left on device");
        mockFs.writeFile.mockRejectedValue(spaceError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Insufficient disk space: Cannot write to file '/test/output.csv'"
        );
      });

      it("should throw error when too many files are open", async () => {
        const fileError = new Error("EMFILE: too many open files");
        mockFs.writeFile.mockRejectedValue(fileError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Too many open files: Cannot write to file '/test/output.csv'"
        );
      });

      it("should throw error when file appears empty after write", async () => {
        mockFs.stat.mockResolvedValue({ size: 0 } as any);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "File was created but appears to be empty"
        );
      });

      it("should handle generic directory access errors", async () => {
        const genericError = new Error("Some other error");
        mockFs.access.mockRejectedValue(genericError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "Directory access error for '/test': Some other error"
        );
      });

      it("should handle generic file write errors", async () => {
        const genericError = new Error("Some write error");
        mockFs.writeFile.mockRejectedValue(genericError);

        await expect(csvWriter.write(testData, outputPath)).rejects.toThrow(
          "File write error for '/test/output.csv': Some write error"
        );
      });
    });
  });
});
