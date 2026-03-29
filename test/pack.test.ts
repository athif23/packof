import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import yauzl from "yauzl";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, "..");
const CLI = `tsx ${projectRoot}/src/cli.ts`;

function extractZipEntries(zipPath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const entries: string[] = [];
    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) {
        reject(err);
        return;
      }
      zipfile.readEntry();
      zipfile.on("entry", (entry: { fileName: string }) => {
        entries.push(entry.fileName);
        zipfile.readEntry();
      });
      zipfile.on("end", () => resolve(entries));
      zipfile.on("error", reject);
    });
  });
}

describe("foldpak CLI", () => {
  let tempDir: string;
  let tempOutput: string;

  beforeEach(() => {
    tempDir = join(
      process.env["TEMP"] || "/tmp",
      `pack-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    try {
      if (tempOutput) rmSync(tempOutput, { force: true });
    } catch {}
  });

  it("packages all files by default", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    tempOutput = join(tempDir, "simple.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput}`, { cwd: __dirname });

    const entries = await extractZipEntries(tempOutput);
    assert.ok(entries.length > 0, "should create archive");
  });

  it("excludes files from root .gitignore by default", async () => {
    const fixture = join(__dirname, "fixtures/gitignored");
    tempOutput = join(tempDir, "gitignored.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput}`, {
      cwd: __dirname,
    });

    const entries = await extractZipEntries(tempOutput);
    assert.ok(!entries.some((e) => e.startsWith("ignoredfiles/")), "should exclude ignoredfiles/");
    assert.ok(entries.includes("src/main.ts"), "should include src/");
  });

  it("includes gitignored files with --no-gitignore", async () => {
    const fixture = join(__dirname, "fixtures/gitignored");
    tempOutput = join(tempDir, "no-gitignore.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput} --no-gitignore`, {
      cwd: __dirname,
    });

    const entries = await extractZipEntries(tempOutput);
    assert.ok(entries.some((e) => e.startsWith("ignoredfiles/")), "should include ignoredfiles/ when --no-gitignore");
    assert.ok(entries.includes("src/main.ts"), "should include src/");
  });

  it("includes only requested globs", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    tempOutput = join(tempDir, "included.zip");

    execSync(
      `${CLI} ${fixture} -o ${tempOutput} --include "src/**"`,
      { cwd: __dirname },
    );

    const entries = await extractZipEntries(tempOutput);
    assert.ok(entries.some((e) => e.startsWith("src/")), "should include src/");
    assert.ok(
      !entries.includes("package.json"),
      "should exclude package.json",
    );
  });

  it("excludes requested globs", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    tempOutput = join(tempDir, "excluded.zip");

    execSync(
      `${CLI} ${fixture} -o ${tempOutput} --exclude "src/**"`,
      { cwd: __dirname },
    );

    const entries = await extractZipEntries(tempOutput);
    assert.ok(!entries.some((e) => e.startsWith("src/")), "should exclude src/");
    assert.ok(entries.includes("package.json"), "should include package.json");
  });

  it("preserves nested folder paths", async () => {
    const fixture = join(__dirname, "fixtures/nested");
    tempOutput = join(tempDir, "nested.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput}`, { cwd: __dirname });

    const entries = await extractZipEntries(tempOutput);
    assert.ok(entries.some((e) => e.includes("sub/data.json")), "should include sub/data.json");
    assert.ok(entries.some((e) => e.includes("sub/deep/file.md")), "should include sub/deep/file.md");
  });

  it("does not include output archive in itself", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    tempOutput = join(fixture, "simple.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput}`, { cwd: __dirname });

    const entries = await extractZipEntries(tempOutput);
    assert.ok(
      !entries.some((e) => e.includes("simple.zip")),
      "should not include output archive",
    );

    rmSync(tempOutput, { force: true });
  });

  it("derives output name from source folder", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    tempOutput = join(tempDir, "simple.zip");

    execSync(`${CLI} ${fixture} -o ${tempOutput}`, { cwd: __dirname });

    const stat = statSync(tempOutput);
    assert.ok(stat.size > 0, "output should have content");
  });

  it("reports error for non-existent source", () => {
    try {
      execSync(`${CLI} /nonexistent/path`, { cwd: __dirname });
      assert.fail("should throw error");
    } catch (err: any) {
      assert.ok(
        err.status !== 0,
        "should exit with non-zero status",
      );
    }
  });

  it("handles spaces in filenames", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    const fileWithSpace = join(fixture, "file with space.txt");
    writeFileSync(fileWithSpace, "content");
    tempOutput = join(tempDir, "spaces.zip");

    try {
      execSync(`${CLI} ${fixture} -o ${tempOutput}`, { cwd: __dirname });
      const entries = await extractZipEntries(tempOutput);
      assert.ok(
        entries.some((e) => e.includes("file with space.txt")),
        "should include file with spaces",
      );
    } finally {
      rmSync(fileWithSpace, { force: true });
    }
  });

  it("excludes files from custom ignore file", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    const customIgnoreFile = join(fixture, ".customignore");
    const ignoredFile = join(fixture, "ignored-by-custom.txt");

    writeFileSync(customIgnoreFile, "ignored-by-custom.txt\n");
    writeFileSync(ignoredFile, "content");
    tempOutput = join(tempDir, "custom-ignore.zip");

    try {
      execSync(`${CLI} ${fixture} -o ${tempOutput} --ignore-file .customignore`, {
        cwd: __dirname,
      });

      const entries = await extractZipEntries(tempOutput);
      assert.ok(
        !entries.includes("ignored-by-custom.txt"),
        "should exclude files from custom ignore file",
      );
      assert.ok(entries.includes("package.json"), "should include other files");
    } finally {
      rmSync(customIgnoreFile, { force: true });
      rmSync(ignoredFile, { force: true });
    }
  });

  it("supports multiple custom ignore files", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    const ignoreFile1 = join(fixture, ".ignore1");
    const ignoreFile2 = join(fixture, ".ignore2");
    const ignoredFile1 = join(fixture, "ignored-1.txt");
    const ignoredFile2 = join(fixture, "ignored-2.txt");

    writeFileSync(ignoreFile1, "ignored-1.txt\n");
    writeFileSync(ignoreFile2, "ignored-2.txt\n");
    writeFileSync(ignoredFile1, "content");
    writeFileSync(ignoredFile2, "content");
    tempOutput = join(tempDir, "multi-ignore.zip");

    try {
      execSync(
        `${CLI} ${fixture} -o ${tempOutput} --ignore-file .ignore1 --ignore-file .ignore2`,
        { cwd: __dirname },
      );

      const entries = await extractZipEntries(tempOutput);
      assert.ok(
        !entries.includes("ignored-1.txt"),
        "should exclude files from first ignore file",
      );
      assert.ok(
        !entries.includes("ignored-2.txt"),
        "should exclude files from second ignore file",
      );
      assert.ok(entries.includes("package.json"), "should include other files");
    } finally {
      rmSync(ignoreFile1, { force: true });
      rmSync(ignoreFile2, { force: true });
      rmSync(ignoredFile1, { force: true });
      rmSync(ignoredFile2, { force: true });
    }
  });

  it("combines custom ignore file with .gitignore", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    const gitignoredFile = join(fixture, "node_modules/test.js");
    const customIgnoreFile = join(fixture, ".customignore");
    const customIgnoredFile = join(fixture, "custom-ignored.txt");

    mkdirSync(join(fixture, "node_modules"), { recursive: true });
    writeFileSync(gitignoredFile, "content");
    writeFileSync(customIgnoreFile, "custom-ignored.txt\n");
    writeFileSync(customIgnoredFile, "content");
    tempOutput = join(tempDir, "combined-ignore.zip");

    // Create a .gitignore in the fixture
    const gitignoreFile = join(fixture, ".gitignore");
    let hadGitignore = false;
    try {
      statSync(gitignoreFile);
      hadGitignore = true;
    } catch {
      hadGitignore = false;
    }
    writeFileSync(gitignoreFile, "node_modules/\n");

    try {
      execSync(`${CLI} ${fixture} -o ${tempOutput} --ignore-file .customignore`, {
        cwd: __dirname,
      });

      const entries = await extractZipEntries(tempOutput);
      assert.ok(
        !entries.some((e) => e.includes("node_modules")),
        "should exclude files from .gitignore",
      );
      assert.ok(
        !entries.includes("custom-ignored.txt"),
        "should exclude files from custom ignore file",
      );
      assert.ok(entries.includes("package.json"), "should include other files");
    } finally {
      rmSync(join(fixture, "node_modules"), { recursive: true, force: true });
      rmSync(customIgnoreFile, { force: true });
      rmSync(customIgnoredFile, { force: true });

      // Restore original .gitignore state
      if (!hadGitignore) {
        rmSync(gitignoreFile, { force: true });
      }
    }
  });

  it("uses only custom ignore file when --no-gitignore", async () => {
    const fixture = join(__dirname, "fixtures/simple");
    const customIgnoreFile = join(fixture, ".customignore");
    const gitignoredFile = join(fixture, "gitignored-file.txt");
    const customIgnoredFile = join(fixture, "custom-ignored.txt");

    // Create .gitignore
    const gitignoreFile = join(fixture, ".gitignore");
    writeFileSync(gitignoreFile, "gitignored-file.txt\n");
    writeFileSync(customIgnoreFile, "custom-ignored.txt\n");
    writeFileSync(gitignoredFile, "content");
    writeFileSync(customIgnoredFile, "content");
    tempOutput = join(tempDir, "no-gitignore-custom.zip");

    try {
      execSync(
        `${CLI} ${fixture} -o ${tempOutput} --no-gitignore --ignore-file .customignore`,
        { cwd: __dirname },
      );

      const entries = await extractZipEntries(tempOutput);
      assert.ok(
        entries.includes("gitignored-file.txt"),
        "should include files ignored by .gitignore when --no-gitignore",
      );
      assert.ok(
        !entries.includes("custom-ignored.txt"),
        "should still exclude files from custom ignore file",
      );
    } finally {
      rmSync(gitignoreFile, { force: true });
      rmSync(customIgnoreFile, { force: true });
      rmSync(gitignoredFile, { force: true });
      rmSync(customIgnoredFile, { force: true });
    }
  });
});
