# 設計書

## 概要

CSV Converter は、設定可能なルールに基づいて CSV ファイルを変換するコマンドラインツールです。システムは、データが解析、変換、出力の各段階を流れるパイプラインアーキテクチャに従います。設定は JSON ファイルに外部化されており、ユーザーはコードを変更することなく、列マッピング、値の置換、ヘッダー変換を定義できます。

## アーキテクチャ

システムは以下のコンポーネントを持つモジュラーパイプラインアーキテクチャを使用します：

```
入力CSV → パーサー → トランスフォーマー → ライター → 出力CSV
              ↑
        設定ローダー
```

### コアコンポーネント：

- **CSV パーサー**: 入力 CSV ファイルの読み取りと検証
- **設定ローダー**: 変換ルールの読み込みと検証
- **データトランスフォーマー**: 列の並び替え、値の置換、ヘッダーマッピングの適用
- **CSV ライター**: 変換されたデータを新しい CSV ファイルに出力
- **エラーハンドラー**: 明確なエラーメッセージと検証の提供

## コンポーネントとインターフェース

### CSVParser

```typescript
interface CSVParser {
  parse(filePath: string): Promise<CSVData>;
  validate(data: string[][]): boolean;
}

interface CSVData {
  headers: string[];
  rows: string[][];
}
```

### ConfigurationLoader

```typescript
interface TransformationConfig {
  headerMappings?: Record<string, string>;
  columnOrder?: string[];
  valueReplacements?: Record<string, Record<string, string>>;
}

interface ConfigurationLoader {
  load(configPath: string): Promise<TransformationConfig>;
  validate(config: TransformationConfig): ValidationResult;
}
```

### DataTransformer

```typescript
interface DataTransformer {
  transform(data: CSVData, config: TransformationConfig): CSVData;
  reorderColumns(data: CSVData, order: string[]): CSVData;
  replaceValues(
    data: CSVData,
    replacements: Record<string, Record<string, string>>
  ): CSVData;
  mapHeaders(headers: string[], mappings: Record<string, string>): string[];
}
```

### CSVWriter

```typescript
interface CSVWriter {
  write(data: CSVData, outputPath: string): Promise<void>;
  formatRow(row: string[]): string;
}
```

## データモデル

### 設定ファイル形式（JSON）

```json
{
  "headerMappings": {
    "original_column_name": "new_column_name"
  },
  "columnOrder": ["column1", "column2", "column3"],
  "valueReplacements": {
    "column_name": {
      "あり": "1",
      "なし": "0"
    }
  }
}
```

### 内部データ構造

- **CSVData**: ヘッダーとデータ行を分離した解析済み CSV を表現
- **TransformationConfig**: 検証機能付きの型付き設定オブジェクト
- **ValidationResult**: 詳細なメッセージを含むエラー報告構造

## エラーハンドリング

### エラーカテゴリ：

1. **ファイルアクセスエラー**: ファイルの欠如、権限の問題
2. **解析エラー**: 無効な CSV 形式、エンコーディングの問題
3. **設定エラー**: 無効な JSON、必須フィールドの欠如
4. **変換エラー**: 参照された列が存在しない、循環依存

### エラー報告戦略：

- エラーコードと説明的なメッセージを含む構造化されたエラーオブジェクトを使用
- デバッグのためのコンテキスト（行番号、列名）を提供
- 部分的な処理ではなく、明確なエラーメッセージで早期に失敗
- 適切な重要度レベルでコンソールにエラーをログ出力

### エラーメッセージの例：

```
ERROR: columnOrderで指定された列 'missing_column' が入力CSVに見つかりません
ERROR: 設定ファイルの5行目で無効なJSON: 予期しないトークン
ERROR: 入力ファイル 'data.csv' が見つからないか読み取れません
```

## テスト戦略

### 単体テスト：

- **パーサーテスト**: 有効/無効な CSV 形式、エンコーディング処理、エッジケース
- **トランスフォーマーテスト**: 列の並び替え、値の置換、ヘッダーマッピング
- **設定テスト**: 有効/無効な JSON、欠如フィールド、型検証
- **ライターテスト**: 出力フォーマット、ファイル作成、権限処理

### 統合テスト：

- **エンドツーエンドワークフロー**: 様々な設定での完全な変換パイプライン
- **エラーシナリオ**: ファイルが見つからない、無効な設定、不正な CSV
- **パフォーマンステスト**: 大きな CSV ファイル、複雑な変換ルール

### テストデータ：

- 様々な形式のサンプル CSV ファイル（引用符付きフィールド、特殊文字、異なるエンコーディング）
- すべての変換タイプをカバーする設定ファイル
- エッジケース：空ファイル、単一列、単一行、Unicode 文字

### テストツール：

- 単体テストと統合テストのための Jest
- ファイル操作テストのためのモックファイルシステム
- CSV 解析エッジケースのためのプロパティベーステスト
