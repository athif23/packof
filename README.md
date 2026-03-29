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

## Roadmap

We are committed to making `packof` the most intuitive and versatile packaging tool for developers. Here are the features we are planning for future releases:

### Archive Format Support
- **Tar & Tar.GZ** — Support for `.tar` and `.tar.gz` archives for Unix-friendly workflows
- **7-Zip** — Support for `.7z` format with higher compression ratios
- **Tar.ZST** — Support for Zstandard-compressed tarballs for modern compression speeds

### Enhanced Functionality
- **Nested `.gitignore` Support** — Respect `.gitignore` files recursively throughout the project tree
- **Custom Ignore Files** — Support for `.packofignore` or arbitrary ignore file patterns
- **Config File Support** — Per-project configuration via `.packofrc` or `packof.config.js`
- **Watch Mode** — Auto-repackage on file changes during development

### Developer Experience
- **Dry Run Mode** — Preview what would be packaged without creating the archive
- **List Contents** — View archive contents without extracting
- **Strip Root Option** — Option to include/exclude the root directory in the archive
- **Progress Indicators** — Visual feedback for large directories

Have a suggestion? [Open an issue](https://github.com/athif23/packof/issues) — we'd love to hear from you!
