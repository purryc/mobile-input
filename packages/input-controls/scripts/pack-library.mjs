import {execFileSync} from 'node:child_process';
import {cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {dirname, extname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const sourceDirectory = fileURLToPath(new URL('..', import.meta.url));

function filesUnder(directory) {
  return readdirSync(directory, {withFileTypes: true}).flatMap(entry => {
    const target = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(target) : [target];
  });
}

function resolveEsmImports(file, ts) {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ESNext, true);
  const edits = [];
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) specifier = node.moduleSpecifier;
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      specifier = node.arguments[0];
    } else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
      specifier = node.argument.literal;
    }

    if (specifier && ts.isStringLiteral(specifier) && /^\.\.?\//.test(specifier.text)) {
      const relative = specifier.text;
      const explicit = extname(relative) ? relative
        : existsSync(resolve(dirname(file), relative + '.js')) ? relative + '.js'
        : relative + '/index.js';
      if (!existsSync(resolve(dirname(file), explicit))) {
        throw Error('Unresolved packaged module ' + relative + ' in ' + file);
      }
      if (relative !== explicit) edits.push({start: specifier.getStart(source), end: specifier.end, explicit});
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  let output = text;
  for (const {start, end, explicit} of edits.reverse()) {
    output = output.slice(0, start + 1) + explicit + output.slice(end - 1);
  }
  if (output !== text) writeFileSync(file, output);
}

export function packLibrary({
  destination = join(sourceDirectory, 'public/generated/input-controls'),
  toolingDirectory = sourceDirectory,
} = {}) {
  const source = JSON.parse(readFileSync(join(sourceDirectory, 'package.json'), 'utf8'));
  // Stage under the tooling installation so TypeScript can resolve the host's peer types.
  const dependencies = join(toolingDirectory, 'node_modules');
  if (!existsSync(dependencies)) throw Error('Run npm ci in ' + toolingDirectory + ' before packing.');
  const ts = createRequire(join(toolingDirectory, 'package.json'))('typescript');
  const stage = mkdtempSync(join(dependencies, '.input-controls-pack-'));
  try {
    const src = join(stage, 'src');
    cpSync(join(sourceDirectory, 'src'), src, {recursive: true});
    const entries = filesUnder(src).filter(name => /\.tsx?$/.test(name));
    const compiled = join(stage, 'dist');
    execFileSync(process.execPath, [
      join(toolingDirectory, 'node_modules/typescript/bin/tsc'),
      '--target', 'ES2022', '--module', 'ESNext', '--moduleResolution', 'Bundler',
      '--jsx', 'react-jsx', '--strict', '--skipLibCheck', '--declaration',
      '--rootDir', src, '--outDir', compiled,
      ...entries,
    ], {stdio: 'inherit'});

    // Our public source uses bundler-style imports. Add explicit extensions to the
    // emitted modules so the packaged ESM also resolves in Node.
    for (const file of filesUnder(compiled)) resolveEsmImports(file, ts);

    const exports = Object.fromEntries(Object.entries(source.exports).map(([key, target]) => {
      if (target.endsWith('.css')) return [key, target];
      const module = target.replace('./src/', './dist/').replace(/\.tsx?$/, '');
      return [key, {types: module + '.d.ts', import: module + '.js', default: module + '.js'}];
    }));
    const manifest = {
      name: source.name,
      version: source.version,
      description: '13 Xiaoyi Work React input controls, chips and desktop styles',
      private: true,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports,
      sideEffects: ['**/*.css'],
      peerDependencies: source.peerDependencies,
      bin: {'input-controls-assets': './scripts/copy-assets.mjs'},
      files: ['dist', 'src', 'public', 'scripts/copy-assets.mjs', 'DESIGN-SOURCES.md', 'examples'],
    };
    writeFileSync(join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
    for (const name of ['README.md', 'DESIGN-SOURCES.md', 'scripts/copy-assets.mjs',
      'public/assets', 'public/reference-assets', 'public/ASSET-SOURCES.md']) {
      mkdirSync(dirname(join(stage, name)), {recursive: true});
      cpSync(join(sourceDirectory, name), join(stage, name), {recursive: true});
    }

    mkdirSync(join(stage, 'examples'), {recursive: true});
    cpSync(join(sourceDirectory, 'example/react-integration.tsx'), join(stage, 'examples/react-integration.tsx'));
    cpSync(join(sourceDirectory, 'example/integration'), join(stage, 'examples/widgets'), {recursive: true});

    mkdirSync(destination, {recursive: true});
    const args = ['pack', '--ignore-scripts', '--json', '--pack-destination', destination];
    const result = /npm-cli\.js$/.test(process.env.npm_execpath ?? '')
      ? execFileSync(process.execPath, [process.env.npm_execpath, ...args], {cwd: stage, encoding: 'utf8'})
      : execFileSync('npm', args, {cwd: stage, encoding: 'utf8'});
    const [{filename}] = JSON.parse(result);
    const tarball = join(destination, filename);
    console.log('Packed ' + tarball);
    return tarball;
  } finally {
    rmSync(stage, {recursive: true, force: true});
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  packLibrary(process.argv[2] ? {destination: resolve(process.argv[2])} : {});
}
