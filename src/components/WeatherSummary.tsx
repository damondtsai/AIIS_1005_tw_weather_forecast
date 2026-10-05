"use client";

import React from "react";
import { TemperatureForecast, CityForecastSummary } from "@/lib/types";
import { getTemperatureBadgeClass } from "./TemperatureLegend";
import {
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  CloudLightning,
  Droplets,
  Thermometer,
  ThermometerSnowflake,
  ThermometerSun,
  HeartHandshake,
  MapPin,
  Calendar,
} from "lucide-react";

interface WeatherSummaryProps {
  selectedCity: string;
  selectedDate: string;
  forecasts: TemperatureForecast[];
  citySummary?: CityForecastSummary;
}

export function getWeatherIcon(weather: string, className = "w-6 h-6") {
  if (!weather) return <Cloud className={`${className} text-slate-400`} />;
  if (weather.includes("雷")) return <CloudLightning className={`${className} text-amber-500`} />;
  if (weather.includes("雨")) return <CloudRain className={`${className} text-blue-500`} />;
  if (weather.includes("晴時多雲") || weather.includes("多雲時晴"))
    return <CloudSun className={`${className} text-amber-400`} />;
  if (weather.includes("晴")) return <Sun className={`${className} text-amber-500`} />;
  return <Cloud className={`${className} text-slate-400`} />;
}

export default function WeatherSummary({
  selectedCity,
  selectedDate,
  forecasts,
  citySummary,
}: WeatherSummaryProps) {
  // Find current day's primary slot or summary
  const dayForecasts = forecasts.filter((f) => f.dataDate === selectedDate);
  const currentSlot =
    dayForecasts.find((f) => f.startTime.includes("06:00") || f.startTime.includes("12:00")) ||
    dayForecasts[0] ||
    forecasts[0];

  const minT = citySummary?.minT ?? currentSlot?.minT ?? null;
  const maxT = citySummary?.maxT ?? currentSlot?.maxT ?? null;
  const avgT =
    citySummary?.avgT ??
    currentSlot?.avgT ??
    (minT !== null && maxT !== null ? Math.round(((minT + maxT) / 2) * 10) / 10 : null);
  const weather = citySummary?.weather || currentSlot?.weather || "多雲";
  const pop = citySummary?.precipitationProbability ?? currentSlot?.precipitationProbability ?? null;
  const comfort = citySummary?.comfort || currentSlot?.comfort || "舒適";

  const formatTemp = (val: number | null) => (val !== null && !isNaN(val) ? `${val}°C` : "暫無資料");
  const formatPop = (val: number | null) => (val !== null && !isNaN(val) ? `${val}%` : "暫無資料");
  const formatText = (val?: string) => (val && val.trim() !== "" ? val : "暫無資料");

  return (
    <div className="space-y-4">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-15 pointer-events-none">
          <Sun className="w-48 h-48" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-blue-100 text-sm font-medium">
              <MapPin className="w-4 h-4 text-blue-200" />
              <span>{selectedCity} 天氣重點摘要</span>
              <span className="text-blue-300">•</span>
              <Calendar className="w-4 h-4 text-blue-200" />
              <span>{selectedDate || "七日預報"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20">
                {getWeatherIcon(weather, "w-8 h-8 text-amber-300")}
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{formatText(weather)}</h2>
                <p className="text-xs text-blue-100 font-normal">體感指數：{formatText(comfort)}</p>
              </div>
            </div>
          </div>

          <div className="flex items-baseline gap-2 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 self-start md:self-auto">
            <span className="text-xs text-blue-200 uppercase tracking-wider font-semibold">平均溫</span>
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {avgT !== null ? `${avgT}°C` : "暫無"}
            </span>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Min Temperature */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">最低氣溫</span>
            <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600">
              <ThermometerSnowflake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{formatTemp(minT)}</div>
            <span className="text-[11px] text-slate-400">當日夜間/清晨低溫</span>
          </div>
        </div>

        {/* Max Temperature */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">最高氣溫</span>
            <div className="p-1.5 bg-rose-50 rounded-lg text-rose-600">
              <ThermometerSun className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-rose-600">{formatTemp(maxT)}</div>
            <span className="text-[11px] text-slate-400">當日午後最高溫</span>
          </div>
        </div>

        {/* Precipitation */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">降雨機率</span>
            <div className="p-1.5 bg-cyan-50 rounded-lg text-cyan-600">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-cyan-700">{formatPop(pop)}</div>
            <span className="text-[11px] text-slate-400">降水機率預估 (PoP)</span>
          </div>
        </div>

        {/* Comfort Index */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">人體舒適度</span>
            <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-lg sm:text-xl font-bold text-slate-800 truncate">{formatText(comfort)}</div>
            <span className="text-[11px] text-slate-400">氣象署舒適度指標 (CI)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
