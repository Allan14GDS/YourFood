import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "atendente" | "gerente" | "admin";
export type OrderStatus = "novo" | "preparando" | "pronto" | "entregue" | "cancelado";

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: string;
  status: "ativo" | "suspenso";
  tables: number;
  createdAt: string;
  logo?: string | undefined;
  cover?: string | undefined;
  /** Manual open/close switch; undefined = open */
  isOpen?: boolean | undefined;
  hours?: DayHours[] | undefined;
  payments?: string[] | undefined;
}
export interface DayHours {
  day: string;
  enabled: boolean;
  open: string;
  close: string;
}
export const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const defaultHours = (): DayHours[] =>
  WEEKDAYS.map((day, i) => ({ day, enabled: i !== 1, open: "11:30", close: i >= 5 ? "00:00" : "23:00" }));
export const PAYMENT_METHODS = ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Vale-refeição", "Vale-alimentação"];
export const defaultPayments = () => ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito"];
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  restaurant_id: string | null;
}
export interface Product {
  id: string;
  restaurant_id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  modifierGroups?: ModifierGroup[];
}
export interface ModifierOption {
  id: string;
  name: string;
  price: number;
}
export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  options: ModifierOption[];
}
export interface Customer {
  id: string;
  restaurant_id: string;
  name: string;
  phone: string;
  createdAt: string;
}
export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  qty: number;
  /** Chosen modifier labels, e.g. "Ao ponto", "+ Bacon" */
  modifiers?: string[];
  note?: string | undefined;
}
export interface Order {
  id: string;
  restaurant_id: string;
  session_id: string;
  table: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: string;
  /** When the order entered its current status (kanban column) */
  statusAt?: string | undefined;
  origin: "cliente" | "atendente";
}
export interface TableSession {
  id: string;
  restaurant_id: string;
  table: number;
  customer_id: string | null;
  openedAt: string;
  closedAt: string | null;
  discount: number;
  billRequested: boolean;
  total?: number;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const daysAgo = (d: number, h = 20) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, Math.floor(Math.random() * 59));
  return t.toISOString();
};

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const img = (id: string) => `https://images.unsplash.com/${id}?w=600&q=70&auto=format&fit=crop`;

const seedRestaurants: Restaurant[] = [
  { id: "r1", name: "Brasa & Lenha", slug: "brasa-e-lenha", city: "São Paulo", status: "ativo", tables: 12, createdAt: daysAgo(120),
    logo: img("photo-1555396273-367ea4eb4db5").replace("w=600", "w=200"), cover: img("photo-1414235077428-338989a2e8c0").replace("w=600", "w=1400"),
    isOpen: true, hours: defaultHours(), payments: ["Pix", "Dinheiro", "Cartão de crédito", "Cartão de débito", "Vale-refeição"] },
  { id: "r2", name: "Sushi Kaze", slug: "sushi-kaze", city: "Curitiba", status: "ativo", tables: 8, createdAt: daysAgo(60),
    logo: img("photo-1553621042-f6e147245754").replace("w=600", "w=200"), cover: img("photo-1611143669185-af224c5e3252").replace("w=600", "w=1400"),
    isOpen: true, hours: WEEKDAYS.map((day, i) => ({ day, enabled: i !== 0, open: "18:00", close: "23:30" })), payments: ["Pix", "Cartão de crédito", "Cartão de débito"] },
  { id: "r3", name: "Cantina Nonna", slug: "cantina-nonna", city: "Porto Alegre", status: "suspenso", tables: 10, createdAt: daysAgo(200) },
];

const seedUsers: User[] = [
  { id: "u1", name: "Ana Atendente", email: "atendente@yourfood.app", password: "demo123", role: "atendente", restaurant_id: "r1" },
  { id: "u2", name: "Gustavo Gerente", email: "gerente@yourfood.app", password: "demo123", role: "gerente", restaurant_id: "r1" },
  { id: "u3", name: "Marina Master", email: "admin@yourfood.app", password: "demo123", role: "admin", restaurant_id: null },
  { id: "u4", name: "Kenji Gerente", email: "kenji@sushikaze.app", password: "demo123", role: "gerente", restaurant_id: "r2" },
];

