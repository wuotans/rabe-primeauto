import React from "react";

const statusConfig = {
  "Aguardando": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  "Em Andamento": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  "Concluído": { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  "Liberado": { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig["Aguardando"];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status}
    </span>
  );
}