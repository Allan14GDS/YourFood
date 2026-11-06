import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/AdminShell";
import { useStore, useCurrentUser, brl, sessionSubtotal } from "@/lib/store";

export const Route = createFileRoute("/painel/clientes")({ component: Clientes });

function Clientes() {
  const user = useCurrentUser()!;
  const customers = useStore((s) => s.customers).filter((c) => c.restaurant_id === user.restaurant_id);
  const sessions = useStore((s) => s.sessions);
  const orders = useStore((s) => s.orders);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  if (user.role !== "gerente") return <p className="text-muted-foreground">Acesso restrito ao gerente.</p>;

  const rows = customers
    .filter((c) => (c.name + c.phone).toLowerCase().includes(q.toLowerCase()))
    .map((c) => {
      const ses = sessions.filter((s) => s.customer_id === c.id).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
      const spent = ses.reduce((a, s) => a + (s.closedAt ? s.total ?? 0 : sessionSubtotal(orders, s.id) - s.discount), 0);
      return { c, ses, spent };
    });

  return (
    <div>
      <PageHeader title="Clientes" subtitle="Base criada pelas comandas nominais" action={
        <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      } />
      {rows.length === 0 ? (
        <EmptyState art="people" title={q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado ainda"} description={q ? "Tente buscar por outro nome ou telefone." : "Clientes aparecem aqui quando a mesa é aberta com nome e telefone."} />
      ) : (
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Telefone</TableHead><TableHead>Visitas</TableHead><TableHead>Última visita</TableHead><TableHead className="text-right">Total gasto</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(({ c, ses, spent }) => (
              <Fragment key={c.id}>
                <TableRow className="cursor-pointer" onClick={() => setOpen(open === c.id ? null : c.id)}>
                  <TableCell className="font-semibold">{c.name}</TableCell>
                  <TableCell>{c.phone}</TableCell>
                  <TableCell>{ses.length}</TableCell>
                  <TableCell>{ses[0] ? new Date(ses[0].openedAt).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell className="text-right font-bold text-primary">{brl(spent)}</TableCell>
                </TableRow>
                {open === c.id && (
                  <TableRow key={c.id + "-d"}>
                    <TableCell colSpan={5} className="bg-muted/50">
                      <div className="grid gap-1 text-sm">
                        {ses.slice(0, 10).map((s) => (
                          <div key={s.id} className="flex justify-between">
                            <span>{new Date(s.openedAt).toLocaleDateString("pt-BR")} · Mesa {s.table} {!s.closedAt && <b className="text-primary">(em aberto)</b>}</span>
                            <span>{brl(s.closedAt ? s.total ?? 0 : sessionSubtotal(orders, s.id))}</span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
      )}
    </div>
  );
}
