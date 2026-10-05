"use client";

import React from "react";
import { TemperatureForecast } from "@/lib/types";
import { getWeatherIcon } from "./WeatherSummary";
import { getTemperatureBadgeClass } from "./TemperatureLegend";
import { Table, Calendar, Clock, Droplets, Info } from "lucide-react";

interface ForecastTableProps {
  forecasts: TemperatureForecast[];
  cityName: string;
  updatedAt?: string | null;
}

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

interface DailyRow {
  date: string;
  weekday: string;
  weather: string;
  minT: number | null;
  maxT: number | null;
  avgT: number | null;
  pop: number | null;
  comfort: string;
  fetchedAt: string;
}

function aggregateDailyForecasts(forecasts: TemperatureForecast[]): DailyRow[] {
  const map = new Map<string, DailyRow>();

  for (const f of forecasts) {
    const d = f.dataDate;
    if (!map.has(d)) {
      const parsed = new Date(d + "T00:00:00+08:00");
      const weekday = !isNaN(parsed.getTime()) ? WEEKDAYS[parsed.getDay()] : "";

      map.set(d, {
        date: d,
        weekday,
        weather: f.weather,
        minT: f.minT,
        maxT: f.maxT,
        avgT: f.avgT,
        pop: f.precipitationProbability,
        comfort: f.comfort,
        fetchedAt: f.fetchedAt,
      });
    } else {
      const row = map.get(d)!;
      if (f.minT !== null) {
        row.minT = row.minT === null ? f.minT : Math.min(row.minT, f.minT);
      }
      if (f.maxT !== null) {
        row.maxT = row.maxT === null ? f.maxT : Math.max(row.maxT, f.maxT);
      }
      if (f.precipitationProbability !== null) {
        row.pop = row.pop === null ? f.precipitationProbability : Math.max(row.pop, f.precipitationProbability);
      }
      if (row.minT !== null && row.maxT !== null) {
        row.avgT = Math.round(((row.minT + row.maxT) / 2) * 10) / 10;
      }
      if (f.startTime.includes("06:00") || f.startTime.includes("12:00")) {
        row.weather = f.weather;
        row.comfort = f.comfort;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function ForecastTable({ forecasts, cityName, updatedAt }: ForecastTableProps) {
  const rows = aggregateDailyForecasts(forecasts);

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[220px] text-slate-400 space-y-2">
        <Info className="w-8 h-8 text-slate-300" />
        <p className="text-sm">暫無 {cityName} 之七日詳細預報表格</p>
      </div>
    );
  }

  const formatTemp = (v: number | null) => (v !== null && !isNaN(v) ? `${v}°C` : "暫無");
  const formatPop = (v: number | null) => (v !== null && !isNaN(v) ? `${v}%` : "0%");

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">{cityName} 七天天氣預報明細表</h3>
            <p className="text-xs text-slate-500">每日天氣狀態、氣溫區間、降雨機率與舒適度</p>
          </div>
        </div>

        {updatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>資料擷取：{new Date(updatedAt).toLocaleString("zh-TW", { timeZone: "Asia/Taipei" })}</span>
          </div>
        )}
      </div>

      {/* Table responsive wrapper */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse min-w-[640px]">
          <thead>
            <tr className="bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200/80">
              <th className="py-3.5 px-4">預報日期</th>
              <th className="py-3.5 px-4">天氣狀態</th>
              <th className="py-3.5 px-4">最低溫 (MinT)</th>
              <th className="py-3.5 px-4">最高溫 (MaxT)</th>
              <th className="py-3.5 px-4">預估均溫</th>
              <th className="py-3.5 px-4">降雨機率</th>
              <th className="py-3.5 px-4">舒適度指標</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {rows.map((row) => (
              <tr key={row.date} className="hover:bg-slate-50/60 transition-colors">
                {/* Date & Weekday */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <div>
                      <span className="font-semibold text-slate-900">{row.date}</span>
                      <span className="ml-1.5 text-xs text-slate-500 font-medium">{row.weekday}</span>
                    </div>
                  </div>
                </td>

                {/* Weather */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2">
                    {getWeatherIcon(row.weather, "w-5 h-5")}
                    <span className="font-medium text-slate-800">{row.weather || "多雲"}</span>
                  </div>
                </td>

                {/* Min Temp */}
                <td className="py-3.5 px-4 font-semibold text-blue-600">
                  {formatTemp(row.minT)}
                </td>

                {/* Max Temp */}
                <td className="py-3.5 px-4 font-semibold text-rose-600">
                  {formatTemp(row.maxT)}
                </td>

                {/* Avg Temp */}
                <td className="py-3.5 px-4">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getTemperatureBadgeClass(row.avgT)}`}>
                    {formatTemp(row.avgT)}
                  </span>
                </td>

                {/* PoP */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1 text-cyan-700 font-medium">
                    <Droplets className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{formatPop(row.pop)}</span>
                  </div>
                </td>

                {/* Comfort */}
                <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                  {row.comfort || "舒適"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
