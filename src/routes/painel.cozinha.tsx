import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ElapsedBadge, OrderDetailDialog } from "@/components/OrderDetails";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/AdminShell";
import { useStore, useCurrentUser, type OrderStatus, type Order } from "@/lib/store";

export const Route = createFileRoute("/painel/cozinha")({ component: KDS });

const COLS: { key: OrderStatus; label: string; dot: string; next?: OrderStatus; action?: string }[] = [
  { key: "novo", label: "Novo", dot: "bg-info", next: "preparando", action: "Iniciar preparo" },
  { key: "preparando", label: "Preparando", dot: "bg-warning", next: "pronto", action: "Marcar pronto" },
  { key: "pronto", label: "Pronto", dot: "bg-success", next: "entregue", action: "Entregar" },
  { key: "entregue", label: "Entregue", dot: "bg-muted-foreground" },
];

const today = new Date().toDateString();

function KDS() {
  const user = useCurrentUser()!;
  const orders = useStore((s) => s.orders);
  const setOrderStatus = useStore((s) => s.setOrderStatus);
  const [detail, setDetail] = useState<Order | null>(null);
  const mine = orders.filter((o) => o.restaurant_id === user.restaurant_id && new Date(o.createdAt).toDateString() === today);

  return (
    <div>
      <PageHeader title="Cozinha" subtitle="Atualiza em tempo real — abra o cardápio do cliente em outra aba para testar." />
      {!mine.some((o) => o.status !== "entregue") && (
        <div className="mb-6">
          <EmptyState art="kitchen" title="Nenhum pedido no momento, aproveite a calmaria" description="Novos pedidos aparecem aqui automaticamente assim que forem feitos." />
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-4 xl:gap-4">
        {COLS.map((c) => {
          const list = mine.filter((o) => o.status === c.key);
          return (
            <div key={c.key} className="flex min-w-0 flex-col rounded-2xl bg-muted/60 p-2.5 md:max-h-[calc(100vh-9rem)] xl:p-3">
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                <h2 className="font-sans text-sm font-bold uppercase tracking-widest">{c.label}</h2>
                <span className="ml-auto rounded-full bg-card px-2 text-xs font-bold">{list.length}</span>
              </div>
              <div className="-mx-1 flex-1 space-y-3 overflow-y-auto px-1 pb-1">
                {list.map((o) => (
                  <div key={o.id} role="button" tabIndex={0} onClick={() => setDetail(o)} onKeyDown={(e) => e.key === "Enter" && setDetail(o)} className="cursor-pointer rounded-xl bg-card p-3 shadow-soft transition hover:ring-2 hover:ring-primary/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-display text-xl font-bold">Mesa {o.table}</span>
                      {c.key !== "entregue" && <ElapsedBadge order={o} />}
                    </div>
                    <ul className="mt-2 space-y-0.5 text-sm">
                      {o.items.map((i, idx) => <li key={idx}><b>{i.qty}×</b> {i.name}{!!i.modifiers?.length && <span className="block pl-5 text-xs text-muted-foreground">{i.modifiers.join(", ")}</span>}{i.note && <span className="block pl-5 text-xs font-semibold text-destructive">Obs: {i.note}</span>}</li>)}
                    </ul>
                    {c.next && (
                      <Button variant={c.key === "novo" ? "default" : "secondary"} className="mt-3 h-11 w-full" onClick={(e) => { e.stopPropagation(); setOrderStatus(o.id, c.next!); }}>
                        {c.action} <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                {!list.length && <EmptyState compact art="kitchen" title={c.key === "entregue" ? "Nada entregue hoje" : "Nada por aqui"} />}
              </div>
            </div>
          );
        })}
      </div>
      <OrderDetailDialog order={detail ? mine.find((o) => o.id === detail.id) ?? null : null} onClose={() => setDetail(null)} />
    </div>
  );
}
