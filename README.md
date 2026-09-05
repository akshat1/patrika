# Patrika

### Patrikā (पत्रिका):—(nf) a magazine; journal.

Patrika is

- a utility to programmatically access HTML from a bunch of markdown files.
- a command line tool to call the `renderToString()` function supplied by you, with an instance of Patrika and the markdown, HTML, and front-matter data for each markdown file indicated by your configuration.

Patrika can be used as

- an API to serve as a headless CMS for your frontend (when coupled with your REST code).
- an API to access data in your static site gen tool of choice.
- a stand alone, framework agnostic, unopinionated static site generator.

## Usage

### Stand alone

In the stand alone mode,

```sh
$ mkdir my-personal-website
$ cd my-personal-website
$ mkdir content                # All your markdown content goes into this directory
$ mkdir src                    # Your template goes into this directory
$ touch src/index.js
$ echo "@akshat1:registry=https://npm.pkg.github.com" >> .npmrc
$ npm init
$ npm i -D @akshat1/patrika
```

Patrika is published to the GitHub Packages npm registry, which requires authentication even for public packages. If the install fails with a 401, [create a GitHub personal access token](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages) with the `read:packages` scope and add it to your `~/.npmrc`:

```ini
//npm.pkg.github.com/:_authToken=YOUR_TOKEN
```

Then run Patrika with your template:

```sh
$ npx patrika -t src/index.js
```

#### Template

```ts
// This is a TS example just to illustrate use of various interfaces from Patrika.
// You are free to use JS, or any compile to JS language; just pass the compiled JS to patrika on the CLI.
import { ContentItem, Patrika, Template, RunnerConfiguration } from "@akshat1/patrika";
import path from "node:path";
import slugify from "slugify";
import { renderToString } from "./renderer/index.js";

const config: RunnerConfiguration = {
  "watchedPaths": ["src", "content"], // Template, renderer, styles and images all live under src/
  "outDir": "_site",
  "contentGlob": "content/**/*.md",
  "staticAssets": {
    "src/images": "images", // Copy all files from src/images to _site/images
    "src/styles": "styles", // Ship your CSS the same way
  },
};

const getSlug = ({ sourceFilePath, title }: ContentItem) => slugify((title ?? path.basename(sourceFilePath).replace(/\.md$/, ""))).toLowerCase();

const getURLRelativeToRoot = (item: ContentItem, pageNumber?: number) => {
  const {
    id,
    slug,
    frontMatter,
  } = item;

  const { type } = frontMatter;
  if (type === "page") {
    const fileName = pageNumber ? `index-${pageNumber}.html` : "index.html";
    return id === "site-index" ? fileName : `${slug}/${fileName}`;
  } else if (type === "post") {
    const publishDate = new Date(frontMatter.publishDate);
    const year = String(publishDate.getFullYear());
    const month = String(publishDate.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-based.
    return path.join("posts", year, month, `${slug}.html`);
  }

  throw new Error(`Unknown item type: ${type}`);
};

const template: Template = {
  getSlug,
  renderToString,
  getURLRelativeToRoot,
  getConfig: () => config,
  onShortCode: async (args: Record<string, unknown>, patrika: Patrika) => "",
};

export default template;
```

#### Renderer

Patrika doesn't care which frontend framework you use. It only expects the template to provide a `renderToString` function.

Here's a really simple TypeScript example.

```ts
// src/renderer/index.ts, imported by the template above. Compile it alongside the template.
import { renderHead } from "./head.js";
import { ContentItem, Patrika } from "@akshat1/patrika";
import { renderBody } from "./body.js";
import { renderFooter } from "./footer.js";

export const renderToString = async (item: ContentItem, patrika: Patrika) =>
  `
  <!DOCTYPE html>
  <html lang="en">
    ${await renderHead(item)}
    ${await renderBody(item, patrika)}
    ${await renderFooter()}
  </html>
  `;
```

#### Pagination

`renderToString` may return an array of strings instead of a single string. When it does, Patrika writes one file per element and calls `getURLRelativeToRoot(item, pageNumber)` with the element's index (0, 1, 2, ...) to decide where each one goes. That is why the `getURLRelativeToRoot` example above accepts a `pageNumber` argument. For a single string, `getURLRelativeToRoot` is called without a page number.

```ts
import { ContentItem, Patrika } from "@akshat1/patrika";

// Render a list page in chunks of ten posts.
export const renderToString = async (item: ContentItem, patrika: Patrika) => {
  if (item.type !== "page") {
    return renderPost(item);
  }

  const posts = await patrika.find({ type: "post" });
  const pages: string[] = [];
  for (let i = 0; i < posts.length; i += 10) {
    pages.push(renderList(posts.slice(i, i + 10), pages.length));
  }

  return pages;
};
```

#### Pages without a markdown file (tags, categories, ...)

Every page Patrika writes is backed by a `ContentItem`. To produce pages that have no markdown file of their own, such as a page per tag, provide an optional `getExtraContentItems` function on the template (or in the `getPatrika` call). It receives the `Patrika` instance after all markdown files have been loaded (but before their markdown is rendered, so `body` is still `undefined` on every item at this point) and must return fully formed `ContentItem`s. `getSlug` is not called for these, so set `slug` yourself. They get inserted into the database and rendered like any other item, which means your `getURLRelativeToRoot` and `renderToString` functions must handle them too: the template example above keys on `frontMatter.type` and would throw for a `tag` item until you add a branch for it. The runner asks `getURLRelativeToRoot` where to write each item, so keep the `url` and `filePath` you set here consistent with it.

