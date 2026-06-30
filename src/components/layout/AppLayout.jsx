import React from "react";
import { Outlet } from "react-router-dom";
import { Home, PlusCircle, Users, FileText, BarChart3, Settings, Package } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { path: "/", icon: Home, label: "Painel" },
  { path: "/checkin", icon: PlusCircle, label: "Entrada" },
  { path: "/clients", icon: Users, label: "Clientes" },
  { path: "/orders", icon: FileText, label: "OS" },
  { path: "/inventory", icon: Package, label: "Estoque" },
  { path: "/reports", icon: BarChart3, label: "Relatórios" },
  { path: "/settings", icon: Settings, label: "Ajustes" },
];

function Sidebar() {
  const location = useLocation();
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border/50 shrink-0">
      <div className="px-5 py-5 border-b border-border/30">
        <h1 className="text-lg font-extrabold tracking-tight">Rabe PrimeAuto</h1>
        <p className="text-[10px] text-muted-foreground font-medium mt-0.5 uppercase tracking-widest">Gestão de Serviços</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${active ? "text-primary" : ""}`} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-border/30">
        <p className="text-[10px] text-muted-foreground">© 2025 Rabe PrimeAuto</p>
      </div>
    </aside>
  );
}

function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "stroke-[2.5px]" : ""}`} />
              <span className={`text-[10px] font-medium ${active ? "font-semibold" : ""}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:flex">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
      <MobileNav />
    </div>
  );
}