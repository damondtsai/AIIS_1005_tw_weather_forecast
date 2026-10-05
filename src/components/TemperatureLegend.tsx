import React from "react";

export function getTemperatureColor(temp: number | null): string {
  if (temp === null || temp === undefined || isNaN(temp)) return "#9ca3af"; // Gray
  if (temp < 20) return "#3b82f6"; // Blue
  if (temp <= 25) return "#10b981"; // Green
  if (temp <= 30) return "#f59e0b"; // Yellow/Amber
  return "#ef4444"; // Red
}

export function getTemperatureBadgeClass(temp: number | null): string {
  if (temp === null || temp === undefined || isNaN(temp)) return "bg-gray-100 text-gray-700 border-gray-300";
  if (temp < 20) return "bg-blue-50 text-blue-700 border-blue-200";
  if (temp <= 25) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (temp <= 30) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-rose-50 text-rose-700 border-rose-200";
}

export default function TemperatureLegend() {
  const items = [
    { label: "< 20°C (低溫/寒意)", color: "#3b82f6", bg: "bg-blue-500" },
    { label: "20–25°C (舒適/溫和)", color: "#10b981", bg: "bg-emerald-500" },
    { label: "25–30°C (溫暖/微熱)", color: "#f59e0b", bg: "bg-amber-500" },
    { label: "> 30°C (炎熱/高溫)", color: "#ef4444", bg: "bg-rose-500" },
    { label: "無資料", color: "#9ca3af", bg: "bg-gray-400" },
  ];

  return (
    <div className="bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-slate-200 shadow-sm">
      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
        <span>🌡️ 台灣 GIS 氣溫分級圖例</span>
        <span className="text-[10px] text-slate-400 font-normal">依當日平均溫度</span>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
        {items.map((item) => (
          <div key={item.label} className="flex items-center space-x-1.5">
            <span className={`w-3 h-3 rounded-full ${item.bg} ring-2 ring-white shadow-sm`} />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
