import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/api/apiClient";
import { BarChart3, Download, Calendar, TrendingUp, CreditCard, Package, Wallet, Receipt } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import moment from "moment";

const PERIODS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta Semana" },
  { value: "month", label: "Este Mês" },
  { value: "all", label: "Todos" },
];
const COLORS = ["#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0891b2"];
const cardItem = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const formatCurrency = (value) => `R$ ${(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

export default function Reports() {
  const [orders, setOrders] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    Promise.all([
      api.entities.ServiceOrder.list("-created_date", 1000),
      api.entities.StockMovement.list("-created_date", 1000),
    ]).then(([orderData, movementData]) => {
      setOrders(orderData);
      setMovements(movementData);
      setLoading(false);
    });
  }, []);

  const matchesPeriod = (date) => {
    const current = moment();
    const target = moment(date);
    if (period === "today") return target.isSame(current, "day");
    if (period === "week") return target.isSame(current, "week");
    if (period === "month") return target.isSame(current, "month");
    return true;
  };

  const completedOrders = useMemo(
    () => orders.filter(o => matchesPeriod(o.created_date) && ["Liberado", "Concluído"].includes(o.status)),
    [orders, period]
  );
  const filteredMovements = useMemo(() => movements.filter(m => matchesPeriod(m.created_date)), [movements, period]);

  const totalRevenue = completedOrders.reduce((sum, order) => sum + (order.value || 0), 0);
  const serviceCosts = completedOrders.reduce((sum, order) => sum + (order.total_cost || 0), 0);
  const stockExpenses = filteredMovements.filter(m => m.type === "Entrada").reduce((sum, movement) => sum + (movement.total_value || 0), 0);
  const profit = totalRevenue - serviceCosts;

  const byCategory = useMemo(() => {
    const result = {};
    completedOrders.forEach(order => {
      const name = order.service_category || "Outro";
      result[name] ??= { name, total: 0, count: 0 };
      result[name].total += order.value || 0;
      result[name].count += 1;
    });
    return Object.values(result).sort((a, b) => b.total - a.total);
  }, [completedOrders]);

  const byPayment = useMemo(() => {
    const result = {};
    completedOrders.forEach(order => {
      const name = order.payment_method || "Não informado";
      result[name] ??= { name, total: 0 };
      result[name].total += order.value || 0;
    });
    return Object.values(result);
  }, [completedOrders]);

  const dailyRevenue = useMemo(() => {
    const result = {};
    completedOrders.forEach(order => {
      const date = moment(order.created_date).format("DD/MM");
      result[date] ??= { date, total: 0 };
      result[date].total += order.value || 0;
    });
    return Object.values(result);
  }, [completedOrders]);

  const exportCSV = () => {
    const rows = [
      ["Data", "Veículo", "Placa", "Cliente", "Categoria", "Valor", "Custo", "Pagamento"],
      ...completedOrders.map(order => [
        moment(order.created_date).format("DD/MM/YYYY"), order.vehicle, order.plate, order.client_name,
        order.service_category || "", order.value || 0, order.total_cost || 0, order.payment_method || "",
      ]),
    ];
    const content = "\uFEFF" + rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(";")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio_primeauto_${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const cards = [
    [TrendingUp, "Faturamento", formatCurrency(totalRevenue)],
    [Receipt, "Custo dos serviços", formatCurrency(serviceCosts)],
    [Wallet, "Lucro", formatCurrency(profit)],
    [Package, "Compras de estoque", formatCurrency(stockExpenses)],
    [BarChart3, "Serviços", completedOrders.length],
    [CreditCard, "Ticket médio", formatCurrency(completedOrders.length ? totalRevenue / completedOrders.length : 0)],
  ];

  return <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
    <PageHeader title="Relatórios" subtitle="Fechamentos e indicadores" />
    <div className="px-4 py-5 md:px-6 lg:px-8 space-y-5">
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <Select value={period} onValueChange={setPeriod}><SelectTrigger className="bg-white md:w-64"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger><SelectContent>{PERIODS.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
        <Button variant="outline" onClick={exportCSV}><Download className="w-4 h-4 mr-2" />Exportar CSV</Button>
      </div>
      <motion.div initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 gap-3">{cards.map(([Icon, label, value]) => <motion.div key={label} variants={cardItem} className="bg-white rounded-2xl p-4 shadow-sm border"><Icon className="w-5 h-5 mb-2" /><p className="text-xl font-bold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></motion.div>)}</motion.div>
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm border"><h3 className="text-sm font-bold mb-4">Faturamento por categoria</h3><ResponsiveContainer width="100%" height={240}><BarChart data={byCategory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="total">{byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border"><h3 className="text-sm font-bold mb-4">Forma de pagamento</h3><ResponsiveContainer width="100%" height={240}><PieChart><Pie data={byPayment} dataKey="total" nameKey="name" outerRadius={85}>{byPayment.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
      {dailyRevenue.length > 1 && <div className="bg-white rounded-2xl p-4 shadow-sm border"><h3 className="text-sm font-bold mb-4">Evolução diária</h3><ResponsiveContainer width="100%" height={240}><LineChart data={dailyRevenue}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis /><Tooltip /><Line type="monotone" dataKey="total" strokeWidth={3} /></LineChart></ResponsiveContainer></div>}
    </div>
  </div>;
}
