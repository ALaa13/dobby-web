// Define the type of your environment variables.
declare interface Env {
  readonly NODE_ENV: string;
  readonly NG_APP_BACKEND_URL: string; // 👈 Add your variable explicitly here for autocomplete!
}

// Use import.meta.env.YOUR_ENV_VAR in your code (modern convention)
declare interface ImportMeta {
  readonly env: Env;
}
