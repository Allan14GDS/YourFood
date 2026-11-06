import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BellRing, Plus, Minus, X, Percent, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { PageHeader } from "@/components/AdminShell";
import { EmptyState } from "@/components/EmptyState";
import { ElapsedBadge, OrderDetailDialog } from "@/components/OrderDetails";
import { useStore, useCurrentUser, brl, orderTotal, sessionSubtotal, type OrderItem } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/painel/")({ component: Mesas });

const STATUS_LABEL = { novo: "Novo", preparando: "Preparando", pronto: "Pronto", entregue: "Entregue", cancelado: "Cancelado" };

function Mesas() {
  const user = useCurrentUser()!;
  const rid = user.restaurant_id!;
  const restaurant = useStore((s) => s.restaurants.find((r) => r.id === rid))!;
  const sessions = useStore((s) => s.sessions);
  const orders = useStore((s) => s.orders);
  const customers = useStore((s) => s.customers);
  const [selected, setSelected] = useState<number | null>(null);

  const active = sessions.filter((s) => s.restaurant_id === rid && !s.closedAt);
  const alerts = active.filter((s) => s.billRequested);

  return (
    <div>
      <PageHeader title="Mesas" subtitle={`${active.length} de ${restaurant.tables} mesas ocupadas`} />

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((s) => (
            <button key={s.id} onClick={() => setSelected(s.table)} className="flex w-full items-center gap-3 rounded-xl bg-primary px-4 py-3 text-left text-primary-foreground shadow-ember">
              <BellRing className="h-5 w-5 animate-pulse" />
              <span className="flex-1 font-semibold">Mesa {s.table} pediu a conta</span>
              <span className="text-sm opacity-80">Abrir →</span>
            </button>
          ))}
        </div>
      )}

      {active.length === 0 && (
        <div className="mb-6">
          <EmptyState art="tables" title="Salão vazio por enquanto" description="Toque em uma mesa para abri-la, ou aguarde o cliente fazer o pedido pelo QR code." />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 xl:gap-4">
        {Array.from({ length: restaurant.tables }, (_, i) => i + 1).map((t) => {
          const ses = active.find((s) => s.table === t);
          const cust = customers.find((c) => c.id === ses?.customer_id);
          const pending = ses ? orders.filter((o) => o.session_id === ses.id && ["novo", "preparando", "pronto"].includes(o.status)).length : 0;
          return (
            <button
              key={t}
              onClick={() => setSelected(t)}
              className={`relative flex aspect-square flex-col rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-soft ${
                ses?.billRequested ? "border-primary bg-primary/10" : ses ? "bg-card" : "border-dashed bg-transparent"
              }`}
            >
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Mesa</span>
              <span className="font-display text-4xl font-bold">{t}</span>
              {ses ? (
                <div className="mt-auto">
                  <p className="truncate text-sm font-semibold">{cust?.name ?? "Cliente anônimo"}</p>
                  <p className="text-sm text-primary">{brl(sessionSubtotal(orders, ses.id) - ses.discount)}</p>
                  {pending > 0 && <span className="absolute right-3 top-3 rounded-full bg-warning px-2 py-0.5 text-xs font-bold text-warning-foreground">{pending}</span>}
                </div>
              ) : (
                <span className="mt-auto text-sm text-muted-foreground">Livre</span>
              )}
            </button>
          );
        })}
      </div>

      <Sheet open={selected !== null} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg lg:max-w-xl">
          {selected !== null && <TableDetail rid={rid} table={selected} onClose={() => setSelected(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TableDetail({ rid, table, onClose }: { rid: string; table: number; onClose: () => void }) {
  const user = useCurrentUser()!;
  const isManager = user.role === "gerente";
  const session = useStore((s) => s.sessions.find((x) => x.restaurant_id === rid && x.table === table && !x.closedAt));
  const orders = useStore((s) => s.orders);
  const products = useStore((s) => s.products.filter((p) => p.restaurant_id === rid && p.available));
  const customer = useStore((s) => s.customers.find((c) => c.id === session?.customer_id));
  const { openTable, placeOrder, setOrderStatus, closeTable, setDiscount } = useStore.getState();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [draft, setDraft] = useState<Record<string, number>>({});
  const [disc, setDisc] = useState("");
  const [detail, setDetail] = useState<string | null>(null);

  if (!session) {
    return (
      <>
        <SheetHeader><SheetTitle className="font-display text-3xl">Abrir mesa {table}</SheetTitle></SheetHeader>
        <form
          className="space-y-4 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            openTable(rid, table, name ? { name, phone } : undefined);
            toast.success(`Mesa ${table} aberta`);
          }}
        >
          <p className="text-sm text-muted-foreground">Comanda nominal (opcional). O cliente não precisa de senha.</p>
          <div className="space-y-2"><Label>Nome do cliente</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Telefone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" /></div>
          <Button type="submit" className="w-full bg-ember shadow-ember">Abrir mesa</Button>
        </form>
      </>
    );
  }

  const sesOrders = orders.filter((o) => o.session_id === session.id);
  const detailOrder = sesOrders.find((o) => o.id === detail) ?? null;
  const subtotal = sessionSubtotal(orders, session.id);
  const draftItems: OrderItem[] = Object.entries(draft).filter(([, q]) => q > 0).map(([id, qty]) => {
    const p = products.find((x) => x.id === id)!;
    return { product_id: id, name: p.name, price: p.price, qty };
  });

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-display text-3xl">Mesa {table}</SheetTitle>
        <p className="text-sm text-muted-foreground">{customer ? `${customer.name} · ${customer.phone}` : "Cliente anônimo"}</p>
      </SheetHeader>
      <div className="space-y-6 p-4">
        {session.billRequested && <div className="flex items-center gap-2 rounded-lg bg-primary/10 p-3 text-sm font-semibold text-primary"><BellRing className="h-4 w-4" /> Cliente solicitou a conta</div>}

        <section>
          <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground">Pedidos</h3>
          {sesOrders.length === 0 && <EmptyState art="receipt" title="Nenhum pedido nesta mesa" description="Lance um pedido abaixo para enviar à cozinha." />}
          <div className="space-y-2">
            {sesOrders.map((o) => (
              <div key={o.id} role="button" tabIndex={0} onClick={() => setDetail(o.id)} onKeyDown={(e) => e.key === "Enter" && setDetail(o.id)} className={`cursor-pointer rounded-xl border p-3 text-sm transition hover:border-primary ${o.status === "cancelado" ? "opacity-50 line-through" : ""}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">{STATUS_LABEL[o.status]} · {o.origin}{o.status !== "entregue" && o.status !== "cancelado" && <ElapsedBadge order={o} />}</span>
                  {isManager && o.status !== "cancelado" && o.status !== "entregue" && (
                    <button onClick={(e) => { e.stopPropagation(); setOrderStatus(o.id, "cancelado"); toast("Pedido cancelado"); }} className="flex items-center gap-1 text-xs text-destructive"><X className="h-3 w-3" /> Cancelar</button>
                  )}
                </div>
                {o.items.map((i, idx) => <div key={idx} className="flex justify-between gap-2"><span>{i.qty}× {i.name}{!!i.modifiers?.length && <span className="block text-xs text-muted-foreground">{i.modifiers.join(", ")}</span>}{i.note && <span className="block text-xs italic text-muted-foreground">Obs: {i.note}</span>}</span><span>{brl(i.qty * i.price)}</span></div>)}
                <div className="mt-1 text-right font-semibold">{brl(orderTotal(o))}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground">Lançar pedido</h3>
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border p-2">
            {products.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                <span>{p.name} <span className="text-muted-foreground">{brl(p.price)}</span></span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setDraft((d) => ({ ...d, [p.id]: Math.max(0, (d[p.id] ?? 0) - 1) }))} className="rounded bg-muted p-1"><Minus className="h-3 w-3" /></button>
                  <span className="w-4 text-center">{draft[p.id] ?? 0}</span>
                  <button onClick={() => setDraft((d) => ({ ...d, [p.id]: (d[p.id] ?? 0) + 1 }))} className="rounded bg-primary p-1 text-primary-foreground"><Plus className="h-3 w-3" /></button>
                </div>
              </div>
            ))}
          </div>
          <Button className="mt-2 w-full" disabled={!draftItems.length} onClick={() => { placeOrder(rid, session.id, draftItems, "atendente"); setDraft({}); toast.success("Pedido enviado à cozinha"); }}>
            Enviar à cozinha
          </Button>
        </section>

        {isManager && (
          <section>
            <h3 className="mb-2 font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground">Desconto</h3>
            <div className="flex gap-2">
              <Input type="number" min={0} placeholder="Valor em R$" value={disc} onChange={(e) => setDisc(e.target.value)} />
              <Button variant="outline" onClick={() => { setDiscount(session.id, Math.min(subtotal, Number(disc) || 0)); toast.success("Desconto aplicado"); }}><Percent className="h-4 w-4" /> Aplicar</Button>
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-ink p-4 text-ink-foreground">
          <div className="flex justify-between text-sm opacity-70"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
          {session.discount > 0 && <div className="flex justify-between text-sm text-primary"><span>Desconto</span><span>−{brl(session.discount)}</span></div>}
          <div className="mt-1 flex justify-between font-display text-2xl font-bold"><span>Total</span><span>{brl(Math.max(0, subtotal - session.discount))}</span></div>
          <Button className="mt-4 w-full bg-ember shadow-ember" onClick={() => { closeTable(session.id); toast.success(`Mesa ${table} encerrada`); onClose(); }}>
            <Lock className="h-4 w-4" /> Fechar mesa
          </Button>
        </section>
      </div>
      <OrderDetailDialog order={detailOrder} onClose={() => setDetail(null)} />
    </>
  );
}
