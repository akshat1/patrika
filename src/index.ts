import { getLogger } from "@kabukisolutions/js-logger";
import PicoDB from "picodb";
import { type ContentItem } from "./ContentItem.js";
import { getExtraContentItems } from "./GetExtraContentItems.js";
import { type GetSlug } from "./GetSlug.js";
import { type GetURLRelativeToRoot } from "./GetURLRelativeToRoot.js";
import { type Patrika } from "./Patrika.js";
import { fileWalker } from "./fileWalker.js";
import { type FrontMatterAttributes } from "./front-matter/index.js";
import { type OnShortCode } from "./markdown/extensions/OnShortCode.js";
import { renderAllMarkdown } from "./markdown/index.js";
export { type RunnerConfiguration } from "./runner/RunnerConfiguration.js";
export { type Template } from "./runner/Template.js";

export {
  type ContentItem,
  type FrontMatterAttributes,
  type Patrika,
  type OnShortCode,
};

const logger = getLogger("getPatrika");
export interface GetPatrikaArgs {
  contentGlob          : string;
  onShortCode?         : OnShortCode;
  getSlug              : GetSlug;
  getURLRelativeToRoot : GetURLRelativeToRoot;
  outDir               : string;
  getExtraContentItems?: getExtraContentItems;
}
export const getPatrika = async (args: GetPatrikaArgs): Promise<Patrika> => {
  logger.debug(args);
  const {
    onShortCode,
    contentGlob,
    getSlug,
    getURLRelativeToRoot,
    outDir,
  } = args;
  const db = new PicoDB<ContentItem>();

  const items = await fileWalker({
    getSlug,
    getURLRelativeToRoot,
    globPattern: contentGlob,
    outDir,
  });
  db.insertMany(items);

  const patrika: Patrika = {
    find: (query?: Record<string, unknown>, projection?: Record<string, unknown>) => db.find(query, projection).toArray(),
    _db : db,
  };

  // Add extra content items (for things like tags, categories, etc).
  if (typeof args.getExtraContentItems === "function") {
    const extraItems = await args.getExtraContentItems(patrika);
    db.insertMany(extraItems);
  }

  // Render all markdown.
  await renderAllMarkdown({
    db,
    onShortCode,
    patrika,
  });

  return patrika;
};
