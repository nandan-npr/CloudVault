const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.RESEND_API_KEY = "re_test_contract_key";

const authRouter = require("../routes/authRoutes");

const routePaths = authRouter.stack
  .filter((layer) => layer.route)
  .map((layer) => layer.route.path);

test("auth routes expose signup and reset-password token routes", () => {
  assert.ok(routePaths.includes("/signup"));
  assert.ok(routePaths.some((path) => path.includes(":token") || path.includes("/reset-password/")));
});
