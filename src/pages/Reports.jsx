import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { BarChart3, Download, Calendar, TrendingUp, CreditCard, PieChart, Package, Wallet, Receipt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, LineChart, Line } from "recharts";
import moment from "moment";

const colorMap = {
  emerald: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-50", iconText: "text-emerald-600" },
  blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-50", iconText: "text-blue-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-50", iconText: "text-amber-600" },
  purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-50", iconText: "text-purple-600" },
  rose: { bg: "bg-rose-50", text: "text-rose-600", iconBg: "bg-rose-50", iconText: "text-rose-600" },
};

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "all", label: "Todos" }
];

const COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2", "#4f46e5", "#e11d48"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const cardItem = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

function formatCurrency(v) {
  return `R$${(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`;
}

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    Promise.all([
      base44.entities.ServiceOrder.list("-created_date", 1000),
      base44.entities.StockMovement.list("-created_date", 1000)
    ]).then(([o, m]) => {
      setOrders(o);
      setMovements(m);
      setLoading(false);
    });
  }, []);

  const filteredOrders = useMemo(() => {
    const now = moment();
    return orders.filter(o => {
      const d = moment(o.created_date);
      if (period === "today") return d.isSame(now, "day");
      if (period === "week") return d.isSame(now, "week");
      if (period === "month") return d.isSame(now, "month");
      return true;
    });
  }, [orders, period]);

  const completedOrders = filteredOrders.filter(o => o.status === "Liberado" || o.status === "Concluído");
  const totalRevenue = completedOrders.reduce((s, o) => s + (o.value || 0), 0);

  const filteredMovements = useMemo(() => {
    const now = moment();
    return movements.filter(m => {
      const d = moment(m.created_date);
      if (period === "today") return d.isSame(now, "day");
      if (period === "week") return d.isSame(now, "week");
      if (period === "month") return d.isSame(now, "month");
      return true;
    });
  }, [movements, period]);

  const stockExpenses = filteredMovements
    .filter(m => m.type === "Entrada")
    .reduce((s, m) => s + (m.total_value || 0), 0);
  const serviceCosts = completedOrders.reduce((s, o) => s + (o.total_cost || 0), 0);
  const profit = totalRevenue - serviceCosts;

  // By Category
  const byCategory = useMemo(() => {
    const map = {};
    completedOrders.forEach(o => {
      const cat = o.service_category || "Outro";
      if (!map[cat]) map[cat] = { name: cat, count: 0, total: 0, orders: [] };
      map[cat].count++;
      map[cat].total += o.value || 0;
      map[cat].orders.push(o);
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedOrders]);

  // By Payment
  const byPayment = useMemo(() => {
    const map = {};
    completedOrders.forEach(o => {
      const pm = o.payment_method || "Não informado";
      if (!map[pm]) map[pm] = { name: pm, count: 0, total: 0 };
      map[pm].count++;
      map[pm].total += o.value || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [completedOrders]);

  // Daily revenue line chart
  const dailyRevenue = useMemo(() => {
    const map = {};
    completedOrders.forEach(o => {
      const day = moment(o.created_date).format("DD/MM");
      if (!map[day]) map[day] = { date: day, total: 0, count: 0 };
      map[day].total += o.value || 0;
      map[day].count++;
    });
    return Object.values(map).sort((a, b) => moment(a.date, "DD/MM").diff(moment(b.date, "DD/MM")));
  }, [completedOrders]);

  const exportCSV = () => {
    const headers = ["Data", "Veículo", "Placa", "Serviços", "Categoria", "Valor", "Custo", "Lucro", "Pagamento", "Cliente", "Obs"];
    const rows = completedOrders.map(o => [
      moment(o.created_date).format("DD/MM/YYYY"),
      o.vehicle, o.plate,
      (o.services || []).join("; "),
      o.service_category || "",
      (o.value || 0).toFixed(2).replace(".", ","),
      (o.total_cost || 0).toFixed(2).replace(".", ","),
      ((o.value || 0) - (o.total_cost || 0)).toFixed(2).replace(".", ","),
      o.payment_method || "", o.client_name, o.observations || ""
    ]);
    const bom = "\uFEFF";
    const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `relatorio_${period}_rabe.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const exportByCategory = () => {
    byCategory.forEach((cat) => {
      const headers = ["Data", "Veículo", "Placa", "Serviços", "Valor", "Pagamento", "Cliente", "Obs"];
      const rows = cat.orders.map(o => [
        moment(o.created_date).format("DD/MM/YYYY"), o.vehicle, o.plate,
        (o.services || []).join("; "), (o.value || 0).toFixed(2).replace(".", ","),
        o.payment_method || "", o.client_name, o.observations || ""
      ]);
      const bom = "\uFEFF";
      const csvContent = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(";")).join("\n");
      const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url;
      a.download = `relatorio_${cat.name.toLowerCase().replace(/\s/g,"_")}.csv`; a.click(); URL.revokeObjectURL(url);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title="Relatórios" subtitle="Fechamentos e exportações" />

      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5 md:space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-11 bg-white rounded-xl md:w-64">
              <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {[
            { icon: TrendingUp, color: "emerald", label: "Faturamento", value: formatCurrency(totalRevenue) },
            { icon: Receipt, color: "rose", label: "Custo Serviços", value: formatCurrency(serviceCosts) },
            { icon: Wallet, color: "purple", label: "Lucro Líquido", value: formatCurrency(profit) },
            { icon: Package, color: "amber", label: "Gasto Estoque", value: formatCurrency(stockExpenses) },
            { icon: BarChart3, color: "blue", label: "Serviços", value: completedOrders.length },
            { icon: CreditCard, color: "amber", label: "Ticket Médio", value: completedOrders.length ? formatCurrency(totalRevenue / completedOrders.length) : "R$0" },
          ].map((s, i) => (
            <motion.div key={i} variants={cardItem} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <div className={`flex items-center justify-center w-9 h-9 ${colorMap[s.color].bg} rounded-xl mb-2`}>
                <s.icon className={`w-4.5 h-4.5 ${colorMap[s.color].text}`} />
              </div>
              <motion.p className="text-xl md:text-2xl font-bold" initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.1, type: "spring" }}>{s.value}</motion.p>
              <p className="text-[10px] md:text-xs text-muted-foreground font-medium">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Charts - desktop: 2 columns */}
        <div className="md:grid md:grid-cols-2 md:gap-5 space-y-5 md:space-y-0">
          {/* Bar Chart - Revenue by Category */}
          {byCategory.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Faturamento por Categoria</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byCategory} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip formatter={v => [`R$${v}`, "Faturamento"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Pie Chart - Payment Methods */}
          {byPayment.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Forma de Pagamento</h3>
              <ResponsiveContainer width="100%" height={240}>
                <RePieChart>
                  <Pie data={byPayment} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} labelLine={false}>
                    {byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => [formatCurrency(v), ""]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                </RePieChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>

        {/* Line Chart - Daily Revenue */}
        {dailyRevenue.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Evolução Diária</h3>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={dailyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={v => [formatCurrency(v), "Faturamento"]} contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={3} dot={{ fill: "#2563eb", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Export */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="space-y-2.5">
          <Button onClick={exportCSV} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            <Download className="w-4 h-4 mr-2" /> Exportar Planilha Geral (CSV)
          </Button>
          <Button onClick={exportByCategory} variant="outline" className="w-full h-12 rounded-xl font-semibold">
            <Download className="w-4 h-4 mr-2" /> Exportar por Categoria
          </Button>
        </motion.div>
      </div>
    </div>
  );
}