// Server Component — owns route segment config so Next.js skips static-path generation
export const dynamic = "force-dynamic";
export function generateStaticParams() {
  return []; // No pre-rendered paths — all resolved at runtime
}

import TenantDetailClient from "./TenantDetailClient";

export default function TenantDetailPage() {
  return <TenantDetailClient />;
}
