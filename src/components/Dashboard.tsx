import { WeatherData, ElectricityData, BusinessData, Location } from '../types'
import DataService from '../services/DataService'

interface DashboardProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  currentLocation: Location | null
}

const Dashboard = ({ weatherData, electricityData, businessData, currentLocation }: DashboardProps) => {
  const optimalLocations = DataService.calculateOptimalLocation(weatherData, electricityData, businessData)
  const topLocation = optimalLocations[0]

  const currentWeather = weatherData.find(w => w.locationId === currentLocation?.id)
  const currentElectricity = electricityData.find(e => e.locationId === currentLocation?.id)
  const currentBusiness = businessData.find(b => b.locationId === currentLocation?.id)

  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'stormy': return '⛈️'
      case 'snowy': return '❄️'
      default: return '🌤️'
    }
  }

  return (
    <div className="space-y-6">
      {/* Optimaalinen sijainti */}
      <div className="bg-gradient-to-r from-green-900 to-blue-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-white">🎯 Paras Sijainti Nyt</h2>
        {topLocation && (
          <div>
            <h3 className="text-2xl font-bold text-green-400">{topLocation.locationName}</h3>
            <p className="text-green-300 mt-1">Kokonaispistemäärä: {topLocation.combinedScore}/100</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Sää:</span>
                <span className="text-blue-300">{topLocation.weatherScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Sähkö:</span>
                <span className="text-yellow-300">{topLocation.electricityScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Kysyntä:</span>
                <span className="text-purple-300">{topLocation.businessScore}/100</span>
              </div>
            </div>
            <div className="mt-4 bg-green-800/30 rounded p-3">
              <span className="text-green-300 font-semibold">💡 Suositus: {topLocation.recommendation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Nykyisen sijainnin tiedot */}
      {currentLocation && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">📍 Nykyinen Sijainti</h2>
          <h3 className="text-lg font-semibold text-blue-400 mb-4">{currentLocation.name}</h3>
          
          {/* Sää */}
          {currentWeather && (
            <div className="mb-4 p-4 bg-gray-700 rounded">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                {getWeatherIcon(currentWeather.condition)} Sää
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Lämpötila: {currentWeather.temperature}°C</div>
                <div>Kosteus: {currentWeather.humidity}%</div>
                <div>Sade: {currentWeather.precipitation}mm</div>
                <div>Tuuli: {currentWeather.windSpeed}m/s</div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center">
                  <span>Jacuzzi-sää pisteet:</span>
                  <span className="font-bold text-blue-400">{currentWeather.badWeatherScore}/100</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${currentWeather.badWeatherScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Sähkö */}
          {currentElectricity && (
            <div className="mb-4 p-4 bg-gray-700 rounded">
              <h4 className="font-semibold flex items-center gap-2 mb-2">⚡ Sähkö</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Hinta: {currentElectricity.pricePerKwh}€/kWh</div>
                <div>Uusiutuva: {currentElectricity.renewablePercent}%</div>
                <div>Verkko kuorma: {currentElectricity.gridLoad}%</div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center">
                  <span>Kustannustehokkuus:</span>
                  <span className="font-bold text-yellow-400">{currentElectricity.costEfficiencyScore}/100</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${currentElectricity.costEfficiencyScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Yritykset */}
          {currentBusiness && (
            <div className="p-4 bg-gray-700 rounded">
              <h4 className="font-semibold flex items-center gap-2 mb-2">🏢 Yritykset</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Yrityksiä: {currentBusiness.totalCompanies.toLocaleString()}</div>
                <div>Tech-yrityksiä: {currentBusiness.techCompanies.toLocaleString()}</div>
                <div>Keskikoko: {currentBusiness.avgEmployees} henk.</div>
                <div>Tiheys: {currentBusiness.businessDensity}/km²</div>
              </div>
              <div className="mt-2">
                <div className="flex justify-between items-center">
                  <span>Kysyntäpotentiaali:</span>
                  <span className="font-bold text-purple-400">{currentBusiness.demandScore}/100</span>
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2 mt-1">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${currentBusiness.demandScore}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top 3 sijainnit */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">🏆 Top 3 Sijainnit</h2>
        <div className="space-y-3">
          {optimalLocations.slice(0, 3).map((location, index) => (
            <div key={location.locationName} className={`p-3 rounded border-l-4 ${
              index === 0 ? 'border-gold bg-yellow-900/20' :
              index === 1 ? 'border-silver bg-gray-600/20' :
              'border-bronze bg-orange-900/20'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'} {location.locationName}
                  </span>
                  <p className="text-sm text-gray-400">{location.recommendation}</p>
                </div>
                <span className="text-xl font-bold">{location.combinedScore}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
