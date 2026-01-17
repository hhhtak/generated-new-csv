import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { FileEncoderImpl } from "../FileEncoder";

describe("FileEncoder", () => {
  let encoder: FileEncoderImpl;
  let testDir: string;

  beforeEach(async () => {
    encoder = new FileEncoderImpl();
    // Create a unique temporary directory for each test
    testDir = join(
      tmpdir(),
      `file-encoder-test-${Date.now()}-${Math.random()}`
    );
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("isEncodingSupported", () => {
    it("should return true for supported encodings", () => {
      expect(encoder.isEncodingSupported("utf8")).toBe(true);
      expect(encoder.isEncodingSupported("shift_jis")).toBe(true);
      expect(encoder.isEncodingSupported("euc-jp")).toBe(true);
    });

    it("should be case-insensitive", () => {
      expect(encoder.isEncodingSupported("UTF8")).toBe(true);
      expect(encoder.isEncodingSupported("SHIFT_JIS")).toBe(true);
      expect(encoder.isEncodingSupported("EUC-JP")).toBe(true);
    });

    it("should return false for unsupported encodings", () => {
      expect(encoder.isEncodingSupported("invalid-encoding")).toBe(false);
      expect(encoder.isEncodingSupported("latin1")).toBe(false);
      expect(encoder.isEncodingSupported("iso-2022-jp")).toBe(false);
      expect(encoder.isEncodingSupported("")).toBe(false);
    });
  });

  describe("encode", () => {
    it("should encode file to UTF-8", async () => {
      const testFile = join(testDir, "test-utf8.csv");
      const content = "名前,年齢\n太郎,25\n花子,30";
      await fs.writeFile(testFile, content, "utf8");

      await encoder.encode(testFile, "utf8");

      const result = await fs.readFile(testFile, "utf8");
      expect(result).toBe(content);
    });

    it("should encode file to Shift_JIS", async () => {
      const testFile = join(testDir, "test-sjis.csv");
      const content = "名前,年齢\n太郎,25\n花子,30";
      await fs.writeFile(testFile, content, "utf8");

      await encoder.encode(testFile, "shift_jis");

      // Read as buffer and verify it's not UTF-8 anymore
      const buffer = await fs.readFile(testFile);
      expect(buffer).toBeInstanceOf(Buffer);
      // The buffer should be different from UTF-8 encoding
      const utf8Buffer = Buffer.from(content, "utf8");
      expect(buffer.equals(utf8Buffer)).toBe(false);
    });

    it("should encode file to EUC-JP", async () => {
      const testFile = join(testDir, "test-eucjp.csv");
      const content = "名前,年齢\n太郎,25";
      await fs.writeFile(testFile, content, "utf8");

      await encoder.encode(testFile, "euc-jp");

      const buffer = await fs.readFile(testFile);
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it("should handle ASCII-only content", async () => {
      const testFile = join(testDir, "test-ascii.csv");
      const content = "name,age\nJohn,25\nJane,30";
      await fs.writeFile(testFile, content, "utf8");

      await encoder.encode(testFile, "shift_jis");

      const result = await fs.readFile(testFile, "utf8");
      expect(result).toBe(content);
    });

    it("should throw error for unsupported encoding", async () => {
      const testFile = join(testDir, "test-invalid.csv");
      await fs.writeFile(testFile, "test content", "utf8");

      await expect(
        encoder.encode(testFile, "invalid-encoding")
      ).rejects.toThrow(/Unsupported encoding/);
    });

    it("should throw error for non-existent file", async () => {
      const testFile = join(testDir, "non-existent.csv");

      await expect(encoder.encode(testFile, "utf8")).rejects.toThrow();
    });

    it("should handle empty file", async () => {
      const testFile = join(testDir, "test-empty.csv");
      await fs.writeFile(testFile, "", "utf8");

      await encoder.encode(testFile, "shift_jis");

      const result = await fs.readFile(testFile);
      expect(result.length).toBe(0);
    });

    it("should handle special characters", async () => {
      const testFile = join(testDir, "test-special.csv");
      const content = "名前,説明\n商品A,「特別」な商品\n商品B,100%オフ";
      await fs.writeFile(testFile, content, "utf8");

      await encoder.encode(testFile, "shift_jis");

      const buffer = await fs.readFile(testFile);
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });
});
