const fs = require('fs');
const path = require('path');

const saveFile = (filePath, data) => {
  fs.writeFileSync(path.resolve(filePath), data);
};

const deleteFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

module.exports = { saveFile, deleteFile };
