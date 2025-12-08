import fs from "node:fs/promises";
import { getLogger } from "@akshat1/js-logger";
import { glob } from "glob";
import { ContentItem, toContentItem } from "./ContentItem.js";
import { GetSlug } from "./GetSlug.js";
import { GetURLRelativeToRoot } from "./GetURLRelativeToRoot.js";
import { getFMData } from "./front-matter/index.js";

const logger = getLogger("fileWalker");

interface FileWalkerArgs {
  getSlug             : GetSlug;
  getURLRelativeToRoot: GetURLRelativeToRoot;
  outDir              : string;
  globPattern         : string;
}
export const fileWalker = async (args: FileWalkerArgs): Promise<ContentItem[]> => {
  const {
    getSlug,
    getURLRelativeToRoot,
    globPattern,
    outDir,
  } = args;
  logger.debug(`Read glob ${globPattern}`);
  const sourceFilePaths = await glob(globPattern);
  logger.debug({ globPattern, sourceFilePaths });
  const items = [];
  for (const sourceFilePath of sourceFilePaths) {
    const stats = await fs.stat(sourceFilePath);
    if (!stats.isFile()) {
      logger.warn("Skipping non-file", sourceFilePath);
      continue;
    }

    const markdown = (await fs.readFile(sourceFilePath)).toString();
    const fmData = getFMData({ markdown, filePath: sourceFilePath });
    const item = await toContentItem({
      sourceFilePath,
      stats,
      fmData,
      getSlug,
      getURLRelativeToRoot,
      outDir,
    });

    items.push(item);
  }

  return items;
};
