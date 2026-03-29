# packof

A tiny CLI to package a folder into a zip archive with simple include, exclude, and `.gitignore` support.

## Install

```bash
npm install -g packof
```

Or run directly with `npx`:

```bash
npx packof .
```

## Usage

```bash
packof [source]
```

### Options

- `-o, --output <file>` — Output zip file path
- `--no-gitignore` — Don't use .gitignore rules (by default, .gitignore is respected)
- `--include <glob>` — Include files matching glob (can be repeated)
- `--exclude <glob>` — Exclude files matching glob (can be repeated)
- `--verbose` — Show detailed output

### Examples

```bash
# Package current directory
packof .

# Package a specific directory
packof ./my-project

# Specify output file
packof . -o my-app.zip

# Ignore .gitignore rules
packof . --no-gitignore

# Include only specific files
packof . --include "src/**" --include "package.json"

# Exclude specific files (in addition to .gitignore)
packof . --exclude "dist/**" --exclude "node_modules/**"

# Combine options
packof . --include "dist/**" --exclude "**/*.map"
```

## Rule Summary

- Files are archived relative to the source root
- `.gitignore` rules are applied by default (use `--no-gitignore` to disable)
- `--include` narrows the file set to matching files
- `--exclude` removes matching files (always wins last)

## Building

```bash
npm install
npm run build
```

The compiled CLI will be at `dist/cli.js`.

## Testing

```bash
npm test
```
