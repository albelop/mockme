import z from 'zod';

const LiteralSchema = z.union([z.string(), z.number(), z.boolean(), z.null()]);

const JsonSchema = z.lazy(() =>
  z.union([LiteralSchema, z.array(JsonSchema), z.record(JsonSchema)]),
);

const BodySchema = JsonSchema.optional();

const ConditionsSchema = z.object({
  url: z.record(z.string(), LiteralSchema).optional(), // pathParams
  query: z.record(z.string(), LiteralSchema).optional(), // queryParams
  headers: z.record(z.string(), LiteralSchema).optional(),
  cookies: z.record(z.string(), LiteralSchema).optional(),
  body: JsonSchema.optional(),
});

const RequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'HEAD', 'DELETE', 'OPTIONS']),
  path: z.string(),
  body: BodySchema,
  conditions: ConditionsSchema.optional(),
});

const ResponseObjectSchema = z.object({
  headers: JsonSchema.optional(),
  body: BodySchema,
  status: z.number(),
});

const ResponseSchema = z.union([
  z.function().args(RequestSchema.optional()).returns(ResponseObjectSchema),
  ResponseObjectSchema,
]);

export const MockSchema = z.object({
  request: RequestSchema,
  response: ResponseSchema,
  delay: z.number().optional(),
  scenario: z.string().optional(),
  // states: z.array(z.record(z.any())).optional(),
});
