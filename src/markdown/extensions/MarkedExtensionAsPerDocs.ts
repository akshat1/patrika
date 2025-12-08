import { SCToken } from "./SCToken";

/**
 * The Docs don't seem to match the MarkedExtension type, or I might have
 * misunderstood something. The following typedef is based on the docs.
 *
 * We'll probably need to ts-ignore the marked.use call but I think it's
 * acceptable in this situation.
 */
export interface MarkedExtensionAsPerDocs {
  name : string;
  level: "block" | "inline";
  start(src: string, pos: number): number | void;
  async: boolean;
  tokenizer(src: string, tokens: SCToken[]): void;
  renderer(token: SCToken): string;
}
