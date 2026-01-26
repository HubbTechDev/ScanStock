import { z } from "zod";

/**
 * Environment variable schema using Zod
 * This ensures all required environment variables are present and valid
 */
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().optional().default("3000"),
  NODE_ENV: z.string().optional(),

  // Database Configuration
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required").default("file:dev.db"),

  // Better Auth Configuration
  BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),

  // Used for Better Auth and for Expo client access
  BACKEND_URL: z.url("BACKEND_URL must be a valid URL").default("http://localhost:3000"), // Set via the Vibecode enviroment at run-time

  // Google OAuth Configuration
  // GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  // GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(process.env);
    console.log("✅ Environment variables validated successfully");
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("\n❌ Environment variable validation failed:");
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.error("\n🔍 Troubleshooting steps:");
      console.error("  1. Check that server/.env file exists");
      console.error("  2. Copy server/.env.example to server/.env if missing");
      console.error("  3. Generate BETTER_AUTH_SECRET with: openssl rand -base64 32");
      console.error("  4. Ensure all required variables are set in server/.env");
      console.error("\n📖 See README.md for detailed setup instructions\n");
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Validated and typed environment variables
 */
export const env = validateEnv();

/**
 * Type of the validated environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Extend process.env with our environment variables
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line import/namespace
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
