# CSV Converter

設定可能なルールに基づいて CSV ファイルを変換する柔軟なコマンドラインツールです。列の並び替え、値の置換、ヘッダーのカスタマイズをサポートし、異なるシステム間でのデータ形式標準化を可能にします。

## 機能

- **ヘッダーマッピング**: 列ヘッダーを新しい名前に変更
- **列の並び替え**: 出力 CSV の列順序をカスタマイズ
- **値の置換**: 特定の列の値を別の値に置換
- **固定列追加**: すべての行に同じ値を持つ新しい列を追加
- **連番列追加**: 自動採番される連番列を追加（開始値、増分値を指定可能）
- **データ削除**: 指定した条件に基づいて行を削除
- **ファイルエンコーディング**: 出力ファイルの文字エンコーディングを指定（UTF-8、Shift_JIS、EUC-JP）
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
npm run dev -- -i input.csv -o output.csv -c config.json

# 設定なしで直接コピー
npm run dev -- -i input.csv -o output.csv
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
  },
  "fixedColumns": {
    "列名": "固定値"
  },
  "sequenceColumns": [
    {
      "column": "列名",
      "start": 1,
      "step": 1
    }
  ],
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

#### fixedColumns（オプション）

すべての行に同じ値を持つ新しい列を追加します。

```json
{
  "fixedColumns": {
    "status": "active",
    "created_date": "2024-01-01",
    "version": "1.0"
  }
}
```

#### sequenceColumns（オプション）

自動採番される連番列を追加します。一番上の行から順に採番されます。

```json
{
  "sequenceColumns": [
    {
      "column": "id",
      "start": 1,
      "step": 1
    },
    {
      "column": "order_no",
      "start": 100,
      "step": 10
    }
  ]
}
```

**連番列の設定項目**:

- `column`: 連番列の列名（必須）
- `start`: 開始値（オプション、デフォルト: 1）
- `step`: 増分値（オプション、デフォルト: 1）

**使用例**:

```json
{
  "sequenceColumns": [
    {
      "column": "id",
      "start": 1,
      "step": 1
    }
  ]
}
```

上記の設定で、3行のデータがある場合：

- 1行目: id = 1
- 2行目: id = 2
- 3行目: id = 3

**注意事項**:

- 連番列は、削除処理の後に追加されます（削除後の行に対して採番）
- 負の値も使用可能です（例: `start: -10, step: 1` → -10, -9, -8...）
- 負の増分値も使用可能です（例: `start: 100, step: -1` → 100, 99, 98...）
- 連番列の名前が既存の列と重複する場合、エラーが発生します
- 複数の連番列を同時に追加できます

#### deleteConditions（オプション）

指定した条件に基づいて行を削除します。複数の条件を指定した場合、すべての条件に一致する行が削除されます。

```json
{
  "deleteConditions": [
    {
      "column": "status",
      "value": "inactive"
    },
    {
      "column": "category",
      "value": ["削除対象", "無効", "テスト"]
    }
  ]
}
```

**削除条件の詳細**:

- `column`: 削除条件を適用する列名
- `value`: 削除対象の値（文字列または文字列の配列）
- 配列を指定した場合、いずれかの値に一致する行が削除されます
- 複数の削除条件を指定した場合、すべての条件に一致する行のみが削除されます（AND 条件）

#### outputEncoding（オプション）

出力 CSV ファイルの文字エンコーディングを指定します。指定しない場合は UTF-8 がデフォルトで使用されます。

```json
{
  "outputEncoding": "shift_jis"
}
```

**サポートされているエンコーディング**:

- `utf8`: UTF-8（デフォルト）
- `shift_jis`: Shift_JIS（日本語 Windows で一般的）
- `euc-jp`: EUC-JP（Unix/Linux 系で使用）

**使用例**:

```json
{
  "headerMappings": {
    "名前": "氏名",
    "年齢": "age"
  },
  "outputEncoding": "shift_jis"
}
```

