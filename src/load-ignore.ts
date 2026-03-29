import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import ignore from "ignore";

export function loadIgnoreFile(filePath: string): ignore.Ignore | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const ig = ignore();
    ig.add(content);
    return ig;
  } catch {
    // File doesn't exist or can't be read
    return null;
  }
}

export function loadGitignore(sourceDir: string): ignore.Ignore | null {
  return loadIgnoreFile(join(sourceDir, ".gitignore"));
}

export function loadCustomIgnoreFiles(
  sourceDir: string,
  ignoreFiles: string[],
): ignore.Ignore | null {
  if (ignoreFiles.length === 0) {
    return null;
  }

  const ig = ignore();
  let loadedAny = false;

  for (const file of ignoreFiles) {
    const filePath = resolve(sourceDir, file);
    const result = loadIgnoreFile(filePath);
    if (result) {
      ig.add(result);
      loadedAny = true;
    }
  }

  return loadedAny ? ig : null;
}
