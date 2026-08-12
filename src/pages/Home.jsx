import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { PlusCircle, Car, CheckCircle2, LogOut, ChevronRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Home() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
    const unsub = api.entities.ServiceOrder.subscribe(() => loadData());
    return unsub;
  }, []);

  const loadData = async () => {
    const [ordersData, userData] = await Promise.all([
      api.entities.ServiceOrder.list("-created_date", 50),
      api.auth.me()
    ]);
    setOrders(ordersData);
    setUser(userData);
    setLoading(false);
  };

  const todayOrders = orders.filter(o => {
    const d = new Date(o.created_date);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const activeOrders = orders.filter(o => o.status === "Aguardando" || o.status === "Em Andamento");
  const todayRevenue = todayOrders.filter(o => o.status === "Liberado" || o.status === "Concluído").reduce((sum, o) => sum + (o.value || 0), 0);
  const completedToday = todayOrders.filter(o => o.status === "Liberado" || o.status === "Concluído").length;

  const handleLogout = () => api.auth.logout("/login");

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title="Rabe PrimeAuto" subtitle={`Olá, ${user?.full_name || "Operador"}`} rightAction={<button onClick={handleLogout} className="p-2 rounded-lg hover:bg-muted transition-colors no-print"><LogOut className="w-5 h-5 text-muted-foreground" /></button>} />
      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5 md:space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/checkin" className="flex items-center gap-4 p-4 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform hover:bg-primary/90">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl"><PlusCircle className="w-6 h-6" /></div>
            <div className="flex-1"><p className="font-bold text-sm">Nova Entrada</p><p className="text-xs opacity-80">Registrar veículo no pátio</p></div>
            <ChevronRight className="w-5 h-5 opacity-60" />
          </Link>
        </motion.div>
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3 md:grid-cols-3 md:gap-4">
          <motion.div variants={item} className="bg-white rounded-2xl p-3.5 md:p-5 shadow-sm border border-border/50"><div className="flex items-center justify-center w-9 h-9 bg-blue-50 rounded-xl mb-2"><Car className="w-5 h-5 text-blue-600" /></div><motion.p className="text-xl md:text-2xl font-bold" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.3, type: "spring" }}>{activeOrders.length}</motion.p><p className="text-[10px] md:text-xs text-muted-foreground font-medium">No pátio</p></motion.div>
          <motion.div variants={item} className="bg-white rounded-2xl p-3.5 md:p-5 shadow-sm border border-border/50"><div className="flex items-center justify-center w-9 h-9 bg-emerald-50 rounded-xl mb-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /></div><motion.p className="text-xl md:text-2xl font-bold" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring" }}>{completedToday}</motion.p><p className="text-[10px] md:text-xs text-muted-foreground font-medium">Concluídos</p></motion.div>
          <motion.div variants={item} className="bg-white rounded-2xl p-3.5 md:p-5 shadow-sm border border-border/50"><div className="flex items-center justify-center w-9 h-9 bg-amber-50 rounded-xl mb-2"><TrendingUp className="w-5 h-5 text-amber-600" /></div><motion.p className="text-xl md:text-2xl font-bold" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }}>R${todayRevenue.toLocaleString("pt-BR")}</motion.p><p className="text-[10px] md:text-xs text-muted-foreground font-medium">Faturamento</p></motion.div>
        </motion.div>
        <div><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-bold md:text-base">Veículos no Pátio</h2><Link to="/orders" className="text-xs text-primary font-semibold">Ver todos</Link></div>{activeOrders.length === 0 ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl p-8 text-center border border-border/50"><Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhum veículo no pátio</p></motion.div> : <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">{activeOrders.map(order => <motion.div key={order.id} variants={item}><Link to={`/order/${order.id}`} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border/50 active:bg-muted/50 transition-colors block"><div className="flex items-center justify-center w-11 h-11 bg-slate-100 rounded-xl"><Car className="w-5 h-5 text-slate-600" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-bold truncate">{order.vehicle}</p><span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{order.plate}</span></div><p className="text-xs text-muted-foreground truncate mt-0.5">{order.client_name} · {order.services?.join(", ")}</p></div><StatusBadge status={order.status} /></Link></motion.div>)}</motion.div>}</div>
      </div>
    </div>
  );
}