```ts
import { ContentItem, Patrika } from "@akshat1/patrika";

const getExtraContentItems = async (patrika: Patrika): Promise<ContentItem[]> => {
  const posts = await patrika.find({ type: "post" });
  const tags = new Set(posts.flatMap(post => (post.frontMatter.tags as string[] | undefined) ?? []));
  return [...tags].map(tag => ({
    id: `tag-${tag}`,
    title: tag,
    type: "tag",
    slug: tag,
    url: `tags/${tag}.html`,
    filePath: `_site/tags/${tag}.html`,
    sourceFilePath: "",
    markdown: "",
    publishDate: new Date(),
    frontMatter: { id: `tag-${tag}`, title: tag, publishDate: new Date(), type: "tag", tag },
  }));
};
```

#### What about CSS?

Patrika is agnostic towards CSS the same way it is agnostic towards frontend frameworks: bring your own. Write plain CSS and ship it via `staticAssets`, or run your preprocessor / bundler of choice as a separate step and point `staticAssets` at its output directory. Add your styles directory to `watchedPaths` if you want changes to it to trigger a rebuild in watch/serve mode.

(Earlier versions compiled `.less` files via a `lessDir` configuration property; that has been removed.)

#### Live development?

Patrika provides two mechanisms to enable live development:

1. Watch mode through the `--watch or -w` flag: In this mode, any changes made to the watchedPaths mentioned in the runner configuration trigger a rebuild.
2. Serve mode through the `--serve or -s` flag: In this mode, Patrika watches for changes (same as watch mode) but also runs a minimal, live reloading webserver at http://localhost:3000. Use the `--port or -p` flag to serve on a different port (e.g. `npx patrika -t src/index.js -s -p 8080`).

`npx patrika --help` prints all the flags, and `npx patrika --version` prints the installed version.

### Headless CMS

Patrika reads the markdown files matched by the `contentGlob` you provide, compiles them to HTML, and loads the whole shebang into an in-memory database. Then it exposes a simple `.find({ })` API.

Here's a simple example of using Patrika as a headless CMS.

```ts
import path from "node:path";
import express from "express";
import slugify from "slugify";
import { getPatrika } from "@akshat1/patrika";

const getSlug = ({ sourceFilePath, title }) =>
  slugify(title ?? path.basename(sourceFilePath).replace(/\.md$/, "")).toLowerCase();
const patrika = await getPatrika({
  contentGlob: "contentDir/**/*.md",
  outDir: "_site", // Required, but nothing is written to it when Patrika is used programmatically.
  getSlug,
  getURLRelativeToRoot: (item) => `${item.slug}.html`,
});

const app = express();
app.get("/posts", async (req, res) => {
  const allPosts = await patrika.find({ type: "post" });
  res.send(allPosts);
});

app.get("/post/:postId", async (req, res) => {
  const post = (await patrika.find({
    id: req.params.postId,
  }))[0];
  res.send(post);
});
```

### Data source for a Static Side Generator

The details for this would depend on the SSG in question, but it would be similar to the headless CMS example.

## Requirements

Patrika expects the following [FrontMatter](https://frontmatter.codes/docs/markdown) data in each markdown file. It is fine to include more data in the attributes, but Patrika will throw an error if any of the required fields (`id`, `title`, `publishDate`) are missing.

```ts
export interface FrontMatterAttributes extends Record<string, unknown> {
  id         : string;
  title      : string;
  publishDate: Date;
  type?      : string;
}
```

## Custom short-codes

Sometimes, you need to insert custom instructions in your markdown content. For instance, you might want to insert a hyperlink to a post by the post-id so that you don't have to specify the path to the actual html file. Or even, fetch data async from an external data source (say from a DB or a service). For such use-cases, Patrika provides a mechanism to specify a shortcode handler in the getPatrika call. For example,

```markdown
# Example shortcode usage.

Our author Adam Smith has written [P:I tagName="author-data" authorID="adam-smith" requested="post-count"] posts. Here's his picture.

[P:I tagName="author-data" authorId="adam-smith" requested="picture"]
```

```js
const patrika = await getPatrika({
  contentGlob: path.join("content", "**", "*.md"),
  outDir: "_site",
  getSlug: ({ sourceFilePath, title }) => slugify(title ?? path.basename(sourceFilePath).replace(/\.md$/, "")).toLowerCase(),
  getURLRelativeToRoot: (item) => `${item.slug}.html`,
  // Use the patrika instance passed to the handler; the `patrika` const above is not
  // yet initialized when shortcodes are rendered during the getPatrika call itself.
  onShortCode: async (args, patrika) => {
    switch (args.tagName) {
      case "author-data": {
        switch (args.requested) {
          case "post-count": return String((await patrika.find({ authors: args.authorID })).length);
          case "picture": return await (await fetch(`${authorPictureService}/${args.authorID}`)).text();
          // Potential other data attributes.
        }
      }
      // Potential other tags.
    }
  },
});
```

Patrika's shortcode mechanism is very unopinionated, because it let's the user (you) implement an unlimited number of shortcodes using a single `onShortCode` callback. What would be a tagName in usual markup becomes a shortcode parameter which would show up in your args object. The only optinionated bits is the syntax (strings must be quoted with double quotes). Valid (made up) examples are

```markdown
[P:I toRender="picture" assetId=42]
[P:I tagName="postLink" postId="a-particular-post" title="Link to a particular post" text="Click here"]
[P:I foo="bar" baz=42 qux=3.14 quux=true corge=false]
```

At the moment there's just one tag, `[P:I]` (Patrika:inline) which is intended for standalone content. Eventually, we'll also provide a mechanism to enclose content (to create excerpts, for instance).
