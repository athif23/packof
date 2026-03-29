#!/usr/bin/env node

import { cac, CAC } from "cac";
import { foldpak } from "./foldpak.js";

const cli: CAC = cac("foldpak");

cli
  .option("-o, --output <file>", "Output zip file path")
  .option("--no-gitignore", "Ignore .gitignore rules")
  .option("--ignore-file <file>", "Load ignore patterns from file (can be repeated)")
  .option("-i, --include <glob>", "Include files matching glob (can be repeated)")
  .option("-e, --exclude <glob>", "Exclude files matching glob (can be repeated)")
  .option("--verbose", "Show detailed output");

cli.command("[source]", "Directory to package (default: .)").action((source) => {
  const options = cli.options;
  
  const resolvedSource = source ?? ".";
  
  const include = Array.isArray(options.include) 
    ? options.include as string[] 
    : options.include 
      ? [options.include] 
      : [];
      
  const exclude = Array.isArray(options.exclude) 
    ? options.exclude as string[] 
    : options.exclude 
      ? [options.exclude] 
      : [];

  const ignoreFiles = Array.isArray(options.ignoreFile)
    ? options.ignoreFile as string[]
    : options.ignoreFile
      ? [options.ignoreFile]
      : [];

  foldpak({
    source: resolvedSource,
    output: options.output as string | undefined,
    gitignore: options.gitignore as boolean ?? true,
    ignoreFiles,
    include,
    exclude,
    verbose: options.verbose as boolean ?? false,
  })
    .then((result) => {
      console.log(`Created ${result.outputPath} (${result.fileCount} files)`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(`Error: ${err.message}`);
      process.exit(1);
    });
});

cli.help();

cli.parse();
