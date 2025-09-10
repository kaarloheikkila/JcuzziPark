import { WeatherData, ElectricityData, BusinessData } from '../types'
import { useState, useEffect } from 'react'
import ShapefileService from '../services/ShapefileService'

interface MapViewProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  selectedLocation: string | null
  onLocationChange: (locationName: string) => void
  activeLayer: 'weather' | 'electricity' | 'business' | 'combined'
  timeOffset: number
}

const MapView = ({ weatherData, electricityData, businessData, selectedLocation, onLocationChange, activeLayer, timeOffset }: MapViewProps) => {
  const [finlandPath, setFinlandPath] = useState<string>('')
  
  useEffect(() => {
    // Load Finland border from shapefile with larger dimensions to show all of Finland
    const loadFinlandPath = async () => {
      try {
        const path = await ShapefileService.getFinlandPath(600, 800)
        setFinlandPath(path)
      } catch (error) {
        console.error('Error loading Finland path:', error)
        setFinlandPath(ShapefileService.getFallbackFinlandPath())
      }
    }
    
    loadFinlandPath()
  }, [])
  // Finland map locations with verified accurate coordinates (longitude, latitude)
  const finlandCities = [
    { id: 'helsinki', name: 'Helsinki', lon: 24.9354, lat: 60.1695 },
    { id: 'espoo', name: 'Espoo', lon: 24.6522, lat: 60.2055 },
    { id: 'tampere', name: 'Tampere', lon: 23.7610, lat: 61.4981 },
    { id: 'turku', name: 'Turku', lon: 22.2666, lat: 60.4518 },
    { id: 'oulu', name: 'Oulu', lon: 25.4685, lat: 65.0121 },
    { id: 'lahti', name: 'Lahti', lon: 25.6612, lat: 60.9827 },
    { id: 'kuopio', name: 'Kuopio', lon: 27.6782, lat: 62.8924 },
    { id: 'vaasa', name: 'Vaasa', lon: 21.6158, lat: 63.0960 },
    { id: 'lappeenranta', name: 'Lappeenranta', lon: 28.1887, lat: 61.0587 },
    { id: 'rovaniemi', name: 'Rovaniemi', lon: 25.7209, lat: 66.5039 }
  ]
  
  // Convert real coordinates to SVG coordinates using improved projection
  const locations = finlandCities.map(city => {
    const [x, y] = ShapefileService.projectCoordinates(city.lon, city.lat, 600, 800)
    return {
      id: city.id,
      name: city.name,
      x: x,
      y: y
    }
  })

  const getLocationScore = (locationName: string) => {
    const weather = weatherData.find(w => w.locationName === locationName)
    const electricity = electricityData.find(e => e.locationName === locationName)
    const business = businessData.find(b => b.locationName === locationName)

    if (!weather || !electricity || !business) return 50

    switch (activeLayer) {
      case 'weather':
        return weather.badWeatherScore
      case 'electricity':
        return electricity.costEfficiencyScore
      case 'business':
        return business.demandScore
      case 'combined':
        return Math.round((weather.badWeatherScore + electricity.costEfficiencyScore + business.demandScore) / 3)
      default:
        return 50
    }
  }

  const getHeatmapColor = (score: number) => {
    if (score >= 80) return '#ef4444' // Red
    if (score >= 60) return '#f97316' // Orange
    if (score >= 40) return '#eab308' // Yellow
    if (score >= 20) return '#22c55e' // Green
    return '#3b82f6' // Blue
  }

  const getWeatherIcon = (locationName: string) => {
    const weather = weatherData.find(w => w.locationName === locationName)
    if (!weather) return '🌤️'
    
    switch (weather.condition) {
      case 'sunny': return '☀️'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'stormy': return '⛈️'
      case 'snowy': return '❄️'
      default: return '🌤️'
    }
  }

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-4 h-full">
      {/* SVG Map */}
      <div className="relative h-full">
        <svg viewBox="0 0 600 800" className="w-full h-full min-h-[400px] border border-gray-300 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200">
          {/* Finland outline from shapefile */}
          <path
            d={finlandPath || ShapefileService.getFallbackFinlandPath()}
            fill="url(#finlandGradient)"
            stroke="#22c55e"
            strokeWidth="1"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="finlandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{stopColor:"#86efac", stopOpacity:1}} />
              <stop offset="100%" style={{stopColor:"#22d3ee", stopOpacity:1}} />
            </linearGradient>
          </defs>
          
          {/* Location markers */}
          {locations.map(location => {
            const score = getLocationScore(location.name)
            const color = getHeatmapColor(score)
            const isSelected = selectedLocation === location.name
            
            return (
              <g key={location.id}>
                {/* Heatmap circle */}
                <circle
                  cx={location.x}
                  cy={location.y}
                  r={isSelected ? 10 : 6}
                  fill={color}
                  fillOpacity={0.8}
                  stroke={isSelected ? '#1f2937' : 'white'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onClick={() => onLocationChange(location.name)}
                />
                
                {/* Location label */}
                <text
                  x={location.x}
                  y={location.y - 12}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-800 pointer-events-none"
                  style={{ fontSize: '10px', fontWeight: '600' }}
                >
                  {location.name}
                </text>
                
                {/* Score */}
                <text
                  x={location.x}
                  y={location.y + 2}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white pointer-events-none"
                  style={{ fontSize: '8px', fontWeight: 'bold' }}
                >
                  {score}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Current weather overlay */}
      {activeLayer === 'weather' && (
        <div className="mt-4 grid grid-cols-5 gap-2 text-center">
          {locations.slice(0, 5).map(location => (
            <div key={location.id} className="flex flex-col items-center p-2 bg-gray-50 rounded">
              <div className="text-2xl">{getWeatherIcon(location.name)}</div>
              <div className="text-xs font-medium">{location.name}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MapView
