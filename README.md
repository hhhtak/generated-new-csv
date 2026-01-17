# CSV Converter

設定可能なルールに基づいて CSV ファイルを変換する柔軟なコマンドラインツールです。列の並び替え、値の置換、ヘッダーのカスタマイズをサポートし、異なるシステム間でのデータ形式標準化を可能にします。

## 機能

- **ヘッダーマッピング**: 列ヘッダーを新しい名前に変更（1対1、1対多のマッピングをサポート）
- **列の並び替え**: 出力 CSV の列順序をカスタマイズ
- **値の置換**: 特定の列の値を別の値に置換
- **行の削除**: 指定した条件に基づいて行を削除（AND条件をサポート）
- **固定列の追加**: 定数値を持つ新しい列を追加
- **エンコーディング変換**: 出力ファイルのエンコーディングを変更（UTF-8、Shift_JIS、EUC-JP）
- **設定ファイル**: JSON 形式の外部設定ファイルで変換ルールを定義
- **詳細ログ**: 変換プロセスの詳細な情報を出力
- **エラーハンドリング**: 詳細なエラーメッセージとバリデーション

## インストール

```bash
npm install
npm run build
```

## 使用方法

### 基本的な使用方法

```bash
# 設定ファイルを使用して変換
csv-converter -i input.csv -o output.csv -c config.json

# 詳細ログ付きで変換
csv-converter -i input.csv -o output.csv -c config.json --verbose

# 設定なしで直接コピー
csv-converter -i input.csv -o output.csv
```

### コマンドラインオプション

- `-i, --input <file>`: 入力 CSV ファイルのパス（必須）
- `-o, --output <file>`: 出力 CSV ファイルのパス（必須）
- `-c, --config <file>`: 設定ファイルのパス（オプション）
- `-v, --verbose`: 詳細ログを出力
- `-h, --help`: ヘルプを表示

## 設定ファイル形式

設定ファイルは JSON 形式で、以下のオプションをサポートします：

```json
{
  "headerMappings": {
    "元の列名": "新しい列名"
  },
  "columnOrder": ["列1", "列2", "列3"],
  "valueReplacements": {
    "列名": {
      "元の値": "新しい値"
    }
  },
  "fixedColumns": {
    "新しい列名": "固定値"
  },
  "deleteConditions": [
    {
      "column": "列名",
      "value": "削除対象の値"
    }
  ],
  "outputEncoding": "shift_jis"
}
```

### 設定オプション

#### headerMappings（オプション）

元の列ヘッダーを新しい名前にマッピングします。1対1のマッピングと1対多のマッピングをサポートします。

```json
{
  "headerMappings": {
    "名前": "name",
    "年齢": "age",
    "住所": ["address", "location"] // 1対多のマッピング
  }
}
```

#### columnOrder（オプション）

出力 CSV の列順序を指定します。指定されていない列は出力から除外されます。

```json
{
  "columnOrder": ["name", "age", "gender"]
}
```

#### valueReplacements（オプション）

特定の列の値を置換します。複数の置換ルールを同じ列に適用できます。

```json
{
  "valueReplacements": {
    "gender": {
      "男性": "M",
      "女性": "F"
    },
    "status": {
      "あり": "1",
      "なし": "0"
    }
  }
}
```

#### fixedColumns（オプション）

定数値を持つ新しい列を追加します。

```json
{
  "fixedColumns": {
    "version": "1.0",
    "processed_date": "2024-01-01",
    "batch_id": 12345
  }
}
```

#### deleteConditions（オプション）

指定した条件に基づいて行を削除します。複数の条件を指定した場合、すべての条件に一致する行が削除されます（AND条件）。

```json
{
  "deleteConditions": [
    {
      "column": "status",
      "value": "inactive"
    },
    {
      "column": "category",
      "value": ["test", "debug"] // 配列で複数の値を指定可能
    }
  ]
}
```

#### outputEncoding（オプション）

出力ファイルのエンコーディングを指定します。サポートされているエンコーディング：

- `utf8`（デフォルト）
- `shift_jis`
- `euc-jp`

```json
{
  "outputEncoding": "shift_jis"
}
```

## サンプル

`samples/` ディレクトリには、すべての変換機能を実演する包括的なサンプルファイルが含まれています。

### クイックスタート

```bash
# デモスクリプトを実行してすべてのサンプルを試す
./samples/demo.sh

# サンプルの動作を検証
./samples/validate.sh
```

詳細については `samples/README.md` を参照してください。

### サンプル 1: 従業員データの変換

**入力ファイル** (`samples/input-employees.csv`):

```csv
名前,年齢,性別,職業,給与,部署,入社日,ステータス
田中太郎,30,男性,エンジニア,500000,開発部,2020-04-01,有効
佐藤花子,25,女性,営業,450000,営業部,2021-06-15,有効
山田次郎,35,男性,マネージャー,600000,開発部,2019-01-10,無効
```

**設定ファイル** (`samples/config-complete.json`):

```json
{
  "headerMappings": {
    "名前": "name",
    "年齢": "age",
    "性別": "gender",
    "職業": "occupation",
    "給与": "salary",
    "部署": "department",
    "入社日": "hire_date",
    "ステータス": "status"
  },
  "columnOrder": [
    "name",
    "age",
    "department",
    "occupation",
    "salary",
    "hire_date",
    "gender",
    "status"
  ],
  "valueReplacements": {
    "gender": {
      "男性": "M",
      "女性": "F"
    },
    "status": {
      "有効": "active",
      "無効": "inactive"
    },
    "department": {
      "開発部": "Development",
      "営業部": "Sales"
    }
  },
  "deleteConditions": [
    {
      "column": "ステータス",
      "value": "無効"
    }
  ],
  "fixedColumns": {
    "company": "ABC Corp",
    "processed_at": "2024-01-01"
  },
  "outputEncoding": "shift_jis"
}
```

