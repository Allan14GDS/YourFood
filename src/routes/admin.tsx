import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Master — yourFood" },
      { name: "description", content: "Gestão da plataforma yourFood." },
      { property: "og:title", content: "Admin Master — yourFood" },
      { property: "og:description", content: "Gestão da plataforma yourFood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell allow={["admin"]}>
      <Outlet />
    </AdminShell>
  ),
});
