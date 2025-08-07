import fs from 'fs';
import path from 'path';

function convertToCommonJs(filePath) {
  // update imports
  const content = fs.readFileSync(filePath, 'utf-8');
  const updatedContent = content.replace(/(require\(['"])(.*)(\.js)(['"]\))/g, '$1$2.cjs$4');
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  // update file extension
  const commonJsPath = filePath.replace(/\.js$/, '.cjs');
  fs.renameSync(filePath, commonJsPath);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js')) {
      convertToCommonJs(fullPath);
    }
  });
}

walk('./dist-cjs');