**注意事項**:

- エンコーディング変換は、すべての変換処理（ヘッダーマッピング、列並び替え、値置換、削除）が完了した後に実行されます
- サポートされていないエンコーディングを指定した場合、エラーが発生します
- ASCII のみのデータの場合、どのエンコーディングでも同じ結果になります

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
npm run dev -- -i samples/input-employees.csv -o output-employees.csv -c samples/config-complete.json
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
npm run dev -- -i samples/input-products.csv -o output-products.csv -c samples/config-simple.json
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

### サンプル 4: 削除機能付きデータ変換

**入力ファイル** (`samples/input-employees-with-inactive.csv`):

```csv
名前,年齢,性別,職業,給与,部署,入社日,ステータス
田中太郎,30,男性,エンジニア,500000,開発部,2020-04-01,有効
佐藤花子,25,女性,営業,450000,営業部,2021-06-15,有効
山田次郎,35,男性,マネージャー,700000,開発部,2018-03-10,有効
鈴木美咲,28,女性,アナリスト,520000,経理部,2019-09-01,無効
高橋健一,42,男性,部長,800000,人事部,2015-01-20,有効
伊藤裕子,31,女性,デザイナー,480000,開発部,2020-07-15,無効
渡辺大輔,29,男性,営業,460000,営業部,2021-02-01,無効
```

