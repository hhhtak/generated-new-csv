#!/bin/bash

# CSV Converter Sample Validation Script
# このスクリプトはサンプルファイルが正しく動作することを検証します

echo "=== CSV Converter Sample Validation ==="
echo ""

# ビルドが必要かチェック
if [ ! -f "dist/cli.js" ]; then
    echo "Building the project..."
    npm run build
    echo ""
fi

PASSED=0
FAILED=0

# テスト関数
run_test() {
    local test_name="$1"
    local input_file="$2"
    local config_file="$3"
    local expected_file="$4"
    local output_file="samples/test-output-$(basename "$expected_file")"
    
    echo "Testing: $test_name"
    
    # 変換を実行
    if [ -n "$config_file" ]; then
        node dist/cli.js -i "$input_file" -o "$output_file" -c "$config_file" > /dev/null 2>&1
    else
        node dist/cli.js -i "$input_file" -o "$output_file" > /dev/null 2>&1
    fi
    
    if [ $? -ne 0 ]; then
        echo "❌ FAILED: Conversion failed"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # 出力ファイルが存在するかチェック
    if [ ! -f "$output_file" ]; then
        echo "❌ FAILED: Output file not created"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # 期待される結果と比較（ヘッダー行のみ）
    expected_header=$(head -n 1 "$expected_file")
    actual_header=$(head -n 1 "$output_file")
    
    if [ "$expected_header" != "$actual_header" ]; then
        echo "❌ FAILED: Header mismatch"
        echo "  Expected: $expected_header"
        echo "  Actual:   $actual_header"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    # 行数をチェック
    expected_lines=$(wc -l < "$expected_file")
    actual_lines=$(wc -l < "$output_file")
    
    if [ "$expected_lines" -ne "$actual_lines" ]; then
        echo "❌ FAILED: Line count mismatch"
        echo "  Expected: $expected_lines lines"
        echo "  Actual:   $actual_lines lines"
        FAILED=$((FAILED + 1))
        return 1
    fi
    
    echo "✅ PASSED"
    PASSED=$((PASSED + 1))
    
    # テスト用出力ファイルを削除
    rm -f "$output_file"
    return 0
}

# テストケース実行
run_test "Employee data with complete config" \
    "samples/input-employees.csv" \
    "samples/config-complete.json" \
    "samples/output-employees-expected.csv"

run_test "Product data with simple config" \
    "samples/input-products.csv" \
    "samples/config-simple.json" \
    "samples/output-products-expected.csv"

run_test "Task data with value replacement" \
    "samples/input-tasks.csv" \
    "samples/config-value-replacement.json" \
    "samples/output-tasks-expected.csv"

echo ""
echo "=== Validation Results ==="
echo "✅ Passed: $PASSED"
echo "❌ Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 All sample validations passed!"
    exit 0
else
    echo ""
    echo "⚠️  Some validations failed. Please check the implementation."
    exit 1
fi