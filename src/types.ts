export interface PackOptions {
  source: string;
  output?: string;
  gitignore: boolean;
  ignoreFiles: string[];
  include: string[];
  exclude: string[];
  verbose: boolean;
}

export interface PackResult {
  outputPath: string;
  fileCount: number;
}
