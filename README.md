# jaylen

[![Build status][travis-badge]][travis-badge-url]
[![Coverage status][coveralls-badge]][coveralls-badge-url]

`jaylen` is an SVG to `VectorDrawable` command line tool.

## Installation

You can install `jaylen` using [npm][npm] w/ the following command:

```sh
npm install -g jaylen
```

## Usage

```text
Usage: jaylen [options] [file]

Options:
  -V, --version          output the version number
  -s, --string <string>  input SVG string
  -i, --input <file>     input file/directory, or "-" for STDIN
  -o, --output <file>    output file/directory (an XML file w/ the same name as the input file by default), or "-" for STDOUT
  -d, --dir <dir>        convert all *.svg files in a directory
  -q, --quiet            only output error messages
  -h, --help             output usage information
```

### Examples

```sh
# Convert an SVG to VectorDrawable.
jaylen filename.svg

# Convert all files ending with '.svg' to VectorDrawable.
jaylen *.svg

# Convert an SVG to VectorDrawable and write the output to a new file.
jaylen filename.svg -o vector.xml

# Convert an SVG to VectorDrawable using standard input and standard output.
cat filename.svg | jaylen -i - -o - > vector.xml

# Convert all SVG files in a directory.
jaylen -d path/to/directory

# Convert all SVG files in a directory and write them to a new directory.
jaylen -d path/to/input/directory -o path/to/output/directory

# Convert all files ending with '.svg' and write them to a new directory.
jaylen *.svg -o path/to/output/directory

# Pass a string as input and write the output to a new file.
jaylen -s '<svg>...</svg>' -o vector.xml
```

## Build instructions

If you want to contribute, first be sure to install the latest version of
[`Node.js`](https://nodejs.org/) and [`npm`](https://www.npmjs.com/).
If you're not sure what IDE to use, I highly recommend checking out
[vscode][vscode].

Then clone this repository and in the root directory, run:

```sh
npm install
```

To build the tool, run:

```sh
npm run build
```

To test the tool, run:

```sh
npm run test
```

  [travis-badge]: https://travis-ci.org/alexjlockwood/jaylen.svg?branch=master
  [travis-badge-url]: https://travis-ci.org/alexjlockwood/jaylen
  [coveralls-badge]: https://coveralls.io/repos/github/alexjlockwood/jaylen/badge.svg?branch=master
  [coveralls-badge-url]: https://coveralls.io/github/alexjlockwood/jaylen?branch=master
  [npm-badge]: https://badge.fury.io/js/jaylen.svg
  [npm-badge-url]: https://www.npmjs.com/package/jaylen
  [vscode]: https://code.visualstudio.com/
  [npm]: https://www.npmjs.com/get-npm
