import { ContentItem } from "./ContentItem";
import { Patrika } from "./Patrika";

export type RenderToString = (item: ContentItem, patrika: Patrika) => Promise<string | string[]>;
