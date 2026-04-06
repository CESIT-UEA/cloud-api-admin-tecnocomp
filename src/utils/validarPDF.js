const fs = require('fs');

function validarPDF(filePath) {
  const fd = fs.openSync(filePath, "r");
  const buffer = Buffer.alloc(4);

  fs.readSync(fd, buffer, 0, 4, 0);
  fs.closeSync(fd);

  return buffer.toString() === "%PDF";
}

module.exports = {
    validarPDF
}