import { marked } from "marked";
import PicoDB from "picodb";
import { ContentItem } from "..";
import { Patrika } from "../Patrika.js";
import { OnShortCode } from "./extensions/OnShortCode.js";
import { getExtensions } from "./extensions/index.js";

interface RenderAllMarkdownArgs {
  db          : PicoDB<ContentItem>;
  patrika     : Patrika;
  onShortCode?: OnShortCode;
}

/**
 * We render markdown separately from constructing the ContentItem collections, because we have
 * custom markdown extensions that might refer to other items. For example, adding a hyperlink
 * in post A to post B, without having to know the URL of post B ahead of time; just the id.
 * @param patrika
 */
export const renderAllMarkdown = async (args: RenderAllMarkdownArgs): Promise<void> => {
  const {
    db,
    onShortCode,
    patrika,
  } = args;

  if (typeof onShortCode === "function") {
    marked.use({ extensions: getExtensions() });
    marked.use({
      async     : true,
      walkTokens: async (token) => {
        if (token.type === "P:I") {
          token.html = await onShortCode(token.args, patrika);
        }
      },
    });
  }

  const items = await patrika.find({});
  for (const item of items) {
    item.body = await marked(item.markdown);
    
    db.updateOne({ id: item.id }, item);
  }
};
