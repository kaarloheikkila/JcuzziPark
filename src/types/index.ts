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
}

export interface ElectricityData {
  locationId: string
  locationName: string
  pricePerKwh: number
  renewablePercent: number
  gridLoad: number
  timestamp: Date
  costEfficiencyScore: number // 0-100, korkeampi = halvempi
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
}

export interface OptimalLocation {
  location: Location
  weatherScore: number
  electricityScore: number
  businessScore: number
  combinedScore: number
  recommendation: string
}
