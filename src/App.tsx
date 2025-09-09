import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import DataService from './services/DataService'
import { WeatherData, ElectricityData, BusinessData, Location } from './types'
import './App.css'

function App() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [electricityData, setElectricityData] = useState<ElectricityData[]>([])
  const [businessData, setBusinessData] = useState<BusinessData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Simuloidaan datan hakemista avoindata.fi:stä
        const weather = await DataService.getWeatherData()
        const electricity = await DataService.getElectricityData()
        const business = await DataService.getBusinessData()
        
        setWeatherData(weather)
        setElectricityData(electricity)
        setBusinessData(business)
        
        // Asetetaan alkusijainti (Helsinki)
        setCurrentLocation({
          id: 'helsinki',
          name: 'Helsinki',
          lat: 60.1699,
          lng: 24.9384,
          region: 'Uusimaa'
        })
        
      } catch (error) {
        console.error('Virhe datan haussa:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4 text-lg">Ladataan JacuzziPark-dataa...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-blue-400">🛁 JacuzziPark</h1>
              <span className="ml-4 text-gray-300">Sähköjättien Sijaintioptimointi</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                Nykyinen sijainti: {currentLocation?.name}
              </span>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Dashboard - Analytics */}
          <div className="lg:col-span-1">
            <Dashboard
              weatherData={weatherData}
              electricityData={electricityData}
              businessData={businessData}
              currentLocation={currentLocation}
            />
          </div>

          {/* Karttanäkymä */}
          <div className="lg:col-span-2">
            <MapView
              weatherData={weatherData}
              electricityData={electricityData}
              businessData={businessData}
              currentLocation={currentLocation}
              onLocationChange={setCurrentLocation}
            />
          </div>
        </div>

        {/* Yhteenveto ja suositukset */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Puiston Sijoitussuositus</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
              <h3 className="font-semibold text-red-400 mb-2">🌧️ Huonoin Sää</h3>
              <p className="text-sm text-gray-300">
                Tampere: Sade ja tuuli - korkea kysynta sisätiloissa
              </p>
            </div>
            <div className="bg-green-900/30 border border-green-700 rounded-lg p-4">
              <h3 className="font-semibold text-green-400 mb-2">⚡ Halvin Sähkö</h3>
              <p className="text-sm text-gray-300">
                Lappi: Tuulivoima tuottaa 120% tarpeesta
              </p>
            </div>
            <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4">
              <h3 className="font-semibold text-blue-400 mb-2">🏢 Eniten Yrityksiä</h3>
              <p className="text-sm text-gray-300">
                Espoo: Tech-yritykset hakevat rentoutumista
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
