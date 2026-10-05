"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { TemperatureForecast } from "@/lib/types";
import { TrendingUp, Info } from "lucide-react";

interface TemperatureChartProps {
  forecasts: TemperatureForecast[];
  cityName: string;
}

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

function formatChartData(forecasts: TemperatureForecast[]) {
  // Aggregate by date (take min of MinT and max of MaxT for each unique dataDate)
  const dateMap = new Map<
    string,
    {
      date: string;
      displayDate: string;
      weekday: string;
      minT: number | null;
      maxT: number | null;
      avgT: number | null;
      weather: string;
    }
  >();

  for (const f of forecasts) {
    const d = f.dataDate;
    if (!dateMap.has(d)) {
      const parsedDate = new Date(d + "T00:00:00+08:00");
      const weekday = !isNaN(parsedDate.getTime()) ? WEEKDAYS[parsedDate.getDay()] : "";
      const displayDate = d.slice(5); // MM-DD

      dateMap.set(d, {
        date: d,
        displayDate,
        weekday,
        minT: f.minT,
        maxT: f.maxT,
        avgT: f.avgT,
        weather: f.weather,
      });
    } else {
      const item = dateMap.get(d)!;
      if (f.minT !== null) {
        item.minT = item.minT === null ? f.minT : Math.min(item.minT, f.minT);
      }
      if (f.maxT !== null) {
        item.maxT = item.maxT === null ? f.maxT : Math.max(item.maxT, f.maxT);
      }
      if (item.minT !== null && item.maxT !== null) {
        item.avgT = Math.round(((item.minT + item.maxT) / 2) * 10) / 10;
      }
    }
  }

  return Array.from(dateMap.values());
}

export default function TemperatureChart({ forecasts, cityName }: TemperatureChartProps) {
  const chartData = formatChartData(forecasts);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-slate-400 space-y-2">
        <Info className="w-8 h-8 text-slate-300" />
        <p className="text-sm">暫無 {cityName} 之七日氣溫趨勢資料</p>
      </div>
    );
  }

  // Calculate domain boundaries
  const validTemps = chartData
    .flatMap((d) => [d.minT, d.maxT])
    .filter((t): t is number => t !== null && !isNaN(t));
  const minDomain = validTemps.length > 0 ? Math.floor(Math.min(...validTemps) - 2) : 10;
  const maxDomain = validTemps.length > 0 ? Math.ceil(Math.max(...validTemps) + 2) : 35;

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {cityName} 氣溫變化趨勢圖 (MinT / MaxT)
            </h3>
            <p className="text-xs text-slate-500">七天天氣預報最高與最低氣溫走勢</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-3 h-1 bg-rose-500 rounded-full" /> 最高溫 MaxT
          </span>
          <span className="flex items-center gap-1.5 text-blue-600">
            <span className="w-3 h-1 bg-blue-500 rounded-full" /> 最低溫 MinT
          </span>
        </div>
      </div>

      <div className="w-full h-[280px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="displayDate"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={({ x, y, payload }) => {
                const item = chartData.find((d) => d.displayDate === payload.value);
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={12} textAnchor="middle" fill="#64748b" fontSize={11} fontWeight={500}>
                      {payload.value}
                    </text>
                    <text x={0} y={26} textAnchor="middle" fill="#94a3b8" fontSize={10}>
                      {item?.weekday || ""}
                    </text>
                  </g>
                );
              }}
              height={40}
            />
            <YAxis
              domain={[minDomain, maxDomain]}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
              tick={{ fill: "#64748b", fontSize: 11 }}
              unit="°C"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-1 backdrop-blur-sm">
                      <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 flex justify-between gap-4">
                        <span>{data.date} ({data.weekday})</span>
                        <span className="text-amber-300">{data.weather}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-rose-400">
                        <span>最高溫 (MaxT)：</span>
                        <span className="font-bold">{data.maxT !== null ? `${data.maxT}°C` : "暫無"}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-blue-400">
                        <span>最低溫 (MinT)：</span>
                        <span className="font-bold">{data.minT !== null ? `${data.minT}°C` : "暫無"}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-slate-300 pt-1 border-t border-slate-800">
                        <span>預估均溫：</span>
                        <span className="font-bold text-white">{data.avgT !== null ? `${data.avgT}°C` : "暫無"}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="maxT"
              name="最高溫 (MaxT)"
              stroke="#ef4444"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2, fill: "#ffffff" }}
            />
            <Line
              type="monotone"
              dataKey="minT"
              name="最低溫 (MinT)"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#ffffff" }}
              activeDot={{ r: 6, stroke: "#3b82f6", strokeWidth: 2, fill: "#ffffff" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
