import { CSVData } from "../../models";
import { DataTransformerImpl } from "../DataTransformer";

describe("DataTransformer - Sequence Columns", () => {
  let transformer: DataTransformerImpl;

  beforeEach(() => {
    transformer = new DataTransformerImpl();
  });

  describe("addSequenceColumns", () => {
    it("should add sequence column with default start and step", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
          ["Charlie", "35"],
        ],
      };

      const sequenceColumns = [{ column: "id" }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.headers).toEqual(["name", "age", "id"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "1"],
        ["Bob", "30", "2"],
        ["Charlie", "35", "3"],
      ]);
    });

    it("should add sequence column with custom start", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const sequenceColumns = [{ column: "id", start: 100 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.headers).toEqual(["name", "age", "id"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "100"],
        ["Bob", "30", "101"],
      ]);
    });

    it("should add sequence column with custom step", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
          ["Charlie", "35"],
        ],
      };

      const sequenceColumns = [{ column: "id", start: 10, step: 10 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.headers).toEqual(["name", "age", "id"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "10"],
        ["Bob", "30", "20"],
        ["Charlie", "35", "30"],
      ]);
    });

    it("should add multiple sequence columns", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const sequenceColumns = [
        { column: "id", start: 1, step: 1 },
        { column: "order_no", start: 100, step: 10 },
      ];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.headers).toEqual(["name", "age", "id", "order_no"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "1", "100"],
        ["Bob", "30", "2", "110"],
      ]);
    });

    it("should handle negative start value", () => {
      const data: CSVData = {
        headers: ["name"],
        rows: [["Alice"], ["Bob"], ["Charlie"]],
      };

      const sequenceColumns = [{ column: "id", start: -5, step: 1 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.rows).toEqual([
        ["Alice", "-5"],
        ["Bob", "-4"],
        ["Charlie", "-3"],
      ]);
    });

    it("should handle negative step value", () => {
      const data: CSVData = {
        headers: ["name"],
        rows: [["Alice"], ["Bob"], ["Charlie"]],
      };

      const sequenceColumns = [{ column: "id", start: 100, step: -10 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.rows).toEqual([
        ["Alice", "100"],
        ["Bob", "90"],
        ["Charlie", "80"],
      ]);
    });

    it("should handle empty data", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [],
      };

      const sequenceColumns = [{ column: "id", start: 1, step: 1 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.headers).toEqual(["name", "age", "id"]);
      expect(result.rows).toEqual([]);
    });

    it("should throw error for duplicate column names", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [["Alice", "25"]],
      };

      const sequenceColumns = [{ column: "name", start: 1 }];

      expect(() => {
        transformer.addSequenceColumns(data, sequenceColumns);
      }).toThrow(/連番列の名前が既存の列と重複しています/);
    });

    it("should work with large step values", () => {
      const data: CSVData = {
        headers: ["name"],
        rows: [["Alice"], ["Bob"]],
      };

      const sequenceColumns = [{ column: "id", start: 1000, step: 1000 }];

      const result = transformer.addSequenceColumns(data, sequenceColumns);

      expect(result.rows).toEqual([
        ["Alice", "1000"],
        ["Bob", "2000"],
      ]);
    });

    it("should preserve original data", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const originalHeaders = [...data.headers];
      const originalRows = data.rows.map((row) => [...row]);

      const sequenceColumns = [{ column: "id", start: 1, step: 1 }];

      transformer.addSequenceColumns(data, sequenceColumns);

      // Original data should not be mutated
      expect(data.headers).toEqual(originalHeaders);
      expect(data.rows).toEqual(originalRows);
    });
  });

  describe("transform with sequence columns", () => {
    it("should apply sequence columns in transformation pipeline", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const config = {
        sequenceColumns: [{ column: "id", start: 1, step: 1 }],
      };

      const result = transformer.transform(data, config);

      expect(result.headers).toEqual(["name", "age", "id"]);
      expect(result.rows).toEqual([
        ["Alice", "25", "1"],
        ["Bob", "30", "2"],
      ]);
    });

    it("should apply sequence columns with column reordering", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const config = {
        sequenceColumns: [{ column: "id", start: 1, step: 1 }],
        columnOrder: ["id", "name", "age"],
      };

      const result = transformer.transform(data, config);

      expect(result.headers).toEqual(["id", "name", "age"]);
      expect(result.rows).toEqual([
        ["1", "Alice", "25"],
        ["2", "Bob", "30"],
      ]);
    });

    it("should apply sequence columns with fixed columns", () => {
      const data: CSVData = {
        headers: ["name", "age"],
        rows: [
          ["Alice", "25"],
          ["Bob", "30"],
        ],
      };

      const config = {
        fixedColumns: { status: "active" },
        sequenceColumns: [{ column: "id", start: 1, step: 1 }],
        columnOrder: ["id", "name", "age", "status"],
      };

      const result = transformer.transform(data, config);

      expect(result.headers).toEqual(["id", "name", "age", "status"]);
      expect(result.rows).toEqual([
        ["1", "Alice", "25", "active"],
        ["2", "Bob", "30", "active"],
      ]);
    });
  });
});
