# CSV Converter サンプル

このディレクトリには CSV Converter の機能を実演するサンプルファイルが含まれています。

## ファイル構成

### 設定ファイル

- **`config-complete.json`**: すべての変換機能（ヘッダーマッピング、列並び替え、値置換、固定列）を使用する完全な設定例
- **`config-simple.json`**: ヘッダーマッピングと列並び替えのみを使用するシンプルな設定例
- **`config-value-replacement.json`**: 値置換のみを使用する設定例
- **`config-with-deletion.json`**: 削除機能を含むすべての変換機能を使用する設定例
- **`config-deletion-only.json`**: 削除機能のみを使用する設定例（複数条件）
- **`config-fixed-columns.json`**: 固定列追加機能を使用する設定例

### 入力 CSV ファイル

- **`input-employees.csv`**: 従業員データのサンプル（日本語ヘッダー、複数の変換が必要）
- **`input-employees-with-inactive.csv`**: 削除機能デモ用の従業員データ（無効なレコードを含む）
- **`input-products.csv`**: 商品データのサンプル（シンプルな構造）
- **`input-tasks.csv`**: タスクデータのサンプル（値置換に適した形式）
- **`input-tasks-mixed.csv`**: 削除機能デモ用のタスクデータ（複数の削除条件に適した形式）

### 期待される出力ファイル

- **`output-employees-expected.csv`**: `input-employees.csv` + `config-complete.json` の期待される結果
- **`output-products-expected.csv`**: `input-products.csv` + `config-simple.json` の期待される結果
- **`output-tasks-expected.csv`**: `input-tasks.csv` + `config-value-replacement.json` の期待される結果
- **`output-employees-with-deletion-expected.csv`**: `input-employees-with-inactive.csv` + `config-with-deletion.json` の期待される結果
- **`output-tasks-deletion-only-expected.csv`**: `input-tasks-mixed.csv` + `config-deletion-only.json` の期待される結果

### デモスクリプト

- **`demo.sh`**: 全サンプルを実行するシェルスクリプト（削除機能を含む）

## サンプルの実行方法

### 個別実行

```bash
# プロジェクトをビルド
npm run build

# 従業員データの変換
csv-converter -i samples/input-employees.csv -o output-employees.csv -c samples/config-complete.json

# 商品データの変換
csv-converter -i samples/input-products.csv -o output-products.csv -c samples/config-simple.json

# タスクデータの変換
csv-converter -i samples/input-tasks.csv -o output-tasks.csv -c samples/config-value-replacement.json

# 削除機能付き従業員データの変換
csv-converter -i samples/input-employees-with-inactive.csv -o output-employees-with-deletion.csv -c samples/config-with-deletion.json

# 削除機能のみ（複数条件）
csv-converter -i samples/input-tasks-mixed.csv -o output-tasks-deletion-only.csv -c samples/config-deletion-only.json

# 固定列追加機能
csv-converter -i samples/input-products.csv -o output-products-fixed.csv -c samples/config-fixed-columns.json
```

### デモスクリプトの実行

```bash
# 全サンプルを一度に実行
./samples/demo.sh
```

## 各サンプルの詳細

### サンプル 1: 従業員データ（完全変換）

**目的**: すべての変換機能を実演

- ヘッダーマッピング: 日本語から英語へ
- 列並び替え: 論理的な順序に再配置
- 値置換: 性別、ステータス、部署名の標準化
- 固定列追加: 作成日とバージョン情報を追加

**変換内容**:

- `名前` → `name`
- `性別`: `男性` → `M`, `女性` → `F`
- `部署`: `開発部` → `Development`, `営業部` → `Sales`
- `ステータス`: `有効` → `active`, `無効` → `inactive`
- 固定列: `created_date` = `2024-01-01`, `version` = `1.0`

### サンプル 2: 商品データ（シンプル変換）

**目的**: 基本的なヘッダーマッピングと列選択を実演

- ヘッダーマッピング: 日本語から英語へ
- 列選択: カテゴリ列を除外

**変換内容**:

- `商品名` → `product_name`
- `価格` → `price`
- `在庫` → `stock`
- `カテゴリ` 列は出力から除外

### サンプル 3: タスクデータ（値置換）

**目的**: 値置換機能を実演

- ヘッダーはそのまま保持
- 特定の列の値のみ置換

**変換内容**:

- `availability`: `あり` → `1`, `なし` → `0`
- `priority`: `高` → `high`, `中` → `medium`, `低` → `low`

### サンプル 4: 削除機能付き従業員データ（完全変換 + 削除）

**目的**: 削除機能を含むすべての変換機能を実演

- 削除条件: `ステータス` が `無効` の行を削除
- ヘッダーマッピング、列並び替え、値置換、固定列追加も実行

**入力データ**: 7 行（ヘッダー含む 8 行）
**削除対象**: `ステータス` が `無効` の 3 行
**出力データ**: 4 行（ヘッダー含む 5 行）

**変換内容**:

- 削除: `ステータス` = `無効` の行を削除
- その他の変換はサンプル 1 と同様

### サンプル 5: 削除機能のみ（複数条件）

**目的**: 複数の削除条件を使用した削除機能を実演

- 削除条件 1: `availability` が `なし` の行
- 削除条件 2: `priority` が `低` または `中` の行
- 両方の条件に一致する行のみ削除（AND 条件）

**入力データ**: 8 行（ヘッダー含む 9 行）
**削除対象**: `availability` = `なし` AND `priority` = `低` または `中` の行
**出力データ**: 2 行（ヘッダー含む 3 行）

**削除される行**:

- T002: `availability` = `なし`, `priority` = `中`
- T006: `availability` = `なし`, `priority` = `低`
- T008: `availability` = `なし`, `priority` = `中`

### サンプル 6: 固定列追加

**目的**: 固定列追加機能を実演

- ヘッダーマッピング: 日本語から英語へ
- 固定列追加: すべての行に同じ値を持つ列を追加

**変換内容**:

- `商品名` → `product_name`
- `価格` → `price`
- `在庫` → `stock`
- `カテゴリ` → `category`
- 固定列: `status` = `active`, `last_updated` = `2024-01-01`

## テスト用途

これらのサンプルファイルは以下の用途で使用できます：

1. **機能テスト**: 各変換機能が正しく動作することを確認
2. **統合テスト**: エンドツーエンドのワークフローをテスト
3. **デモンストレーション**: ユーザーへの機能説明
4. **開発テスト**: 新機能の動作確認

## カスタマイズ

これらのサンプルを基に、独自の設定ファイルや入力データを作成できます。設定ファイルの詳細な仕様については、プロジェクトルートの README.md を参照してください。
