import { CSVConverterError, ErrorCode, ErrorHandler } from "../ErrorHandler";

describe("ErrorHandler", () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = ErrorHandler.getInstance();
  });

  describe("createError", () => {
    it("should create a CSVConverterError with default error code", () => {
      const error = errorHandler.createError("Test error message");

      expect(error).toBeInstanceOf(CSVConverterError);
      expect(error.message).toBe("Test error message");
      expect(error.code).toBe(ErrorCode.UNKNOWN_ERROR);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it("should create a CSVConverterError with specified error code", () => {
      const error = errorHandler.createError("File not found", ErrorCode.FILE_NOT_FOUND);

      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toBe("File not found");
    });

    it("should create a CSVConverterError with context", () => {
      const context = { file: "test.csv", line: 5 };
      const error = errorHandler.createError(
        "Test error",
        ErrorCode.INVALID_CSV_FORMAT,
        context
      );

      expect(error.context).toEqual(context);
    });
  });

  describe("handleFileError", () => {
    it("should handle ENOENT error", () => {
      const originalError = { code: "ENOENT" };
      const error = errorHandler.handleFileError(originalError, "test.csv", "read");

      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toBe("File not found: test.csv");
      expect(error.context).toEqual({ file: "test.csv", operation: "read" });
    });

    it("should handle EACCES error", () => {
      const originalError = { code: "EACCES" };
      const error = errorHandler.handleFileError(originalError, "test.csv", "write");

      expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
      expect(error.message).toBe(
        "Permission denied: Cannot write file 'test.csv'. Check file permissions."
      );
    });

    it("should handle EPERM error", () => {
      const originalError = { code: "EPERM" };
      const error = errorHandler.handleFileError(originalError, "test.csv", "read");

      expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
      expect(error.message).toBe(
        "Permission denied: Cannot read file 'test.csv'. Check file permissions."
      );
    });

    it("should handle ENOSPC error", () => {
      const originalError = { code: "ENOSPC" };
      const error = errorHandler.handleFileError(originalError, "test.csv", "write");

      expect(error.code).toBe(ErrorCode.OUTPUT_ERROR);
      expect(error.message).toBe(
        "Insufficient disk space: Cannot write to file 'test.csv'"
      );
    });

    it("should handle unknown file errors", () => {
      const originalError = { code: "UNKNOWN", message: "Unknown file error" };
      const error = errorHandler.handleFileError(originalError, "test.csv", "read");

      expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
      expect(error.message).toBe("File read error for 'test.csv': Unknown file error");
    });
  });

  describe("handleCSVError", () => {
    it("should handle syntax errors", () => {
      const originalError = new SyntaxError("Unexpected token");
      const error = errorHandler.handleCSVError(originalError, { line: 5 });

      expect(error.code).toBe(ErrorCode.INVALID_CSV_FORMAT);
      expect(error.message).toBe("Invalid CSV format: Unexpected token");
      expect(error.context).toEqual({ line: 5 });
    });

    it("should handle parse errors", () => {
      const originalError = new Error("Failed to parse CSV");
      const error = errorHandler.handleCSVError(originalError);

      expect(error.code).toBe(ErrorCode.INVALID_CSV_FORMAT);
      expect(error.message).toBe("Invalid CSV format: Failed to parse CSV");
    });

    it("should handle generic CSV errors", () => {
      const originalError = new Error("Generic CSV error");
      const error = errorHandler.handleCSVError(originalError, { column: "name" });

      expect(error.code).toBe(ErrorCode.INVALID_CSV_FORMAT);
      expect(error.message).toBe("CSV processing error: Generic CSV error");
      expect(error.context).toEqual({ column: "name" });
    });
  });

  describe("handleConfigError", () => {
    it("should handle JSON syntax errors", () => {
      const originalError = new SyntaxError("Unexpected token } in JSON");
      const error = errorHandler.handleConfigError(originalError, "config.json");

      expect(error.code).toBe(ErrorCode.INVALID_CONFIGURATION);
      expect(error.message).toBe(
        "Invalid JSON in configuration file: Unexpected token } in JSON"
      );
      expect(error.context).toEqual({ file: "config.json" });
    });

    it("should handle file not found errors", () => {
      const originalError = { code: "ENOENT" };
      const error = errorHandler.handleConfigError(originalError, "config.json");

      expect(error.code).toBe(ErrorCode.FILE_NOT_FOUND);
      expect(error.message).toBe("Configuration file not found: config.json");
    });

    it("should handle permission errors", () => {
      const originalError = { code: "EACCES" };
      const error = errorHandler.handleConfigError(originalError, "config.json");

      expect(error.code).toBe(ErrorCode.FILE_ACCESS_DENIED);
      expect(error.message).toBe(
        "Permission denied reading configuration file: config.json"
      );
    });
  });

  describe("handleTransformationError", () => {
    it("should handle missing column errors", () => {
      const message = '列 "missing_column" が見つかりません';
      const error = errorHandler.handleTransformationError(message, {
        column: "missing_column",
      });

      expect(error.code).toBe(ErrorCode.MISSING_COLUMN);
      expect(error.message).toBe(message);
      expect(error.context).toEqual({ column: "missing_column" });
    });

    it("should handle generic transformation errors", () => {
      const message = "Transformation failed";
      const error = errorHandler.handleTransformationError(message);

      expect(error.code).toBe(ErrorCode.TRANSFORMATION_ERROR);
      expect(error.message).toBe(message);
    });
  });

  describe("handleValidationError", () => {
    it("should create validation errors", () => {
      const message = "Invalid data format";
      const context = { field: "headers" };
      const error = errorHandler.handleValidationError(message, context);

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe(message);
      expect(error.context).toEqual(context);
    });
  });
});

describe("CSVConverterError", () => {
  it("should format error message with string context", () => {
    const error = new CSVConverterError(
      "Test error",
      ErrorCode.FILE_NOT_FOUND,
      "additional context"
    );
    const formatted = error.getFormattedMessage();

    expect(formatted).toBe("[FILE_NOT_FOUND] Test error (Context: additional context)");
  });

  it("should format error message with line context", () => {
    const error = new CSVConverterError("Test error", ErrorCode.INVALID_CSV_FORMAT, {
      line: 5,
    });
    const formatted = error.getFormattedMessage();

    expect(formatted).toBe("[INVALID_CSV_FORMAT] Test error (Line: 5)");
  });

  it("should format error message with column context", () => {
    const error = new CSVConverterError("Test error", ErrorCode.MISSING_COLUMN, {
      column: "name",
    });
    const formatted = error.getFormattedMessage();

    expect(formatted).toBe("[MISSING_COLUMN] Test error (Column: name)");
  });

  it("should format error message with file context", () => {
    const error = new CSVConverterError("Test error", ErrorCode.FILE_ACCESS_DENIED, {
      file: "test.csv",
    });
    const formatted = error.getFormattedMessage();

    expect(formatted).toBe("[FILE_ACCESS_DENIED] Test error (File: test.csv)");
  });

  it("should format error message without context", () => {
    const error = new CSVConverterError("Test error", ErrorCode.UNKNOWN_ERROR);
    const formatted = error.getFormattedMessage();

    expect(formatted).toBe("[UNKNOWN_ERROR] Test error");
  });
});
