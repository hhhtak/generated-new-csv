# サンプルファイル一覧

このディレクトリに含まれるすべてのファイルの詳細説明です。

## 設定ファイル（JSON）

### `config-complete.json`

- **目的**: すべての変換機能を実演
- **機能**: ヘッダーマッピング + 列並び替え + 値置換
- **対象**: `input-employees.csv`
- **特徴**: 日本語から英語への完全な変換

### `config-simple.json`

- **目的**: 基本的な変換機能を実演
- **機能**: ヘッダーマッピング + 列選択
- **対象**: `input-products.csv`
- **特徴**: シンプルな列マッピングと不要列の除外

### `config-value-replacement.json`

- **目的**: 値置換機能を実演
- **機能**: 値置換のみ
- **対象**: `input-tasks.csv`
- **特徴**: ヘッダーはそのまま、値のみ変換

## 入力 CSV ファイル

### `input-employees.csv`

- **内容**: 従業員データ（5 行）
- **ヘッダー**: 日本語（名前、年齢、性別、職業、給与、部署、入社日、ステータス）
- **特徴**: 複数の変換タイプが必要な複雑なデータ
- **用途**: 完全変換のテスト

### `input-products.csv`

- **内容**: 商品データ（5 行）
- **ヘッダー**: 日本語（商品名、価格、在庫、カテゴリ）
- **特徴**: シンプルな構造、一部列の除外が必要
- **用途**: 基本変換のテスト

### `input-tasks.csv`

- **内容**: タスクデータ（5 行）
- **ヘッダー**: 英語（task_id、title、availability、priority、assignee）
- **特徴**: 値置換に適した日本語値を含む
- **用途**: 値置換機能のテスト

## 期待される出力ファイル

### `output-employees-expected.csv`

- **元ファイル**: `input-employees.csv`
- **設定**: `config-complete.json`
- **変換内容**:
  - ヘッダー: 日本語 → 英語
  - 列順序: 論理的な順序に再配置
  - 値: 性別（男性 →M）、部署（開発部 →Development）、ステータス（有効 →active）

### `output-products-expected.csv`

- **元ファイル**: `input-products.csv`
- **設定**: `config-simple.json`
- **変換内容**:
  - ヘッダー: 商品名 →product_name、価格 →price、在庫 →stock
  - 列選択: カテゴリ列を除外

### `output-tasks-expected.csv`

- **元ファイル**: `input-tasks.csv`
- **設定**: `config-value-replacement.json`
- **変換内容**:
  - availability: あり →1、なし →0
  - priority: 高 →high、中 →medium、低 →low

## スクリプトファイル

### `demo.sh`

- **目的**: 全サンプルの実行デモ
- **機能**:
  - 自動ビルド
  - 4 つのデモケースを順次実行
  - 結果の表示
- **使用方法**: `./samples/demo.sh`

### `validate.sh`

- **目的**: サンプルの動作検証
- **機能**:
  - 各サンプルの変換実行
  - 期待される結果との比較
  - テスト結果の報告
- **使用方法**: `./samples/validate.sh`

## ドキュメントファイル

### `README.md`

- **内容**: サンプルディレクトリの概要と使用方法
- **対象**: 開発者、ユーザー
- **特徴**: 各サンプルの詳細説明

### `USAGE.md`

- **内容**: 実践的な使用ガイド
- **対象**: 実際にツールを使用するユーザー
- **特徴**: コマンド例、トラブルシューティング

### `FILES.md`（このファイル）

- **内容**: 全ファイルの詳細説明
- **対象**: 開発者、メンテナー
- **特徴**: ファイル構成の完全な理解

## ファイル関係図

```
samples/
├── 設定ファイル
│   ├── config-complete.json ──→ input-employees.csv
│   ├── config-simple.json ────→ input-products.csv
│   └── config-value-replacement.json ──→ input-tasks.csv
│
├── 入力ファイル
│   ├── input-employees.csv
│   ├── input-products.csv
│   └── input-tasks.csv
│
├── 期待される出力
│   ├── output-employees-expected.csv
│   ├── output-products-expected.csv
│   └── output-tasks-expected.csv
│
├── 実行スクリプト
│   ├── demo.sh ──→ 全サンプル実行
│   └── validate.sh ──→ 動作検証
│
└── ドキュメント
    ├── README.md ──→ 概要
    ├── USAGE.md ──→ 使用方法
    └── FILES.md ──→ ファイル説明
```

## 使用シナリオ

### 1. 初回ユーザー

1. `README.md` を読む
2. `demo.sh` を実行
3. 生成されたファイルを確認

### 2. 開発者

1. `validate.sh` でテスト
2. 新機能追加時は対応するサンプルを追加
3. `FILES.md` でファイル構成を理解

### 3. カスタマイズユーザー

1. `USAGE.md` で使用方法を学習
2. 既存の設定ファイルを参考に独自設定を作成
3. サンプル入力ファイルで動作確認
