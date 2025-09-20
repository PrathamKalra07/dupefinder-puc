const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');


const app = express();
app.use(express.json());
// app.use(cors());
// app.options(/.*/, cors());
app.use(cors({
  origin: 'https://orgfarm-9135997210-dev-ed.develop.lightning.force.com', 
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true
}))
dotenv.config();
app.use(bodyParser.json());

const upload = multer({ dest: 'uploads/' });

const oauth2Client = new google.auth.OAuth2();
oauth2Client.setCredentials({
  access_token: process.env.GOOGLE_ACCESS_TOKEN,
});

const driveService = google.drive({ version: 'v3', auth : oauth2Client });

app.get('/api/upload',async (req,res)=>{
    res.sendFile(path.join(__dirname,'pages','uploadFile.html'));
})

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const fileMetadata = {
      name: req.file.originalname,
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const driveResponse = await driveService.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
      uploadType: 'resumable'
    });

    fs.unlinkSync(req.file.path);

    res.json({
      message: 'File uploaded successfully to Google Drive',
      file: driveResponse.data,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).send('Error uploading file');
  }
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Salesforce backup server listening on port ${PORT}`);
});
