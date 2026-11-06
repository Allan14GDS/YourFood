import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, Receipt, BellRing, UtensilsCrossed, Clock, CheckCircle2, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { defaultHours, defaultPayments, useStore, brl, orderTotal, sessionSubtotal, type OrderItem, type OrderStatus, type Product } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHydrated } from "@/components/AdminShell";
import { toast } from "sonner";

export const Route = createFileRoute("/menu/$slug")({
  head: () => ({
    meta: [
      { title: "Cardápio digital — yourFood" },
      { name: "description", content: "Faça seu pedido direto da mesa pelo cardápio digital." },
      { property: "og:title", content: "Cardápio digital — yourFood" },
      { property: "og:description", content: "Faça seu pedido direto da mesa pelo cardápio digital." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Menu,
});

const STATUS: Record<OrderStatus, { label: string; cls: string; icon: typeof Clock }> = {
  novo: { label: "Recebido", cls: "bg-info/15 text-info", icon: Clock },
  preparando: { label: "Preparando", cls: "bg-warning/25 text-warning-foreground", icon: Flame },
  pronto: { label: "Pronto", cls: "bg-success/15 text-success", icon: CheckCircle2 },
  entregue: { label: "Entregue", cls: "bg-muted text-muted-foreground", icon: CheckCircle2 },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive", icon: Clock },
};

function Menu() {
  const { slug } = Route.useParams();
  const hydrated = useHydrated();
  const restaurant = useStore((s) => s.restaurants.find((r) => r.slug === slug));
  const allProducts = useStore((s) => s.products);
  const sessions = useStore((s) => s.sessions);
  const orders = useStore((s) => s.orders);
  const { getOrOpenSession, placeOrder, requestBill } = useStore.getState();

  const [table, setTable] = useState<number | null>(null);
  const [tableInput, setTableInput] = useState("");
  const [tab, setTab] = useState<"menu" | "conta">("menu");
  const [cat, setCat] = useState("Todos");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [picking, setPicking] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const key = `yf-table-${slug}`;
  useEffect(() => {
    const t = localStorage.getItem(key);
    if (t) setTable(Number(t));
  }, [key]);

  const products = useMemo(() => allProducts.filter((p) => p.restaurant_id === restaurant?.id), [allProducts, restaurant]);
  const categories = ["Todos", ...Array.from(new Set(products.map((p) => p.category)))];
  const session = sessions.find((s) => s.restaurant_id === restaurant?.id && s.table === table && !s.closedAt);
  const myOrders = orders.filter((o) => session && o.session_id === session.id).reverse();

  if (!hydrated) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Carregando…</div>;

  if (!restaurant || restaurant.status !== "ativo") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <UtensilsCrossed className="h-10 w-10 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Restaurante indisponível</h1>
        <p className="text-muted-foreground">Verifique o código do QR e tente novamente.</p>
        <Button asChild variant="outline"><Link to="/">Voltar</Link></Button>
      </div>
    );
  }

  if (restaurant.isOpen === false) {
    const hours = (restaurant.hours ?? defaultHours());
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
        <div className="relative h-48 bg-ink">
          {restaurant.cover && <img src={restaurant.cover} alt="" className="h-full w-full object-cover opacity-60" />}
          {restaurant.logo && <img src={restaurant.logo} alt={restaurant.name} className="absolute -bottom-10 left-6 h-20 w-20 rounded-2xl border-4 border-background object-cover" />}
        </div>
        <div className="flex-1 p-6 pt-14">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <div className="mt-6 rounded-2xl bg-destructive/10 p-5 text-center">
            <p className="text-xl font-bold text-destructive">Estamos fechados no momento</p>
            <p className="mt-1 text-sm text-muted-foreground">Volte em breve — confira nosso horário abaixo.</p>
          </div>
          <ul className="mt-6 space-y-1.5 text-sm">
            {hours.map((h) => <li key={h.day} className="flex justify-between"><span className="font-medium">{h.day}</span><span className="text-muted-foreground">{h.enabled ? `${h.open} – ${h.close}` : "Fechado"}</span></li>)}
          </ul>
        </div>
      </div>
    );
  }

  if (!table) {
    return (
      <div className="relative flex min-h-screen flex-col bg-ink p-6 text-ink-foreground">
        {restaurant.cover && <img src={restaurant.cover} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />}
        <p className="relative font-display text-sm opacity-60">your<span className="text-primary">Food</span></p>
        <div className="relative flex flex-1 flex-col justify-center">
          {restaurant.logo && <img src={restaurant.logo} alt={restaurant.name} className="mb-5 h-20 w-20 rounded-2xl object-cover" />}
          <p className="text-sm uppercase tracking-widest text-primary">Bem-vindo ao</p>
          <h1 className="mt-1 text-4xl font-bold">{restaurant.name}</h1>
          <p className="mt-3 opacity-70">Qual o número da sua mesa?</p>
          <form
            className="mt-8 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(tableInput);
              if (!n || n < 1 || n > restaurant.tables) return void toast.error(`Mesa deve ser entre 1 e ${restaurant.tables}`);
              localStorage.setItem(key, String(n));
              setTable(n);
            }}
          >
            <Input inputMode="numeric" value={tableInput} onChange={(e) => setTableInput(e.target.value.replace(/\D/g, ""))} placeholder="Ex: 5" className="h-16 bg-card text-center text-3xl font-bold text-card-foreground" />
            <Button type="submit" size="lg" className="h-14 w-full bg-ember text-base shadow-ember">Ver cardápio</Button>
          </form>
        </div>
      </div>
    );
  }

  const cartItems = cart;
  const cartCount = cartItems.reduce((a, i) => a + i.qty, 0);
  const cartTotal = cartItems.reduce((a, i) => a + i.qty * i.price, 0);
  const bump = (idx: number, d: number) => setCart((c) => c.map((x, i) => (i === idx ? { ...x, qty: x.qty + d } : x)).filter((x) => x.qty > 0));
  const addLine = (line: OrderItem) =>
    setCart((c) => {
      const same = (x: OrderItem) => x.product_id === line.product_id && (x.modifiers ?? []).join("|") === (line.modifiers ?? []).join("|") && (x.note ?? "") === (line.note ?? "");
      return c.some(same) ? c.map((x) => (same(x) ? { ...x, qty: x.qty + line.qty } : x)) : [...c, line];
    });
  const inCart = (id: string) => cart.filter((x) => x.product_id === id).reduce((a, x) => a + x.qty, 0);

  const send = () => {
    const ses = session ?? getOrOpenSession(restaurant.id, table);
    placeOrder(restaurant.id, ses.id, cartItems, "cliente");
    setCart([]);
    setCartOpen(false);
    setTab("conta");
    toast.success("Pedido enviado para a cozinha!");
  };

  const subtotal = session ? sessionSubtotal(orders, session.id) : 0;
  const visible = products.filter((p) => cat === "Todos" || p.category === cat);

  return (
    <div className="mx-auto min-h-screen max-w-md bg-background pb-32">
      {restaurant.cover && <img src={restaurant.cover} alt="" className="h-36 w-full object-cover" />}
      <header className="sticky top-0 z-20 bg-background/90 px-5 pb-3 pt-5 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          {restaurant.logo && <img src={restaurant.logo} alt={restaurant.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <button className="text-sm text-muted-foreground" onClick={() => { localStorage.removeItem(key); setTable(null); }}>Mesa {table} · trocar</button>
          </div>
          <div className="flex rounded-full bg-muted p-1 text-sm font-semibold">
            <button onClick={() => setTab("menu")} className={`rounded-full px-4 py-1.5 ${tab === "menu" ? "bg-card shadow-soft" : "text-muted-foreground"}`}>Cardápio</button>
            <button onClick={() => setTab("conta")} className={`rounded-full px-4 py-1.5 ${tab === "conta" ? "bg-card shadow-soft" : "text-muted-foreground"}`}>Conta</button>
          </div>
        </div>
        {tab === "menu" && (
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium ${cat === c ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>{c}</button>
            ))}
          </div>
        )}
      </header>

      {tab === "menu" ? (
        <div className="space-y-4 px-5 pt-2">
          {visible.length === 0 && <EmptyState art="menu" title="Cardápio em preparação" description="Este restaurante ainda não publicou pratos aqui." />}
          {visible.map((p) => (
            <button type="button" key={p.id} disabled={!p.available} onClick={() => setPicking(p)} className={`flex w-full gap-4 rounded-2xl bg-card p-3 text-left shadow-soft ${!p.available ? "opacity-50" : ""}`}>
              <img src={p.image} alt={p.name} className="h-24 w-24 shrink-0 rounded-xl object-cover" loading="lazy" />
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="font-sans font-bold leading-tight">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-bold text-primary">{brl(p.price)}</span>
                  {!p.available ? (
                    <span className="text-xs font-semibold text-muted-foreground">Esgotado</span>
                  ) : (
                    <span className="flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1.5 text-primary-foreground shadow-ember">
                      <Plus className="h-4 w-4" />{inCart(p.id) > 0 && <span className="text-xs font-bold">{inCart(p.id)}</span>}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 px-5 pt-2">
          <div className="rounded-2xl bg-ink p-5 text-ink-foreground">
            <p className="text-sm opacity-60">Total acumulado · Mesa {table}</p>
            <p className="mt-1 font-display text-4xl font-bold">{brl(Math.max(0, subtotal - (session?.discount ?? 0)))}</p>
            {!!session?.discount && <p className="mt-1 text-sm text-primary">Desconto aplicado: {brl(session.discount)}</p>}
          </div>
          {myOrders.length === 0 && <EmptyState art="receipt" title="Nenhum pedido ainda" description="Explore o cardápio e escolha algo gostoso." action={<Button variant="outline" onClick={() => setTab("menu")}>Ver cardápio</Button>} />}
          {myOrders.map((o) => {
            const st = STATUS[o.status];
            return (
              <div key={o.id} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}><st.icon className="h-3 w-3" />{st.label}</span>
                </div>
                <ul className="mt-2 space-y-1 text-sm">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex justify-between gap-2"><span>{i.qty}× {i.name}{!!i.modifiers?.length && <span className="block text-xs text-muted-foreground">{i.modifiers.join(", ")}</span>}{i.note && <span className="block text-xs italic text-muted-foreground">Obs: {i.note}</span>}</span><span className="text-muted-foreground">{brl(i.qty * i.price)}</span></li>
                  ))}
                </ul>
                <p className="mt-2 border-t pt-2 text-right text-sm font-bold">{brl(orderTotal(o))}</p>
              </div>
            );
          })}
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Pagamento no local</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(restaurant.payments ?? defaultPayments()).map((m) => <span key={m} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{m}</span>)}
            </div>
          </div>
          {session && (
            <Button
              size="lg"
              variant={session.billRequested ? "secondary" : "default"}
              disabled={session.billRequested}
              className="h-14 w-full text-base"
              onClick={() => { requestBill(session.id); toast.success("O garçom foi avisado!"); }}
            >
              {session.billRequested ? <><BellRing className="h-5 w-5" /> Conta solicitada — aguarde</> : <><Receipt className="h-5 w-5" /> Pedir a conta</>}
            </Button>
          )}
        </div>
      )}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4">
          <Button size="lg" className="h-14 w-full justify-between bg-ember text-base shadow-ember" onClick={() => setCartOpen(true)}>
            <span className="flex items-center gap-2"><ShoppingBag className="h-5 w-5" /> {cartCount} {cartCount > 1 ? "itens" : "item"}</span>
            <span>{brl(cartTotal)}</span>
          </Button>
        </div>
      )}

      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl">
          <SheetHeader><SheetTitle className="font-display text-2xl">Seu pedido</SheetTitle></SheetHeader>
          <ul className="space-y-3 px-4">
            {cartItems.map((i, idx) => (
              <li key={idx} className="flex items-center justify-between gap-3">
                <div className="min-w-0"><p className="font-semibold">{i.name}</p>{!!i.modifiers?.length && <p className="text-xs text-muted-foreground">{i.modifiers.join(", ")}</p>}{i.note && <p className="text-xs italic text-muted-foreground">Obs: {i.note}</p>}<p className="text-sm text-muted-foreground">{brl(i.price)}</p></div>
                <div className="flex items-center gap-2">
                  <button onClick={() => bump(idx, -1)} className="rounded-full bg-muted p-1.5"><Minus className="h-4 w-4" /></button>
                  <span className="w-4 text-center font-bold">{i.qty}</span>
                  <button onClick={() => bump(idx, 1)} className="rounded-full bg-primary p-1.5 text-primary-foreground"><Plus className="h-4 w-4" /></button>
                </div>
              </li>
            ))}
          </ul>
          <div className="p-4">
            <Button size="lg" className="h-14 w-full justify-between bg-ember text-base shadow-ember" onClick={send} disabled={!cartItems.length}>
              <span>Enviar para a cozinha</span><span>{brl(cartTotal)}</span>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ProductPicker product={picking} onClose={() => setPicking(null)} onAdd={(line) => { addLine(line); setPicking(null); toast.success("Adicionado ao pedido"); }} />
    </div>
  );
}

