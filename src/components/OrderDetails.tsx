import { useEffect, useState } from "react";
import { Timer, MessageSquareText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brl, minutesInStatus, orderTotal, type Order, type OrderStatus } from "@/lib/store";

const LABEL: Record<OrderStatus, string> = { novo: "Novo", preparando: "Preparando", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado" };

/** Re-renders every 30s so elapsed timers stay current. */
export function useNow(interval = 30000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

export const formatElapsed = (min: number) => (min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`);

export function ElapsedBadge({ order }: { order: Order }) {
  const now = useNow();
  const min = minutesInStatus(order, now);
  const tone = min >= 20 ? "bg-destructive text-destructive-foreground" : min >= 10 ? "bg-warning/30 text-warning-foreground" : "bg-success/15 text-success";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold normal-case ${tone}`} title="Tempo nesta etapa">
      <Timer className="h-3 w-3" />{formatElapsed(min)}
    </span>
  );
}

export function OrderDetailDialog({ order, onClose }: { order: Order | null; onClose: () => void }) {
  return (
    <Dialog open={!!order} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        {order && (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-3xl">Mesa {order.table}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold">{LABEL[order.status]}</span>
                {order.status !== "entregue" && order.status !== "cancelado" && <ElapsedBadge order={order} />}
                <span>Feito às {new Date(order.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · via {order.origin}</span>
              </div>
            </DialogHeader>
            <ul className="divide-y">
              {order.items.map((i, idx) => (
                <li key={idx} className="py-3">
                  <div className="flex justify-between gap-3 font-semibold">
                    <span><span className="text-primary">{i.qty}×</span> {i.name}</span>
                    <span>{brl(i.qty * i.price)}</span>
                  </div>
                  {!!i.modifiers?.length && (
                    <ul className="mt-1 space-y-0.5 pl-6 text-sm text-muted-foreground">
                      {i.modifiers.map((m) => <li key={m}>• {m}</li>)}
                    </ul>
                  )}
                  {i.note && (
                    <p className="mt-2 flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
                      <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0" />{i.note}
                    </p>
                  )}
                  <p className="mt-1 pl-6 text-xs text-muted-foreground">{brl(i.price)} cada</p>
                </li>
              ))}
            </ul>
            <div className="flex justify-between border-t pt-3 font-display text-2xl font-bold">
              <span>Subtotal</span><span>{brl(orderTotal(order))}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
