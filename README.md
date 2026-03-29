# foldpak

A tiny CLI to package a folder into a zip archive with simple include, exclude, and `.gitignore` support.

## Install

```bash
npm install -g foldpak
```

Or run directly with `npx`:

```bash
npx foldpak .
```

## Usage

```bash
foldpak [source]
```

### Options

- `-o, --output <file>` — Output zip file path
- `--no-gitignore` — Don't use .gitignore rules (by default, .gitignore is respected)
- `-i, --include <glob>` — Include files matching glob (can be repeated)
- `-e, --exclude <glob>` — Exclude files matching glob (can be repeated)
- `--verbose` — Show detailed output

### Examples

```bash
# Package current directory
foldpak .

# Package a specific directory
foldpak ./my-project

# Specify output file
foldpak . -o my-app.zip

# Ignore .gitignore rules
foldpak . --no-gitignore

# Include only specific files
foldpak . -i "src/**" -i "package.json"

# Exclude specific files (in addition to .gitignore)
foldpak . -e "dist/**" -e "node_modules/**"

# Combine options
foldpak . --include "dist/**" --exclude "**/*.map"
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

We are committed to making `foldpak` the most intuitive and versatile packaging tool for developers. Here are the features we are planning for future releases:

### Archive Format Support
- **Tar & Tar.GZ** — Support for `.tar` and `.tar.gz` archives for Unix-friendly workflows
- **7-Zip** — Support for `.7z` format with higher compression ratios
- **Tar.ZST** — Support for Zstandard-compressed tarballs for modern compression speeds

### Enhanced Functionality
- **Nested `.gitignore` Support** — Respect `.gitignore` files recursively throughout the project tree
- **Custom Ignore Files** — Support for `.foldpakignore` or arbitrary ignore file patterns
- **Config File Support** — Per-project configuration via `.foldpakrc` or `foldpak.config.js`
- **Watch Mode** — Auto-repackage on file changes during development

### Developer Experience
- **Dry Run Mode** — Preview what would be packaged without creating the archive
- **List Contents** — View archive contents without extracting
- **Strip Root Option** — Option to include/exclude the root directory in the archive
- **Progress Indicators** — Visual feedback for large directories

### Distribution & Integration
- **Prebuilt Binaries** — Standalone executables for major platforms (no Node.js required)
- **GitHub Action** — Official action for CI/CD workflows
- **Checksum Generation** — Automatic SHA256 checksums for integrity verification

Have a suggestion? [Open an issue](https://github.com/athif23/foldpak/issues) — we'd love to hear from you!
