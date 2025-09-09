import { WeatherData, ElectricityData, BusinessData, Location } from '../types'

interface MapViewProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  currentLocation: Location | null
  onLocationChange: (location: Location) => void
}

const MapView = ({ weatherData, electricityData, businessData, currentLocation, onLocationChange }: MapViewProps) => {
  // Simuloidaan kartta-komponentti (oikeassa sovelluksessa käytettäisiin Leaflet/OpenStreetMap)
  const locations = [
    { id: 'helsinki', name: 'Helsinki', lat: 60.1699, lng: 24.9384, region: 'Uusimaa' },
    { id: 'tampere', name: 'Tampere', lat: 61.4981, lng: 23.7608, region: 'Pirkanmaa' },
    { id: 'turku', name: 'Turku', lat: 60.4518, lng: 22.2666, region: 'Varsinais-Suomi' },
    { id: 'espoo', name: 'Espoo', lat: 60.2055, lng: 24.6559, region: 'Uusimaa' },
    { id: 'lappeenranta', name: 'Lappeenranta', lat: 61.0587, lng: 28.1887, region: 'Etelä-Karjala' },
    { id: 'lappi', name: 'Lappi', lat: 66.5039, lng: 25.7294, region: 'Lappi' }
  ]

  const getLocationScore = (locationId: string) => {
    const weather = weatherData.find(w => w.locationId === locationId)
    const electricity = electricityData.find(e => e.locationId === locationId)
    const business = businessData.find(b => b.locationId === locationId)

    if (!weather || !electricity || !business) return 0

    return Math.round(
      (weather.badWeatherScore * 0.4) +
      (electricity.costEfficiencyScore * 0.35) +
      (business.demandScore * 0.25)
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 65) return 'bg-yellow-500'
    if (score >= 50) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getWeatherIcon = (locationId: string) => {
    const weather = weatherData.find(w => w.locationId === locationId)
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
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">🗺️ Suomen Jacuzzi-kartta</h2>
      
      {/* Simuloitu kartta */}
      <div className="relative bg-gradient-to-b from-blue-900 to-green-900 rounded-lg h-96 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        
        {/* Sijainnit kartalla */}
        {locations.map((location) => {
          const score = getLocationScore(location.id)
          const isSelected = currentLocation?.id === location.id
          
          return (
            <div
              key={location.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                isSelected ? 'scale-125' : 'hover:scale-110'
              }`}
              style={{
                left: `${((location.lng - 20) / 15) * 100}%`,
                top: `${(1 - (location.lat - 59) / 8) * 100}%`
              }}
              onClick={() => onLocationChange(location)}
              title={`${location.name} - Pisteet: ${score}/100`}
            >
              {/* Sijainti-pin */}
              <div className={`w-8 h-8 rounded-full ${getScoreColor(score)} flex items-center justify-center text-white font-bold shadow-lg border-2 ${
                isSelected ? 'border-white' : 'border-gray-600'
              }`}>
                {score}
              </div>
              
              {/* Sää-ikoni */}
              <div className="absolute -top-2 -right-2 text-sm">
                {getWeatherIcon(location.id)}
              </div>
              
              {/* Sijainnin nimi */}
              <div className={`absolute top-10 left-1/2 transform -translate-x-1/2 text-xs font-semibold px-2 py-1 rounded shadow-lg ${
                isSelected ? 'bg-white text-gray-900' : 'bg-gray-800 text-white'
              }`}>
                {location.name}
              </div>
            </div>
          )
        })}

        {/* Suomen siluetti (yksinkertaistettu) */}
        <div className="absolute inset-0 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
            <path
              d="M20 80 Q25 75 30 70 Q35 65 40 60 Q45 55 50 50 Q55 45 60 40 Q65 35 70 30 Q75 25 75 20 Q70 15 65 20 Q60 25 55 30 Q50 35 45 40 Q40 45 35 50 Q30 55 25 60 Q20 65 20 70 Z"
              fill="currentColor"
              className="text-blue-300"
            />
          </svg>
        </div>
      </div>

      {/* Kartan selite */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2"></div>
          <span className="text-xs">Erinomainen (80+)</span>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="w-6 h-6 bg-yellow-500 rounded-full mx-auto mb-2"></div>
          <span className="text-xs">Hyvä (65-79)</span>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="w-6 h-6 bg-orange-500 rounded-full mx-auto mb-2"></div>
          <span className="text-xs">Kohtalainen (50-64)</span>
        </div>
        <div className="bg-gray-700 rounded p-3 text-center">
          <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-2"></div>
          <span className="text-xs">Huono (alle 50)</span>
        </div>
      </div>

      {/* Ohje */}
      <div className="mt-4 bg-blue-900/30 border border-blue-700 rounded p-3">
        <p className="text-sm text-blue-300">
          💡 <strong>Ohje:</strong> Klikkaa kartalta sijaintia nähdäksesi tarkemmat tiedot. 
          Väri kertoo sijainnin soveltuvuuden jacuzzi-puistolle kaikkien kriteerien perusteella.
        </p>
      </div>
    </div>
  )
}

export default MapView
