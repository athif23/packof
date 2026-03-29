import { statSync } from "node:fs";
import { basename, resolve } from "node:path";
import ignore from "ignore";
import { PackOptions, PackResult } from "./types.js";
import { loadGitignore, loadCustomIgnoreFiles } from "./load-ignore.js";
import { discoverFiles } from "./discover-files.js";
import { filterFiles } from "./filter-files.js";
import { writeZip } from "./write-zip.js";

export async function foldpak(options: PackOptions): Promise<PackResult> {
  const { source, output, gitignore, ignoreFiles, include, exclude, verbose } = options;

  // Resolve and validate source
  const absoluteSource = resolve(source);

  let stats: ReturnType<typeof statSync>;
  try {
    stats = statSync(absoluteSource);
  } catch {
    throw new Error(`Source path does not exist: ${source}`);
  }

  if (!stats.isDirectory()) {
    throw new Error(`Source path is not a directory: ${source}`);
  }

  // Determine output path
  const outputPath = output ?? `${basename(absoluteSource)}.zip`;

  if (verbose) {
    console.log(`Source: ${absoluteSource}`);
    console.log(`Output: ${resolve(outputPath)}`);
  }

  // Load ignore rules
  const ig = ignore();
  let loadedAnyIgnore = false;

  // Load .gitignore if requested
  if (gitignore) {
    const gitignoreIg = loadGitignore(absoluteSource);
    if (gitignoreIg) {
      ig.add(gitignoreIg);
      loadedAnyIgnore = true;
      if (verbose) {
        console.log("Using .gitignore rules");
      }
    }
  }

  // Load custom ignore files
  if (ignoreFiles.length > 0) {
    const customIg = loadCustomIgnoreFiles(absoluteSource, ignoreFiles);
    if (customIg) {
      ig.add(customIg);
      loadedAnyIgnore = true;
      if (verbose) {
        console.log(`Using custom ignore files: ${ignoreFiles.join(", ")}`);
      }
    }
  }

  if (verbose && include.length > 0) {
    console.log(`Include patterns: ${include.join(", ")}`);
  }

  if (verbose && exclude.length > 0) {
    console.log(`Exclude patterns: ${exclude.join(", ")}`);
  }

  // Discover all files
  if (verbose) {
    console.log("Discovering files...");
  }

  const allFiles = await discoverFiles(absoluteSource);

  if (verbose) {
    console.log(`Found ${allFiles.length} files`);
  }

  // Filter files
  const filteredFiles = await filterFiles(
    allFiles,
    absoluteSource,
    loadedAnyIgnore ? ig : null,
    include,
    exclude,
  );

  if (verbose) {
    console.log(`After filtering: ${filteredFiles.length} files`);
  }

  if (filteredFiles.length === 0) {
    throw new Error("No files matched the specified filters");
  }

  // Write zip
  if (verbose) {
    console.log("Creating archive...");
  }

  const fileCount = await writeZip(
    filteredFiles,
    absoluteSource,
    outputPath,
    verbose,
  );

  return {
    outputPath: resolve(outputPath),
    fileCount,
  };
}