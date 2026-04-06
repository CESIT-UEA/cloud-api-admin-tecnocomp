const multer = require("multer");
const crypto = require('crypto')
const path = require("path");
const fs = require('fs')

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // cria a pasta com um nome único
    req.pastaId = crypto.randomUUID();

    const basePath = path.resolve(process.env.FILE_PATH);

    // caminho da pasta
    const uploadPath = path.join(basePath, req.pastaId)

    // cria a pasta se não existir
    fs.mkdirSync(uploadPath, { recursive: true });

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    const nomeArquivo = crypto.randomUUID();

    cb(null, `${nomeArquivo}${extensao}`);
  },
})


const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype !== "application/pdf" || ext !== ".pdf"){
      return cb(new Error("Apenas arquivos PDF são permitidos"));
    }

    cb(null, true)
  }
})


module.exports = upload