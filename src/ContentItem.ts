import { Stats } from "fs";
import path from "node:path";
import { FrontMatterResult } from "front-matter";
import { GetSlug } from "./GetSlug.js";
import { GetURLRelativeToRoot } from "./GetURLRelativeToRoot.js";
import { FrontMatterAttributes } from "./front-matter/index.js";

/**
 * @TODO Rationalise this. Move most things into frontMatter attributes (which itself should be open ended; probably
 * extend Record) so that the user can stuff whatever they want in there. Top level properties should be limited to
 * whatever Patrika needs at a minimum.
 *
 * @TODO We'll probably also need to have a hook for the template to potentially augment the front matter attributes;
 * or should we force the users to declare everything in frontMatter upfront?
 *
 *
 */
export interface ContentItem {
  // The actual content.
  markdown: string;
  body?   : string;

  // Populated by Patrika from file information + template.
  url           : string;
  sourceFilePath: string;
  filePath      : string;
  slug          : string;

  // User supplied data (as part of the frontMatter section).
  id         : string;
  title      : string;
  publishDate: Date;
  type?      : string;
  draft?     : boolean;

  // All other user supplied data (as part of the frontMatter section) lives here.
  frontMatter: FrontMatterAttributes;
}

export const comparePostsByPublishedDate = (a: ContentItem, b: ContentItem): number => {
  const dA = new Date(a.publishDate).getTime();
  const dB = new Date(b.publishDate).getTime();
  return dB - dA;
};

export const getPublishDate = (args: { attributes: FrontMatterAttributes, stats: Stats }): Date | null => {
  if (args.attributes?.publishDate) {
    return args.attributes.publishDate;
  }

  if (args.stats.ctime) {
    return new Date(args.stats.ctime);
  }

  return null;
};

export interface ToContentItemArgs {
  fmData              : FrontMatterResult<FrontMatterAttributes>;
  sourceFilePath      : string;
  stats               : Stats;
  getSlug             : GetSlug;
  getURLRelativeToRoot: GetURLRelativeToRoot;
  outDir              : string;
}

/**
 * @TODO: Clean this (and associated code in other files) up. Right now we have some repetition and some peanut
 * buttering of logic into multiple modules. Can we get rid of some partial types and just pass around a dummy item
 * which gets progressively filled up? Similar to what we did for getFilePath?
 *
 * @param args
 * @returns
 */
export const toContentItem = async (args: ToContentItemArgs): Promise<ContentItem> => {
  const {
    sourceFilePath,
    fmData,
    stats,
    getSlug,
    getURLRelativeToRoot,
    outDir,
  } = args;

  const {
    attributes,
    body: markdown,
  } = fmData;

  const {
    authors = [],
    collections = [],
    draft = false,
    id,
    image,
    imgAlt,
    tags = [],
    title,
    type,
  } = attributes;

  const publishDate = getPublishDate({ attributes, stats });
  const item = {
    sourceFilePath,
    filePath   : "pending",
    url        : "pending",
    authors,
    collections,
    draft,
    excerpt    : {},
    frontMatter: attributes,
    id,
    image,
    imgAlt,
    markdown,
    publishDate,
    slug       : "pending",
    tags,
    title,
    type,
  };

  item.slug = getSlug(item);
  item.url = getURLRelativeToRoot(item);
  item.filePath = path.join(outDir, item.url);

  return item;
};
