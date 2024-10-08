import frontmatter, { FrontMatterResult } from "front-matter";
import { FrontMatterAttributes, validate } from "./schema.js";

export { FrontMatterAttributes };

interface GetFMDataArgs {
  markdown: string;
  filePath: string;
}

export const getFMData = ({ markdown, filePath }: GetFMDataArgs): FrontMatterResult<FrontMatterAttributes> => {
  const fmData = frontmatter<FrontMatterAttributes>(markdown);
  const missingFields = validate(fmData.attributes);
  if (missingFields.length) {
    throw new Error(`Missing [${missingFields.join(", ")}] in ${filePath}`);
  }

  return fmData;
};
