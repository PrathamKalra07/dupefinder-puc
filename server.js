const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/api/upload-chunk", upload.single("chunk"), (req, res) => {
  const { fileName, chunkIndex } = req.body;
  const tempDir = path.join(__dirname, "uploads", fileName + "_chunks");

  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const chunkPath = path.join(tempDir, `chunk_${chunkIndex}`);
  fs.renameSync(req.file.path, chunkPath);

  res.json({ message: `Chunk ${chunkIndex} stored` });
});

app.post("/api/merge-chunks", express.json(), (req, res) => {
  const { fileName, totalChunks } = req.body;
  const tempDir = path.join(__dirname, "uploads", fileName + "_chunks");
  const finalPath = path.join(__dirname, "uploads", fileName);

  const writeStream = fs.createWriteStream(finalPath);

  for (let i = 0; i < totalChunks; i++) {
    const chunkFile = path.join(tempDir, `chunk_${i}`);
    if (!fs.existsSync(chunkFile)) {
      return res.status(400).json({ error: `Missing chunk ${i}` });
    }
    writeStream.write(fs.readFileSync(chunkFile));
    fs.unlinkSync(chunkFile);
  }

  writeStream.end();
  fs.rmdirSync(tempDir);

  res.json({ message: `File assembled at ${finalPath}` });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
