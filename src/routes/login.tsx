import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ChefHat, Briefcase, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acesso restrito — yourFood" },
      { name: "description", content: "Login para atendentes, gerentes e administradores do yourFood." },
      { property: "og:title", content: "Acesso restrito — yourFood" },
      { property: "og:description", content: "Login para atendentes, gerentes e administradores do yourFood." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

const DEMOS = [
  { label: "Atendente", email: "atendente@yourfood.app", icon: ChefHat, desc: "Brasa & Lenha" },
  { label: "Gerente", email: "gerente@yourfood.app", icon: Briefcase, desc: "Brasa & Lenha" },
  { label: "Admin Master", email: "admin@yourfood.app", icon: Crown, desc: "Plataforma" },
];

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useStore((s) => s.login);
  const restaurants = useStore((s) => s.restaurants);
  const navigate = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(email, password);
    if (!u) return void toast.error("E-mail ou senha inválidos");
    if (u.restaurant_id && restaurants.find((r) => r.id === u.restaurant_id)?.status === "suspenso") {
      useStore.getState().logout();
      return void toast.error("Este restaurante está suspenso.");
    }
    toast.success(`Bem-vindo(a), ${u.name.split(" ")[0]}!`);
    navigate({ to: u.role === "admin" ? "/admin" : "/painel" });
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden bg-ink md:block">
        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200&q=70&auto=format&fit=crop" alt="Cozinha profissional" className="h-full w-full object-cover opacity-50" />
        <div className="absolute bottom-10 left-10 max-w-sm text-ink-foreground">
          <p className="font-display text-4xl font-bold">your<span className="text-primary">Food</span></p>
          <p className="mt-2 opacity-70">Painel de gestão para a equipe do restaurante.</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
          <h1 className="text-3xl font-bold">Acesso restrito</h1>
          <p className="mt-1 text-muted-foreground">Atendentes, gerentes e Admin Master.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Senha</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
            <Button type="submit" className="w-full bg-ember shadow-ember">Entrar</Button>
          </form>

          <div className="mt-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contas de demonstração</p>
            <div className="grid gap-2">
              {DEMOS.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword("demo123"); }}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary hover:shadow-soft"
                >
                  <span className="rounded-lg bg-accent p-2 text-accent-foreground"><d.icon className="h-4 w-4" /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{d.label}</span><span className="text-xs text-muted-foreground">{d.desc}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
