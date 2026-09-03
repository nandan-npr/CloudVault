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
  })
  .strict();

module.exports = { listFilesSchema };
