import {build} from 'esbuild';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const frontendDirectory = path.resolve(scriptDirectory, '..');
const repositoryDirectory = path.resolve(frontendDirectory, '..');
const sourcePath = path.join(frontendDirectory, 'src', 'modern-graphics.js');
const outputPath = path.join(repositoryDirectory, 'public', 'js', 'modern', 'purett-modern-graphics.min.js');
const threePackagePath = path.join(frontendDirectory, 'node_modules', 'three', 'package.json');
const checkOnly = process.argv.includes('--check');

const threePackage = JSON.parse(await readFile(threePackagePath, 'utf8'));
const result = await build({
  entryPoints: [sourcePath],
  bundle: true,
  format: 'iife',
  platform: 'browser',
  target: ['es2020'],
  minify: true,
  sourcemap: false,
  legalComments: 'inline',
  write: false,
  banner: {
    js: `/*! Purett modern graphics | Three.js ${threePackage.version} | MIT License */`
  },
  define: {
    __PURETT_THREE_PACKAGE_VERSION__: JSON.stringify(threePackage.version)
  }
});

const normalizedOutput = result.outputFiles[0].text
  .replace(/[ \t]+$/gm, '')
  .replace(/^ +(?=\t)/gm, '');
const output = Buffer.from(normalizedOutput);

if (checkOnly) {
  let committed;
  try {
    committed = await readFile(outputPath);
  } catch (error) {
    throw new Error(`Modern graphics bundle is missing. Run "npm run build:graphics". (${error.message})`);
  }

  if (!committed.equals(output)) {
    throw new Error('Modern graphics bundle is stale. Run "npm run build:graphics".');
  }

  console.log(`Modern graphics bundle is current (Three.js ${threePackage.version}, ${output.length} bytes).`);
} else {
  await mkdir(path.dirname(outputPath), {recursive: true});
  await writeFile(outputPath, output);
  console.log(`Built ${path.relative(repositoryDirectory, outputPath)} with Three.js ${threePackage.version} (${output.length} bytes).`);
}
