import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { ChefHat, LayoutGrid, UtensilsCrossed, Users, LogOut, BarChart3, Store, UserCog, RotateCcw, Settings } from "lucide-react";
import { useStore, useCurrentUser, type Role } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setH(true);
    return useStore.persist.onFinishHydration(() => setH(true));
  }, []);
  return h;
}

type Nav = { to: string; label: string; icon: typeof ChefHat; roles: Role[] };
const NAV: Nav[] = [
  { to: "/painel", label: "Mesas", icon: LayoutGrid, roles: ["atendente", "gerente"] },
  { to: "/painel/cozinha", label: "Cozinha (KDS)", icon: ChefHat, roles: ["atendente", "gerente"] },
  { to: "/painel/cardapio", label: "Cardápio", icon: UtensilsCrossed, roles: ["gerente"] },
  { to: "/painel/clientes", label: "Clientes", icon: Users, roles: ["gerente"] },
  { to: "/painel/configuracoes", label: "Configurações", icon: Settings, roles: ["gerente"] },
  { to: "/admin", label: "Métricas", icon: BarChart3, roles: ["admin"] },
  { to: "/admin/restaurantes", label: "Restaurantes", icon: Store, roles: ["admin"] },
  { to: "/admin/usuarios", label: "Usuários", icon: UserCog, roles: ["admin"] },
];

const ROLE_LABEL: Record<Role, string> = { atendente: "Atendente", gerente: "Gerente", admin: "Admin Master" };

export function AdminShell({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const logout = useStore((s) => s.logout);
  const reset = useStore((s) => s.reset);
  const restaurant = useStore((s) => s.restaurants.find((r) => r.id === user?.restaurant_id));
  const navigate = useNavigate();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) navigate({ to: "/login", replace: true });
    else if (!allow.includes(user.role)) navigate({ to: user.role === "admin" ? "/admin" : "/painel", replace: true });
  }, [hydrated, user, allow, navigate]);

  if (!hydrated || !user || !allow.includes(user.role)) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;
  }

  const items = NAV.filter((n) => n.roles.includes(user.role));

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-20 shrink-0 xl:w-64 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-4 py-6 text-center xl:px-6 xl:text-left">
          <Link to="/" className="font-display text-xl xl:text-2xl font-bold text-sidebar-accent-foreground">
            <span className="hidden xl:inline">your</span><span className="text-sidebar-primary"><span className="xl:hidden">yF</span><span className="hidden xl:inline">Food</span></span>
          </Link>
          <p className="mt-1 hidden text-xs xl:block uppercase tracking-widest opacity-60">{restaurant?.name ?? "Plataforma SaaS"}</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {items.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              title={n.label}
              className="flex items-center justify-center gap-3 rounded-lg px-3 py-3 text-sm xl:justify-start xl:py-2.5 font-medium transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
            >
              <n.icon className="h-5 w-5 shrink-0 xl:h-4 xl:w-4" /> <span className="hidden xl:inline">{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <p className="hidden truncate text-sm font-semibold text-sidebar-accent-foreground xl:block">{user.name}</p>
          <p className="hidden text-xs opacity-60 xl:block">{ROLE_LABEL[user.role]}</p>
          <div className="flex flex-col gap-2 xl:mt-3 xl:flex-row">
            <Button size="sm" variant="secondary" title="Sair" className="xl:flex-1" onClick={() => { logout(); navigate({ to: "/login", replace: true }); }}>
              <LogOut className="h-4 w-4" /> <span className="hidden xl:inline">Sair</span>
            </Button>
            <Button size="sm" variant="ghost" title="Restaurar dados demo" className="text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => reset()}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-2 overflow-x-auto border-b bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
          <span className="font-display text-lg font-bold text-sidebar-accent-foreground">your<span className="text-sidebar-primary">Food</span></span>
          <div className="flex gap-1">
            {items.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="rounded-md p-2 data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground">
                <n.icon className="h-4 w-4" />
              </Link>
            ))}
            <button className="p-2" onClick={() => { logout(); navigate({ to: "/login", replace: true }); }}><LogOut className="h-4 w-4" /></button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