function ProductPicker({ product, onClose, onAdd }: { product: Product | null; onClose: () => void; onAdd: (l: OrderItem) => void }) {
  const isMobile = useIsMobile();
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [qty, setQty] = useState(1);
  useEffect(() => { setSel({}); setNote(""); setQty(1); }, [product?.id]);

  const open = !!product;
  const groups = product?.modifierGroups ?? [];
  const toggle = (gid: string, oid: string, multiple: boolean) =>
    setSel((s) => {
      const cur = s[gid] ?? [];
      return { ...s, [gid]: multiple ? (cur.includes(oid) ? cur.filter((x) => x !== oid) : [...cur, oid]) : [oid] };
    });
  const chosen = groups.flatMap((g) => g.options.filter((o) => (sel[g.id] ?? []).includes(o.id)));
  const unitPrice = (product?.price ?? 0) + chosen.reduce((a, o) => a + o.price, 0);
  const missing = groups.filter((g) => g.required && !(sel[g.id]?.length));

  const body = product && (
    <div className="flex max-h-[80vh] flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-1 pb-4">
        {product.image && <img src={product.image} alt={product.name} className="h-44 w-full rounded-2xl object-cover" />}
        <div>
          <h2 className="text-2xl font-bold">{product.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
          <p className="mt-2 font-bold text-primary">{brl(product.price)}</p>
        </div>
        {groups.map((g) => (
          <div key={g.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-semibold">{g.name}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${g.required ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {g.required ? "Obrigatório" : "Opcional"} · {g.multiple ? "vários" : "escolha 1"}
              </span>
            </div>
            <div className="space-y-2">
              {g.options.map((o) => {
                const on = (sel[g.id] ?? []).includes(o.id);
                return (
                  <button key={o.id} type="button" onClick={() => toggle(g.id, o.id, g.multiple)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm ${on ? "border-primary bg-primary/10" : "bg-card"}`}>
                    <span className="flex items-center gap-3">
                      <span className={`flex h-5 w-5 items-center justify-center border-2 ${g.multiple ? "rounded-md" : "rounded-full"} ${on ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                        {on && <span className={`h-2 w-2 bg-primary-foreground ${g.multiple ? "rounded-sm" : "rounded-full"}`} />}
                      </span>
                      {o.name}
                    </span>
                    {o.price > 0 && <span className="text-muted-foreground">+ {brl(o.price)}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div>
          <p className="mb-2 font-semibold">Observação</p>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex: sem cebola" maxLength={140} />
        </div>
      </div>
      <div className="flex items-center gap-3 border-t pt-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="rounded-full bg-muted p-2"><Minus className="h-4 w-4" /></button>
          <span className="w-5 text-center font-bold">{qty}</span>
          <button type="button" onClick={() => setQty((q) => q + 1)} className="rounded-full bg-muted p-2"><Plus className="h-4 w-4" /></button>
        </div>
        <Button
          size="lg"
          className="h-12 flex-1 justify-between bg-ember shadow-ember"
          disabled={missing.length > 0}
          onClick={() =>
            onAdd({
              product_id: product.id,
              name: product.name,
              price: unitPrice,
              qty,
              modifiers: chosen.map((o) => (o.price > 0 ? `+ ${o.name}` : o.name)),
              note: note.trim() || undefined,
            })
          }
        >
          <span>{missing.length ? `Escolha: ${missing[0]!.name}` : "Adicionar"}</span>
          <span>{brl(unitPrice * qty)}</span>
        </Button>
      </div>
    </div>
  );

  if (isMobile)
    return (
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent side="bottom" className="rounded-t-3xl p-5">
          <SheetHeader className="sr-only"><SheetTitle>{product?.name}</SheetTitle></SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="sr-only"><DialogTitle>{product?.name}</DialogTitle></DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}
