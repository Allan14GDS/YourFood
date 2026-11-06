import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel do restaurante — yourFood" },
      { name: "description", content: "Gestão de mesas, cozinha e cardápio." },
      { property: "og:title", content: "Painel do restaurante — yourFood" },
      { property: "og:description", content: "Gestão de mesas, cozinha e cardápio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => (
    <AdminShell allow={["atendente", "gerente"]}>
      <Outlet />
    </AdminShell>
  ),
});
