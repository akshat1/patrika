import * as assert from "node:assert";
import { test, suite } from "node:test";
import { FrontMatterResult } from "front-matter";
import {
  ContentItem, getPublishDate, toContentItem, ToContentItemArgs, comparePostsByPublishedDate,
} from "./ContentItem";
import { FrontMatterAttributes } from "./front-matter";

suite("ContentItem", () => {
  suite("comparePostsByPublishedDate", () => {
    const FakeItemStub: ContentItem = {
      authors    : [],
      body       : "",
      collections: [],
      draft      : false,
      excerpt    : {},
      /// @ts-expect-error - I JUST NEED A STUB FOR THE TEST!
      frontMatter: {},
      id         : "",
      markdown   : "",
      publishDate: new Date(),
      slug       : "",
      tags       : [],
      title      : "",
    };
    const makeFakeItem = (publishDate: string): ContentItem => ({
      ...FakeItemStub,
      publishDate: new Date(publishDate),
    });
  
    test("should return 0 when a and b are the same", () => {
      const a = makeFakeItem("2023-01-01");
      const b = makeFakeItem("2023-01-01");
      assert.equal(comparePostsByPublishedDate(a, b), 0);
    });
  
    test("should return > 0 when a is older than b", () => {
      const a = makeFakeItem("2023-01-01");
      const b = makeFakeItem("2023-02-01");
      assert.equal(comparePostsByPublishedDate(a, b) > 0, true);
    });
  
    test("should return < 0 when a is newer than b", () => {
      const a = makeFakeItem("2023-02-01");
      const b = makeFakeItem("2023-01-01");
      assert.equal(comparePostsByPublishedDate(a, b) < 0, true);
    });
  });

  suite("getPublishDate", () => {
    test("should return the date from front matter attributes when present", () => {
      const args = {
        attributes: { publishDate: new Date("2020-03-02") },
        stats     : { ctime: new Date("2021-01-01").toUTCString() },
      };
      /// @ts-expect-error Not going to create a full fs.Stats object for the test :-|
      const actualDate = getPublishDate(args);
      assert.equal(actualDate?.toISOString(), new Date("2020-03-02").toISOString());
    });

    test("should return the date from file states when missing from attributes", () => {
      const args = {
        attributes: {},
        stats     : { ctime: new Date("2021-01-01").toUTCString() },
      };
      /// @ts-expect-error Not going to create a full fs.Stats object for the test :-|
      const actualDate = getPublishDate(args);
      assert.equal(actualDate?.toISOString(), new Date("2021-01-01").toISOString());
    });

    test("should return null when published date is missing from attributes, and ctime is missing from stats", () => {
      const args = {
        attributes: {},
        stats     : {},
      };
      /// @ts-expect-error Not going to create a full fs.Stats object for the test :-|
      const actualDate = getPublishDate(args);
      assert.equal(actualDate?.toISOString(), null);
    });
  });

  suite("toContentItem", () => {
    test("should return a well formed ContentItem", async () => {
      const authors = ["foo", "bar"];
      const id = "post-42";
      const publishDate = new Date("2023-01-01");
      const title = "Le Title";
      const collections = ["one", "two"];
      const image = "/images/blah";
      const imgAlt = "a fake image for testing";
      const tags = ["such", "tags"];
      const fmAttributes = {
        authors,
        id,
        publishDate,
        title,
        collections,
        draft: false,
        image,
        imgAlt,
        tags,
        type : "post",
      };
      const frontMatter: FrontMatterResult<FrontMatterAttributes> = {
        attributes : fmAttributes,
        body       : "ze markdown",
        bodyBegin  : 0,
        frontmatter: "all ze frontmatter",
      };
      const contentItemArgs: ToContentItemArgs = {
        filePath            : "foo/bar/baz.md",
        fmData              : frontMatter,
        getSlug             : () => "jabba-the-hut",
        getURLRelativeToRoot: () => "/",
        outDir              : "/",
        /// @ts-expect-error We don't want to create an entire fs.Stat object.
        stats               : {},
      };

      const expectedItem = {
        sourceFilePath: undefined,
        filePath      : "/",
        url           : "/",
        authors,
        collections,
        draft         : false,
        frontMatter   : fmAttributes,
        id,
        markdown      : "ze markdown",
        publishDate,
        slug          : "jabba-the-hut",
        tags,
        title,
        image,
        imgAlt,
        excerpt       : {},
        type          : "post",
      };
      const actualItem = await toContentItem(contentItemArgs);
      assert.deepEqual(actualItem, expectedItem);
    });
  });
});