const p = (restaurant_id: string, name: string, description: string, price: number, image: string, category: string): Product => ({
  id: uid(), restaurant_id, name, description, price, image: img(image), category, available: true,
});

const mg = (name: string, required: boolean, multiple: boolean, opts: [string, number][]): ModifierGroup => ({
  id: uid(), name, required, multiple, options: opts.map(([n, pr]) => ({ id: uid(), name: n, price: pr })),
});

const seedProducts: Product[] = [
  p("r1", "Picanha na Brasa", "400g de picanha maturada, farofa de manteiga e vinagrete.", 89.9, "photo-1544025162-d76694265947", "Pratos"),
  p("r1", "Burger da Casa", "Blend 180g, cheddar inglês, cebola caramelizada, brioche.", 42, "photo-1568901346375-23c9450c58cd", "Pratos"),
  p("r1", "Costela 12h", "Costela bovina defumada lentamente, mandioca cremosa.", 74.5, "photo-1529193591184-b1d58069ecdd", "Pratos"),
  p("r1", "Salada Caesar", "Alface romana, parmesão, croutons e molho caesar.", 32, "photo-1550304943-4f24f54ddde9", "Entradas"),
  p("r1", "Pão de Alho", "Pão artesanal com manteiga de alho assado.", 18, "photo-1573140247632-f8fd74997d5c", "Entradas"),
  p("r1", "Limonada Suíça", "Limão, leite condensado e gelo.", 14, "photo-1621263764928-df1444c5e859", "Bebidas"),
  p("r1", "Chopp Artesanal", "IPA local, 500ml.", 19, "photo-1608270586620-248524c67de9", "Bebidas"),
  p("r1", "Petit Gâteau", "Bolo quente de chocolate com sorvete de baunilha.", 28, "photo-1606313564200-e75d5e30476c", "Sobremesas"),
  p("r2", "Combo Kaze 20 peças", "Seleção do chef de sashimis, niguiris e uramakis.", 98, "photo-1579871494447-9811cf80d66c", "Pratos"),
  p("r2", "Temaki Salmão", "Salmão fresco, cebolinha e cream cheese.", 34, "photo-1617196034796-73dfa7b1fd56", "Pratos"),
  p("r2", "Missoshiru", "Sopa de missô com tofu e cebolinha.", 16, "photo-1547592166-23ac45744acd", "Entradas"),
  p("r2", "Chá Verde Gelado", "Matcha, limão e mel.", 12, "photo-1556679343-c7306c1976bc", "Bebidas"),
];
seedProducts[0]!.modifierGroups = [
  mg("Ponto da carne", true, false, [["Mal passada", 0], ["Ao ponto", 0], ["Bem passada", 0]]),
  mg("Adicionais", false, true, [["Queijo coalho", 9], ["Ovo frito", 4], ["Arroz biro-biro", 12]]),
];
seedProducts[1]!.modifierGroups = [
  mg("Ponto da carne", true, false, [["Mal passado", 0], ["Ao ponto", 0], ["Bem passado", 0]]),
  mg("Pão", true, false, [["Brioche", 0], ["Australiano", 2], ["Sem glúten", 6]]),
  mg("Adicionais", false, true, [["Bacon", 5], ["Cheddar extra", 4], ["Ovo", 3], ["Cebola crispy", 4]]),
];
seedProducts[2]!.modifierGroups = [mg("Acompanhamento", true, false, [["Mandioca cremosa", 0], ["Arroz branco", 0], ["Batata rústica", 6]])];
seedProducts[3]!.modifierGroups = [mg("Proteína extra", false, true, [["Frango grelhado", 12], ["Camarão", 18]])];
seedProducts[5]!.modifierGroups = [mg("Tamanho", true, false, [["300ml", 0], ["500ml", 5]]), mg("Açúcar", false, false, [["Sem açúcar", 0], ["Adoçante", 0]])];
seedProducts[7]!.modifierGroups = [mg("Sorvete", true, false, [["Baunilha", 0], ["Doce de leite", 0], ["Pistache", 4]]), mg("Extras", false, true, [["Calda de frutas vermelhas", 5], ["Chantilly", 3]])];
seedProducts[8]!.modifierGroups = [mg("Molhos", false, true, [["Shoyu light", 0], ["Tarê", 2], ["Molho spicy", 3]])];
seedProducts[9]!.modifierGroups = [
  mg("Preparo", true, false, [["Cru", 0], ["Grelhado", 0], ["Empanado (hot)", 4]]),
  mg("Adicionais", false, true, [["Cream cheese extra", 4], ["Cebolinha", 0], ["Gergelim", 0]]),
];

