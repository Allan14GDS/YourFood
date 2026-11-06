import { createFileRoute } from "@tanstack/react-router";
import { useRef, type ChangeEvent } from "react";
import { ImagePlus, Trash2, Store, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/AdminShell";
import { useStore, useCurrentUser, defaultHours, defaultPayments, PAYMENT_METHODS, type DayHours } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações da Loja — yourFood" }, { name: "description", content: "Logo, capa, horários e pagamentos do restaurante." }] }),
  component: Settings,
});

/** Downscale an uploaded image to a JPEG data URL so it fits in browser storage. */
function resizeImage(file: File, maxW: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Settings() {
  const user = useCurrentUser()!;
  const r = useStore((s) => s.restaurants.find((x) => x.id === user.restaurant_id));
  const update = useStore((s) => s.updateRestaurant);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  if (user.role !== "gerente") return <p className="text-muted-foreground">Acesso restrito ao gerente.</p>;
  if (!r) return null;

  const open = r.isOpen !== false;
  const hours = r.hours ?? defaultHours();
  const payments = r.payments ?? defaultPayments();

  const upload = (field: "logo" | "cover", maxW: number) => async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (!f.type.startsWith("image/")) return void toast.error("Envie um arquivo de imagem");
    try {
      update(r.id, { [field]: await resizeImage(f, maxW) });
      toast.success(field === "logo" ? "Logo atualizado" : "Capa atualizada");
    } catch {
      toast.error("Não foi possível ler a imagem");
    }
  };
  const setDay = (i: number, patch: Partial<DayHours>) => update(r.id, { hours: hours.map((h, j) => (j === i ? { ...h, ...patch } : h)) });

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="Configurações da Loja"
        subtitle={r.name}
        action={<Button variant="outline" asChild><a href={`/menu/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Ver cardápio</a></Button>}
      />

      <section className={`flex items-center justify-between gap-4 rounded-2xl border p-5 ${open ? "bg-success/10" : "bg-destructive/10"}`}>
        <div className="flex items-center gap-3">
          <Store className={`h-8 w-8 ${open ? "text-success" : "text-destructive"}`} />
          <div>
            <p className="text-lg font-bold">{open ? "Loja aberta" : "Loja fechada"}</p>
            <p className="text-sm text-muted-foreground">{open ? "Clientes podem fazer pedidos pelo cardápio." : "Clientes veem “Estamos fechados no momento”."}</p>
          </div>
        </div>
        <Button size="lg" variant={open ? "destructive" : "default"} className={open ? "" : "bg-ember shadow-ember"} onClick={() => { update(r.id, { isOpen: !open }); toast.success(open ? "Loja fechada" : "Loja aberta"); }}>
          {open ? "Fechar loja" : "Abrir loja"}
        </Button>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-xl font-bold">Identidade visual</h2>
        <div className="relative">
          <div className="h-40 overflow-hidden rounded-xl bg-muted">
            {r.cover ? <img src={r.cover} alt="Capa" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Sem foto de capa</div>}
          </div>
          <div className="absolute -bottom-8 left-5 h-20 w-20 overflow-hidden rounded-2xl border-4 border-card bg-muted">
            {r.logo ? <img src={r.logo} alt="Logo" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Logo</div>}
          </div>
        </div>
        <div className="mt-12 flex flex-wrap gap-2">
          <input ref={logoRef} type="file" accept="image/*" hidden onChange={upload("logo", 400)} />
          <input ref={coverRef} type="file" accept="image/*" hidden onChange={upload("cover", 1400)} />
          <Button variant="outline" onClick={() => logoRef.current?.click()}><ImagePlus className="h-4 w-4" /> Enviar logo</Button>
          {r.logo && <Button variant="ghost" className="text-destructive" onClick={() => update(r.id, { logo: undefined })}><Trash2 className="h-4 w-4" /> Remover logo</Button>}
          <Button variant="outline" onClick={() => coverRef.current?.click()}><ImagePlus className="h-4 w-4" /> Enviar capa</Button>
          {r.cover && <Button variant="ghost" className="text-destructive" onClick={() => update(r.id, { cover: undefined })}><Trash2 className="h-4 w-4" /> Remover capa</Button>}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-4 text-xl font-bold">Horário de funcionamento</h2>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.day} className="flex flex-wrap items-center gap-3">
              <label className="flex w-36 items-center gap-2 text-sm font-medium"><Switch checked={h.enabled} onCheckedChange={(v) => setDay(i, { enabled: v })} />{h.day}</label>
              {h.enabled ? (
                <div className="flex items-center gap-2 text-sm">
                  <Input type="time" className="w-28" value={h.open} onChange={(e) => setDay(i, { open: e.target.value })} />
                  <span className="text-muted-foreground">até</span>
                  <Input type="time" className="w-28" value={h.close} onChange={(e) => setDay(i, { close: e.target.value })} />
                </div>
              ) : <span className="text-sm text-muted-foreground">Fechado</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-1 text-xl font-bold">Pagamentos aceitos no local</h2>
        <p className="mb-4 text-sm text-muted-foreground">Exibidos para o cliente na aba “Conta”.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {PAYMENT_METHODS.map((m) => {
            const on = payments.includes(m);
            return (
              <label key={m} className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium ${on ? "border-primary bg-primary/5" : ""}`}>
                {m}
                <Switch checked={on} onCheckedChange={(v) => update(r.id, { payments: v ? [...payments, m] : payments.filter((x) => x !== m) })} />
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
