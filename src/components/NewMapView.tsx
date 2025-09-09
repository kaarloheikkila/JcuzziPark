import { WeatherData, ElectricityData, BusinessData } from '../types'

interface MapViewProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  selectedLocation: string | null
  onLocationChange: (locationName: string) => void
  activeLayer: 'weather' | 'electricity' | 'business' | 'combined'
  timeOffset: number
}

const MapView = ({ weatherData, electricityData, businessData, selectedLocation, onLocationChange, activeLayer }: MapViewProps) => {
  // Finland map locations with SVG coordinates
  const locations = [
    { id: 'kuopio', name: 'Kuopio', x: 68, y: 35 },
    { id: 'lahti', name: 'Lahti', x: 58, y: 55 },
    { id: 'vaasa', name: 'Vaasa', x: 35, y: 32 },
    { id: 'helsinki', name: 'Helsinki', x: 55, y: 60 },
    { id: 'tampere', name: 'Tampere', x: 50, y: 48 },
    { id: 'turku', name: 'Turku', x: 42, y: 58 },
    { id: 'espoo', name: 'Espoo', x: 53, y: 61 },
    { id: 'lappeenranta', name: 'Lappeenranta', x: 72, y: 52 },
    { id: 'oulu', name: 'Oulu', x: 58, y: 20 },
    { id: 'rovaniemi', name: 'Rovaniemi', x: 60, y: 8 }
  ]

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
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">🗺️ Suomen Jacuzzi-kartta</h3>
      
      {/* SVG Map */}
      <div className="relative">
        <svg viewBox="0 0 100 80" className="w-full h-96 border border-gray-300 rounded-lg bg-blue-50">
          {/* Simplified Finland outline */}
          <path
            d="M20,70 L25,65 L30,60 L35,55 L40,50 L45,45 L50,40 L55,35 L60,30 L65,25 L70,20 L75,15 L80,10 L85,15 L88,20 L85,25 L82,30 L80,35 L78,40 L75,45 L73,50 L70,55 L68,60 L65,65 L60,68 L55,70 L50,72 L45,70 L40,68 L35,66 L30,68 L25,70 L20,70"
            fill="#e0f2fe"
            stroke="#0891b2"
            strokeWidth="0.5"
          />
          
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
                  r={isSelected ? 8 : 6}
                  fill={color}
                  fillOpacity={0.7}
                  stroke={isSelected ? '#1f2937' : 'white'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer transition-all duration-200 hover:r-8"
                  onClick={() => onLocationChange(location.name)}
                />
                
                {/* Location label */}
                <text
                  x={location.x}
                  y={location.y - 10}
                  textAnchor="middle"
                  className="text-xs font-medium fill-gray-800"
                  style={{ fontSize: '3px' }}
                >
                  {location.name}
                </text>
                
                {/* Score */}
                <text
                  x={location.x}
                  y={location.y + 1}
                  textAnchor="middle"
                  className="text-xs font-bold fill-white"
                  style={{ fontSize: '2.5px' }}
                >
                  {score}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span>0-20</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>20-40</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span>40-60</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span>60-80</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>80-100</span>
          </div>
        </div>
        
        <div className="text-gray-600">
          {activeLayer === 'weather' && 'Sääpisteet (korkeampi = huonompi sää = parempi jacuzzi-kysyntä)'}
          {activeLayer === 'electricity' && 'Kustannustehokkuus (korkeampi = halvempi energia)'}
          {activeLayer === 'business' && 'Kysyntäpisteet (korkeampi = enemmän asiakkaita)'}
          {activeLayer === 'combined' && 'Yhdistetty pistemäärä (optimaalinen jacuzzi-sijainti)'}
        </div>
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
