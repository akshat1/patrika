import { MarkedExtensionAsPerDocs } from "./MarkedExtensionAsPerDocs";
import { SCToken } from "./SCToken";

const StartPattern = /\S?\[P:I[^\]]+\]/;
/**
 * @param src The markdown source
 * @returns The next potential start of the custom token.
 */
export const start = (src: string): number | void => {
  const match = StartPattern.exec(src);
  if (match && match[0] && match[0].startsWith("[P:I")) {
    return match.index;
  }
};

const extractValues = (str: string): Record<string, unknown> => {
  // Thank you Copilot.
  const regex = /(\w+)=(?:(true|false)|(\d+(?:\.\d+)?)|("([^"\\]*(?:\\.[^"\\]*)*)"))/g;
  const args: Record<string, unknown> = {};
  let match;
  while ((match = regex.exec(str)) !== null) {
    const [, key, boolValue, numValue, strValue] = match;
    if (boolValue !== undefined) {
      args[key] = boolValue === "true";
    } else if (numValue !== undefined) {
      args[key] = parseFloat(numValue);
    } else if (strValue !== undefined) {
      args[key] = strValue
        .replace(/\\"/g, "\"")         // Turn escaped quotes into quotes.
        .replace(/(^")|("$)/g, "");   // Remove quotes from the start and end of the string.
    }
  }
  return args;
};

const TokenPattern = /^\[P:I[^\]]+\]/;
/**
 * @param src The markdown source
 * @returns The custom token
 */
export const tokenizer = (src: string): SCToken | void => {
  const l1Match = TokenPattern.exec(src);
  if(l1Match) {
    const tag = l1Match[0];
    const args = extractValues(src);

    return {
      type: "P:I",
      raw : tag,
      text: tag,
      html: "",
      args,
    };
  }
};

/**
 * Returns a Marked extension.
 * The extension will handle custom markdown syntax such that when it
 * encounters our custom markdown tag, it will call the supplied onShortCode
 * function with the args and assign the result to the html property of the
 * token.
 *
 * For example, given the following markdown:
 * I'm writing this [PSC foo="bar" baz='qux' ab=0 cd=true] with a custom
 * markdown tag.
 *
 * The extension will call onShortCode with the args
 * { foo: "bar", baz: "qux", ab: 0, cd: true } and assign the result to the
 * html property of the token.
 *
 * @see https://marked.js.org/using_pro#extensions
 */
export const getExtension = (): MarkedExtensionAsPerDocs => ({
  name    : "P:I", // Patrika Inline
  level   : "inline",
  async   : true,
  start,
  tokenizer,
  renderer: (token: SCToken) => token.html,
});
