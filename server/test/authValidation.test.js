const test = require("node:test");
const assert = require("node:assert/strict");
const { registerSchema, loginSchema } = require("../validators/authValidation");

test("registration validation accepts a strong confirmed password", () => {
  const result = registerSchema.safeParse({
    fullName: "Ada Lovelace",
    email: "ADA@EXAMPLE.COM",
    password: "SecurePass123!",
    confirmPassword: "SecurePass123!",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.email, "ada@example.com");
});

test("login validation rejects malformed requests", () => {
  assert.equal(loginSchema.safeParse({ email: { $ne: "" }, password: "x" }).success, false);
});
