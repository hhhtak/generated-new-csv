import { promises as fs } from "fs";
import * as iconv from "iconv-lite";
import { ErrorHandler } from "./ErrorHandler";
import { getLogger } from "./Logger";

/**
 * Supported encoding types for output files
 */
export type SupportedEncoding = "utf8" | "shift_jis" | "euc-jp";

/**
 * Interface for file encoding functionality
 */
export interface FileEncoder {
  /**
   * Encode a file to the specified target encoding
   * @param filePath Path to the file to encode
   * @param targetEncoding Target encoding format
   */
  encode(filePath: string, targetEncoding: string): Promise<void>;

  /**
   * Check if an encoding is supported
   * @param encoding Encoding name to check
   */
  isEncodingSupported(encoding: string): boolean;
}

/**
 * Implementation of file encoder with support for multiple encodings
 */
export class FileEncoderImpl implements FileEncoder {
  private errorHandler = ErrorHandler.getInstance();
  private logger = getLogger();

  /**
   * Map of supported encodings with their iconv-lite names
   */
  private readonly supportedEncodings: Record<string, string> = {
    utf8: "utf8",
    shift_jis: "shift_jis",
    "euc-jp": "euc-jp",
  };

  /**
   * Encode a file to the specified target encoding
   * @param filePath Path to the file to encode
   * @param targetEncoding Target encoding format
   */
  async encode(filePath: string, targetEncoding: string): Promise<void> {
    this.logger.debug(`Encoding file to ${targetEncoding}: ${filePath}`);

    try {
      // Validate encoding is supported
      if (!this.isEncodingSupported(targetEncoding)) {
        throw this.errorHandler.handleValidationError(
          `Unsupported encoding '${targetEncoding}' specified. Supported encodings: ${Object.keys(
            this.supportedEncodings
          ).join(", ")}`,
          { encoding: targetEncoding, filePath }
        );
      }

      // Read the file as UTF-8 (default Node.js encoding)
      const content = await fs.readFile(filePath, "utf8");

      // Get the iconv-lite encoding name
      const iconvEncoding =
        this.supportedEncodings[targetEncoding.toLowerCase()];

      // Convert to target encoding
      const encodedBuffer = iconv.encode(content, iconvEncoding);

      // Write the encoded content back to the file
      await fs.writeFile(filePath, encodedBuffer);

      this.logger.info(
        `Successfully encoded file to ${targetEncoding}: ${filePath}`
      );
    } catch (error) {
      // Re-throw our structured errors
      if (
        error instanceof Error &&
        error.message.includes("Unsupported encoding")
      ) {
        throw error;
      }

      // Handle encoding conversion errors
      const structuredError = this.errorHandler.handleTransformationError(
        `Failed to encode file '${filePath}' to ${targetEncoding}: ${
          error instanceof Error ? error.message : String(error)
        }`,
        { encoding: targetEncoding, filePath }
      );
      this.logger.error(`Encoding conversion failed`, structuredError);
      throw structuredError;
    }
  }

  /**
   * Check if an encoding is supported
   * @param encoding Encoding name to check
   */
  isEncodingSupported(encoding: string): boolean {
    return encoding.toLowerCase() in this.supportedEncodings;
  }
}
