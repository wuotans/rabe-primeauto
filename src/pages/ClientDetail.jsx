import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useParams, Link } from "react-router-dom";
import { User, Phone, FileText, Car, CreditCard } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import PageHeader from "@/components/layout/PageHeader";
import moment from "moment";

export default function ClientDetail() {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.get(id),
      base44.entities.ServiceOrder.list("-created_date", 500)
    ]).then(([c, allOrders]) => {
      setClient(c);
      setOrders(allOrders.filter(o => o.client_id === id || o.client_name === c.name));
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="max-w-lg mx-auto">
        <PageHeader title="Cliente não encontrado" backTo="/clients" />
      </div>
    );
  }

  const totalValue = orders.reduce((s, o) => s + (o.value || 0), 0);

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title={client.name} subtitle={client.phone} backTo="/clients" />

      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5 md:max-w-2xl">
        {/* Client info */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-bold">{client.name}</p>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
            </div>
            {client.has_contract && (
              <span className="ml-auto px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
                Contrato
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">Total de OS</p>
              <p className="text-lg font-bold">{orders.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-emerald-600">R$ {totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        {/* Orders history */}
        <div>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Histórico de Serviços</h2>
          
          {orders.length === 0 ? (
            <div className="py-10 text-center bg-white rounded-2xl border border-border/50">
              <FileText className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum serviço registrado</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {orders.map(order => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className="flex items-center gap-3 bg-white rounded-2xl p-3.5 shadow-sm border border-border/50 active:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 bg-slate-100 rounded-xl shrink-0">
                    <Car className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold">{order.vehicle} — {order.plate}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {order.services?.join(", ")} · {moment(order.created_date).format("DD/MM/YY")}
                    </p>
                    {order.value > 0 && (
                      <p className="text-xs font-semibold text-emerald-600">
                        R$ {order.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} — {order.payment_method}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={order.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}