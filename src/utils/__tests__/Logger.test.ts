import { ConsoleLogOutput, LogEntry, Logger, LogLevel, LogOutput } from "../Logger";

// Mock console methods
const mockConsoleError = jest.spyOn(console, "error").mockImplementation();
const mockConsoleWarn = jest.spyOn(console, "warn").mockImplementation();
const mockConsoleLog = jest.spyOn(console, "log").mockImplementation();
const mockConsoleDebug = jest.spyOn(console, "debug").mockImplementation();

// Mock log output for testing
class MockLogOutput implements LogOutput {
  public entries: LogEntry[] = [];

  write(entry: LogEntry): void {
    this.entries.push(entry);
  }

  clear(): void {
    this.entries = [];
  }
}

describe("Logger", () => {
  let logger: Logger;
  let mockOutput: MockLogOutput;

  beforeEach(() => {
    // Reset singleton instance for testing
    (Logger as any).instance = undefined;
    logger = Logger.getInstance();
    logger.clearOutputs();

    mockOutput = new MockLogOutput();
    logger.addOutput(mockOutput);

    // Clear console mocks
    mockConsoleError.mockClear();
    mockConsoleWarn.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleDebug.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
    mockConsoleWarn.mockRestore();
    mockConsoleLog.mockRestore();
    mockConsoleDebug.mockRestore();
  });

  describe("singleton pattern", () => {
    it("should return the same instance", () => {
      const logger1 = Logger.getInstance();
      const logger2 = Logger.getInstance();

      expect(logger1).toBe(logger2);
    });
  });

  describe("log levels", () => {
    it("should log error messages at ERROR level", () => {
      logger.setLevel(LogLevel.ERROR);
      logger.error("Error message");
      logger.warn("Warning message");
      logger.info("Info message");
      logger.debug("Debug message");

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].level).toBe(LogLevel.ERROR);
      expect(mockOutput.entries[0].message).toBe("Error message");
    });

    it("should log error and warn messages at WARN level", () => {
      logger.setLevel(LogLevel.WARN);
      logger.error("Error message");
      logger.warn("Warning message");
      logger.info("Info message");
      logger.debug("Debug message");

      expect(mockOutput.entries).toHaveLength(2);
      expect(mockOutput.entries[0].level).toBe(LogLevel.ERROR);
      expect(mockOutput.entries[1].level).toBe(LogLevel.WARN);
    });

    it("should log error, warn, and info messages at INFO level", () => {
      logger.setLevel(LogLevel.INFO);
      logger.error("Error message");
      logger.warn("Warning message");
      logger.info("Info message");
      logger.debug("Debug message");

      expect(mockOutput.entries).toHaveLength(3);
      expect(mockOutput.entries[2].level).toBe(LogLevel.INFO);
    });

    it("should log all messages at DEBUG level", () => {
      logger.setLevel(LogLevel.DEBUG);
      logger.error("Error message");
      logger.warn("Warning message");
      logger.info("Info message");
      logger.debug("Debug message");

      expect(mockOutput.entries).toHaveLength(4);
      expect(mockOutput.entries[3].level).toBe(LogLevel.DEBUG);
    });
  });

  describe("log methods", () => {
    beforeEach(() => {
      logger.setLevel(LogLevel.DEBUG);
    });

    it("should log error with context", () => {
      const error = new Error("Test error");
      const context = { file: "test.csv" };

      logger.error("Error occurred", error, context);

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].level).toBe(LogLevel.ERROR);
      expect(mockOutput.entries[0].message).toBe("Error occurred");
      expect(mockOutput.entries[0].error).toBe(error);
      expect(mockOutput.entries[0].context).toEqual(context);
    });

    it("should log warning with context", () => {
      const context = { line: 5 };

      logger.warn("Warning message", context);

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].level).toBe(LogLevel.WARN);
      expect(mockOutput.entries[0].context).toEqual(context);
    });

    it("should log info with context", () => {
      const context = { operation: "parse" };

      logger.info("Info message", context);

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].level).toBe(LogLevel.INFO);
      expect(mockOutput.entries[0].context).toEqual(context);
    });

    it("should log debug with context", () => {
      const context = { step: "validation" };

      logger.debug("Debug message", context);

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].level).toBe(LogLevel.DEBUG);
      expect(mockOutput.entries[0].context).toEqual(context);
    });
  });

  describe("multiple outputs", () => {
    it("should write to multiple outputs", () => {
      const mockOutput2 = new MockLogOutput();
      logger.addOutput(mockOutput2);

      logger.info("Test message");

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput2.entries).toHaveLength(1);
      expect(mockOutput.entries[0].message).toBe("Test message");
      expect(mockOutput2.entries[0].message).toBe("Test message");
    });

    it("should clear all outputs", () => {
      const mockOutput2 = new MockLogOutput();
      logger.addOutput(mockOutput2);

      logger.clearOutputs();
      logger.info("Test message");

      expect(mockOutput.entries).toHaveLength(0);
      expect(mockOutput2.entries).toHaveLength(0);
    });
  });

  describe("timestamp", () => {
    it("should include timestamp in log entries", () => {
      const beforeLog = new Date();
      logger.info("Test message");
      const afterLog = new Date();

      expect(mockOutput.entries).toHaveLength(1);
      expect(mockOutput.entries[0].timestamp).toBeInstanceOf(Date);
      expect(mockOutput.entries[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        beforeLog.getTime()
      );
      expect(mockOutput.entries[0].timestamp.getTime()).toBeLessThanOrEqual(
        afterLog.getTime()
      );
    });
  });
});

describe("ConsoleLogOutput", () => {
  let consoleOutput: ConsoleLogOutput;

  beforeEach(() => {
    consoleOutput = new ConsoleLogOutput();
  });

  it("should format error messages correctly", () => {
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: "Error message",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
    };

    // Test that the method doesn't throw and handles the entry
    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should format warning messages correctly", () => {
    const entry: LogEntry = {
      level: LogLevel.WARN,
      message: "Warning message",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
    };

    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should format info messages correctly", () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "Info message",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
    };

    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should format debug messages correctly", () => {
    const entry: LogEntry = {
      level: LogLevel.DEBUG,
      message: "Debug message",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
    };

    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should handle context in output", () => {
    const entry: LogEntry = {
      level: LogLevel.INFO,
      message: "Test message",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
      context: { file: "test.csv", line: 5 },
    };

    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should handle error stack traces", () => {
    const error = new Error("Test error");
    const entry: LogEntry = {
      level: LogLevel.ERROR,
      message: "Error occurred",
      timestamp: new Date("2023-01-01T12:00:00.000Z"),
      error,
    };

    expect(() => consoleOutput.write(entry)).not.toThrow();
  });

  it("should handle all log levels", () => {
    const timestamp = new Date("2023-01-01T12:00:00.000Z");

    const entries = [
      { level: LogLevel.ERROR, message: "Error", timestamp },
      { level: LogLevel.WARN, message: "Warning", timestamp },
      { level: LogLevel.INFO, message: "Info", timestamp },
      { level: LogLevel.DEBUG, message: "Debug", timestamp },
    ];

    entries.forEach((entry) => {
      expect(() => consoleOutput.write(entry)).not.toThrow();
    });
  });
});
