import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import PageHeader from "@/components/layout/PageHeader";
import { motion } from "framer-motion";
import { Loader2, Camera, X, ChevronDown } from "lucide-react";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const section = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

export default function Checkin() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [damageTypes, setDamageTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");

  const [form, setForm] = useState({
    client_name: "", client_phone: "", has_contract: false,
    vehicle: "", plate: "", services: [], service_category: "",
    damages: [], observations: "", damage_photos: [], service_costs: []
  });

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-created_date", 200),
      base44.entities.ServiceType.list("category", 200),
      base44.entities.DamageType.list("name", 200),
      base44.entities.ServiceCategory.list("name", 200)
    ]).then(([cl, st, dt, ct]) => {
      setClients(cl);
      setServiceTypes(st.filter(s => s.active !== false));
      setDamageTypes(dt.filter(d => d.active !== false));
      setCategories(ct.filter(c => c.active !== false));
    });
  }, []);

  const handleClientSelect = (clientId) => {
    setSelectedClientId(clientId);
    if (clientId === "new") {
      setForm(f => ({ ...f, client_name: "", client_phone: "", has_contract: false }));
      return;
    }
    const client = clients.find(c => c.id === clientId);
    if (client) {
      setForm(f => ({ ...f, client_name: client.name, client_phone: client.phone, has_contract: client.has_contract || false }));
    }
  };

  const toggleService = (name) => {
    setForm(f => {
      if (f.services.includes(name)) {
        return { ...f, services: f.services.filter(s => s !== name), service_costs: f.service_costs.filter(sc => sc.name !== name) };
      }
      return { ...f, services: [...f.services, name], service_costs: [...f.service_costs, { name, cost: 0 }] };
    });
  };

  const updateServiceCost = (name, cost) => {
    setForm(f => ({ ...f, service_costs: f.service_costs.map(sc => sc.name === name ? { ...sc, cost: Number(cost) || 0 } : sc) }));
  };

  const toggleDamage = (name) => {
    setForm(f => ({ ...f, damages: f.damages.includes(name) ? f.damages.filter(d => d !== name) : [...f.damages, name] }));
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, damage_photos: [...f.damage_photos, file_url] }));
  };

  const removePhoto = (idx) => {
    setForm(f => ({ ...f, damage_photos: f.damage_photos.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async () => {
    if (!form.client_name || !form.vehicle || !form.plate || form.services.length === 0) {
      toast({ title: "Preencha os campos obrigatórios", description: "Nome, veículo, placa e pelo menos um serviço.", variant: "destructive" });
      return;
    }
    setSaving(true);

    let clientId = selectedClientId;
    if (!clientId || clientId === "new") {
      const existing = clients.find(c => c.phone === form.client_phone && c.name === form.client_name);
      if (existing) {
        clientId = existing.id;
      } else {
        const newClient = await base44.entities.Client.create({
          name: form.client_name, phone: form.client_phone, has_contract: form.has_contract
        });
        clientId = newClient.id;
      }
    }

    const now = new Date();
    const osNumber = `OS-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

    const order = await base44.entities.ServiceOrder.create({
      os_number: osNumber, client_id: clientId,
      client_name: form.client_name, client_phone: form.client_phone, has_contract: form.has_contract,
      vehicle: form.vehicle.toUpperCase(), plate: form.plate.toUpperCase(),
      services: form.services, service_category: form.service_category || "Lava-Jato",
      service_costs: form.service_costs, total_cost: form.service_costs.reduce((s, sc) => s + (sc.cost || 0), 0),
      damages: form.damages, observations: form.observations,
      status: "Aguardando", value: 0, checkin_date: now.toISOString(), damage_photos: form.damage_photos
    });

    toast({ title: "Veículo registrado!", description: `OS ${osNumber} criada com sucesso.` });
    navigate(`/order/${order.id}`);
  };

  return (
    <div className="max-w-lg mx-auto md:max-w-none md:mx-0">
      <PageHeader title="Entrada de Veículo" subtitle="Registrar novo veículo" backTo="/" />

      <motion.div variants={container} initial="hidden" animate="show" className="px-4 py-5 md:px-6 lg:px-8 md:py-6 space-y-6 md:max-w-2xl">
        {/* Client */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cliente</h2>
          <Select value={selectedClientId} onValueChange={handleClientSelect}>
            <SelectTrigger className="h-12 bg-white rounded-xl">
              <SelectValue placeholder="Selecionar cliente existente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">+ Novo Cliente</SelectItem>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name} {c.has_contract ? "📋" : ""} — {c.phone}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Nome *</Label>
              <Input className="h-12 bg-white rounded-xl mt-1" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Nome do cliente" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Telefone *</Label>
              <Input className="h-12 bg-white rounded-xl mt-1" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} placeholder="(00) 00000-0000" type="tel" />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-border/50">
            <Checkbox checked={form.has_contract} onCheckedChange={v => setForm(f => ({ ...f, has_contract: v }))} id="contract" />
            <Label htmlFor="contract" className="text-sm font-medium cursor-pointer">Cliente com contrato recorrente</Label>
          </div>
        </motion.section>

        {/* Vehicle */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Veículo</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold">Modelo *</Label>
              <Input className="h-12 bg-white rounded-xl mt-1 uppercase" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="Ex: Polo" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Placa *</Label>
              <Input className="h-12 bg-white rounded-xl mt-1 uppercase font-mono" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} placeholder="ABC1D23" maxLength={7} />
            </div>
          </div>
        </motion.section>

        {/* Category */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Categoria</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setForm(f => ({ ...f, service_category: cat.name }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  form.service_category === cat.name ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-foreground border border-border/50 hover:border-primary/30"
                }`}>{cat.name}</button>
            ))}
          </div>
        </motion.section>

        {/* Services */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Serviços *</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {serviceTypes.map(st => (
              <button key={st.id} onClick={() => toggleService(st.name)}
                className={`p-3 rounded-xl text-xs font-semibold text-left transition-all ${
                  form.services.includes(st.name) ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-foreground border border-border/50"
                }`}>{st.name}</button>
            ))}
          </div>
          {form.service_costs.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted-foreground">Custo de materiais por serviço (R$)</p>
              {form.service_costs.map(sc => (
                <div key={sc.name} className="flex items-center gap-2">
                  <span className="flex-1 px-3 py-2 bg-primary/5 text-primary text-xs font-semibold rounded-xl truncate">{sc.name}</span>
                  <Input type="number" step="0.01" className="h-9 w-28 rounded-lg text-sm font-semibold" value={sc.cost} onChange={e => updateServiceCost(sc.name, e.target.value)} placeholder="0,00" />
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Damages */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Avarias Pré-existentes</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {damageTypes.map(dt => (
              <button key={dt.id} onClick={() => toggleDamage(dt.name)}
                className={`p-3 rounded-xl text-xs font-semibold text-left transition-all ${
                  form.damages.includes(dt.name) ? "bg-destructive text-white" : "bg-white text-foreground border border-border/50"
                }`}>{dt.icon || ""} {dt.name}</button>
            ))}
          </div>
          <div>
            <label className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Fotografar avarias</span>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            </label>
            {form.damage_photos.length > 0 && (
              <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                {form.damage_photos.map((url, idx) => (
                  <div key={idx} className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden">
                    <img src={url} alt="Avaria" className="w-full h-full object-cover" />
                    <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>

        {/* Observations */}
        <motion.section variants={section} className="space-y-3">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Observações</h2>
          <Textarea className="bg-white rounded-xl min-h-[80px]" value={form.observations} onChange={e => setForm(f => ({ ...f, observations: e.target.value }))} placeholder="Notas sobre o veículo, avarias específicas..." />
        </motion.section>

        <motion.div variants={section}>
          <Button onClick={handleSubmit} disabled={saving} className="w-full h-14 rounded-2xl text-base font-bold shadow-lg shadow-primary/20">
            {saving ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Registrando...</> : "Registrar Entrada"}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}