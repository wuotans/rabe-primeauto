import React, { useEffect, useState } from "react";
import { api } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Plus, Trash2, Wrench, AlertTriangle, FolderTree, Loader2 } from "lucide-react";

const itemAnimation = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function Settings() {
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newService, setNewService] = useState({ name: "", category: "Lava-Jato" });
  const [newDamage, setNewDamage] = useState({ name: "", icon: "" });
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [serviceData, damageData, categoryData] = await Promise.all([
      api.entities.ServiceType.list("category", 200),
      api.entities.DamageType.list("name", 200),
      api.entities.ServiceCategory.list("name", 200),
    ]);
    setServices(serviceData);
    setDamages(damageData);
    setCategories(categoryData);
    setLoading(false);
  };

  const addService = async () => {
    if (!newService.name.trim()) return;
    setSaving(true);
    const created = await api.entities.ServiceType.create({ name: newService.name.trim(), category: newService.category, active: true });
    setServices(current => [...current, created]);
    setNewService({ name: "", category: newService.category });
    setSaving(false);
    toast({ title: "Serviço adicionado" });
  };
  const deleteService = async (id) => {
    await api.entities.ServiceType.delete(id);
    setServices(current => current.filter(item => item.id !== id));
    toast({ title: "Serviço removido" });
  };
  const addDamage = async () => {
    if (!newDamage.name.trim()) return;
    setSaving(true);
    const created = await api.entities.DamageType.create({ name: newDamage.name.trim(), icon: newDamage.icon || "⚠️", active: true });
    setDamages(current => [...current, created]);
    setNewDamage({ name: "", icon: "" });
    setSaving(false);
    toast({ title: "Avaria adicionada" });
  };
  const deleteDamage = async (id) => {
    await api.entities.DamageType.delete(id);
    setDamages(current => current.filter(item => item.id !== id));
    toast({ title: "Avaria removida" });
  };
  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    const created = await api.entities.ServiceCategory.create({ name: newCategory.trim(), active: true });
    setCategories(current => [...current, created]);
    setNewCategory("");
    setSaving(false);
    toast({ title: "Categoria adicionada" });
  };
  const deleteCategory = async (id) => {
    await api.entities.ServiceCategory.delete(id);
    setCategories(current => current.filter(item => item.id !== id));
    toast({ title: "Categoria removida" });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const tabs = [
    { id: "services", label: "Serviços", icon: Wrench },
    { id: "damages", label: "Avarias", icon: AlertTriangle },
    { id: "categories", label: "Categorias", icon: FolderTree },
  ];

  return <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
    <PageHeader title="Ajustes" subtitle="Personalize serviços e avarias" />
    <div className="px-4 py-5 md:px-6 lg:px-8 space-y-5">
      <div className="flex gap-2 p-1 bg-muted rounded-xl">{tabs.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold ${tab === item.id ? "bg-white shadow-sm" : "text-muted-foreground"}`}><item.icon className="w-3.5 h-3.5" />{item.label}</button>)}</div>

      {tab === "services" && <div className="space-y-4"><div className="bg-white rounded-2xl p-4 border space-y-3"><div className="grid md:grid-cols-[1fr_220px] gap-2"><Input placeholder="Nome do serviço" value={newService.name} onChange={e => setNewService(current => ({ ...current, name: e.target.value }))} /><Select value={newService.category} onValueChange={value => setNewService(current => ({ ...current, category: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map(category => <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>)}</SelectContent></Select></div><Button onClick={addService} disabled={saving || !newService.name.trim()} className="w-full">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Adicionar Serviço</Button></div><motion.div initial="hidden" animate="show" className="space-y-2">{services.map(service => <motion.div variants={itemAnimation} key={service.id} className="flex items-center justify-between bg-white rounded-xl p-3 border"><div><p className="text-sm font-semibold">{service.name}</p><p className="text-xs text-muted-foreground">{service.category}</p></div><button onClick={() => deleteService(service.id)}><Trash2 className="w-4 h-4" /></button></motion.div>)}</motion.div></div>}

      {tab === "damages" && <div className="space-y-4"><div className="bg-white rounded-2xl p-4 border space-y-3"><div className="flex gap-2"><Input placeholder="Nome da avaria" value={newDamage.name} onChange={e => setNewDamage(current => ({ ...current, name: e.target.value }))} /><Input className="w-24" placeholder="Ícone" value={newDamage.icon} onChange={e => setNewDamage(current => ({ ...current, icon: e.target.value }))} /></div><Button onClick={addDamage} disabled={saving || !newDamage.name.trim()} className="w-full"><Plus className="w-4 h-4 mr-2" />Adicionar Avaria</Button></div><div className="space-y-2">{damages.map(damage => <div key={damage.id} className="flex items-center justify-between bg-white rounded-xl p-3 border"><p className="text-sm font-semibold">{damage.icon} {damage.name}</p><button onClick={() => deleteDamage(damage.id)}><Trash2 className="w-4 h-4" /></button></div>)}</div></div>}

      {tab === "categories" && <div className="space-y-4"><div className="bg-white rounded-2xl p-4 border space-y-3"><Input placeholder="Nova categoria" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><Button onClick={addCategory} disabled={saving || !newCategory.trim()} className="w-full"><Plus className="w-4 h-4 mr-2" />Adicionar Categoria</Button></div><div className="space-y-2">{categories.map(category => <div key={category.id} className="flex items-center justify-between bg-white rounded-xl p-3 border"><p className="text-sm font-semibold">{category.name}</p><button onClick={() => deleteCategory(category.id)}><Trash2 className="w-4 h-4" /></button></div>)}</div></div>}
    </div>
  </div>;
}
