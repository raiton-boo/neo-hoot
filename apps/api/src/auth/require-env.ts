export function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required enviroment variable: ${key}`);
  }
  return value;
}
