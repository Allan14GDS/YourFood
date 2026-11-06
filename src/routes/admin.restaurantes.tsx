import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pause, Play, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/AdminShell";
import { useStore, slugify, newId } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/restaurantes")({ component: Restaurantes });

function Restaurantes() {
  const restaurants = useStore((s) => s.restaurants);
  const { upsertRestaurant, deleteRestaurant } = useStore.getState();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [tables, setTables] = useState(10);
  const slug = slugify(name);

  return (
    <div>
      <PageHeader title="Restaurantes" subtitle={`${restaurants.length} unidades cadastradas`} action={<Button className="bg-ember shadow-ember" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Novo restaurante</Button>} />
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>URL do cardápio</TableHead><TableHead>Cidade</TableHead><TableHead>Mesas</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {restaurants.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-semibold">{r.name}</TableCell>
                <TableCell>
                  <Link to="/menu/$slug" params={{ slug: r.slug }} target="_blank" className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">/menu/{r.slug} <ExternalLink className="h-3 w-3" /></Link>
                </TableCell>
                <TableCell>{r.city}</TableCell>
                <TableCell>{r.tables}</TableCell>
                <TableCell><Badge variant={r.status === "ativo" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" title={r.status === "ativo" ? "Suspender" : "Reativar"} onClick={() => upsertRestaurant({ ...r, status: r.status === "ativo" ? "suspenso" : "ativo" })}>
                    {r.status === "ativo" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" title="Excluir permanentemente" onClick={() => { if (confirm(`Excluir permanentemente ${r.name} e seus usuários?`)) { deleteRestaurant(r.id); toast("Restaurante excluído"); } }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">Novo restaurante</DialogTitle></DialogHeader>
          <form className="space-y-3" onSubmit={(e) => {
            e.preventDefault();
            if (restaurants.some((r) => r.slug === slug)) return void toast.error("Slug já existe");
            upsertRestaurant({ id: newId(), name, slug, city, tables, status: "ativo", createdAt: new Date().toISOString() });
            toast.success("Restaurante criado"); setOpen(false); setName(""); setCity("");
          }}>
            <div className="space-y-1"><Label>Nome</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
            <p className="text-xs text-muted-foreground">URL gerada: <span className="font-mono text-primary">/menu/{slug || "…"}</span></p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div className="space-y-1"><Label>Nº de mesas</Label><Input type="number" min={1} value={tables} onChange={(e) => setTables(Number(e.target.value))} /></div>
            </div>
            <Button type="submit" className="w-full" disabled={!slug}>Cadastrar</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
