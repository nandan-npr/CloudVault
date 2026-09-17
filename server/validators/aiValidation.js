const { z } = require("zod");

const chatWithFileSchema = z
  .object({
    message: z.string().trim().min(1, "Please enter a question").max(2000),
    history: z
      .array(
        z
          .object({
            role: z.enum(["user", "assistant"]),
            content: z.string().max(2000),
          })
      )
      .max(10)
      .optional(),
  })
  .strict();

module.exports = { chatWithFileSchema };
