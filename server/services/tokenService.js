const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const env = require("../config/env");

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REFRESH_COOKIE = "cloudvault_refresh";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (userId) =>
  jwt.sign({ sub: userId.toString(), type: "access" }, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
    issuer: "cloudvault-api",
    audience: "cloudvault-client",
  });

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/api/auth",
  maxAge: REFRESH_TOKEN_TTL_MS,
};

const clearRefreshCookieOptions = {
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/api/auth",
};

const issueRefreshToken = async (userId, request) => {
  const token = crypto.randomBytes(48).toString("hex");
  await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    userAgent: request.get("user-agent") || "",
    ip: request.ip,
  });
  return token;
};

const setRefreshCookie = (response, token) => response.cookie(REFRESH_COOKIE, token, refreshCookieOptions);
const clearRefreshCookie = (response) => response.clearCookie(REFRESH_COOKIE, clearRefreshCookieOptions);

module.exports = {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE,
  createAccessToken,
  hashToken,
  issueRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
};
