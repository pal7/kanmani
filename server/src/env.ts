import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  AZURE_FOUNDRY_ENDPOINT: z.string().url(),
  AZURE_FOUNDRY_API_KEY: z.string().min(1),
  AZURE_FOUNDRY_DEPLOYMENT_GPT4O: z.string().min(1),
  AZURE_FOUNDRY_DEPLOYMENT_GPT4O_MINI: z.string().min(1),
  AZURE_FOUNDRY_DEPLOYMENT_PHI4: z.string().min(1),
  AZURE_FOUNDRY_API_VERSION: z.string().regex(
    /^\d{4}-\d{2}-\d{2}(-preview)?$/,
    'Expected a date-formatted API version like 2024-10-21',
  ),

  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters').optional(),
  CLIENT_ORIGIN: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const problems = result.error.issues
    .map((issue) => `  ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  // Throw synchronously so the process never reaches listen(). A missing env
  // var that only surfaces on the first request is much harder to diagnose
  // than a crash at startup.
  throw new Error(`Server cannot start — invalid environment:\n${problems}`);
}

export const env = result.data;
