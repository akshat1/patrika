/**
  FrontMatter Validation
  ======================
  The following schema is used to validate front-matter data extracted from each markdown file. While the
  `FrontMatterAttributes` interface itself is open ended, we need to ensure that certain fields are present. These are
  the ones mentioned in the `FMDataSchema` object below (as well as the ones explicitly mentioned in
  `FrontMatterAttributes`. If any of these fields are missing, we throw an error.

  Note that the few fields that are required will eventually get hoisted to the top level of the `ContentItem` type.
  We want to minimise the number of items that are "required". Users may choose to add whatever data they need for
  actually rendering the website in the manner they choose.

  @TODO Create a mechanism for users to formally specify a schema that Patrika can validate for them.
*/

/**
 * The front-matter attributes extracted from a markdown file.
 */
export interface FrontMatterAttributes extends Record<string, unknown> {
  id         : string;
  title      : string;
  publishDate: Date;
  type?      : string;
  draft?     : boolean;
}

type ValidatorFunc = (obj: FrontMatterAttributes) => boolean;
type Schema = Record<string, ValidatorFunc>;
const FMDataSchema: Schema = {
  id         : obj => typeof obj.id === "string",
  title      : obj => typeof obj.title === "string",
  publishDate: obj => obj.publishDate instanceof Date,
};

const doValidate = (schema: Schema, data: FrontMatterAttributes): string[] => {
  const missingFields: string[] = [];
  for (const key in schema) {
    if (!schema[key](data)) {
      missingFields.push(key);
    }
  }

  return missingFields.sort();
};

/**
 * @param frontmatter result.
 * @returns list of missing fields.
 */
export const validate = (data: FrontMatterAttributes): string[] =>
  doValidate(FMDataSchema, data);


/*
  authors: string[];
  /**
   * The HTML generated from the markdown content.
   *
   * This is optional because the body is generated in another pass and we need
   * to account for a half-baked ContentItem, one without a body. Ideally we
   * should use a partial type here so that the exposed API is consistent.
   *
   * @TODO Use a partial type here instead of making `body` optional.
   * /
  body?: string;
  collections: string[];
  draft: boolean;
  excerpt: Record<string, string>;
  /**
   * `id` as specified using front-matter in the markdown file.
   * /
  id: string;
  image?: string;
  imgAlt?: string;
  markdown: string;
  publishDate: string|null; // Date
  slug: string;
  tags: string[];
  title: string;
  frontMatter: FrontMatterAttributes;
  url: string;
  sourceFilePath: string;
  filePath: string;
*/
