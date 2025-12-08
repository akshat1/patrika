import PicoDB from "picodb";
import { ContentItem } from "./ContentItem";

export interface Patrika {
  find: (query?: Record<string, unknown>, projection?: Record<string, unknown>) => Promise<ContentItem[]>;
  /** WARNING, this will disappear _any_ time, _without_ warning. This is just to help the devs experiment and troubleshoot. */
  _db : PicoDB<ContentItem>;
}
