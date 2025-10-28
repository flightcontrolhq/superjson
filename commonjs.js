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

function convertToCommonJsDeclaration(filePath) {
  // update imports
  const content = fs.readFileSync(filePath, 'utf-8');
  const updatedContent = content.replace(/(from ['"])(.*)(\.js)(['"];?)/g, '$1$2.cjs$4');
  fs.writeFileSync(filePath, updatedContent, 'utf-8');

  // update file extension
  const commonJsDeclPath = filePath.replace(/\.d\.ts$/, '.d.cts');
  fs.renameSync(filePath, commonJsDeclPath);
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (file.endsWith('.js')) {
      convertToCommonJs(fullPath);
    } else if (file.endsWith('.d.ts')) {
      convertToCommonJsDeclaration(fullPath);
    }
  });
}

walk('./dist-cjs');
