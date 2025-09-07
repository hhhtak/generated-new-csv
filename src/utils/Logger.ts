/**
 * Log levels for the CSV converter
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

/**
 * Log entry structure
 */
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  error?: Error;
}

/**
 * Logger interface for different output targets
 */
export interface LogOutput {
  write(entry: LogEntry): void;
}

/**
 * Console log output implementation
 */
export class ConsoleLogOutput implements LogOutput {
  write(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];

    let message = `[${timestamp}] [${levelName}] ${entry.message}`;

    if (entry.context) {
      message += ` ${JSON.stringify(entry.context)}`;
    }

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message);
        if (entry.error) {
          console.error(entry.error.stack);
        }
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.INFO:
        console.log(message);
        break;
      case LogLevel.DEBUG:
        console.debug(message);
        break;
    }
  }
}

/**
 * Centralized logger for the CSV converter
 */
export class Logger {
  private static instance: Logger;
  private outputs: LogOutput[] = [];
  private currentLevel: LogLevel = LogLevel.INFO;

  private constructor() {
    // Default to console output
    this.outputs.push(new ConsoleLogOutput());
  }

  /**
   * Get singleton instance of Logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Set the minimum log level
   */
  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  /**
   * Add a log output target
   */
  addOutput(output: LogOutput): void {
    this.outputs.push(output);
  }

  /**
   * Remove all outputs
   */
  clearOutputs(): void {
    this.outputs = [];
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error, context?: any): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: any): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an info message
   */
  info(message: string, context?: any): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a debug message
   */
  debug(message: string, context?: any): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Internal log method
   */
  private log(level: LogLevel, message: string, context?: any, error?: Error): void {
    if (level <= this.currentLevel) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: new Date(),
        context,
        error,
      };

      this.outputs.forEach((output) => output.write(entry));
    }
  }
}

/**
 * Convenience function to get logger instance
 */
export function getLogger(): Logger {
  return Logger.getInstance();
}
