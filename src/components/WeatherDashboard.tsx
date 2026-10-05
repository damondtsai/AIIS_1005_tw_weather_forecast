"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { TemperatureForecast, CityForecastSummary } from "@/lib/types";
import { getRegionByCity, TAIWAN_REGIONS } from "@/lib/regions";
import WeatherFilters from "./WeatherFilters";
import WeatherSummary from "./WeatherSummary";
import TemperatureChart from "./TemperatureChart";
import ForecastTable from "./ForecastTable";
import TemperatureLegend from "./TemperatureLegend";
import {
  CloudSun,
  Database,
  Radio,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  Map as MapIcon,
} from "lucide-react";

// Dynamic import Leaflet component with ssr: false
const TaiwanWeatherMap = dynamic(() => import("./TaiwanWeatherMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[480px] sm:h-[540px] bg-slate-100 rounded-2xl border border-slate-200 animate-pulse flex flex-col items-center justify-center text-slate-400 space-y-2">
      <MapIcon className="w-10 h-10 text-slate-300" />
      <span className="text-sm font-medium">GIS 互動氣象地圖載入中...</span>
    </div>
  ),
});

export default function WeatherDashboard() {
  const [selectedRegion, setSelectedRegion] = useState("中部地區");
  const [selectedCity, setSelectedCity] = useState("臺中市");
  const [selectedDate, setSelectedDate] = useState("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [forecasts, setForecasts] = useState<TemperatureForecast[]>([]);
  const [citySummaries, setCitySummaries] = useState<CityForecastSummary[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Read URL search params on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlRegion = params.get("region");
      const urlCity = params.get("location");
      const urlDate = params.get("date");

      if (urlCity) {
        setSelectedCity(urlCity);
        setSelectedRegion(getRegionByCity(urlCity));
      } else if (urlRegion && TAIWAN_REGIONS[urlRegion]) {
        setSelectedRegion(urlRegion);
        setSelectedCity(TAIWAN_REGIONS[urlRegion][0]);
      }

      if (urlDate) {
        setSelectedDate(urlDate);
      }
    }
  }, []);

  // Update URL Search Params
  const updateUrlParams = useCallback(
    (city: string, region: string, date: string) => {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      url.searchParams.set("location", city);
      url.searchParams.set("region", region);
      if (date) {
        url.searchParams.set("date", date);
      }
      window.history.replaceState({}, "", url.toString());
    },
    []
  );

  // Fetch forecast data
  const loadWeatherData = useCallback(
    async (city: string, date?: string) => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const queryParams = new URLSearchParams();
        queryParams.set("location", city);
        if (date) {
          queryParams.set("date", date);
        }

        const res = await fetch(`/api/weather?${queryParams.toString()}`, {
          cache: "no-store",
        });
        const result = await res.json();

        if (result.ok) {
          setForecasts(result.data || []);
          setCitySummaries(result.summary || []);
          setUpdatedAt(result.updatedAt || null);
          setIsFallback(result.isFallback || false);

          if (result.availableDates && result.availableDates.length > 0) {
            setAvailableDates(result.availableDates);
            if (!date && !selectedDate) {
              setSelectedDate(result.selectedDate || result.availableDates[0]);
            }
          }
        } else {
          setErrorMessage(result.error || "無法載入天氣預報資料");
        }
      } catch (err) {
        setErrorMessage("無法連線至氣象伺服器，請檢查網路連線。");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedDate]
  );

  // Trigger load on city/date change
  useEffect(() => {
    loadWeatherData(selectedCity, selectedDate);
  }, [selectedCity, selectedDate, loadWeatherData]);

  // Sync / Refresh handler
  const handleSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const res = await fetch("/api/weather/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await res.json();
      if (result.ok) {
        setSuccessToast(result.message || "氣象資料同步成功！");
        await loadWeatherData(selectedCity, selectedDate);
      } else {
        setErrorMessage(result.error || "資料同步失敗");
      }
    } catch (err) {
      setErrorMessage("同步請求失敗，請稍後再試。");
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  // Reset filters
  const handleReset = () => {
    setSelectedRegion("中部地區");
    setSelectedCity("臺中市");
    const firstDate = availableDates[0] || "";
    setSelectedDate(firstDate);
    updateUrlParams("臺中市", "中部地區", firstDate);
  };

  // City change handler
  const handleCityChange = (newCity: string) => {
    startTransition(() => {
      setSelectedCity(newCity);
      const newRegion = getRegionByCity(newCity);
      setSelectedRegion(newRegion);
      updateUrlParams(newCity, newRegion, selectedDate);
    });
  };

  // Region change handler
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    const cities = TAIWAN_REGIONS[newRegion] || [];
    if (!cities.includes(selectedCity) && cities.length > 0) {
      const newCity = cities[0];
      setSelectedCity(newCity);
      updateUrlParams(newCity, newRegion, selectedDate);
    }
  };

  // Date change handler
  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    updateUrlParams(selectedCity, selectedRegion, newDate);
  };

  const currentSummary = citySummaries.find((s) => s.locationName === selectedCity);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 pb-16">
      {/* Top Navigation / Brand Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl text-white shadow-md shadow-blue-500/20">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">
                  Taiwan Weather Forecast
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <Radio className="w-3 h-3 animate-pulse text-blue-600" /> CWA F-A0010-001
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                台灣七天天氣預報 • 從氣象資料到互動式天氣預報應用
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-500 self-end sm:self-center">
            <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>SQLite / libSQL</span>
            </span>

            {updatedAt && (
              <span className="bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-medium hidden lg:inline-block">
                更新於：{new Date(updatedAt).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Notification Toasts & Warnings */}
        {isFallback && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>提醒：</strong>目前使用備援離線資料集 (包含全台 22 縣市七日預報)。若欲連線中央氣象署即時 API，請於環境變數配置 <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">CWA_API_KEY</code>。
              </span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 shadow-xs animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Filter Controls Section */}
        <WeatherFilters
          selectedRegion={selectedRegion}
          onRegionChange={handleRegionChange}
          selectedCity={selectedCity}
          onCityChange={handleCityChange}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          availableDates={availableDates}
          onRefresh={handleSync}
          onReset={handleReset}
          isSyncing={isSyncing}
        />

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Summary Cards & Charts & Table (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Weather Summary Card */}
            <WeatherSummary
              selectedCity={selectedCity}
              selectedDate={selectedDate}
              forecasts={forecasts}
              citySummary={currentSummary}
            />

            {/* Temperature Trend Line Chart */}
            <TemperatureChart forecasts={forecasts} cityName={selectedCity} />

            {/* Detailed 7-day Table */}
            <ForecastTable
              forecasts={forecasts}
              cityName={selectedCity}
              updatedAt={updatedAt}
            />
          </div>

          {/* Right Column: GIS Interactive Map & Legend (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <MapIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      台灣 GIS 氣溫分佈地圖
                    </h3>
                    <p className="text-xs text-slate-500">
                      當前日期：<span className="font-semibold text-blue-600">{selectedDate || "載入中"}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Leaflet Map */}
              <TaiwanWeatherMap
                citySummaries={citySummaries}
                selectedCity={selectedCity}
                selectedDate={selectedDate}
                onSelectCity={handleCityChange}
              />

              {/* Temperature Scale Legend */}
              <TemperatureLegend />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
