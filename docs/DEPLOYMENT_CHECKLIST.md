# Production deployment checklist

## Secrets and platform

- [ ] Rotate the database credential and JWT secret that were previously included in the supplied archive.
- [ ] Configure all required environment variables in the hosting platform's secret store.
- [ ] Use a MongoDB user with least-privilege access and IP/network restrictions.
- [ ] Set `NODE_ENV=production`, `COOKIE_SECURE=true`, HTTPS, and an explicit production `CLIENT_URL`/`CORS_ORIGINS` allowlist.
- [ ] Configure a verified SMTP sender and test password-reset delivery.
- [ ] Enable database backups, monitoring, alerting, and secret rotation.

## Application checks

- [ ] Run server lint/tests and client lint/format/build checks in CI.
- [ ] Run dependency scanning (`npm audit` plus a maintained SCA tool) and remediate findings before release.
- [ ] Confirm refresh cookies are `HttpOnly`, `Secure`, and have the intended `SameSite` policy in the deployed browser.
- [ ] Verify CORS rejects an unapproved browser origin.
- [ ] Verify account lockout, refresh-token rotation, logout, password change, and password reset.
- [ ] Verify production error responses do not contain stack traces or secrets.

## Future file-management endpoints

- [ ] Store files outside the web root, preferably in private object storage.
- [ ] Use allowlisted MIME types and extensions, server-side content inspection, strict size limits, and generated storage keys.
- [ ] Reject executable/archive types unless the business case has a dedicated scanner/quarantine process.
- [ ] Authorize ownership/share access for every upload, download, rename, and deletion.
- [ ] Use identifiers rather than user-provided paths; set `Content-Disposition` and `X-Content-Type-Options: nosniff` on downloads.
- [ ] Log security-relevant file operations without filenames that expose sensitive information when avoidable.
