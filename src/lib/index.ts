// TODO: figure out 'android:pathData' vs. 'pathData' stuff
// TODO: create plugin that removes useless clip-paths?
// TODO: a 'useless clip-paths' plugin would have to run before the 'empty groups' plugin
// TODO: filter out xml files that don't contain a <vector> or <animated-vector> file?

import * as cli from 'commander';

import { optimizeSvg } from './svgo';

import fs = require('fs');
import path = require('path');
const promisify = require('util.promisify');

const readFileFn: ((
  path: string,
  options: string,
) => Promise<string>) = promisify(fs.readFile);
const readDirFn: (path: string) => Promise<string[]> = promisify(fs.readdir);
const writeFileFn: (
  path: string,
  data: any,
  options?: string,
) => Promise<void> = promisify(fs.writeFile);

export async function run() {
  const pkgJson: {
    name: string;
    version: string;
    engines: { node: string };
  } = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, '..', '..') + '/package.json',
      'utf8',
    ),
  );

  cli
    .version(pkgJson.version)
    .arguments('[file]')
    .option('-s, --string <string>', 'input SVG string')
    .option('-i, --input <file>', 'input file/directory, or "-" for STDIN')
    .option(
      '-o, --output <file>',
      'output file/directory (an XML file w/ the same name as the input file by default), or "-" for STDOUT',
    )
    .option('-d, --dir <dir>', 'convert all *.svg files in a directory')
    .option('-q, --quiet', 'only output error messages')
    // TODO: add precision option
    // .option(
    //   '-p, --precision <number>',
    //   'number of significant digits to use for decimals',
    // )
    .parse(process.argv);

  const input: string[] = cli.input ? [cli.input] : cli.args;
  let output: string[] = cli.output ? [cli.output] : undefined;

  if (
    (input.length === 0 || input[0] === '-') &&
    !cli.string &&
    !cli.dir &&
    process.stdin.isTTY === true
  ) {
    cli.help();
    return;
  }

  if (
    typeof process === 'object' &&
    process.versions &&
    process.versions.node &&
    pkgJson.engines.node
  ) {
    const nodeVersion = String(pkgJson.engines.node).match(/\d*(\.\d+)*/)[0];
    if (parseFloat(process.versions.node) < parseFloat(nodeVersion)) {
      await printErrorAndExit(
        `${pkgJson.name} requires Node.js version ${nodeVersion} or higher.`,
      );
      return;
    }
  }

  if (output) {
    if (input && input[0] !== '-') {
      if (output.length === 1 && checkIsDir(output[0])) {
        const dir = output[0];
        for (let i = 0; i < input.length; i++) {
          output[i] = checkIsDir(input[i])
            ? input[i]
            : path.resolve(dir, path.basename(input[i]));
        }
      } else if (output.length < input.length) {
        output = output.concat(input.slice(output.length));
      }
    }
  } else if (input) {
    output = input;
  } else if (cli.string) {
    output = ['-'];
  }

  if (cli.dir) {
    const outputDir: string = (output && output[0]) || cli.dir;
    await optimizeDirectory({ quiet: cli.quiet }, cli.dir, outputDir).then(
      () => {},
      printErrorAndExit,
    );
    return;
  }

  if (input) {
    if (input[0] === '-') {
      await new Promise<void>((resolve, reject) => {
        const file = output[0];
        let data = '';
        process.stdin.on('data', chunk => (data += chunk)).once('end', () => {
          processData({ quiet: cli.quiet }, data, file).then(resolve, reject);
        });
      });
    } else {
      await Promise.all(
        input
          .filter(name => /\.svg$/.test(name))
          .map((file, n) =>
            optimizeFile(
              { quiet: cli.quiet },
              file,
              svgToXmlFileName(output[n]),
            ),
          ),
      ).then(() => {}, printErrorAndExit);
    }
    return;
  }

  if (cli.string) {
    const data = cli.string;
    await processData({ quiet: cli.quiet }, data, output[0]);
    return;
  }
}

// TODO: fix implicit any error
function optimizeDirectory(
  config: { quiet: boolean },
  dir: string,
  output: string,
): any {
  if (!config.quiet) {
    console.log(`Processing directory '${dir}':\n`);
  }
  return readDirFn(dir).then(files => {
    // Take only *.svg files.
    const svgFiles = files.filter(name => /\.svg$/.test(name));
    return svgFiles.length
      ? Promise.all(
          svgFiles.map(name =>
            optimizeFile(
              config,
              path.resolve(dir, name),
              path.resolve(output, svgToXmlFileName(name)),
            ),
          ),
        )
      : Promise.reject(
          new Error(`No SVG files were found in directory: '${dir}'`),
        );
  });
}

function svgToXmlFileName(name: string) {
  if (name.endsWith('.svg')) {
    name = name.slice(0, name.length - '.svg'.length);
  }
  return name.toLowerCase().replace(/[^a-z0-9]/gi, '_') + '.xml';
}

// TODO: fix implicit any error
function optimizeFile(
  config: { quiet: boolean },
  file: string,
  output: string,
) {
  return readFileFn(file, 'utf8').then(
    data => processData(config, data, output, file),
    error => {
      if (error.code === 'EISDIR') {
        return optimizeDirectory(config, file, output);
      }
      return checkOptimizeFileError(error);
    },
  );
}

function processData(
  config: { quiet: boolean },
  data: string,
  output: string,
  input?: string,
) {
  return optimizeSvg(data).then(result => {
    return writeOutput(input, output, result).then(
      () => {
        if (!config.quiet && output !== '-') {
          if (input) {
            console.log(`${input} -> ${output}`);
          }
        }
      },
      error =>
        Promise.reject(
          new Error(
            error.code === 'ENOTDIR'
              ? `Output '${output}' is not a directory.`
              : error,
          ),
        ),
    );
  });
}

function writeOutput(input: string, output: string, data: string) {
  if (output === '-') {
    console.log(data);
    return Promise.resolve();
  }
  return writeFileFn(output, data, 'utf8').catch(error =>
    checkWriteFileError(input, output, data, error),
  );
}

function checkOptimizeFileError(error: { code: string; path: string }) {
  if (error.code === 'ENOENT') {
    return Promise.reject(
      new Error(`No such file or directory '${error.path}'.`),
    );
  }
  return Promise.reject(error);
}

function checkWriteFileError(
  input: string,
  output: string,
  data: string,
  error: { code: string },
) {
  if (error.code === 'EISDIR' && input) {
    return writeFileFn(
      path.resolve(output, path.basename(input)),
      data,
      'utf8',
    );
  } else {
    return Promise.reject(error);
  }
}

/**
 * Synchronously check if path is a directory. Tolerant to errors like ENOENT.
 */
function checkIsDir(filePath: string) {
  try {
    return fs.lstatSync(filePath).isDirectory();
  } catch (e) {
    return false;
  }
}

function printErrorAndExit(error: any) {
  console.error(error);
  process.exit(1);
  return Promise.reject(error); // for tests
}
