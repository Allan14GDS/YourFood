import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/AdminShell";
import { useStore, newId, type User } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/usuarios")({ component: Usuarios });

function Usuarios() {
  const users = useStore((s) => s.users).filter((u) => u.role !== "admin");
  const restaurants = useStore((s) => s.restaurants);
  const { upsertUser, deleteUser } = useStore.getState();
  const [editing, setEditing] = useState<User | null>(null);

  const blank = (): User => ({ id: newId(), name: "", email: "", password: "", role: "atendente", restaurant_id: restaurants[0]?.id ?? null });

  return (
    <div>
      <PageHeader title="Usuários" subtitle="Credenciais de gerentes e atendentes" action={<Button className="bg-ember shadow-ember" onClick={() => setEditing(blank())}><Plus className="h-4 w-4" /> Novo usuário</Button>} />
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead><TableHead>Restaurante</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-semibold">{u.name}</TableCell>
                <TableCell className="font-mono text-xs">{u.email}</TableCell>
                <TableCell><Badge variant={u.role === "gerente" ? "default" : "secondary"}>{u.role}</Badge></TableCell>
                <TableCell>{restaurants.find((r) => r.id === u.restaurant_id)?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(u)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => { if (confirm(`Excluir ${u.name}?`)) deleteUser(u.id); }}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display text-2xl">{editing?.name ? "Editar usuário" : "Novo usuário"}</DialogTitle></DialogHeader>
          {editing && (
            <form className="space-y-3" onSubmit={(e) => {
              e.preventDefault();
              if (useStore.getState().users.some((x) => x.email === editing.email && x.id !== editing.id)) return void toast.error("E-mail já em uso");
              upsertUser(editing); setEditing(null); toast.success("Usuário salvo");
            }}>
              <div className="space-y-1"><Label>Nome</Label><Input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>E-mail</Label><Input type="email" required value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Senha</Label><Input required value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Perfil</Label>
                  <Select value={editing.role} onValueChange={(v) => setEditing({ ...editing, role: v as User["role"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="atendente">Atendente</SelectItem><SelectItem value="gerente">Gerente</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-1"><Label>Restaurante</Label>
                  <Select value={editing.restaurant_id ?? ""} onValueChange={(v) => setEditing({ ...editing, restaurant_id: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{restaurants.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