**設定ファイル** (`samples/config-with-deletion.json`):

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
    "status",
    "created_date",
    "version"
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
      "営業部": "Sales",
      "開発部": "Development",
      "人事部": "HR",
      "経理部": "Finance"
    }
  },
  "fixedColumns": {
    "created_date": "2024-01-01",
    "version": "1.0"
  },
  "deleteConditions": [
    {
      "column": "ステータス",
      "value": "無効"
    }
  ]
}
```

**実行コマンド**:

```bash
npm run dev -- -i samples/input-employees-with-inactive.csv -o output-employees-with-deletion.csv -c samples/config-with-deletion.json
```

**出力結果**:

```csv
name,age,department,occupation,salary,hire_date,gender,status,created_date,version
田中太郎,30,Development,エンジニア,500000,2020-04-01,M,active,2024-01-01,1.0
佐藤花子,25,Sales,営業,450000,2021-06-15,F,active,2024-01-01,1.0
山田次郎,35,Development,マネージャー,700000,2018-03-10,M,active,2024-01-01,1.0
高橋健一,42,HR,部長,800000,2015-01-20,M,active,2024-01-01,1.0
```

**処理内容**:

1. **削除処理**: `ステータス` が `無効` の 3 行を削除
2. **ヘッダーマッピング**: 日本語ヘッダーを英語に変換
3. **列並び替え**: 指定された順序で列を配置
4. **値置換**: 性別、ステータス、部署名を標準化
5. **固定列追加**: `created_date` と `version` 列を追加

### サンプル 5: 複数条件での削除

**入力ファイル** (`samples/input-tasks-mixed.csv`):

```csv
task_id,title,availability,priority,assignee,category
T001,データベース設計,あり,高,田中,開発
T002,UI改善,なし,中,佐藤,デザイン
T003,テスト作成,あり,低,山田,品質保証
T004,ドキュメント更新,あり,中,鈴木,ドキュメント
T005,バグ修正,なし,高,高橋,開発
T006,コードレビュー,なし,低,田中,開発
T007,ミーティング準備,あり,低,佐藤,管理
T008,プレゼン作成,なし,中,山田,営業
```

**設定ファイル** (`samples/config-deletion-only.json`):

```json
{
  "deleteConditions": [
    {
      "column": "availability",
      "value": "なし"
    },
    {
      "column": "priority",
      "value": ["低", "中"]
    }
  ]
}
```

**実行コマンド**:

```bash
npm run dev -- -i samples/input-tasks-mixed.csv -o output-tasks-deletion-only.csv -c samples/config-deletion-only.json
```

**出力結果**:

```csv
task_id,title,availability,priority,assignee,category
T001,データベース設計,あり,高,田中,開発
T005,バグ修正,なし,高,高橋,開発
```

**処理内容**:

- `availability` = `なし` AND `priority` = `低` または `中` の行を削除
- 削除された行: T002, T006, T008（3 行）
- 残った行: T001, T005（2 行）+ ヘッダー

### サンプル 6: 連番列の追加

**入力ファイル** (`input-products-no-id.csv`):

```csv
商品名,価格,在庫
ノートパソコン,89800,15
マウス,2500,50
キーボード,5800,30
```

**設定ファイル** (`config-sequence.json`):

```json
{
  "headerMappings": {
    "商品名": "product_name",
    "価格": "price",
    "在庫": "stock"
  },
  "sequenceColumns": [
    {
      "column": "id",
      "start": 1,
      "step": 1
    },
    {
      "column": "display_order",
      "start": 10,
      "step": 10
    }
  ],
  "columnOrder": ["id", "product_name", "price", "stock", "display_order"]
}
```

**実行コマンド**:

```bash
npm run dev -- -i input-products-no-id.csv -o output-products-with-id.csv -c config-sequence.json
```

**出力結果**:

```csv
id,product_name,price,stock,display_order
1,ノートパソコン,89800,15,10
2,マウス,2500,50,20
3,キーボード,5800,30,30
```

**処理内容**:

1. **ヘッダーマッピング**: 日本語ヘッダーを英語に変換
2. **連番列追加**: `id` 列（1から開始、1ずつ増加）と `display_order` 列（10から開始、10ずつ増加）を追加
3. **列並び替え**: 指定された順序で列を配置

**用途**:

- データベースに登録する前に一意のIDを付与
- 表示順序を管理するための連番を追加
- 既存データに行番号を追加

### サンプル 7: エンコーディング変換

**入力ファイル** (`input-japanese.csv`):

```csv
名前,年齢,都市
太郎,25,東京
花子,30,大阪
次郎,35,名古屋
```

**設定ファイル** (`config-encoding.json`):

```json
{
  "headerMappings": {
    "名前": "氏名",
    "年齢": "age",
    "都市": "city"
  },
  "columnOrder": ["氏名", "age", "city"],
  "outputEncoding": "shift_jis"
}
```

**実行コマンド**:

```bash
npm run dev -- -i input-japanese.csv -o output-japanese-sjis.csv -c config-encoding.json
```

**処理内容**:

1. **ヘッダーマッピング**: 日本語ヘッダーを変換
2. **列並び替え**: 指定された順序で列を配置
3. **エンコーディング変換**: 出力ファイルを Shift_JIS に変換

**用途**:

- Windows の Excel で日本語を含む CSV を正しく開くために Shift_JIS を使用
- レガシーシステムとの互換性のために特定のエンコーディングが必要な場合
- 異なる環境間でのデータ交換

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
- **削除エラー**: 削除条件で指定された列が存在しない、無効な削除条件
- **エンコーディングエラー**: サポートされていないエンコーディング、変換失敗

エラーメッセージには詳細なコンテキスト（行番号、列名など）が含まれ、問題の特定とトラブルシューティングを支援します。

### 削除機能のエラー例

```
ERROR: 削除条件で指定された列 'status' が入力CSVに見つかりません
ERROR: 削除条件の値が無効です: 文字列または文字列の配列である必要があります
INFO: 削除処理完了: 3行を削除しました
```

### エンコーディング機能のエラー例

```
ERROR: サポートされていないエンコーディング 'invalid-encoding' が指定されました
ERROR: ファイル 'output.csv' のエンコーディング変換中にエラーが発生しました
INFO: 出力ファイルを shift_jis にエンコードしました
```

## ライセンス

MIT ライセンス

## 貢献

プルリクエストやイシューの報告を歓迎します。開発に参加する前に、テストが通ることを確認してください。
