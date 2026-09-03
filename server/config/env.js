const { z } = require("zod");

const parseOrigins = (value = "") =>
  String(value)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(5000),
    MONGO_URI: z.string().url("MONGO_URI must be a valid MongoDB connection URL").optional(),
    MONGODB_URI: z.string().url("MONGODB_URI must be a valid MongoDB connection URL").optional(),
    JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters").optional(),
    FRONTEND_URL: z.string().url("FRONTEND_URL must be a valid URL").optional(),
    CLIENT_URL: z.string().url("CLIENT_URL must be a valid URL").optional(),
    CORS_ORIGINS: z.string().optional(),
    COOKIE_SECURE: z.enum(["true", "false"]).optional(),
    COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
    FILE_STORAGE_DIR: z.string().min(1, "FILE_STORAGE_DIR is required").default("uploads"),
    MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(500).default(50),
    CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required").optional(),
    CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required").optional(),
    CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required").optional(),
    RESEND_API_KEY: z.string().min(1, "RESEND_API_KEY is required").optional(),
    EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address").optional(),
    SMTP_HOST: z.string().min(1, "SMTP_HOST is required").optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_USER: z.string().min(1, "SMTP_USER is required").optional(),
    SMTP_PASS: z.string().min(1, "SMTP_PASS is required").optional(),
    SMTP_FROM: z.string().email("SMTP_FROM must be a valid email address").optional(),
  })
  .transform((value) => {
    const mongoUri = value.MONGO_URI || value.MONGODB_URI || (value.NODE_ENV === "production" ? undefined : "mongodb://localhost:27017/cloudvault");
    const jwtSecret = value.JWT_SECRET || value.JWT_ACCESS_SECRET || (value.NODE_ENV === "production" ? undefined : "dev_jwt_secret_32_chars_minimum_here");
    const frontendUrl = value.FRONTEND_URL || value.CLIENT_URL || (value.NODE_ENV === "production" ? undefined : "http://localhost:5173");
    const corsOrigins = parseOrigins(value.CORS_ORIGINS || frontendUrl || "");
    return {
      ...value,
      MONGODB_URI: mongoUri,
      MONGO_URI: mongoUri,
      JWT_ACCESS_SECRET: jwtSecret,
      JWT_SECRET: jwtSecret,
      FRONTEND_URL: frontendUrl,
      CLIENT_URL: frontendUrl,
      corsOrigins,
      cookieSecure: value.COOKIE_SECURE ? value.COOKIE_SECURE === "true" : value.NODE_ENV === "production",
    };
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === "production") {
      if (!value.cookieSecure) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "COOKIE_SECURE must be true in production",
          path: ["COOKIE_SECURE"],
        });
      }

      const required = [
        ["MONGO_URI", value.MONGO_URI],
        ["JWT_SECRET or JWT_ACCESS_SECRET", value.JWT_SECRET],
        ["FRONTEND_URL or CLIENT_URL", value.FRONTEND_URL],
        ["CORS_ORIGINS", value.CORS_ORIGINS],
        ["CLOUDINARY_CLOUD_NAME", value.CLOUDINARY_CLOUD_NAME],
        ["CLOUDINARY_API_KEY", value.CLOUDINARY_API_KEY],
        ["CLOUDINARY_API_SECRET", value.CLOUDINARY_API_SECRET],
        ["RESEND_API_KEY", value.RESEND_API_KEY],
        ["EMAIL_FROM", value.EMAIL_FROM],
      ];

      for (const [name, field] of required) {
        if (!field || /^(replace-|your_|demo-)|example\.com/i.test(field)) {
          context.addIssue({ code: z.ZodIssueCode.custom, message: `${name} must be configured for production`, path: [name] });
        }
      }
    }

    for (const origin of [value.FRONTEND_URL, ...value.corsOrigins].filter(Boolean)) {
      try {
        new URL(origin);
      } catch {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid allowed origin: ${origin}`,
          path: ["CORS_ORIGINS"],
        });
      }
    }

    if (value.COOKIE_SAME_SITE === "none" && !value.cookieSecure) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "COOKIE_SECURE must be true when COOKIE_SAME_SITE is none",
        path: ["COOKIE_SAME_SITE"],
      });
    }
  });

const loadEnv = () => {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
};

module.exports = loadEnv();
