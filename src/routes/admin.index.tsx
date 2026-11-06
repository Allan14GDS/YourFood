import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Store, Users, Receipt, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/AdminShell";
import { useStore, brl } from "@/lib/store";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

type Period = "dia" | "semana" | "mes";

function bucketKey(d: Date, p: Period) {
  if (p === "dia") return d.toISOString().slice(0, 10);
  if (p === "mes") return d.toISOString().slice(0, 7);
  const t = new Date(d);
  t.setDate(t.getDate() - ((t.getDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
}
function bucketLabel(k: string, p: Period) {
  if (p === "mes") { const [y, m] = k.split("-"); return `${m}/${(y ?? "").slice(2)}`; }
  const [, m, d] = k.split("-");
  return p === "semana" ? `sem ${d}/${m}` : `${d}/${m}`;
}

function Dashboard() {
  const restaurants = useStore((s) => s.restaurants);
  const sessions = useStore((s) => s.sessions);
  const users = useStore((s) => s.users);
  const [rid, setRid] = useState("all");
  const [period, setPeriod] = useState<Period>("dia");

  const closed = sessions.filter((s) => s.closedAt && (rid === "all" || s.restaurant_id === rid));
  const revenue = closed.reduce((a, s) => a + (s.total ?? 0), 0);

  const data = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of closed) {
      const k = bucketKey(new Date(s.closedAt!), period);
      m.set(k, (m.get(k) ?? 0) + (s.total ?? 0));
    }
    const arr = [...m.entries()].sort(([a], [b]) => a.localeCompare(b));
    const limit = period === "dia" ? 14 : period === "semana" ? 8 : 6;
    return arr.slice(-limit).map(([k, v]) => ({ label: bucketLabel(k, period), total: Math.round(v * 100) / 100 }));
  }, [closed, period]);

  const stats = [
    { label: "Restaurantes ativos", value: restaurants.filter((r) => r.status === "ativo").length, icon: Store },
    { label: "Usuários", value: users.filter((u) => u.role !== "admin").length, icon: Users },
    { label: "Mesas fechadas", value: closed.length, icon: Receipt },
    { label: "Faturamento", value: brl(revenue), icon: TrendingUp },
  ];

  return (
    <div>
      <PageHeader title="Visão global" subtitle="Métricas da plataforma yourFood" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <s.icon className="h-5 w-5 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{s.label}</p>
            <p className="font-display text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Relatório de vendas</h2>
          <div className="flex gap-2">
            <Select value={rid} onValueChange={setRid}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os restaurantes</SelectItem>
                {restaurants.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex rounded-lg bg-muted p-1 text-sm font-semibold">
              {(["dia", "semana", "mes"] as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`rounded-md px-3 py-1 capitalize ${period === p ? "bg-card shadow-soft" : "text-muted-foreground"}`}>{p === "mes" ? "Mês" : p}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" stroke="var(--muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v: number) => brl(v)} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="total" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
