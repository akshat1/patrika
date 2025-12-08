import * as assert from "node:assert";
import { test, suite } from "node:test";
import { validate } from "./schema.js";

suite("validate", () => {
  test("should return an empty array when validation is succesful", () => {
    const actual = validate({
      authors    : ["FOO"],
      id         : "foo",
      publishDate: new Date("2022-01-01"),
      title      : "bar",
    });

    assert.deepEqual(actual, []);
  });

  test("should return the list of missing fields when validation fails", () => {
    /// @ts-expect-error We are intentionally testing the validation failure
    assert.deepEqual(validate({
      id     : "foo",
      authors: ["Kalam Wali Bai"],
      title  : "bar",
    }), ["publishDate"]);

    /// @ts-expect-error - :-|
    assert.deepEqual(validate({
      id         : "foo",
      publishDate: new Date("2022-01-01"),
    }), ["title"]);
  });
});
