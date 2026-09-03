const test = require("node:test");
const assert = require("node:assert/strict");
const { listFilesSchema } = require("../validators/fileValidation");

test("list files validation applies defaults for empty input", () => {
  const result = listFilesSchema.safeParse({});

  assert.equal(result.success, true);
  assert.equal(result.data.page, 1);
  assert.equal(result.data.limit, 20);
  assert.equal(result.data.sort, "-createdAt");
});

test("list files validation coerces query string values", () => {
  const result = listFilesSchema.safeParse({ page: "3", limit: "50", sort: "originalName" });

  assert.equal(result.success, true);
  assert.equal(result.data.page, 3);
  assert.equal(result.data.limit, 50);
  assert.equal(result.data.sort, "originalName");
});

test("list files validation rejects unknown keys and invalid values", () => {
  assert.equal(listFilesSchema.safeParse({ owner: "attacker" }).success, false);
  assert.equal(listFilesSchema.safeParse({ page: "abc" }).success, false);
  assert.equal(listFilesSchema.safeParse({ page: "0" }).success, false);
  assert.equal(listFilesSchema.safeParse({ limit: "101" }).success, false);
  assert.equal(listFilesSchema.safeParse({ sort: "size" }).success, false);
});
