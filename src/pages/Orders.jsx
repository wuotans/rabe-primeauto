import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
import { Link } from "react-router-dom";
import { Car, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";
import moment from "moment";

const STATUS_FILTERS = ["Todos", "Aguardando", "Em Andamento", "Concluído", "Liberado"];
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardItem = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");

  useEffect(() => {
    api.entities.ServiceOrder.list("-created_date", 200).then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.client_name?.toLowerCase().includes(search.toLowerCase()) || o.plate?.toLowerCase().includes(search.toLowerCase()) || o.vehicle?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "Todos" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return <div className="max-w-lg mx-auto md:max-w-none md:mx-0"><PageHeader title="Ordens de Serviço" subtitle={`${orders.length} registros`} /><div className="px-4 py-4 md:px-6 lg:px-8 md:py-6 space-y-4"><motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}><div className="relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="h-11 pl-10 bg-white rounded-xl" placeholder="Buscar por cliente, placa ou veículo..." value={search} onChange={e => setSearch(e.target.value)} /></div></motion.div><div className="flex gap-2 overflow-x-auto">{STATUS_FILTERS.map(status => <button key={status} onClick={() => setStatusFilter(status)} className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-semibold ${statusFilter === status ? "bg-primary text-white" : "bg-white border"}`}>{status}</button>)}</div>{filtered.length === 0 ? <div className="py-16 text-center"><Car className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" /><p className="text-sm text-muted-foreground">Nenhuma OS encontrada</p></div> : <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5 md:grid md:grid-cols-2 md:gap-3 md:space-y-0 lg:grid-cols-3">{filtered.map(order => <motion.div key={order.id} variants={cardItem}><Link to={`/order/${order.id}`} className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border/50 block"><div className="flex items-center justify-center w-11 h-11 bg-slate-100 rounded-xl"><Car className="w-5 h-5 text-slate-600" /></div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><p className="text-sm font-bold truncate">{order.vehicle}</p><span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{order.plate}</span></div><p className="text-xs text-muted-foreground truncate mt-0.5">{order.client_name} · {moment(order.created_date).format("DD/MM HH:mm")}</p>{order.value > 0 && <p className="text-xs font-semibold text-emerald-600">R$ {order.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>}</div><StatusBadge status={order.status} /></Link></motion.div>)}</motion.div>}</div></div>;
}
