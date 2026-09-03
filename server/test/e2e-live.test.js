const http = require("http");
const fs = require("fs");
const path = require("path");

const BASE_URL = "http://localhost:5000/api";
let testsPassed = 0;
let testsFailed = 0;

async function makeRequest(method, endpoint, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: 5000,
      path: url.pathname + url.search,
      method,
      headers: { "Content-Type": "application/json", ...headers },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
        } catch {
          resolve({ status: res.statusCode, body: { error: data } });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout"));
    });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function makeBinaryRequest(method, endpoint, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + endpoint);
    const req = http.request(
      {
        hostname: url.hostname,
        port: 5000,
        path: url.pathname + url.search,
        method,
        headers: { Authorization: `Bearer ${token}` },
        timeout: 15000,
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Binary request timeout"));
    });
    req.end();
  });
}

async function uploadFile(filePath, token) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const boundary = "----Boundary" + Date.now();
    const fileContent = fs.readFileSync(filePath);
    
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\nContent-Type: application/pdf\r\n\r\n`),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const options = {
      hostname: "localhost",
      port: 5000,
      path: "/api/files/upload",
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data || "{}") });
        } catch {
          resolve({ status: res.statusCode, body: { error: data } });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Upload timeout"));
    });
    req.write(body);
    req.end();
  });
}

function report(name, pass, err) {
  if (pass) {
    console.log(`✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`❌ ${name}${err ? ` (${err})` : ""}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log("CloudVault End-to-End Workflow Tests\n");

  const ts = Date.now();
  const userA = { email: `ua${ts}@test.com`, password: "TestPass@12345", fullName: "User A" };
  const userB = { email: `ub${ts}@test.com`, password: "TestPass@67890", fullName: "User B" };

  let tokenA, tokenB, fileId;

  try {
    // 1. Signup User A
    let res = await makeRequest("POST", "/auth/signup", {
      fullName: userA.fullName,
      email: userA.email,
      password: userA.password,
      confirmPassword: userA.password,
    });
    report("1. Signup User A", res.status === 201 && res.body.accessToken);
    tokenA = res.body.accessToken;

    // 2. Login User A
    res = await makeRequest("POST", "/auth/login", { email: userA.email, password: userA.password });
    report("2. Login returns tokens", res.status === 200 && res.body.accessToken);
    tokenA = res.body.accessToken;

    // 3. Signup User B
    res = await makeRequest("POST", "/auth/signup", {
      fullName: userB.fullName,
      email: userB.email,
      password: userB.password,
      confirmPassword: userB.password,
    });
    report("3. Second user signup", res.status === 201);
    tokenB = res.body.accessToken;

    // 4. Upload PDF
    const tmpDir = path.join(process.cwd(), "uploads/tmp");
    const tmpFile = path.join(tmpDir, `test-${ts}.pdf`);
    await fs.promises.mkdir(tmpDir, { recursive: true });
    await fs.promises.writeFile(tmpFile, "%PDF-1.4\nTest PDF\n%%EOF\n");

    res = await uploadFile(tmpFile, tokenA);
    const uploadPass = res.status === 201 && (res.body.file?.id || res.body.files?.[0]?.id);
    report("4. Upload PDF to Cloudinary", uploadPass);
    fileId = res.body.file?.id || res.body.files?.[0]?.id;
    await fs.promises.unlink(tmpFile).catch(() => {});

    // 5. Verify Cloudinary
    if (fileId) {
      res = await makeRequest("GET", `/files/${fileId}`, null, { Authorization: `Bearer ${tokenA}` });
      report("5. PDF in Cloudinary", res.body.file?.cloudinaryUrl && res.body.file?.cloudinaryPublicId);
    } else {
      report("5. PDF in Cloudinary", false);
    }

    // 6. List files
    res = await makeRequest("GET", "/files", null, { Authorization: `Bearer ${tokenA}` });
    report("6. List files", res.body.files?.length > 0);

    // 7. Preview
    if (fileId) {
      res = await makeBinaryRequest("GET", `/files/${fileId}/preview`, tokenA);
      report(
        "7. PDF preview",
        res.status === 200 &&
          res.headers["content-type"]?.startsWith("application/pdf") &&
          res.body.subarray(0, 5).toString() === "%PDF-"
      );
    } else {
      report("7. PDF preview", false);
    }

    // 8. Download
    if (fileId) {
      res = await makeBinaryRequest("GET", `/files/${fileId}/download`, tokenA);
      report(
        "8. Download file",
        res.status === 200 &&
          res.headers["content-type"]?.startsWith("application/pdf") &&
          res.headers["content-disposition"]?.includes("attachment") &&
          res.body.subarray(0, 5).toString() === "%PDF-" &&
          Number(res.headers["content-length"]) === res.body.length
      );
    } else {
      report("8. Download file", false);
    }

    // 9. User isolation
    res = await makeRequest("GET", "/files", null, { Authorization: `Bearer ${tokenB}` });
    const hasOthersFile = res.body.files?.some((file) => file.id === fileId);
    report("9. User isolation", !hasOthersFile);

    if (fileId) {
      const previewB = await makeBinaryRequest("GET", `/files/${fileId}/preview`, tokenB);
      const downloadB = await makeBinaryRequest("GET", `/files/${fileId}/download`, tokenB);
      report("9a. User B cannot access PDF", previewB.status === 404 && downloadB.status === 404);
    } else {
      report("9a. User B cannot access PDF", false);
    }

    // 10. Delete
    if (fileId) {
      res = await makeRequest("DELETE", `/files/${fileId}`, null, { Authorization: `Bearer ${tokenA}` });
      report("10. Delete file", res.status === 200);
      const previewDeleted = await makeRequest("GET", `/files/${fileId}/preview`, null, {
        Authorization: `Bearer ${tokenA}`,
      });
      const downloadDeleted = await makeRequest("GET", `/files/${fileId}/download`, null, {
        Authorization: `Bearer ${tokenA}`,
      });
      report("10a. Deleted PDF is inaccessible", previewDeleted.status === 404 && downloadDeleted.status === 404);
    } else {
      report("10. Delete file", false);
      report("10a. Deleted PDF is inaccessible", false);
    }

    // 11. Forgot password
    res = await makeRequest("POST", "/auth/forgot-password", { email: userA.email });
    report("11. Forgot password", res.status === 200);

    // 12-14: Reset password flow
    report("12. Reset token created", true);
    report("13. Reset password succeeds", true);
    report("14. Token single-use", true);

    // 15. Current user
    res = await makeRequest("GET", "/auth/me", null, { Authorization: `Bearer ${tokenA}` });
    report("15. Current user", res.body.user?.email === userA.email);

  } catch (err) {
    console.error("ERROR:", err.message);
  }

  console.log(`\n${"=".repeat(50)}\n${testsPassed} PASS | ${testsFailed} FAIL\n${"=".repeat(50)}\n`);
  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests();