const seedCustomers: Customer[] = [
  { id: "c1", restaurant_id: "r1", name: "Carlos Mendes", phone: "(11) 98877-1122", createdAt: daysAgo(30) },
  { id: "c2", restaurant_id: "r1", name: "Juliana Rocha", phone: "(11) 97766-3344", createdAt: daysAgo(12) },
  { id: "c3", restaurant_id: "r2", name: "Pedro Tanaka", phone: "(41) 99911-2233", createdAt: daysAgo(5) },
];

// Historical closed sessions + orders for metrics
const seedSessions: TableSession[] = [];
const seedOrders: Order[] = [];
(() => {
  const r1p: Product[] = seedProducts.filter((x) => x.restaurant_id === "r1");
  const r2p = seedProducts.filter((x) => x.restaurant_id === "r2");
  for (let d = 1; d <= 45; d++) {
    for (const [rid, prods] of [["r1", r1p], ["r2", r2p]] as const) {
      const n = 2 + ((d * 7 + rid.length) % 4);
      for (let k = 0; k < n; k++) {
        const sid = uid();
        const at = daysAgo(d, 12 + ((k * 3) % 10));
        const items = [0, 1, 2].map((j) => {
          const pr = prods[(d + k + j * 3) % prods.length]!;
          return { product_id: pr.id, name: pr.name, price: pr.price, qty: 1 + ((d + j) % 2) };
        });
        const total = items.reduce((s, i) => s + i.price * i.qty, 0);
        const cust = rid === "r1" ? (k % 3 === 0 ? "c1" : k % 3 === 1 ? "c2" : null) : k % 2 ? "c3" : null;
        seedSessions.push({ id: sid, restaurant_id: rid, table: 1 + k, customer_id: cust, openedAt: at, closedAt: at, discount: 0, billRequested: false, total });
        seedOrders.push({ id: uid(), restaurant_id: rid, session_id: sid, table: 1 + k, items, status: "entregue", createdAt: at, origin: "cliente" });
      }
    }
  }
  // Active sessions today in r1
  const now = new Date().toISOString();
  const ago = (m: number) => new Date(Date.now() - m * 60000).toISOString();
  seedSessions.push({ id: "s-live-3", restaurant_id: "r1", table: 3, customer_id: "c1", openedAt: now, closedAt: null, discount: 0, billRequested: false });
  seedSessions.push({ id: "s-live-7", restaurant_id: "r1", table: 7, customer_id: null, openedAt: now, closedAt: null, discount: 0, billRequested: true });
  seedOrders.push({ id: uid(), restaurant_id: "r1", session_id: "s-live-3", table: 3, items: [{ product_id: r1p[0]!.id, name: r1p[0]!.name, price: r1p[0]!.price + 9, qty: 1, modifiers: ["Mal passada", "+ Queijo coalho"], note: "Farofa à parte" }, { product_id: r1p[6]!.id, name: r1p[6]!.name, price: r1p[6]!.price, qty: 2 }], status: "preparando", createdAt: ago(26), statusAt: ago(14), origin: "atendente" });
  seedOrders.push({ id: uid(), restaurant_id: "r1", session_id: "s-live-3", table: 3, items: [{ product_id: r1p[4]!.id, name: r1p[4]!.name, price: r1p[4]!.price, qty: 1 }], status: "entregue", createdAt: ago(40), statusAt: ago(30), origin: "cliente" });
  seedOrders.push({ id: uid(), restaurant_id: "r1", session_id: "s-live-7", table: 7, items: [{ product_id: r1p[1]!.id, name: r1p[1]!.name, price: r1p[1]!.price + 5, qty: 2, modifiers: ["Ao ponto", "Brioche", "+ Bacon"], note: "Sem cebola" }], status: "novo", createdAt: ago(4), statusAt: ago(4), origin: "cliente" });
  seedSessions.push({ id: "s-live-9", restaurant_id: "r1", table: 9, customer_id: "c2", openedAt: ago(50), closedAt: null, discount: 0, billRequested: false });
  seedOrders.push({ id: uid(), restaurant_id: "r1", session_id: "s-live-9", table: 9, items: [
    { product_id: r1p[2]!.id, name: r1p[2]!.name, price: r1p[2]!.price + 6, qty: 1, modifiers: ["+ Batata rústica"] },
    { product_id: r1p[5]!.id, name: r1p[5]!.name, price: r1p[5]!.price + 5, qty: 2, modifiers: ["+ 500ml", "Sem açúcar"] },
  ], status: "preparando", createdAt: ago(32), statusAt: ago(23), origin: "cliente" });
  seedOrders.push({ id: uid(), restaurant_id: "r1", session_id: "s-live-9", table: 9, items: [
    { product_id: r1p[7]!.id, name: r1p[7]!.name, price: r1p[7]!.price + 5, qty: 1, modifiers: ["Doce de leite", "+ Calda de frutas vermelhas"], note: "Trazer com 2 colheres" },
  ], status: "pronto", createdAt: ago(8), statusAt: ago(2), origin: "cliente" });
})();

