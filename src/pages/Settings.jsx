import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Plus, X, Pencil, Trash2, Wrench, AlertTriangle, FolderTree, Loader2 } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } };
const cardItem = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

const CATEGORIES = ["Lava-Jato", "Estética", "Funilaria", "Polimento", "Reparo de Pintura", "Reparo de Rodas", "Completo", "Outro"];

export default function Settings() {
  const [tab, setTab] = useState("services");
  const [services, setServices] = useState([]);
  const [damages, setDamages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newService, setNewService] = useState({ name: "", category: "Lava-Jato" });
  const [newDamage, setNewDamage] = useState({ name: "", icon: "" });
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [s, d, c] = await Promise.all([
      base44.entities.ServiceType.list("category", 200),
      base44.entities.DamageType.list("name", 200),
      base44.entities.ServiceCategory.list("name", 200)
    ]);
    setServices(s);
    setDamages(d);
    setCategories(c);
    setLoading(false);
  };

  const addService = async () => {
    if (!newService.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.ServiceType.create({ name: newService.name.trim(), category: newService.category, active: true });
    setServices(prev => [...prev, created]);
    setNewService({ name: "", category: "Lava-Jato" });
    toast({ title: "Serviço adicionado" });
    setSaving(false);
  };

  const deleteService = async (id) => {
    await base44.entities.ServiceType.delete(id);
    setServices(prev => prev.filter(s => s.id !== id));
    toast({ title: "Serviço removido" });
  };

  const addDamage = async () => {
    if (!newDamage.name.trim()) return;
    setSaving(true);
    const created = await base44.entities.DamageType.create({ name: newDamage.name.trim(), icon: newDamage.icon || "⚠️", active: true });
    setDamages(prev => [...prev, created]);
    setNewDamage({ name: "", icon: "" });
    toast({ title: "Avaria adicionada" });
    setSaving(false);
  };

  const deleteDamage = async (id) => {
    await base44.entities.DamageType.delete(id);
    setDamages(prev => prev.filter(d => d.id !== id));
    toast({ title: "Avaria removida" });
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setSaving(true);
    const created = await base44.entities.ServiceCategory.create({ name: newCategory.trim(), active: true });
    setCategories(prev => [...prev, created]);
    setNewCategory("");
    toast({ title: "Categoria adicionada" });
    setSaving(false);
  };

  const deleteCategory = async (id) => {
    await base44.entities.ServiceCategory.delete(id);
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: "Categoria removida" });
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
      <PageHeader title="Ajustes" subtitle="Personalize serviços e avarias" />

      <div className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-5">
        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-xl">
          {[
            { id: "services", icon: Wrench, label: "Serviços" },
            { id: "damages", icon: AlertTriangle, label: "Avarias" },
            { id: "categories", icon: FolderTree, label: "Categorias" },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t.id ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Services Tab */}
        {tab === "services" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input className="h-11 rounded-xl" placeholder="Nome do serviço..." value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} />
                </div>
                <Select value={newService.category} onValueChange={v => setNewService(s => ({ ...s, category: v }))}>
                  <SelectTrigger className="h-11 w-40 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addService} disabled={saving || !newService.name.trim()} className="w-full h-11 rounded-xl font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Adicionar Serviço
              </Button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
              {services.map(s => (
                <motion.div key={s.id} variants={cardItem} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-border/50">
                  <div>
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-[10px] text-muted-foreground">{s.category}</p>
                  </div>
                  <button onClick={() => deleteService(s.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Damages Tab */}
        {tab === "damages" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
              <div className="flex gap-2">
                <Input className="flex-1 h-11 rounded-xl" placeholder="Nome da avaria..." value={newDamage.name} onChange={e => setNewDamage(d => ({ ...d, name: e.target.value }))} />
                <Input className="w-20 h-11 rounded-xl text-center text-lg" placeholder="🔧" value={newDamage.icon} onChange={e => setNewDamage(d => ({ ...d, icon: e.target.value }))} maxLength={2} />
              </div>
              <Button onClick={addDamage} disabled={saving || !newDamage.name.trim()} className="w-full h-11 rounded-xl font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Adicionar Avaria
              </Button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
              {damages.map(d => (
                <motion.div key={d.id} variants={cardItem} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-border/50">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{d.icon || "⚠️"}</span>
                    <p className="text-sm font-semibold">{d.name}</p>
                  </div>
                  <button onClick={() => deleteDamage(d.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Categories Tab */}
        {tab === "categories" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 space-y-3">
              <Input className="h-11 rounded-xl" placeholder="Nova categoria..." value={newCategory} onChange={e => setNewCategory(e.target.value)} />
              <Button onClick={addCategory} disabled={saving || !newCategory.trim()} className="w-full h-11 rounded-xl font-semibold">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Adicionar Categoria
              </Button>
            </div>

            <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
              {categories.map(c => (
                <motion.div key={c.id} variants={cardItem} className="flex items-center justify-between bg-white rounded-xl p-3 shadow-sm border border-border/50">
                  <p className="text-sm font-semibold">{c.name}</p>
                  <button onClick={() => deleteCategory(c.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}