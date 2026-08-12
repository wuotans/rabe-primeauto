import React, { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Car, User, Phone, FileText, CreditCard, Printer, Play, CheckCircle2, Loader2, AlertTriangle } from "lucide-react";
import moment from "moment";

const PAYMENT_METHODS = ["Cartão", "PIX", "Dinheiro", "Contrato", "Cortesia", "Ficha"];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [serviceCosts, setServiceCosts] = useState([]);

  useEffect(() => { loadOrder(); }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    const data = await api.entities.ServiceOrder.get(id);
    setOrder(data);
    setValue(data.value?.toString() || "0");
    setPaymentMethod(data.payment_method || "");
    setServiceCosts(data.service_costs || (data.services || []).map(name => ({ name, cost: 0 })));
    setLoading(false);
  };

  const totalCost = serviceCosts.reduce((sum, item) => sum + (Number(item.cost) || 0), 0);

  const updateStatus = async (status) => {
    setSaving(true);
    const payload = { status };
    if (status === "Liberado") {
      payload.checkout_date = new Date().toISOString();
      payload.value = parseFloat(value) || 0;
      payload.payment_method = paymentMethod;
    }
    await api.entities.ServiceOrder.update(id, payload);
    toast({ title: `Status atualizado: ${status}` });
    await loadOrder();
    setSaving(false);
  };

  const saveCosts = async () => {
    setSaving(true);
    await api.entities.ServiceOrder.update(id, { service_costs: serviceCosts, total_cost: totalCost });
    toast({ title: "Custos salvos" });
    await loadOrder();
    setSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!order) return <div className="max-w-lg mx-auto"><PageHeader title="OS não encontrada" backTo="/" /><div className="px-4 py-16 text-center"><p className="text-muted-foreground">Ordem de serviço não encontrada.</p></div></div>;

  return <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
    <PageHeader title={`OS ${order.os_number || ""}`} subtitle={`${order.vehicle} — ${order.plate}`} backTo="/" rightAction={<button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-muted no-print"><Printer className="w-5 h-5 text-muted-foreground" /></button>} />
    <div className="px-4 py-5 md:px-6 lg:px-8 space-y-5 md:max-w-2xl">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border"><div><p className="text-xs text-muted-foreground">Status</p><StatusBadge status={order.status} /></div><div className="text-right"><p className="text-xs text-muted-foreground">Entrada</p><p className="text-sm font-semibold">{moment(order.checkin_date || order.created_date).format("DD/MM HH:mm")}</p></div></div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-3"><div className="flex items-center gap-3"><Car className="w-5 h-5" /><div><p className="text-sm font-bold">{order.vehicle}</p><p className="text-xs font-mono text-muted-foreground">{order.plate}</p></div></div><div className="flex items-center gap-3"><User className="w-5 h-5" /><div><p className="text-sm font-semibold">{order.client_name}</p><p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{order.client_phone}</p></div>{order.has_contract && <span className="ml-auto px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">Contrato</span>}</div></div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center gap-2 mb-3"><FileText className="w-4 h-4" /><h3 className="text-xs font-bold uppercase">Serviços & Custos</h3></div><div className="space-y-2">{serviceCosts.map((item, index) => <div key={`${item.name}-${index}`} className="flex items-center gap-2"><span className="flex-1 px-3 py-2 bg-primary/5 text-primary text-xs font-semibold rounded-xl">{item.name}</span>{order.status !== "Liberado" ? <Input type="number" step="0.01" className="h-9 w-28" value={item.cost} onChange={e => setServiceCosts(current => current.map(cost => cost.name === item.name ? { ...cost, cost: Number(e.target.value) || 0 } : cost))} /> : <span className="text-sm font-bold">R$ {(item.cost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>}</div>)}</div>{order.status !== "Liberado" && <Button onClick={saveCosts} disabled={saving} variant="outline" className="w-full mt-3">Salvar Custos</Button>}<div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t"><div><p className="text-xs text-muted-foreground">Custo Total</p><p className="font-bold text-rose-600">R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div><div><p className="text-xs text-muted-foreground">Lucro</p><p className="font-bold text-emerald-600">R$ {((parseFloat(value) || 0) - totalCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p></div></div></div>
      {(order.damages?.length > 0 || order.damage_photos?.length > 0) && <div className="bg-white rounded-2xl p-4 shadow-sm border"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-amber-500" /><h3 className="text-xs font-bold uppercase">Avarias</h3></div><div className="flex flex-wrap gap-2">{order.damages?.map((damage, index) => <span key={index} className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl">{damage}</span>)}</div><div className="flex gap-2 overflow-x-auto mt-3">{order.damage_photos?.map((url, index) => <img key={index} src={url} alt="Avaria" className="w-24 h-24 rounded-xl object-cover" />)}</div></div>}
      {order.observations && <div className="bg-white rounded-2xl p-4 shadow-sm border"><h3 className="text-xs font-bold uppercase mb-2">Observações</h3><p className="text-sm whitespace-pre-wrap">{order.observations}</p></div>}
      {["Aguardando", "Em Andamento", "Concluído"].includes(order.status) && <div className="bg-white rounded-2xl p-4 shadow-sm border space-y-4 no-print"><div><Label>Valor (R$)</Label><Input type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} /></div><div><Label>Forma de Pagamento</Label><Select value={paymentMethod} onValueChange={setPaymentMethod}><SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger><SelectContent>{PAYMENT_METHODS.map(method => <SelectItem key={method} value={method}>{method}</SelectItem>)}</SelectContent></Select></div></div>}
      {order.status === "Liberado" && <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200"><div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><h3 className="font-bold text-emerald-800">Veículo Liberado</h3></div><p className="mt-2 text-sm text-emerald-800">Valor: {formatCurrency(order.value)} · {order.payment_method || "—"}</p></div>}
      <div className="space-y-2 no-print">{order.status === "Aguardando" && <Button onClick={() => updateStatus("Em Andamento")} disabled={saving} className="w-full h-14 bg-blue-600"><Play className="w-5 h-5 mr-2" />Iniciar Serviço</Button>}{order.status === "Em Andamento" && <Button onClick={() => updateStatus("Concluído")} disabled={saving} className="w-full h-14 bg-emerald-600"><CheckCircle2 className="w-5 h-5 mr-2" />Concluir Serviço</Button>}{order.status === "Concluído" && <Button onClick={() => paymentMethod ? updateStatus("Liberado") : toast({ title: "Selecione a forma de pagamento", variant: "destructive" })} disabled={saving} className="w-full h-14"><CreditCard className="w-5 h-5 mr-2" />Liberar Veículo</Button>}{saving && <div className="flex justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>}</div>
    </div>
  </div>;
}

function formatCurrency(value) {
  return `R$ ${(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}
