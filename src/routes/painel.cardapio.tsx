import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/AdminShell";
import { useStore, useCurrentUser, brl, newId, type Product, type ModifierGroup } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/painel/cardapio")({ component: Cardapio });

function Cardapio() {
  const user = useCurrentUser()!;
  const rid = user.restaurant_id!;
  const products = useStore((s) => s.products).filter((p) => p.restaurant_id === rid);
  const { upsertProduct, deleteProduct } = useStore.getState();
  const [editing, setEditing] = useState<Product | null>(null);

  if (user.role !== "gerente") return <p className="text-muted-foreground">Acesso restrito ao gerente.</p>;

  const blank = (): Product => ({ id: newId(), restaurant_id: rid, name: "", description: "", price: 0, image: "", category: "Pratos", available: true });

  return (
    <div>
      <PageHeader title="Cardápio" subtitle={`${products.length} produtos`} action={<Button className="bg-ember shadow-ember" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Novo produto</Button>} />
      {products.length === 0 && <EmptyState art="menu" title="Seu cardápio está vazio" description="Cadastre o primeiro prato para os clientes começarem a pedir." action={<Button className="bg-ember shadow-ember" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Novo produto</Button>} />}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="overflow-hidden rounded-2xl border bg-card">
            <img src={p.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=60"} alt={p.name} className={`h-40 w-full object-cover ${!p.available ? "grayscale" : ""}`} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div><p className="text-xs uppercase tracking-widest text-muted-foreground">{p.category}</p><h3 className="font-sans font-bold">{p.name}</h3></div>
                <span className="font-bold text-primary">{brl(p.price)}</span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm"><Switch checked={p.available} onCheckedChange={(v) => upsertProduct({ ...p, available: v })} /> {p.available ? "Disponível" : "Esgotado"}</label>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir ${p.name}?`)) deleteProduct(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.name ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
          {editing && (
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); upsertProduct(editing); setEditing(null); toast.success("Produto salvo"); }}>
              <div className="space-y-1"><Label>Nome</Label><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Descrição</Label><Textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Preço (R$)</Label><Input type="number" step="0.01" min={0} required value={editing.price} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} /></div>
                <div className="space-y-1"><Label>Categoria</Label><Input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} /></div>
              </div>
              <div className="space-y-1"><Label>URL da foto</Label><Input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} placeholder="https://…" /></div>
              <ModifierEditor groups={editing.modifierGroups ?? []} onChange={(g) => setEditing({ ...editing, modifierGroups: g })} />
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModifierEditor({ groups, onChange }: { groups: ModifierGroup[]; onChange: (g: ModifierGroup[]) => void }) {
  const upd = (id: string, patch: Partial<ModifierGroup>) => onChange(groups.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  return (
    <div className="space-y-3 border-t pt-3">
      <div className="flex items-center justify-between">
        <Label className="text-base">Grupos de modificadores</Label>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange([...groups, { id: newId(), name: "", required: false, multiple: true, options: [{ id: newId(), name: "", price: 0 }] }])}>
          <Plus className="h-4 w-4" /> Grupo
        </Button>
      </div>
      {groups.length === 0 && <p className="text-sm text-muted-foreground">Ex: "Ponto da carne" (obrigatório) ou "Adicionais" (+R$ 5 Bacon).</p>}
      {groups.map((g) => (
        <div key={g.id} className="space-y-2 rounded-xl border bg-muted/40 p-3">
          <div className="flex gap-2">
            <Input required placeholder="Nome do grupo" value={g.name} onChange={(e) => upd(g.id, { name: e.target.value })} />
            <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => onChange(groups.filter((x) => x.id !== g.id))}><Trash2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2"><Switch checked={g.required} onCheckedChange={(v) => upd(g.id, { required: v })} /> Obrigatório</label>
            <label className="flex items-center gap-2"><Switch checked={g.multiple} onCheckedChange={(v) => upd(g.id, { multiple: v })} /> Múltipla escolha</label>
          </div>
          <p className="text-xs text-muted-foreground">{g.required ? "Obrigatório" : "Opcional"} · {g.multiple ? "cliente pode escolher vários" : "escolha 1"}</p>
          {g.options.map((o) => (
            <div key={o.id} className="flex gap-2">
              <Input required placeholder="Opção (ex: Bacon)" value={o.name} onChange={(e) => upd(g.id, { options: g.options.map((x) => (x.id === o.id ? { ...x, name: e.target.value } : x)) })} />
              <Input type="number" step="0.01" min={0} className="w-28" placeholder="+R$" value={o.price} onChange={(e) => upd(g.id, { options: g.options.map((x) => (x.id === o.id ? { ...x, price: Number(e.target.value) } : x)) })} />
              <Button type="button" size="icon" variant="ghost" disabled={g.options.length === 1} onClick={() => upd(g.id, { options: g.options.filter((x) => x.id !== o.id) })}><X className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={() => upd(g.id, { options: [...g.options, { id: newId(), name: "", price: 0 }] })}><Plus className="h-4 w-4" /> Opção</Button>
        </div>
      ))}
    </div>
  );
}
