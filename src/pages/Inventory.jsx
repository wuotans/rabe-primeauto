import React, { useState, useEffect } from "react";
import { api } from "@/api/apiClient";
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
      api.entities.StockItem.list("name", 500),
      api.entities.StockMovement.list("-created_date", 200)
    ]);
    setItems(i);
    setMovements(m);
    setLoading(false);
  };

  const addItem = async () => {
    if (!newItem.name.trim()) return;
    setSaving(true);
    const created = await api.entities.StockItem.create({
      name: newItem.name.trim(), category: newItem.category, unit: newItem.unit,
      current_quantity: Number(newItem.current_quantity) || 0,
      min_quantity: Number(newItem.min_quantity) || 0,
      unit_cost: Number(newItem.unit_cost) || 0
    });
    if ((Number(newItem.current_quantity) || 0) > 0) {
      const mv = await api.entities.StockMovement.create({
        stock_item_id: created.id, stock_item_name: created.name, type: "Entrada",
        quantity: Number(newItem.current_quantity), unit_cost: Number(newItem.unit_cost) || 0,
        total_value: Number(newItem.current_quantity) * (Number(newItem.unit_cost) || 0), reason: "Estoque inicial"
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
    await api.entities.StockItem.delete(id);
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
    const mv = await api.entities.StockMovement.create({
      stock_item_id: movementItem.id, stock_item_name: movementItem.name, type: mov.type,
      quantity: qty, unit_cost: cost, total_value: qty * cost,
      reason: mov.reason || (isEntrada ? "Compra" : "Uso em serviço")
    });
    const updated = await api.entities.StockItem.update(movementItem.id, {
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
    <PageHeader title="Estoque" subtitle="Controle de itens e insumos" rightAction={<button onClick={() => setShowAdd(true)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground"><Plus className="w-5 h-5" /></button>} />
    <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border"><Package className="w-5 h-5 text-blue-600 mb-1.5" /><p className="text-lg font-bold">{items.length}</p><p className="text-[10px] text-muted-foreground">Itens</p></div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border"><AlertTriangle className="w-5 h-5 text-amber-600 mb-1.5" /><p className="text-lg font-bold">{lowStock.length}</p><p className="text-[10px] text-muted-foreground">Estoque baixo</p></div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border"><TrendingUp className="w-5 h-5 text-emerald-600 mb-1.5" /><p className="text-sm font-bold">R${totalStockValue.toLocaleString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">Valor total</p></div>
      </div>
      {showAdd && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-4 shadow-sm border space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Novo Item</h3><button onClick={() => setShowAdd(false)}><X className="w-4 h-4" /></button></div>
        <Input placeholder="Nome" value={newItem.name} onChange={e => setNewItem(n => ({ ...n, name: e.target.value }))} />
        <div className="grid grid-cols-2 gap-2"><Select value={newItem.category} onValueChange={v => setNewItem(n => ({ ...n, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><Select value={newItem.unit} onValueChange={v => setNewItem(n => ({ ...n, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent></Select></div>
        <div className="grid grid-cols-3 gap-2"><Input type="number" value={newItem.current_quantity} onChange={e => setNewItem(n => ({ ...n, current_quantity: e.target.value }))} /><Input type="number" value={newItem.min_quantity} onChange={e => setNewItem(n => ({ ...n, min_quantity: e.target.value }))} /><Input type="number" value={newItem.unit_cost} onChange={e => setNewItem(n => ({ ...n, unit_cost: e.target.value }))} /></div>
        <Button onClick={addItem} disabled={saving || !newItem.name.trim()} className="w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}Adicionar Item</Button>
      </motion.div>}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-2.5">{items.map(item => <motion.div key={item.id} variants={cardItem} className="bg-white rounded-2xl p-3.5 shadow-sm border"><div className="flex items-start justify-between"><div><p className="text-sm font-bold">{item.name}</p><p className="text-xs text-muted-foreground">{item.current_quantity} {item.unit}</p></div><div className="flex gap-1.5"><button onClick={() => openMovement(item, "Entrada")}><ArrowDownCircle className="w-4 h-4" /></button><button onClick={() => openMovement(item, "Saída")}><ArrowUpCircle className="w-4 h-4" /></button><button onClick={() => deleteItem(item.id)}><Trash2 className="w-4 h-4" /></button></div></div></motion.div>)}</motion.div>
    </div>
    <Dialog open={!!movementItem} onOpenChange={(open) => !open && setMovementItem(null)}><DialogContent><DialogHeader><DialogTitle>{mov.type === "Entrada" ? "Entrada de Estoque" : "Saída de Estoque"}</DialogTitle></DialogHeader><div className="space-y-3"><p>{movementItem?.name}</p><div><Label>Quantidade</Label><Input type="number" value={mov.quantity} onChange={e => setMov(m => ({ ...m, quantity: e.target.value }))} /></div>{mov.type === "Entrada" && <div><Label>Custo unitário (R$)</Label><Input type="number" value={mov.unit_cost} onChange={e => setMov(m => ({ ...m, unit_cost: e.target.value }))} /></div>}<div><Label>Motivo</Label><Input value={mov.reason} onChange={e => setMov(m => ({ ...m, reason: e.target.value }))} /></div></div><DialogFooter><Button onClick={registerMovement} disabled={saving}>Registrar</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
