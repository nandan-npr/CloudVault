const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { app } = require("../server");

test("protected file routes reject unauthenticated requests", async () => {
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();

  try {
    const response = await new Promise((resolve, reject) => {
      const request = http.get(`http://127.0.0.1:${port}/api/files`, (res) => {
        res.resume();
        res.on("end", () => resolve(res));
      });
      request.on("error", reject);
    });

    assert.equal(response.statusCode, 401);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
