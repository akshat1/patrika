import assert from "node:assert";
import { test, suite } from "node:test";
import { start, tokenizer } from "./inline";

suite("start", () => {
  test("should return the index of the next potential start of the custom token", () => {
    assert.strictEqual(start("This is some [P:I foo=bar] custom markdown"), 13);
    assert.strictEqual(start("[P:I foo=bar] custom markdown"), 0);
  });

  test("should return undefined if there is no potential start of the custom token", () => {
    assert.strictEqual(start("This is some regular markdown"), undefined);
    assert.strictEqual(start("This is markdown with escaped \\[P:I foo=bar] shortcode."), undefined);
    assert.strictEqual(start("This is markdown with incorrectly placed BLAH[P:I foo=bar] shortcode."), undefined);
  });
});

suite("tokenizer", () => {
  test("should return a custom token with the correct type, raw, text, tokens, and args", () => {
    const src = "[P:I pa=\"foo\" pb=\"bar\" pc=0 pd=true pe=\"baz\" pf=1.5]";
    const token = tokenizer(src);
    assert.deepStrictEqual(token, {
      type: "P:I",
      raw : src,
      text: src,
      html: "",
      args: {
        pa: "foo",
        pb: "bar",
        pc: 0,
        pd: true,
        pe: "baz",
        pf: 1.5,
      },
    });
  });

  test("should correctly parse parameter values with various characters", () => {
    const src = "[P:I pa=\"postLink\" pb=\"string-with-dashes\" pc=\"string with escaped \\\" quotes\" pd=2 pe=3.14 pf=true pg=false]";
    const token = tokenizer(src);
    assert.deepStrictEqual(token, {
      type: "P:I",
      raw : src,
      text: src,
      html: "",
      args: {
        pa: "postLink",
        pb: "string-with-dashes",
        pc: "string with escaped \" quotes",
        pd: 2,
        pe: 3.14,
        pf: true,
        pg: false,
      },
    });
  });
});
