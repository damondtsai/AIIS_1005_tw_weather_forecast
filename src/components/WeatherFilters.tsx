"use client";

import React from "react";
import { TAIWAN_REGIONS, ALL_REGIONS } from "@/lib/regions";
import { RefreshCw, RotateCcw, MapPin, Calendar, Globe } from "lucide-react";

interface WeatherFiltersProps {
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  availableDates: string[];
  onRefresh: () => void;
  onReset: () => void;
  isSyncing: boolean;
}

export default function WeatherFilters({
  selectedRegion,
  onRegionChange,
  selectedCity,
  onCityChange,
  selectedDate,
  onDateChange,
  availableDates,
  onRefresh,
  onReset,
  isSyncing,
}: WeatherFiltersProps) {
  const currentCities = TAIWAN_REGIONS[selectedRegion] || [];

  const handleRegionSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value;
    onRegionChange(newRegion);
    const availableInRegion = TAIWAN_REGIONS[newRegion] || [];
    if (!availableInRegion.includes(selectedCity) && availableInRegion.length > 0) {
      onCityChange(availableInRegion[0]);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 flex-1">
          {/* Region Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>目標區域</span>
            </label>
            <div className="relative">
              <select
                id="region-select"
                aria-label="選擇目標區域"
                value={selectedRegion}
                onChange={handleRegionSelect}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer font-medium"
              >
                {ALL_REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* City Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>縣市選擇</span>
            </label>
            <div className="relative">
              <select
                id="city-select"
                aria-label="選擇縣市"
                value={selectedCity}
                onChange={(e) => onCityChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer font-medium"
              >
                {currentCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>預報日期 (GIS地圖同步)</span>
            </label>
            <div className="relative">
              <select
                id="date-select"
                aria-label="選擇預報日期"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition cursor-pointer font-medium"
              >
                {availableDates.length > 0 ? (
                  availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))
                ) : (
                  <option value={selectedDate}>{selectedDate || "載入中..."}</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1 md:pt-5">
          <button
            id="refresh-button"
            onClick={onRefresh}
            disabled={isSyncing}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-xl transition shadow-sm hover:shadow active:scale-95"
            title="從 CWA 更新最新預報資料"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "更新中..." : "重新整理"}</span>
          </button>

          <button
            id="reset-button"
            onClick={onReset}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition active:scale-95 border border-slate-200"
            title="重設為預設條件 (中部地區 / 臺中市)"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">重設</span>
          </button>
        </div>
      </div>
    </div>
  );
}
