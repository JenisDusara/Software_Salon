/** Returns the default tenant ID from env — used in all API routes */
export function getTenantId(): string {
  const id = process.env.DEFAULT_TENANT_ID;
  if (!id) throw new Error("DEFAULT_TENANT_ID not set in .env");
  return id;
}
