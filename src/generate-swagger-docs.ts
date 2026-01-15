import fs from 'fs/promises';
import path from 'path';

void (async function generateDocs(): Promise<void> {
  await fs.copyFile(
    path.join(__dirname, '..', 'swagger.json'),
    path.join(__dirname, '..', 'swagger', 'swagger.json')
  );
  await Promise.all(
    [
      'swagger-ui-bundle.js',
      'swagger-ui-standalone-preset.js',
      'swagger-ui.css',
      'favicon-16x16.png',
      'favicon-32x32.png',
    ].map(async file => fs.copyFile(
        path.join(path.dirname(require.resolve('swagger-ui-dist')), file),
        path.join(path.join(__dirname, '..', 'swagger'), file)
      ))
  );
})();
