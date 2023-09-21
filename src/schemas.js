import z from "zod";

const literalSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);
const jsonSchema = z.lazy(() =>
  z.union([literalSchema, z.array(jsonSchema), z.record(jsonSchema)])
);

const MockRequestSchema = z.object({
  method: z.enum([
    "GET",
    "POST",
    "PUT",
    "HEAD",
    "DELETE",
    "OPTIONS",
    "CONNECT",
  ]),
  path: z.string(),
  body: jsonSchema.optional(),
  conditions: z
    .object({
      url: jsonSchema.optional(),
      query: jsonSchema.optional(),
      header: jsonSchema.optional(),
      cookie: jsonSchema.optional(),
      body: jsonSchema.optional(),
    })
    .optional(),
});
const PlainObjectResponse = z.object({
  headers: jsonSchema.optional(),
  body: jsonSchema.optional(),
  status: z.number().optional(),
});
const MockResponseSchema = z.union([
  z.custom((value) => {
    return typeof value === "function";
  }),
  PlainObjectResponse,
]);

export const mockSchema = z.object({
  request: MockRequestSchema,
  response: MockResponseSchema.optional(),
  delay: z.number().optional(),
  scenario: z.string().optional(),
  // states: z.array(z.record(z.any())).optional(),
});

export const configSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  output: z.string().optional(),
  plugins: z.array(z.function()).optional(),
});
