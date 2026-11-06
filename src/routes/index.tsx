import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Lock, QrCode, ArrowRight, ChefHat, Smartphone, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "yourFood — Pedidos inteligentes para restaurantes" },
      { name: "description", content: "Cardápio por QR Code, cozinha em tempo real e gestão completa para restaurantes." },
      { property: "og:title", content: "yourFood — Pedidos inteligentes para restaurantes" },
      { property: "og:description", content: "Cardápio por QR Code, cozinha em tempo real e gestão completa para restaurantes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const restaurants = useStore((s) => s.restaurants);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = code.trim();
    const slug = (raw.split("/menu/").pop()!.split(/[/?#]/)[0] ?? "").toLowerCase();
    if (!slug) return;
    navigate({ to: "/menu/$slug", params: { slug } });
  };

  return (
    <div className="min-h-screen bg-ink text-ink-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-2xl font-bold">your<span className="text-primary">Food</span></span>
        <Button asChild variant="secondary" size="sm">
          <Link to="/login"><Lock className="h-4 w-4" /> Acesso Restrito</Link>
        </Button>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:pt-20">
        <div>
          <p className="mb-4 inline-block rounded-full border border-primary/40 px-3 py-1 text-xs uppercase tracking-widest text-primary">SaaS para restaurantes</p>
          <h1 className="text-5xl font-bold leading-[1.05] md:text-6xl">
            Do QR Code à cozinha,<br /><em className="text-primary">sem fricção.</em>
          </h1>
          <p className="mt-6 max-w-md text-lg opacity-70">
            Seus clientes pedem pela mesa, a cozinha acompanha em tempo real e você controla tudo em um só painel.
          </p>

          <form onSubmit={go} className="mt-10 rounded-2xl bg-card p-5 text-card-foreground shadow-soft">
            <label className="flex items-center gap-2 text-sm font-semibold"><QrCode className="h-4 w-4 text-primary" /> Está em um restaurante?</label>
            <div className="mt-3 flex gap-2">
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Digite o código ou link (ex: brasa-e-lenha)" />
              <Button type="submit" className="bg-ember shadow-ember"><ArrowRight className="h-4 w-4" /></Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
              Experimente:
              {restaurants.filter((r) => r.status === "ativo").map((r) => (
                <button type="button" key={r.id} onClick={() => setCode(r.slug)} className="underline decoration-dotted hover:text-primary">{r.slug}</button>
              ))}
            </div>
          </form>
        </div>
        <div className="relative">
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=75&auto=format&fit=crop"
            alt="Mesa de restaurante elegante"
            className="aspect-[4/5] w-full rounded-3xl object-cover"
          />
          <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card p-4 text-card-foreground shadow-soft">
            <p className="text-xs text-muted-foreground">Mesa 7 · agora</p>
            <p className="font-semibold">2× Burger da Casa → <span className="text-primary">Preparando</span></p>
          </div>
        </div>
      </section>

      <section className="border-t border-sidebar-border">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 md:grid-cols-3">
          {[
            { i: Smartphone, t: "Cardápio na mesa", d: "Pedidos direto pelo celular, sem app e sem login." },
            { i: ChefHat, t: "Cozinha em tempo real", d: "Kanban de preparo do pedido novo até a entrega." },
            { i: BarChart3, t: "Gestão completa", d: "Cardápio, clientes, descontos e métricas de vendas." },
          ].map((f) => (
            <div key={f.t}>
              <f.i className="h-6 w-6 text-primary" />
              <h3 className="mt-3 text-xl font-semibold">{f.t}</h3>
              <p className="mt-1 opacity-60">{f.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
