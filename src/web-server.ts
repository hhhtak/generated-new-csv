import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { CSVConverterApp } from "./CSVConverterApp";

const app = express();
const port = process.env.PORT || 3000;

// ミドルウェアの設定
app.use(express.json());
app.use(express.static("public"));

// ファイルアップロード用の設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// メインページ
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CSV Converter</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .form-group { margin-bottom: 20px; }
            label { display: block; margin-bottom: 5px; font-weight: bold; }
            input[type="file"], textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
            button:hover { background-color: #0056b3; }
            .result { margin-top: 20px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
            .error { background-color: #f8d7da; color: #721c24; }
            .success { background-color: #d4edda; color: #155724; }
        </style>
    </head>
    <body>
        <h1>CSV Converter</h1>
        <p>CSVファイルをアップロードして変換設定を適用できます。</p>
        
        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="csvFile">CSVファイル:</label>
                <input type="file" id="csvFile" name="csvFile" accept=".csv" required>
            </div>
            
            <div class="form-group">
                <label for="configJson">設定JSON（オプション）:</label>
                <textarea id="configJson" name="configJson" rows="10" placeholder='{
  "headerMappings": {
    "元の列名": "新しい列名"
  },
  "columnOrder": ["列1", "列2", "列3"],
  "valueReplacements": {
    "列名": {
      "元の値": "新しい値"
    }
  }
}'></textarea>
            </div>
            
            <button type="submit">変換実行</button>
        </form>
        
        <div id="result"></div>
        
        <script>
            document.getElementById('uploadForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData();
                const csvFile = document.getElementById('csvFile').files[0];
                const configJson = document.getElementById('configJson').value;
                
                if (!csvFile) {
                    showResult('CSVファイルを選択してください。', 'error');
                    return;
                }
                
                formData.append('csvFile', csvFile);
                if (configJson.trim()) {
                    formData.append('configJson', configJson);
                }
                
                try {
                    const response = await fetch('/convert', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showResult(\`変換が完了しました。ダウンロード: <a href="\${result.downloadUrl}" download>変換されたCSVファイル</a>\`, 'success');
                    } else {
                        showResult(\`エラー: \${result.error}\`, 'error');
                    }
                } catch (error) {
                    showResult(\`エラー: \${error.message}\`, 'error');
                }
            });
            
            function showResult(message, type) {
                const resultDiv = document.getElementById('result');
                resultDiv.innerHTML = message;
                resultDiv.className = 'result ' + type;
            }
        </script>
    </body>
    </html>
  `);
});

// CSV変換エンドポイント
app.post("/convert", upload.single("csvFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.json({
        success: false,
        error: "CSVファイルがアップロードされていません",
      });
    }

    const inputFile = req.file.path;
    const outputFile = `outputs/converted-${Date.now()}.csv`;
    const configFile = req.body.configJson
      ? `configs/config-${Date.now()}.json`
      : undefined;

    // 出力ディレクトリを作成
    if (!fs.existsSync("outputs")) {
      fs.mkdirSync("outputs", { recursive: true });
    }

    // 設定ファイルを保存（提供された場合）
    if (configFile) {
      if (!fs.existsSync("configs")) {
        fs.mkdirSync("configs", { recursive: true });
      }
      fs.writeFileSync(configFile, req.body.configJson);
    }

    // CSV変換を実行
    const converter = new CSVConverterApp();
    await converter.execute(inputFile, outputFile, configFile);

    // 一時ファイルを削除
    fs.unlinkSync(inputFile);
    if (configFile) {
      fs.unlinkSync(configFile);
    }

    res.json({
      success: true,
      downloadUrl: `/download/${path.basename(outputFile)}`,
    });
  } catch (error) {
    console.error("変換エラー:", error);
    res.json({
      success: false,
      error:
        error instanceof Error ? error.message : "不明なエラーが発生しました",
    });
  }
});

// ファイルダウンロードエンドポイント
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join("outputs", filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) {
        console.error("ダウンロードエラー:", err);
        res.status(500).send("ファイルのダウンロードに失敗しました");
      } else {
        // ダウンロード後にファイルを削除
        setTimeout(() => {
          fs.unlinkSync(filePath);
        }, 1000);
      }
    });
  } else {
    res.status(404).send("ファイルが見つかりません");
  }
});

app.listen(port, () => {
  console.log(`CSV Converter Web Server running on port ${port}`);
});






