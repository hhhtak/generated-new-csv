/**
 * Structured error handling for the CSV converter
 */
export interface ErrorHandler {
  /**
   * Handle and format errors with context
   */
  handleError(error: Error, context?: string): void;

  /**
   * Create structured error messages
   */
  createError(message: string, code?: string, context?: any): Error;
}
