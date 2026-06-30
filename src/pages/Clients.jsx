import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Search, User, Phone, FileText, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import PageHeader from "@/components/layout/PageHeader";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 500),
      base44.entities.ServiceOrder.list("-created_date", 500)
    ]).then(([c, o]) => {
      setClients(c); setOrders(o); setLoading(false);
    });
  }, []);

  const getClientStats = (clientName) => {
    const clientOrders = orders.filter(o => o.client_name === clientName);
    return { count: clientOrders.length, total: clientOrders.reduce((s, o) => s + (o.value || 0), 0) };
  };

  const filtered = clients.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title="Clientes" subtitle={`${clients.length} cadastrados`} />

      <div className="px-4 py-4 md:px-6 lg:px-8 md:py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input className="h-11 pl-10 bg-white rounded-xl" placeholder="Buscar por nome ou telefone..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </motion.div>

        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <User className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum cliente encontrado</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">
            {filtered.map(client => {
              const stats = getClientStats(client.name);
              return (
                <motion.div key={client.id} variants={cardItem}>
                  <Link to={`/client/${client.id}`}
                    className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border/50 active:bg-muted/50 transition-colors block">
                    <div className="flex items-center justify-center w-11 h-11 bg-blue-50 rounded-xl shrink-0">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold truncate">{client.name}</p>
                        {client.has_contract && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full shrink-0">Contrato</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><Phone className="w-3 h-3" /> {client.phone}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground"><FileText className="w-3 h-3" /> {stats.count} OS</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}