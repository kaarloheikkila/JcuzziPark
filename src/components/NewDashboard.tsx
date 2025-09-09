import { WeatherData, ElectricityData, BusinessData } from '../types'

interface DashboardProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  selectedLocation: string | null
  activeLayer: 'weather' | 'electricity' | 'business' | 'combined'
  timeOffset: number
}

const Dashboard = ({ weatherData, electricityData, businessData, selectedLocation, activeLayer }: DashboardProps) => {
  // Get current data for selected location
  const currentWeather = selectedLocation ? weatherData.find(d => d.locationName === selectedLocation) : null
  const currentElectricity = selectedLocation ? electricityData.find(d => d.locationName === selectedLocation) : null
  const currentBusiness = selectedLocation ? businessData.find(d => d.locationName === selectedLocation) : null

  // Calculate optimal locations based on combined scores
  const optimalLocations = weatherData.map(weather => {
    const electricity = electricityData.find(e => e.locationId === weather.locationId)
    const business = businessData.find(b => b.locationId === weather.locationId)
    
    if (!electricity || !business) return null
    
    const combinedScore = Math.round(
      (weather.badWeatherScore + electricity.costEfficiencyScore + business.demandScore) / 3
    )
    
    return {
      location: weather.locationName,
      combinedScore,
      weatherScore: weather.badWeatherScore,
      electricityScore: electricity.costEfficiencyScore,
      businessScore: business.demandScore
    }
  }).filter(Boolean).sort((a, b) => (b?.combinedScore || 0) - (a?.combinedScore || 0))

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg p-6 space-y-6">
      {/* Top Locations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">🏆 Parhaat Sijainnit</h3>
        <div className="space-y-3">
          {optimalLocations.slice(0, 3).map((location, index) => (
            <div key={location?.location} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                }`}>
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium text-gray-800">{location?.location}</div>
                  <div className="text-sm text-gray-600">
                    Sää: {location?.weatherScore} | Sähkö: {location?.electricityScore} | Kysyntä: {location?.businessScore}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-blue-600">{location?.combinedScore}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Location Details */}
      {selectedLocation && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📍 {selectedLocation}</h3>
          
          {/* Weather Analysis */}
          {currentWeather && (activeLayer === 'weather' || activeLayer === 'combined') && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">🌦️ Sääanalyysi</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Lämpötila: {currentWeather.temperature}°C</div>
                <div>Sade: {currentWeather.precipitation}mm</div>
                <div>Tuuli: {currentWeather.windSpeed} m/s</div>
                <div>Kosteus: {currentWeather.humidity}%</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-blue-700">Sääpisteet:</span>
                <span className="font-bold text-blue-600">{currentWeather.badWeatherScore}/100</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentWeather.badWeatherScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Electricity Analysis */}
          {currentElectricity && (activeLayer === 'electricity' || activeLayer === 'combined') && (
            <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">⚡ Sähköanalyysi</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Hinta: {currentElectricity.pricePerKwh}€/kWh</div>
                <div>Uusiutuva: {currentElectricity.renewablePercent}%</div>
                <div>Grid-kuorma: {currentElectricity.gridLoad}%</div>
                <div>Tehokkuus: {currentElectricity.costEfficiencyScore}/100</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-yellow-700">Kustannustehokkuus:</span>
                <span className="font-bold text-yellow-600">{currentElectricity.costEfficiencyScore}/100</span>
              </div>
              <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentElectricity.costEfficiencyScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Business Analysis */}
          {currentBusiness && (activeLayer === 'business' || activeLayer === 'combined') && (
            <div className="mb-4 p-4 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">🏢 Yritysanalyysi</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Yrityksiä: {currentBusiness.totalCompanies.toLocaleString()}</div>
                <div>Tech-yrityksiä: {currentBusiness.techCompanies.toLocaleString()}</div>
                <div>Keskikoko: {currentBusiness.avgEmployees} henk.</div>
                <div>Tiheys: {currentBusiness.businessDensity}/km²</div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-purple-700">Kysyntäpisteet:</span>
                <span className="font-bold text-purple-600">{currentBusiness.demandScore}/100</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${currentBusiness.demandScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layer-specific Analysis */}
      {!selectedLocation && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            📊 {activeLayer === 'weather' ? 'Sääanalyysi' : 
                 activeLayer === 'electricity' ? 'Sähköanalyysi' : 
                 activeLayer === 'business' ? 'Yritysanalyysi' : 
                 'Yhdistetty Analyysi'}
          </h3>
          <div className="text-sm text-gray-600">
            {activeLayer === 'weather' && 'Huono sää tarkoittaa korkeampaa jacuzzi-kysyntää. Sade, tuuli ja kylmyys nostavat pisteitä.'}
            {activeLayer === 'electricity' && 'Halpa, uusiutuva energia minimoi käyttökustannukset. Grid-kuorma vaikuttaa saatavuuteen.'}
            {activeLayer === 'business' && 'Korkea yritystiheys ja tech-sektori indikoivat maksukykyisiä asiakkaita.'}
            {activeLayer === 'combined' && 'Optimaalinen sijainti tasapainottaa alhaiset energiakustannukset, korkean kysynnän ja hyvän asiakaspohjan.'}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
