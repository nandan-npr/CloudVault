# CloudVault

CloudVault is a MERN application with a React/Vite client and an Express/MongoDB API.

## Secure local setup

1. Copy `server/.env.example` to `server/.env` and set every value with environment-specific secrets.
2. Copy `client/.env.example` to `client/.env` and set `VITE_API_URL` when the API is not local.
3. Install packages in each directory with `npm ci`.
4. Run the API with `npm run dev` from `server`, then run the client with `npm run dev` from `client`.

The server validates its environment at startup and refuses to start when required variables are invalid or absent. Never commit, email, or archive `.env` files.

### Environment variables

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | MongoDB connection string. |
| `JWT_ACCESS_SECRET` | Random 32+ character secret used only for 15-minute access tokens. |
| `CLIENT_URL` | Canonical client origin for CORS and reset links. |
| `CORS_ORIGINS` | Comma-separated extra allowed frontend origins. |
| `COOKIE_SECURE` / `COOKIE_SAME_SITE` | Refresh-cookie transport settings. Use `true` and `none` only for HTTPS cross-site deployments. |
| `SMTP_*` | SMTP configuration for password-reset email. |

## Security design

- Access tokens are kept only in browser memory and expire after 15 minutes.
- Rotating opaque refresh tokens are stored hashed in MongoDB and sent only in `HttpOnly` cookies.
- Login/register/reset endpoints are rate limited; failed logins temporarily lock accounts.
- Requests are schema-validated with Zod before database access.
- Helmet, restricted CORS, compression, request-size limits, structured/redacted logs, and centralized errors protect the API surface.
- Password hashes use bcrypt with 12 rounds.

## Checks

Run from `server`: `npm run lint` and `npm test`.

Run from `client`: `npm run lint`, `npm run format:check`, and `npm run build`.

## Current scope

The supplied project has no file upload, download, folder, rename, delete, or profile API endpoints. Add those only with ownership authorization, safe object storage, MIME/extension allowlists, size limits, path-independent identifiers, and secure download headers; see the deployment checklist.

## Creating a source archive

Use `git archive` or an artifact pipeline that includes tracked source only. Do not zip the working directory: that can include `.env`, `.git`, and `node_modules`.
