import type { FrontMatterResult } from "front-matter";
import frontmatter from "front-matter";
import { type FrontMatterAttributes, validate } from "./schema.js";

export { FrontMatterAttributes };

interface GetFMDataArgs {
  markdown: string;
  filePath: string;
}

export const getFMData = ({ markdown, filePath }: GetFMDataArgs): FrontMatterResult<FrontMatterAttributes> => {
  const fmData = frontmatter<FrontMatterAttributes>(markdown);
  if (fmData.attributes?.publishDate && !(fmData.attributes.publishDate instanceof Date)) {
    fmData.attributes.publishDate = new Date(fmData.attributes.publishDate);
  }
  const missingFields = validate(fmData.attributes);
  if (missingFields.length) {
    throw new Error(`Missing [${missingFields.join(", ")}] in ${filePath}`);
  }

  return fmData;
};
