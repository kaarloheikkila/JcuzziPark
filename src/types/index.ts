export interface Location {
  id: string
  name: string
  lat: number
  lng: number
  region: string
}

export interface WeatherData {
  locationId: string
  locationName: string
  temperature: number
  humidity: number
  precipitation: number
  windSpeed: number
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'
  timestamp: Date
  badWeatherScore: number // 0-100, korkeampi = huonompi sää = parempi jacuzzi-kysyntä
  dailyRainfall?: { [date: string]: number } // Daily rainfall forecast in mm
}

export interface ElectricityData {
  locationId: string
  locationName: string
  pricePerKwh: number
  renewablePercent: number
  gridLoad: number
  timestamp: Date
  costEfficiencyScore: number // 0-100, korkeampi = halvempi
  hourlyPrices?: { [hour: string]: number } // Hourly electricity prices for optimization
}

export interface BusinessData {
  locationId: string
  locationName: string
  totalCompanies: number
  techCompanies: number
  avgEmployees: number
  businessDensity: number
  demandScore: number // 0-100, korkeampi = enemmän potentiaalisia asiakkaita
  timestamp: Date
  cultureSpendingPerCitizen?: number // €/citizen from cultural statistics
}

export interface OptimalLocation {
  location: Location
  weatherScore: number
  electricityScore: number
  businessScore: number
  combinedScore: number
  recommendation: string
}

export interface DailyRainData {
  [site: string]: {
    [date: string]: number // mm of rain
  }
}

export interface ElectricityPriceData {
  date: string
  hour: number
  price: number // €/MWh
  region?: string
}
