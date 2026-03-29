import { statSync } from "node:fs";
import { basename, resolve } from "node:path";
import { PackOptions, PackResult } from "./types.js";
import { loadGitignore } from "./load-gitignore.js";
import { discoverFiles } from "./discover-files.js";
import { filterFiles } from "./filter-files.js";
import { writeZip } from "./write-zip.js";

export async function packof(options: PackOptions): Promise<PackResult> {
  const { source, output, gitignore, include, exclude, verbose } = options;

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

  // Load gitignore if requested
  const gitignoreIg = gitignore ? loadGitignore(absoluteSource) : null;

  if (verbose && gitignoreIg) {
    console.log("Using .gitignore rules");
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
    gitignoreIg,
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
