# CSV Converter サンプル使用ガイド

## クイックスタート

1. プロジェクトをビルド:

   ```bash
   npm run build
   ```

2. デモを実行:
   ```bash
   ./samples/demo.sh
   ```

## 個別サンプルの実行

### 従業員データの変換

```bash
csv-converter -i samples/input-employees.csv -o output.csv -c samples/config-complete.json
```

この例では以下の変換が行われます:

- 日本語ヘッダーを英語に変換
- 列を論理的な順序に並び替え
- 性別、部署、ステータスの値を標準化

### 商品データの変換

```bash
csv-converter -i samples/input-products.csv -o output.csv -c samples/config-simple.json
```

この例では以下の変換が行われます:

- ヘッダーを英語に変換
- 必要な列のみを選択（カテゴリ列を除外）

### タスクデータの変換

```bash
csv-converter -i samples/input-tasks.csv -o output.csv -c samples/config-value-replacement.json
```

この例では以下の変換が行われます:

- availability 列: あり →1, なし →0
- priority 列: 高 →high, 中 →medium, 低 →low

## テスト用途

### 単体テストでの使用

```javascript
// テストファイルでサンプルデータを使用
const inputPath = "samples/input-employees.csv";
const configPath = "samples/config-complete.json";
const expectedPath = "samples/output-employees-expected.csv";
```

### 統合テストでの使用

```bash
# 実際の変換を実行してから結果を比較
csv-converter -i samples/input-employees.csv -o test-output.csv -c samples/config-complete.json
diff test-output.csv samples/output-employees-expected.csv
```

## カスタム設定の作成

### 1. 基本的な設定ファイル

```json
{
  "headerMappings": {
    "元の名前": "新しい名前"
  }
}
```

### 2. 列順序の指定

```json
{
  "columnOrder": ["列1", "列2", "列3"]
}
```

### 3. 値の置換

```json
{
  "valueReplacements": {
    "列名": {
      "元の値": "新しい値"
    }
  }
}
```

### 4. 全機能を組み合わせ

```json
{
  "headerMappings": {
    "名前": "name"
  },
  "columnOrder": ["name", "age"],
  "valueReplacements": {
    "status": {
      "有効": "active"
    }
  }
}
```

## トラブルシューティング

### よくあるエラー

1. **ファイルが見つからない**

   ```
   ERROR: Input file 'missing.csv' not found
   ```

   → ファイルパスを確認してください

2. **設定ファイルの JSON エラー**

   ```
   ERROR: Invalid JSON in config file
   ```

   → JSON の構文を確認してください

3. **存在しない列の参照**
   ```
   ERROR: Column 'missing_column' specified in columnOrder not found in input CSV
   ```
   → 設定ファイルの列名が入力 CSV のヘッダーと一致することを確認してください

### デバッグのヒント

- 設定なしで実行して基本的な変換が動作することを確認
- 小さなサンプルファイルで設定をテスト
- エラーメッセージの行番号や列名を確認

## パフォーマンステスト

大きなファイルでのテスト用に、サンプルデータを拡張できます:

```bash
# 大きなテストファイルを生成（例）
for i in {1..1000}; do
  tail -n +2 samples/input-employees.csv >> large-test.csv
done
```
