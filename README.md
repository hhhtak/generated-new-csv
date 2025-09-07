# CSV Converter

設定可能なルールに基づいて CSV ファイルを変換する柔軟なコマンドラインツールです。列の並び替え、値の置換、ヘッダーのカスタマイズをサポートし、異なるシステム間でのデータ形式標準化を可能にします。

## 機能

- **ヘッダーマッピング**: 列ヘッダーを新しい名前に変更
- **列の並び替え**: 出力 CSV の列順序をカスタマイズ
- **値の置換**: 特定の列の値を別の値に置換
- **設定ファイル**: JSON 形式の外部設定ファイルで変換ルールを定義
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

# 設定なしで直接コピー
csv-converter -i input.csv -o output.csv
```

### コマンドラインオプション

- `-i, --input <file>`: 入力 CSV ファイルのパス（必須）
- `-o, --output <file>`: 出力 CSV ファイルのパス（必須）
- `-c, --config <file>`: 設定ファイルのパス（オプション）
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
  }
}
```

### 設定オプション

#### headerMappings（オプション）

元の列ヘッダーを新しい名前にマッピングします。

```json
{
  "headerMappings": {
    "名前": "name",
    "年齢": "age",
    "性別": "gender"
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
  }
}
```

**実行コマンド**:

```bash
csv-converter -i samples/input-employees.csv -o output-employees.csv -c samples/config-complete.json
```

**出力結果**:

```csv
name,age,department,occupation,salary,hire_date,gender,status
田中太郎,30,Development,エンジニア,500000,2020-04-01,M,active
佐藤花子,25,Sales,営業,450000,2021-06-15,active
```

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

## 開発

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
- **CSV 解析エラー**: 無効な CSV 形式、エンコーディングの問題
- **設定エラー**: 無効な JSON、必須フィールドの欠如
- **変換エラー**: 存在しない列の参照、設定の矛盾

エラーメッセージには詳細なコンテキスト（行番号、列名など）が含まれ、問題の特定とトラブルシューティングを支援します。

## ライセンス

MIT License

## 貢献

プルリクエストやイシューの報告を歓迎します。開発に参加する前に、テストが通ることを確認してください。
