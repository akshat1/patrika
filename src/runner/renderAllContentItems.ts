import fs from "node:fs/promises";
import path from "node:path";
import { getLogger } from "@kabukisolutions/js-logger";
import { GetURLRelativeToRoot } from "../GetURLRelativeToRoot.js";
import { RenderToString } from "../RenderToString.js";
import { ContentItem, Patrika } from "../index.js";

const rootLogger = getLogger("renderAllContentItems");

interface WriteHTMLFileArgs {
  item          : ContentItem;
  strHTML       : string;
  outputFilePath: string;
}
const writeHTMLFile = async (args : WriteHTMLFileArgs) => {
  const logger = getLogger("writeHTMLFile", rootLogger);
  const {
    item,
    strHTML,
    outputFilePath,
  } = args;

  logger.debug(`Writing ${item.slug} => ${outputFilePath}`);
  await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
  await fs.writeFile(outputFilePath, strHTML);
  logger.debug(`Done writing ${item.slug} to ${outputFilePath}.`);
};

interface RenderAllContentItemsArgs {
  items               : ContentItem[];
  patrika             : Patrika;
  renderToString      : RenderToString;
  getURLRelativeToRoot: GetURLRelativeToRoot;
  outDir              : string;
}
export const renderAllContentItems = async (args: RenderAllContentItemsArgs) => {
  const logger = getLogger("implementation", rootLogger);
  const {
    items,
    patrika,
    renderToString,
    getURLRelativeToRoot,
    outDir,
  } = args;

  // We reload the template to account for changes in the template.
  logger.debug("Reload the template...");
  logger.debug("Done reloading the template. Proceed...");
  for (const item of items) {
    logger.debug(`Rendering ${item.slug}...`);
    const output = await renderToString(item, patrika);
    if (Array.isArray(output)) {
      logger.debug(`Multiple (${output.length}) files will be written for ${item.slug}.`);
      for (const [index, strHTML] of output.entries()) {
        const outputFilePath = path.join(outDir, getURLRelativeToRoot(item, index)); // we call getURLRelativeToRoot with index (page number) if it exists.
        await writeHTMLFile({
          item,
          strHTML,
          outputFilePath,
        });
      }
    } else {
      const outputFilePath = path.join(outDir, getURLRelativeToRoot(item));
      await writeHTMLFile({
        item,
        strHTML: output,
        outputFilePath,
      });
    }
  }
};