**実行コマンド**:

```bash
csv-converter -i samples/input-employees.csv -o output-employees.csv -c samples/config-complete.json --verbose
```

**出力結果**:

```csv
name,age,department,occupation,salary,hire_date,gender,status,company,processed_at
田中太郎,30,Development,エンジニア,500000,2020-04-01,M,active,ABC Corp,2024-01-01
佐藤花子,25,Sales,営業,450000,2021-06-15,F,active,ABC Corp,2024-01-01
```

_注意: 山田次郎の行は「無効」ステータスのため削除されています。_

### サンプル 2: シンプルな列マッピング

**入力ファイル** (`samples/input-products.csv`):

```csv
商品名,価格,在庫,カテゴリ
ノートパソコン,89800,15,電子機器
マウス,2500,50,電子機器
```

**設定ファイル** (`samples/config-simple.json`):

```json
{
  "headerMappings": {
    "商品名": "product_name",
    "価格": "price",
    "在庫": "stock"
  },
  "columnOrder": ["product_name", "price", "stock"]
}
```

**実行コマンド**:

```bash
csv-converter -i samples/input-products.csv -o output-products.csv -c samples/config-simple.json
```

### サンプル 3: 値の置換のみ

**入力ファイル** (`samples/input-tasks.csv`):

```csv
task_id,title,availability,priority,assignee
T001,データベース設計,あり,高,田中
T002,UI改善,なし,中,佐藤
```

**設定ファイル** (`samples/config-value-replacement.json`):

```json
{
  "valueReplacements": {
    "availability": {
      "あり": "1",
      "なし": "0"
    },
    "priority": {
      "高": "high",
      "中": "medium",
      "低": "low"
    }
  }
}
```

**実行コマンド**:

```bash
csv-converter -i samples/input-tasks.csv -o output-tasks.csv -c samples/config-value-replacement.json
```

### サンプル 4: 行削除と固定列追加

**入力ファイル**:

```csv
product_id,name,status,category,price
P001,ノートパソコン,active,electronics,89800
P002,マウス,discontinued,electronics,2500
P003,キーボード,active,electronics,5800
P004,テスト商品,test,electronics,1000
```

**設定ファイル**:

```json
{
  "deleteConditions": [
    {
      "column": "status",
      "value": ["discontinued", "test"]
    }
  ],
  "fixedColumns": {
    "store_id": "STORE001",
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "columnOrder": ["product_id", "name", "price", "category", "store_id", "updated_at"]
}
```

**出力結果**:

```csv
product_id,name,price,category,store_id,updated_at
P001,ノートパソコン,89800,electronics,STORE001,2024-01-01T00:00:00Z
P003,キーボード,5800,electronics,STORE001,2024-01-01T00:00:00Z
```

### サンプル 5: エンコーディング変換

**設定ファイル**:

```json
{
  "headerMappings": {
    "商品名": "product_name",
    "価格": "price"
  },
  "outputEncoding": "shift_jis"
}
```

このサンプルでは、日本語を含むCSVファイルをShift_JISエンコーディングで出力します。

## 変換処理の順序

変換は以下の順序で実行されます：

1. **CSV解析**: 入力ファイルを読み込み、ヘッダーと行データを解析
2. **設定読み込み**: 設定ファイルがある場合は読み込みとバリデーション
3. **行削除**: `deleteConditions` に基づいて条件に一致する行を削除
4. **ヘッダーマッピング**: `headerMappings` に基づいて列ヘッダーを変更
5. **固定列追加**: `fixedColumns` で指定された定数値の列を追加
6. **列並び替え**: `columnOrder` に基づいて列の順序を変更
7. **値置換**: `valueReplacements` に基づいて特定の値を置換
8. **CSV出力**: 変換されたデータをCSVファイルとして出力
9. **エンコーディング変換**: `outputEncoding` が指定されている場合、ファイルのエンコーディングを変換

この順序により、各変換ステップが適切に連携し、期待される結果を得ることができます。

### テストの実行

```bash
# 全テストを実行
npm test

# テストをウォッチモードで実行
npm run test:watch
```

### ビルド

```bash
# TypeScript をコンパイル
npm run build

# 開発モードで実行
npm run dev -- -i input.csv -o output.csv -c config.json
```

### リント

```bash
npm run lint
```

## エラーハンドリング

ツールは以下のエラーシナリオを適切に処理します：

- **ファイルアクセスエラー**: 入力ファイルが見つからない、出力ディレクトリに書き込み権限がない
- **CSV 解析エラー**: 無効な CSV 形式、エンコーディングの問題、空のファイル、重複ヘッダー
- **設定エラー**: 無効な JSON、必須フィールドの欠如、サポートされていないエンコーディング
- **変換エラー**: 存在しない列の参照、設定の矛盾、削除条件の無効な列参照
- **削除エラー**: 削除条件で指定された列が存在しない場合
- **固定列エラー**: 固定列名が既存の列名と重複している場合

エラーメッセージには詳細なコンテキスト（行番号、列名、利用可能な列一覧など）が含まれ、問題の特定とトラブルシューティングを支援します。

### ログレベル

- **通常モード**: 基本的な処理情報のみ表示
- **詳細モード** (`--verbose`): 変換の各ステップの詳細情報を表示
  - 解析されたCSVの統計情報
  - 適用される変換の詳細
  - 削除された行数
  - エンコーディング変換の情報

## 開発

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。開発に参加する前に、テストが通ることを確認してください。
