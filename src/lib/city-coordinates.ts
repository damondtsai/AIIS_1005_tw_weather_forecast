export interface CityCoordinate {
  name: string;
  lat: number;
  lng: number;
  zoom?: number;
}

export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  基隆市: { lat: 25.1276, lng: 121.7392 },
  臺北市: { lat: 25.0330, lng: 121.5654 },
  新北市: { lat: 24.9157, lng: 121.6739 },
  桃園市: { lat: 24.9936, lng: 121.3010 },
  新竹市: { lat: 24.8138, lng: 120.9675 },
  新竹縣: { lat: 24.8387, lng: 121.0177 },
  苗栗縣: { lat: 24.5602, lng: 120.8214 },
  臺中市: { lat: 24.1477, lng: 120.6736 },
  彰化縣: { lat: 24.0518, lng: 120.5161 },
  南投縣: { lat: 23.9609, lng: 120.9719 },
  雲林縣: { lat: 23.7092, lng: 120.4313 },
  嘉義市: { lat: 23.4800, lng: 120.4491 },
  嘉義縣: { lat: 23.4518, lng: 120.2555 },
  臺南市: { lat: 22.9997, lng: 120.2270 },
  高雄市: { lat: 22.6273, lng: 120.3014 },
  屏東縣: { lat: 22.5519, lng: 120.5487 },
  宜蘭縣: { lat: 24.7021, lng: 121.7377 },
  花蓮縣: { lat: 23.9871, lng: 121.6015 },
  臺東縣: { lat: 22.7583, lng: 121.1444 },
  澎湖縣: { lat: 23.5711, lng: 119.5793 },
  金門縣: { lat: 24.4493, lng: 118.3766 },
  連江縣: { lat: 26.1505, lng: 119.9499 },
};

export const TAIWAN_MAP_CENTER = { lat: 23.8, lng: 121.0 };
export const TAIWAN_DEFAULT_ZOOM = 7.5;
