export interface RunnerConfiguration {
  /** Something like mySiteContent\/**\/*.md */
  contentGlob : string;
  outDir      : string;
  /**
   * Any and all static assets that should be copied over as is.
   * A dict which with source path as key and destination path as value.
   * The source path should be relative to the project root, and the destination path should be relative to the output
   * directory.
   *
   * @example
   * {
   *  "src/styles": "styles",   // Copy all files from src/styles to outDir/styles
   *  "src/images": "images"    // Copy all files from src/images to outDir/images
   * }
   */
  staticAssets: Record<string, string>;
  /**
   * All directories that should be watched in order to trigger a re-build. This should include the content directory,
   * the renderer JS, and any other directories that are used to generate the site (such as styles / images etc.).
   */
  watchedPaths: string[];
};
