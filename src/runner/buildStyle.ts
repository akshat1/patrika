import fs from "node:fs/promises";
import path from "node:path";
import { getLogger } from "@akshat1/js-logger";
import { glob } from "glob";
import less from "less";

/**
 * @param srcFile - Absolute path to the less file
 * @param lessDir - Absolute path to the directory containing less files
 * @param outDir  - Absolute path to the directory where css files will be written
 * @returns - Absolute path to the css file such that the directory structure is preserved.
 *
 * @description
 * getDestinationPath("/myProj/foo/bar/baz.less", "/myProj/foo", "/out") -> "/out/bar/baz.css"
 */
export const getDestinationPath = (srcFile: string, lessDir: string, outDir: string) => {
  const logger = getLogger("getDestinationPath");
  const result = path.join(
    outDir,
    path.basename(lessDir),
    path.relative(lessDir, srcFile).replace(/\.less$/, ".css"),
  );

  logger.debug({
    srcFile,
    lessDir,
    outDir,
    result,
  });
  return result;
};

export const buildLessFile = async (srcFile: string, lessDir: string, outDir: string) => {
  const logger = getLogger("buildLessFile");
  logger.debug(`Processing ${srcFile}`);
  const contents = (await fs.readFile(srcFile)).toString();
  const lessOpts = {
    filename: srcFile,
  };
  try {
    const result = await less.render(contents, lessOpts);
    const destinationPath = getDestinationPath(srcFile, lessDir, outDir);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    logger.debug(`Writing to ${destinationPath}...`);
    await fs.writeFile(destinationPath, result.css);
    logger.debug("Done!");
  } catch (err) {
    logger.error(`Error processing ${srcFile}:`, JSON.stringify(err, null, 2));  // Avoid crashing the process for a single file.
  }
};

interface BuildStyleArgs {
  lessDir: string;
  outDir : string;
}

export const buildStyle = async (args: BuildStyleArgs) => {
  const logger = getLogger("getBuildStyle");
  const {
    lessDir,
    outDir,
  } = args;
  const lessGlob = path.join(lessDir, "**/*.less");
  logger.debug(`Looking for less files in ${lessGlob}`);
  const files = await glob(lessGlob, { ignore: ["**/_*.less"] });
  logger.debug("Files to process: ", files.length);
  for (const srcFile of files) {
    if (path.basename(srcFile).startsWith("_")) {
      // I haven't been able to get glob to ignore files starting with _.
      logger.debug(`Ignoring ${srcFile}`);
      continue;
    }
    await buildLessFile(srcFile, lessDir, outDir);
  }
  logger.info("Done building less files");
};
