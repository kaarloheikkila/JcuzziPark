import { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import MapView from './components/MapView'
import AlternativeApp from './components/AlternativeApp'
import DataService from './services/DataService'
import { WeatherData, ElectricityData, BusinessData } from './types'
import './App.css'

function App() {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [electricityData, setElectricityData] = useState<ElectricityData[]>([])
  const [businessData, setBusinessData] = useState<BusinessData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState<'weather' | 'electricity' | 'business' | 'combined'>('combined')
  const [timeOffset, setTimeOffset] = useState(0) // Hours from now
  const [useAlternativeUI, setUseAlternativeUI] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch real data from FMI and other sources
        const weather = await DataService.getWeatherData()
        const electricity = await DataService.getElectricityData()
        const business = await DataService.getBusinessData()
        
        setWeatherData(weather)
        setElectricityData(electricity)
        setBusinessData(business)
        
        // Set initial location (Helsinki)
        setCurrentLocation('Helsinki')
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Toggle between UIs
  if (useAlternativeUI) {
    return <AlternativeApp onBackToOriginal={() => setUseAlternativeUI(false)} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 text-lg">Loading JacuzziPark data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-900">
              Where to Deploy Electric Jacuzzi Park?
            </h1>
            <button
              onClick={() => setUseAlternativeUI(true)}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg"
            >
              🚀 Try Alternative UI
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Layer Controls - Left Sidebar */}
          <div className="col-span-3">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Layers</h3>
              
              <div className="space-y-3">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={activeLayer === 'weather'}
                    onChange={() => setActiveLayer('weather')}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-teal-500 rounded mr-3"></div>
                    <span className={`text-sm ${activeLayer === 'weather' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      Weather
                    </span>
                  </div>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={activeLayer === 'electricity'}
                    onChange={() => setActiveLayer('electricity')}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-3"></div>
                    <span className={`text-sm ${activeLayer === 'electricity' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      Electricity Production
                    </span>
                  </div>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={activeLayer === 'business'}
                    onChange={() => setActiveLayer('business')}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-full mr-3"></div>
                    <span className={`text-sm ${activeLayer === 'business' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      Companies
                    </span>
                  </div>
                </label>
                
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="layer"
                    checked={activeLayer === 'combined'}
                    onChange={() => setActiveLayer('combined')}
                    className="hidden"
                  />
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full mr-3"></div>
                    <span className={`text-sm ${activeLayer === 'combined' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                      Combined
                    </span>
                  </div>
                </label>
              </div>

              {/* Color Legend */}
              <div className="mt-8">
                <div className="bg-gradient-to-b from-teal-400 via-green-300 via-yellow-300 to-red-400 w-6 h-32 rounded"></div>
                <div className="text-xs text-gray-600 mt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span>Worse</span>
                  </div>
                  <div className="text-center text-gray-800 font-medium">Weather</div>
                  <div className="mt-4">
                    <div className="text-center text-gray-800 font-medium mb-1">Electricity</div>
                    <div className="text-center">Production</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Area */}
          <div className="col-span-6">
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <MapView
                weatherData={weatherData}
                electricityData={electricityData}
                businessData={businessData}
                selectedLocation={currentLocation}
                onLocationChange={setCurrentLocation}
                activeLayer={activeLayer}
                timeOffset={timeOffset}
              />
            </div>

            {/* Timeline Slider */}
            <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Now</span>
                <div className="flex-1 mx-4">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="1"
                    value={timeOffset}
                    onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>6 h</span>
                    <span>6 h</span>
                    <span>9 h</span>
                    <span>16 h</span>
                    <span>+24 h</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {timeOffset > 0 ? `+${timeOffset}h` : 'Now'}
                </span>
              </div>
            </div>
          </div>

          {/* Top Locations - Right Sidebar */}
          <div className="col-span-3">
            <Dashboard
              weatherData={weatherData}
              electricityData={electricityData}
              businessData={businessData}
              selectedLocation={currentLocation}
              activeLayer={activeLayer}
              timeOffset={timeOffset}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
