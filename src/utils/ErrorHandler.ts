/**
 * Error codes for different types of errors in the CSV converter
 */
export enum ErrorCode {
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  FILE_ACCESS_DENIED = "FILE_ACCESS_DENIED",
  INVALID_CSV_FORMAT = "INVALID_CSV_FORMAT",
  INVALID_CONFIGURATION = "INVALID_CONFIGURATION",
  MISSING_COLUMN = "MISSING_COLUMN",
  TRANSFORMATION_ERROR = "TRANSFORMATION_ERROR",
  OUTPUT_ERROR = "OUTPUT_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

/**
 * Structured error class with additional context
 */
export class CSVConverterError extends Error {
  public readonly code: ErrorCode;
  public readonly context?: any;
  public readonly timestamp: Date;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, context?: any) {
    super(message);
    this.name = "CSVConverterError";
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
  }

  /**
   * Get a formatted error message with context
   */
  getFormattedMessage(): string {
    let formatted = `[${this.code}] ${this.message}`;

    if (this.context) {
      if (typeof this.context === "string") {
        formatted += ` (Context: ${this.context})`;
      } else if (this.context.line !== undefined) {
        formatted += ` (Line: ${this.context.line})`;
      } else if (this.context.column !== undefined) {
        formatted += ` (Column: ${this.context.column})`;
      } else if (this.context.file !== undefined) {
        formatted += ` (File: ${this.context.file})`;
      }
    }

    return formatted;
  }
}

/**
 * Centralized error handler for the CSV converter
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  /**
   * Get singleton instance of ErrorHandler
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Create a structured error with context
   */
  createError(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    context?: any
  ): CSVConverterError {
    return new CSVConverterError(message, code, context);
  }

  /**
   * Handle file access errors
   */
  handleFileError(
    error: any,
    filePath: string,
    operation: "read" | "write"
  ): CSVConverterError {
    if (error.code === "ENOENT") {
      return this.createError(`File not found: ${filePath}`, ErrorCode.FILE_NOT_FOUND, {
        file: filePath,
        operation,
      });
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      return this.createError(
        `Permission denied: Cannot ${operation} file '${filePath}'. Check file permissions.`,
        ErrorCode.FILE_ACCESS_DENIED,
        { file: filePath, operation }
      );
    }

    if (error.code === "ENOSPC") {
      return this.createError(
        `Insufficient disk space: Cannot write to file '${filePath}'`,
        ErrorCode.OUTPUT_ERROR,
        { file: filePath, operation }
      );
    }

    if (error.code === "EMFILE" || error.code === "ENFILE") {
      return this.createError(
        `Too many open files: Cannot ${operation} file '${filePath}'`,
        ErrorCode.OUTPUT_ERROR,
        { file: filePath, operation }
      );
    }

    return this.createError(
      `File ${operation} error for '${filePath}': ${error.message || "Unknown error"}`,
      operation === "read" ? ErrorCode.FILE_ACCESS_DENIED : ErrorCode.OUTPUT_ERROR,
      { file: filePath, operation, originalError: error.message }
    );
  }

  /**
   * Handle CSV parsing errors
   */
  handleCSVError(error: any, context?: any): CSVConverterError {
    if (error instanceof SyntaxError || error.message?.includes("parse")) {
      return this.createError(
        `Invalid CSV format: ${error.message}`,
        ErrorCode.INVALID_CSV_FORMAT,
        context
      );
    }

    return this.createError(
      `CSV processing error: ${error.message || "Unknown error"}`,
      ErrorCode.INVALID_CSV_FORMAT,
      context
    );
  }

  /**
   * Handle configuration errors
   */
  handleConfigError(error: any, configPath?: string): CSVConverterError {
    if (error instanceof SyntaxError) {
      return this.createError(
        `Invalid JSON in configuration file: ${error.message}`,
        ErrorCode.INVALID_CONFIGURATION,
        { file: configPath }
      );
    }

    if (error.code === "ENOENT") {
      return this.createError(
        `Configuration file not found: ${configPath}`,
        ErrorCode.FILE_NOT_FOUND,
        { file: configPath }
      );
    }

    if (error.code === "EACCES") {
      return this.createError(
        `Permission denied reading configuration file: ${configPath}`,
        ErrorCode.FILE_ACCESS_DENIED,
        { file: configPath }
      );
    }

    return this.createError(
      `Configuration error: ${error.message || "Unknown error"}`,
      ErrorCode.INVALID_CONFIGURATION,
      { file: configPath }
    );
  }

  /**
   * Handle transformation errors
   */
  handleTransformationError(message: string, context?: any): CSVConverterError {
    if (message.includes("列") && message.includes("見つかりません")) {
      return this.createError(message, ErrorCode.MISSING_COLUMN, context);
    }

    return this.createError(message, ErrorCode.TRANSFORMATION_ERROR, context);
  }

  /**
   * Handle validation errors
   */
  handleValidationError(message: string, context?: any): CSVConverterError {
    return this.createError(message, ErrorCode.VALIDATION_ERROR, context);
  }
}
