#!/bin/bash

# CSV Converter Demo Script
# このスクリプトは CSV Converter の機能をデモンストレーションします

echo "=== CSV Converter Demo ==="
echo ""

# ビルドが必要かチェック
if [ ! -f "dist/cli.js" ]; then
    echo "Building the project..."
    npm run build
    echo ""
fi

echo "Demo 1: 従業員データの完全変換"
echo "入力: samples/input-employees.csv"
echo "設定: samples/config-complete.json"
echo "出力: samples/output-employees-demo.csv"
echo ""

node dist/cli.js -i samples/input-employees.csv -o samples/output-employees-demo.csv -c samples/config-complete.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -3 samples/output-employees-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 2: 商品データのシンプル変換"
echo "入力: samples/input-products.csv"
echo "設定: samples/config-simple.json"
echo "出力: samples/output-products-demo.csv"
echo ""

node dist/cli.js -i samples/input-products.csv -o samples/output-products-demo.csv -c samples/config-simple.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -3 samples/output-products-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 3: タスクデータの値置換"
echo "入力: samples/input-tasks.csv"
echo "設定: samples/config-value-replacement.json"
echo "出力: samples/output-tasks-demo.csv"
echo ""

node dist/cli.js -i samples/input-tasks.csv -o samples/output-tasks-demo.csv -c samples/config-value-replacement.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -3 samples/output-tasks-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 4: 削除機能付き従業員データ変換"
echo "入力: samples/input-employees-with-inactive.csv"
echo "設定: samples/config-with-deletion.json"
echo "出力: samples/output-employees-with-deletion-demo.csv"
echo ""

node dist/cli.js -i samples/input-employees-with-inactive.csv -o samples/output-employees-with-deletion-demo.csv -c samples/config-with-deletion.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -5 samples/output-employees-with-deletion-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 5: 削除機能のみ（複数条件）"
echo "入力: samples/input-tasks-mixed.csv"
echo "設定: samples/config-deletion-only.json"
echo "出力: samples/output-tasks-deletion-only-demo.csv"
echo ""

node dist/cli.js -i samples/input-tasks-mixed.csv -o samples/output-tasks-deletion-only-demo.csv -c samples/config-deletion-only.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -5 samples/output-tasks-deletion-only-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 6: 固定列追加"
echo "入力: samples/input-products.csv"
echo "設定: samples/config-fixed-columns.json"
echo "出力: samples/output-products-fixed-demo.csv"
echo ""

node dist/cli.js -i samples/input-products.csv -o samples/output-products-fixed-demo.csv -c samples/config-fixed-columns.json

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -3 samples/output-products-fixed-demo.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "Demo 7: 設定なしでの直接コピー"
echo "入力: samples/input-products.csv"
echo "設定: なし"
echo "出力: samples/output-products-copy.csv"
echo ""

node dist/cli.js -i samples/input-products.csv -o samples/output-products-copy.csv

if [ $? -eq 0 ]; then
    echo "✅ 変換成功！"
    echo "出力ファイルの内容:"
    head -3 samples/output-products-copy.csv
    echo ""
else
    echo "❌ 変換失敗"
    echo ""
fi

echo "=== Demo 完了 ==="
echo "生成されたファイルを確認してください:"
echo "- samples/output-employees-demo.csv"
echo "- samples/output-products-demo.csv"
echo "- samples/output-tasks-demo.csv"
echo "- samples/output-employees-with-deletion-demo.csv"
echo "- samples/output-tasks-deletion-only-demo.csv"
echo "- samples/output-products-fixed-demo.csv"
echo "- samples/output-products-copy.csv"