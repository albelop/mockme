import z from 'zod';

export const ConfigurationSchema = z.object({
  input: z.union([z.string(), z.array(z.string())]),
  output: z.string().optional(),
  plugins: z.array(z.function()).optional(),
});
