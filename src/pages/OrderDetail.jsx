import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Car, User, Phone, FileText, Clock, CreditCard, Printer, Play, CheckCircle2, Loader2, AlertTriangle, Camera } from "lucide-react";
import moment from "moment";

const PAYMENT_METHODS = ["Cartão", "PIX", "Dinheiro", "Contrato", "Cortesia", "Ficha"];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [value, setValue] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [serviceCosts, setServiceCosts] = useState([]);

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    setLoading(true);
    const data = await base44.entities.ServiceOrder.get(id);
    setOrder(data);
    setValue(data.value?.toString() || "0");
    setPaymentMethod(data.payment_method || "");
    setServiceCosts(data.service_costs || (data.services || []).map(s => ({ name: s, cost: 0 })));
    setLoading(false);
  };

  const updateStatus = async (newStatus) => {
    setSaving(true);
    const updateData = { status: newStatus };
    if (newStatus === "Liberado") {
      updateData.checkout_date = new Date().toISOString();
      updateData.value = parseFloat(value) || 0;
      updateData.payment_method = paymentMethod;
    }
    await base44.entities.ServiceOrder.update(id, updateData);
    toast({ title: `Status atualizado: ${newStatus}` });
    loadOrder();
    setSaving(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const totalCost = serviceCosts.reduce((s, sc) => s + (Number(sc.cost) || 0), 0);

  const saveCosts = async () => {
    setSaving(true);
    await base44.entities.ServiceOrder.update(id, { service_costs: serviceCosts, total_cost: totalCost });
    toast({ title: "Custos salvos" });
    loadOrder();
    setSaving(false);
  };

  const updateServiceCost = (name, cost) => {
    setServiceCosts(prev => prev.map(sc => sc.name === name ? { ...sc, cost: Number(cost) || 0 } : sc));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="OS não encontrada" backTo="/" />
        <div className="px-4 py-16 text-center">
          <p className="text-muted-foreground">Ordem de serviço não encontrada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader
        title={`OS ${order.os_number || ""}`}
        subtitle={order.vehicle + " — " + order.plate}
        backTo="/"
        rightAction={
          <button onClick={handlePrint} className="p-2 rounded-lg hover:bg-muted transition-colors no-print">
            <Printer className="w-5 h-5 text-muted-foreground" />
          </button>
        }
      />

      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5 md:max-w-2xl">
        {/* Status */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-border/50">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Status</p>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">Entrada</p>
            <p className="text-sm font-semibold">{moment(order.checkin_date || order.created_date).format("DD/MM HH:mm")}</p>
          </div>
        </div>

        {/* Vehicle & Client info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl">
              <Car className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-bold">{order.vehicle}</p>
              <p className="text-xs font-mono text-muted-foreground">{order.plate}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-xl">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{order.client_name}</p>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{order.client_phone}</p>
              </div>
            </div>
            {order.has_contract && (
              <span className="ml-auto px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                Contrato
              </span>
            )}
          </div>
        </div>

        {/* Services & Costs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Serviços & Custos</h3>
            {order.service_category && (
              <span className="ml-auto px-2 py-0.5 bg-muted text-xs font-semibold rounded-lg">
                {order.service_category}
              </span>
            )}
          </div>
          <div className="space-y-2">
            {serviceCosts.map((sc, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="flex-1 px-3 py-2 bg-primary/5 text-primary text-xs font-semibold rounded-xl truncate">
                  {sc.name}
                </span>
                {order.status !== "Liberado" ? (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">R$</span>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-9 w-24 rounded-lg text-sm font-semibold"
                      value={sc.cost}
                      onChange={e => updateServiceCost(sc.name, e.target.value)}
                      placeholder="0,00"
                    />
                  </div>
                ) : (
                  <span className="text-sm font-bold text-muted-foreground w-24 text-right">R$ {(sc.cost || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                )}
              </div>
            ))}
          </div>
          {order.status !== "Liberado" && (
            <Button onClick={saveCosts} disabled={saving} variant="outline" className="w-full h-10 rounded-xl mt-3 text-xs font-semibold">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Salvar Custos
            </Button>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border/50">
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Custo Total</p>
              <p className="text-sm font-bold text-rose-600">R$ {totalCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase">Lucro</p>
              <p className="text-sm font-bold text-emerald-600">R$ {((parseFloat(value) || 0) - totalCost).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Damages */}
        {(order.damages?.length > 0 || order.damage_photos?.length > 0) && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avarias</h3>
            </div>
            {order.damages?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {order.damages.map((d, i) => (
                  <span key={i} className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs font-semibold rounded-xl">
                    {d}
                  </span>
                ))}
              </div>
            )}
            {order.damage_photos?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mt-2">
                {order.damage_photos.map((url, idx) => (
                  <img key={idx} src={url} alt="Avaria" className="w-24 h-24 rounded-xl object-cover shrink-0" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Observations */}
        {order.observations && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Observações</h3>
            <p className="text-sm text-foreground whitespace-pre-wrap">{order.observations}</p>
          </div>
        )}

        {/* Payment & Checkout - for active orders */}
        {(order.status === "Aguardando" || order.status === "Em Andamento" || order.status === "Concluído") && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-4 no-print">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pagamento & Liberação</h3>
            
            <div>
              <Label className="text-xs font-semibold">Valor (R$)</Label>
              <Input
                className="h-12 rounded-xl mt-1 text-lg font-bold"
                type="number"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0,00"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Forma de Pagamento</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-xl mt-1">
                  <SelectValue placeholder="Selecionar..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Completed info */}
        {order.status === "Liberado" && (
          <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-emerald-800">Veículo Liberado</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-emerald-600">Valor</p>
                <p className="text-lg font-bold text-emerald-800">R$ {(order.value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-xs text-emerald-600">Pagamento</p>
                <p className="text-sm font-bold text-emerald-800">{order.payment_method || "—"}</p>
              </div>
              {order.checkout_date && (
                <div className="col-span-2">
                  <p className="text-xs text-emerald-600">Saída</p>
                  <p className="text-sm font-semibold text-emerald-800">{moment(order.checkout_date).format("DD/MM/YYYY [às] HH:mm")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5 no-print">
          {order.status === "Aguardando" && (
            <Button
              onClick={() => updateStatus("Em Andamento")}
              disabled={saving}
              className="w-full h-14 rounded-2xl text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Play className="w-5 h-5 mr-2" /> Iniciar Serviço</>}
            </Button>
          )}
          {order.status === "Em Andamento" && (
            <Button
              onClick={() => updateStatus("Concluído")}
              disabled={saving}
              className="w-full h-14 rounded-2xl text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5 mr-2" /> Concluir Serviço</>}
            </Button>
          )}
          {order.status === "Concluído" && (
            <Button
              onClick={() => {
                if (!paymentMethod) {
                  toast({ title: "Selecione a forma de pagamento", variant: "destructive" });
                  return;
                }
                updateStatus("Liberado");
              }}
              disabled={saving}
              className="w-full h-14 rounded-2xl text-base font-bold shadow-lg"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5 mr-2" /> Liberar Veículo</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}