const { z } = require("zod");

const listFilesSchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "createdAt",
        "-createdAt",
        "uploadedAt",
        "-uploadedAt",
        "originalName",
        "-originalName",
        "fileSize",
        "-fileSize",
      ])
      .default("-createdAt"),
    search: z.string().trim().max(100).optional(),
    type: z.string().trim().max(32).optional(),
    folder: z.string().trim().max(64).optional(),
    year: z.coerce.number().int().min(1970).max(3000).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD")
      .optional(),
    minSize: z.coerce.number().int().min(0).optional(),
    maxSize: z.coerce.number().int().min(0).optional(),
  })
  .strict();

module.exports = { listFilesSchema };
