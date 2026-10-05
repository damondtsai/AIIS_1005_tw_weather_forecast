import WeatherDashboard from "@/components/WeatherDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taiwan Weather Forecast 台灣天氣預報 | 台灣七天天氣預報 GIS Dashboard",
  description: "從氣象資料到互動式天氣預報應用，提供全台 22 縣市七日氣溫走勢、降雨機率與 GIS 溫度分佈地圖。",
  keywords: ["台灣天氣", "氣象預報", "CWA", "氣溫圖表", "GIS 地圖", "七天預報", "中央氣象署"],
};

export default function HomePage() {
  return <WeatherDashboard />;
}
