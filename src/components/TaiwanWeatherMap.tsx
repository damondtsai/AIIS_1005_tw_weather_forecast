"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { CityForecastSummary } from "@/lib/types";
import { CITY_COORDINATES, TAIWAN_MAP_CENTER, TAIWAN_DEFAULT_ZOOM } from "@/lib/city-coordinates";
import { getTemperatureColor } from "./TemperatureLegend";
import { MapPin, Droplets, Thermometer, AlertTriangle } from "lucide-react";

interface TaiwanWeatherMapProps {
  citySummaries: CityForecastSummary[];
  selectedCity: string;
  selectedDate: string;
  onSelectCity: (cityName: string) => void;
}

// Sub-component to center on selected city when it changes
function MapRecenter({ selectedCity }: { selectedCity: string }) {
  const map = useMap();

  useEffect(() => {
    const coords = CITY_COORDINATES[selectedCity];
    if (coords && map) {
      map.flyTo([coords.lat, coords.lng], 9, { duration: 1.2 });
    }
  }, [selectedCity, map]);

  return null;
}

export default function TaiwanWeatherMap({
  citySummaries,
  selectedCity,
  selectedDate,
  onSelectCity,
}: TaiwanWeatherMapProps) {
  // Create a fast lookup map: cityName -> summary
  const summaryMap = new Map<string, CityForecastSummary>();
  for (const s of citySummaries) {
    summaryMap.set(s.locationName, s);
  }

  const allCityEntries = Object.entries(CITY_COORDINATES);

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
      <MapContainer
        center={[TAIWAN_MAP_CENTER.lat, TAIWAN_MAP_CENTER.lng]}
        zoom={TAIWAN_DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
          minZoom={6}
        />

        <MapRecenter selectedCity={selectedCity} />

        {allCityEntries.map(([cityName, coords]) => {
          const summary = summaryMap.get(cityName);
          const avgT = summary?.avgT ?? null;
          const minT = summary?.minT ?? null;
          const maxT = summary?.maxT ?? null;
          const pop = summary?.precipitationProbability ?? null;
          const weather = summary?.weather || "多雲";
          const color = getTemperatureColor(avgT);
          const isSelected = cityName === selectedCity;

          return (
            <CircleMarker
              key={cityName}
              center={[coords.lat, coords.lng]}
              radius={isSelected ? 14 : 10}
              pathOptions={{
                fillColor: color,
                fillOpacity: isSelected ? 0.95 : 0.85,
                color: isSelected ? "#1e293b" : "#ffffff",
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                click: () => {
                  onSelectCity(cityName);
                },
              }}
            >
              {/* Permanent / Hover Tooltip */}
              <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                <div className="text-center font-sans font-semibold text-xs text-slate-800">
                  <span>{cityName}</span>
                  <span className="ml-1 text-blue-600 font-bold">
                    {avgT !== null ? `${avgT}°C` : "暫無"}
                  </span>
                </div>
              </Tooltip>

              {/* Popup Content */}
              <Popup className="custom-weather-popup">
                <div className="p-1 space-y-2 min-w-[170px] text-xs font-sans text-slate-700">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                    <div className="flex items-center gap-1 font-bold text-sm text-slate-900">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span>{cityName}</span>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                      {selectedDate}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">天氣狀態：</span>
                      <span className="font-semibold text-slate-800">{weather}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">預估均溫：</span>
                      <span className="font-bold" style={{ color }}>
                        {avgT !== null ? `${avgT}°C` : "暫無"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">低溫 ~ 高溫：</span>
                      <span className="font-medium text-slate-700">
                        {minT !== null ? `${minT}°C` : "--"} ~ {maxT !== null ? `${maxT}°C` : "--"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-cyan-500" /> 降雨機率：
                      </span>
                      <span className="font-semibold text-cyan-700">
                        {pop !== null ? `${pop}%` : "0%"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectCity(cityName)}
                    className="w-full mt-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition cursor-pointer"
                  >
                    選擇此縣市查看七日預報
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating map hint */}
      <div className="absolute top-3 right-3 z-[400] bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 shadow-sm pointer-events-none hidden sm:flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
        <span>點擊地圖圓點可切換縣市</span>
      </div>
    </div>
  );
}