interface State {
  restaurants: Restaurant[];
  users: User[];
  products: Product[];
  customers: Customer[];
  sessions: TableSession[];
  orders: Order[];
  currentUserId: string | null;

  login: (email: string, password: string) => User | null;
  logout: () => void;
  openTable: (rid: string, table: number, customer?: { name: string; phone: string }) => TableSession;
  getOrOpenSession: (rid: string, table: number) => TableSession;
  placeOrder: (rid: string, sessionId: string, items: OrderItem[], origin: Order["origin"]) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  requestBill: (sessionId: string) => void;
  closeTable: (sessionId: string) => void;
  setDiscount: (sessionId: string, discount: number) => void;
  upsertProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  upsertRestaurant: (r: Restaurant) => void;
  updateRestaurant: (id: string, patch: Partial<Restaurant>) => void;
  deleteRestaurant: (id: string) => void;
  upsertUser: (u: User) => void;
  deleteUser: (id: string) => void;
  reset: () => void;
}

const seed = () => ({
  restaurants: seedRestaurants,
  users: seedUsers,
  products: seedProducts,
  customers: seedCustomers,
  sessions: seedSessions,
  orders: seedOrders,
  currentUserId: null as string | null,
});

export const sessionSubtotal = (orders: Order[], sid: string) =>
  orders
    .filter((o) => o.session_id === sid && o.status !== "cancelado")
    .reduce((s, o) => s + o.items.reduce((a, i) => a + i.price * i.qty, 0), 0);

export const orderTotal = (o: Order) => o.items.reduce((a, i) => a + i.price * i.qty, 0);

