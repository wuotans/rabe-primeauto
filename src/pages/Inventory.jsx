import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Plus, Package, ArrowDownCircle, ArrowUpCircle, Trash2, AlertTriangle, Loader2, TrendingUp, X } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const CATEGORIES = ["Produtos", "Insumos", "Acessórios", "Ferramentas", "Outros"];
const UNITS = ["un", "L", "ml", "kg", "g", "m"];

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [movementItem, setMovementItem] = useState(null);

  const [newItem, setNewItem] = useState({ name: "", category: "Produtos", unit: "un", min_quantity: 0, current_quantity: 0, unit_cost: 0 });
  const [mov, setMov] = useState({ type: "Entrada", quantity: 0, unit_cost: 0, reason: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [i, m] = await Promise.all([
      base44.entities.StockItem.list("name", 500),
      base44.entities.StockMovement.list("-created_date", 200)
    ]);
    setItems(i);
    setMovements(m);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.StockItem.create({
      name: newItem.name.trim(),
      category: newItem.category,
      unit: newItem.unit,
      current_quantity: Number(newItem.current_quantity) || 0,
      min_quantity: Number(newItem.min_quantity) || 0,
      unit_cost: Number(newItem.unit_cost) || 0
    });
    if ((Number(newItem.current_quantity) || 0) > 0) {
      const mv = await base44.entities.StockMovement.create({
        stock_item_id: created.id,
        stock_item_name: created.name,
        type: "Entrada",
        quantity: Number(newItem.current_quantity),
        unit_cost: Number(newItem.unit_cost) || 0,
        total_value: Number(newItem.current_quantity) * (Number(newItem.unit_cost) || 0),
        reason: "Estoque inicial"
      });
      setMovements(prev => [mv, ...prev]);
    }
    setItems(prev => [...prev, created]);
    setNewItem({ name: "", category: "Produtos", unit: "un", min_quantity: 0, current_quantity: 0, unit_cost: 0 });
    toast({ title: "Item adicionado" });
    setSaving(false);
    setShowAdd(false);
  };

  const deleteItem = async (id) => {
    await base44.entities.StockItem.delete(id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast({ title: "Item removido" });
  };

  const openMovement = (item, type) => {
    setMovementItem(item);
    setMov({ type, quantity: 0, unit_cost: item.unit_cost || 0, reason: "" });
  };

  const registerMovement = async () => {
    if (!movementItem || !mov.quantity || Number(mov.quantity) <= 0) return;
    setSaving(true);
    const qty = Number(mov.quantity);
    const cost = Number(mov.unit_cost) || 0;
    const isEntrada = mov.type === "Entrada";
    const newQty = isEntrada ? movementItem.current_quantity + qty : movementItem.current_quantity - qty;
    if (newQty < 0) {
      toast({ title: "Quantidade insuficiente em estoque", variant: "destructive" });
      setSaving(false);
      return;
    }
    const mv = await base44.entities.StockMovement.create({
      stock_item_id: movementItem.id,
      stock_item_name: movementItem.name,
      type: mov.type,
      quantity: qty,
      unit_cost: cost,
      total_value: qty * cost,
      reason: mov.reason || (isEntrada ? "Compra" : "Uso em serviço")
    });
    const updated = await base44.entities.StockItem.update(movementItem.id, {
      current_quantity: newQty,
      unit_cost: isEntrada ? cost : movementItem.unit_cost
    });
    setItems(prev => prev.map(i => i.id === movementItem.id ? updated : i));
    setMovements(prev => [mv, ...prev]);
    setMovementItem(null);
    toast({ title: "Movimentação registrada" });
    setSaving(false);
  };

  const totalStockValue = items.reduce((s, i) => s + (i.current_quantity || 0) * (i.unit_cost || 0), 0);
  const lowStock = items.filter(i => (i.current_quantity || 0) <= (i.min_quantity || 0) && (i.min_quantity || 0) > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title="Estoque" subtitle="Controle de itens e insumos" rightAction={
        <button onClick={() => setShowAdd(true)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <Plus className="w-5 h-5" />
        </button>
      } />

      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-border/50">
            <Package className="w-5 h-5 text-blue-600 mb-1.5" />
            <p className="text-lg font-bold">{items.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Itens</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-border/50">
            <AlertTriangle className="w-5 h-5 text-amber-600 mb-1.5" />
            <p className="text-lg font-bold">{lowStock.length}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Estoque baixo</p>
          </div>
          <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-border/50">
            <TrendingUp className="w-5 h-5 text-emerald-600 mb-1.5" />
            <p className="text-sm font-bold">R${totalStockValue.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] text-muted-foreground font-medium">Valor total</p>
          </div>
        </div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">Novo Item</h3>
              <button onClick={() => setShowAdd(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <Label className="text-xs">Nome</Label>
              <Input className="h-10 rounded-xl" placeholder="Ex: Shampoo Automotivo" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Categoria</Label>
                <Select value={newItem.category} onValueChange={v => setNewItem(n => ({ ...n, category: v }))}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Unidade</Label>
                <Select value={newItem.unit} onValueChange={v => setNewItem(n => ({ ...n, unit: v }))}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label className="text-xs">Qtd. inicial</Label>
                <Input type="number" className="h-10 rounded-xl" value={newItem.current_quantity} onChange={e => setNewItem(n => ({ ...n, current_quantity: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Qtd. mínima</Label>
                <Input type="number" className="h-10 rounded-xl" value={newItem.min_quantity} onChange={e => setNewItem(n => ({ ...n, min_quantity: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Custo unit.</Label>
                <Input type="number" className="h-10 rounded-xl" value={newItem.unit_cost} onChange={e => setNewItem(n => ({ ...n, unit_cost: e.target.value }))} />
              </div>
            </div>
            <Button onClick={addItem} disabled={saving || !newItem.name.trim()} className="w-full h-10 rounded-xl font-semibold">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Adicionar Item
            </Button>
          </motion.div>
        )}

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">
          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-border/50">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum item cadastrado</p>
            </div>
          ) : items.map(item => {
            const isLow = (item.current_quantity || 0) <= (item.min_quantity || 0) && (item.min_quantity || 0) > 0;
            return (
              <motion.div key={item.id} variants={cardItem} className="bg-white rounded-2xl p-3.5 shadow-sm border border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold truncate">{item.name}</p>
                      {isLow && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{item.category} · {item.unit}</p>
                    <p className="text-xs font-semibold mt-1">{item.current_quantity} {item.unit} <span className="text-muted-foreground font-normal">· min {item.min_quantity}</span></p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openMovement(item, "Entrada")} className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors">
                      <ArrowDownCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => openMovement(item, "Saída")} className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                      <ArrowUpCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteItem(item.id)} className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {movements.length > 0 && (
          <div>
            <h2 className="text-sm font-bold mb-3">Movimentações Recentes</h2>
            <div className="space-y-2">
              {movements.slice(0, 10).map(m => (
                <div key={m.id} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm border border-border/50">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${m.type === "Entrada" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}>
                    {m.type === "Entrada" ? <ArrowDownCircle className="w-4 h-4" /> : <ArrowUpCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{m.stock_item_name}</p>
                    <p className="text-[10px] text-muted-foreground">{m.type} · {m.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${m.type === "Entrada" ? "text-emerald-600" : "text-blue-600"}`}>{m.type === "Entrada" ? "+" : "-"}{m.quantity}</p>
                    {m.total_value > 0 && <p className="text-[10px] text-muted-foreground">R${m.total_value.toLocaleString("pt-BR")}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!movementItem} onOpenChange={(open) => !open && setMovementItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mov.type === "Entrada" ? "Entrada de Estoque" : "Saída de Estoque"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">{movementItem?.name}</p>
            <div>
              <Label>Quantidade</Label>
              <Input type="number" value={mov.quantity} onChange={e => setMov(m => ({ ...m, quantity: e.target.value }))} />
            </div>
            {mov.type === "Entrada" && (
              <div>
                <Label>Custo unitário (R$)</Label>
                <Input type="number" value={mov.unit_cost} onChange={e => setMov(m => ({ ...m, unit_cost: e.target.value }))} />
              </div>
            )}
            <div>
              <Label>Motivo</Label>
              <Input value={mov.reason} onChange={e => setMov(m => ({ ...m, reason: e.target.value }))} placeholder={mov.type === "Entrada" ? "Compra..." : "Uso em serviço..."} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementItem(null)}>Cancelar</Button>
            <Button onClick={registerMovement} disabled={saving || !mov.quantity}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}