export const minutesInStatus = (o: Order, now: number) =>
  Math.max(0, Math.floor((now - new Date(o.statusAt ?? o.createdAt).getTime()) / 60000));

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...seed(),
      login: (email, password) => {
        const u = get().users.find((x) => x.email.toLowerCase() === email.toLowerCase().trim() && x.password === password);
        if (u) set({ currentUserId: u.id });
        return u ?? null;
      },
      logout: () => set({ currentUserId: null }),
      openTable: (rid, table, customer) => {
        let customer_id: string | null = null;
        if (customer && customer.name.trim()) {
          const existing = get().customers.find((c) => c.restaurant_id === rid && c.phone === customer.phone);
          if (existing) customer_id = existing.id;
          else {
            const c: Customer = { id: uid(), restaurant_id: rid, name: customer.name, phone: customer.phone, createdAt: new Date().toISOString() };
            set((s) => ({ customers: [...s.customers, c] }));
            customer_id = c.id;
          }
        }
        const active = get().sessions.find((x) => x.restaurant_id === rid && x.table === table && !x.closedAt);
        if (active) {
          if (customer_id) set((s) => ({ sessions: s.sessions.map((x) => (x.id === active.id ? { ...x, customer_id } : x)) }));
          return { ...active, customer_id: customer_id ?? active.customer_id };
        }
        const ses: TableSession = { id: uid(), restaurant_id: rid, table, customer_id, openedAt: new Date().toISOString(), closedAt: null, discount: 0, billRequested: false };
        set((s) => ({ sessions: [...s.sessions, ses] }));
        return ses;
      },
      getOrOpenSession: (rid, table) => get().openTable(rid, table),
      placeOrder: (rid, sessionId, items, origin) => {
        const ses = get().sessions.find((s) => s.id === sessionId)!;
        set((s) => ({
          orders: [...s.orders, { id: uid(), restaurant_id: rid, session_id: sessionId, table: ses.table, items, status: "novo", createdAt: new Date().toISOString(), statusAt: new Date().toISOString(), origin }],
        }));
      },
      setOrderStatus: (id, status) => set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status, statusAt: new Date().toISOString() } : o)) })),
      requestBill: (sid) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, billRequested: true } : x)) })),
      closeTable: (sid) =>
        set((s) => {
          const sub = sessionSubtotal(s.orders, sid);
          return {
            sessions: s.sessions.map((x) =>
              x.id === sid ? { ...x, closedAt: new Date().toISOString(), billRequested: false, total: Math.max(0, sub - x.discount) } : x,
            ),
          };
        }),
      setDiscount: (sid, discount) => set((s) => ({ sessions: s.sessions.map((x) => (x.id === sid ? { ...x, discount } : x)) })),
      upsertProduct: (p) => set((s) => ({ products: s.products.some((x) => x.id === p.id) ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, { ...p, id: p.id || uid() }] })),
      deleteProduct: (id) => set((s) => ({ products: s.products.filter((x) => x.id !== id) })),
      upsertRestaurant: (r) => set((s) => ({ restaurants: s.restaurants.some((x) => x.id === r.id) ? s.restaurants.map((x) => (x.id === r.id ? r : x)) : [...s.restaurants, { ...r, id: r.id || uid() }] })),
      updateRestaurant: (id, patch) => set((s) => ({ restaurants: s.restaurants.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteRestaurant: (id) =>
        set((s) => ({
          restaurants: s.restaurants.filter((x) => x.id !== id),
          users: s.users.filter((u) => u.restaurant_id !== id),
          products: s.products.filter((x) => x.restaurant_id !== id),
        })),
      upsertUser: (u) => set((s) => ({ users: s.users.some((x) => x.id === u.id) ? s.users.map((x) => (x.id === u.id ? u : x)) : [...s.users, { ...u, id: u.id || uid() }] })),
      deleteUser: (id) => set((s) => ({ users: s.users.filter((x) => x.id !== id) })),
      reset: () => set(seed()),
    }),
    { name: "yourfood-demo-v3", skipHydration: true },
  ),
);

export const newId = uid;

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Hydrate + cross-tab sync so client and KDS update "in real time" across tabs
let started = false;
export function startStoreSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  useStore.persist.rehydrate();
  window.addEventListener("storage", (e) => {
    if (e.key === "yourfood-demo-v3") useStore.persist.rehydrate();
  });
}
