import { useState, useEffect } from 'react'
import AlternativeDashboard from './AlternativeDashboard'
import MapView from './MapView'
import DataService from '../services/DataService'
import LocationOptimizer from '../services/LocationOptimizer'
import { WeatherData, ElectricityData, BusinessData } from '../types'

interface AlternativeAppProps {
  onBackToOriginal?: () => void
}

function AlternativeApp({ onBackToOriginal }: AlternativeAppProps) {
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [weatherData, setWeatherData] = useState<WeatherData[]>([])
  const [electricityData, setElectricityData] = useState<ElectricityData[]>([])
  const [businessData, setBusinessData] = useState<BusinessData[]>([])
  const [loading, setLoading] = useState(true)
  const [activeLayer, setActiveLayer] = useState<'weather' | 'electricity' | 'business' | 'combined'>('combined')
  const [timeOffset, setTimeOffset] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [optimizing, setOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<any>(null)

  const locationOptimizer = new LocationOptimizer()

  // Handle finding the best location using weather and electricity data
  const handleFindBestLocation = async () => {
    try {
      setOptimizing(true)
      setOptimizationResult(null)
      
      console.log('Starting location optimization...')
      const result = await locationOptimizer.findBestLocation()
      
      console.log('Optimization result:', result)
      setOptimizationResult(result)
      
      // Update the current location to the best found location
      setCurrentLocation(result.bestSite)
      
    } catch (error) {
      console.error('Error optimizing location:', error)
      alert(`Error finding best location: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setOptimizing(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const weather = await DataService.getWeatherData()
        const electricity = await DataService.getElectricityData()
        const business = await DataService.getBusinessData()
        
        setWeatherData(weather)
        setElectricityData(electricity)
        setBusinessData(business)
        setCurrentLocation('Helsinki')
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-cyan-400 border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-blue-400 border-b-transparent animate-pulse mx-auto"></div>
          </div>
          <p className="text-white mt-6 text-xl font-medium">Loading JacuzziPark Analytics...</p>
          <div className="flex items-center justify-center mt-4 space-x-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 text-white">
      {/* Top Navigation Bar */}
      <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              {onBackToOriginal && (
                <button
                  onClick={onBackToOriginal}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  title="Back to Original UI"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  JacuzziPark Analytics
                </h1>
                <p className="text-sm text-gray-300">Optimal Location Intelligence Platform</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Layer Selector */}
              <div className="flex bg-white/10 rounded-lg p-1">
                {[
                  { key: 'weather', label: 'Weather', icon: '🌦️' },
                  { key: 'electricity', label: 'Energy', icon: '⚡' },
                  { key: 'business', label: 'Business', icon: '🏢' },
                  { key: 'combined', label: 'Combined', icon: '📊' }
                ].map((layer) => (
                  <button
                    key={layer.key}
                    onClick={() => setActiveLayer(layer.key as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      activeLayer === layer.key
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <span className="mr-2">{layer.icon}</span>
                    {layer.label}
                  </button>
                ))}
              </div>
              
              {/* Time Controls */}
              <div className="flex items-center space-x-3 bg-white/10 rounded-lg px-4 py-2">
                <span className="text-sm font-medium">Time:</span>
                <select
                  value={timeOffset}
                  onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                  className="bg-transparent border border-white/20 rounded px-3 py-1 text-sm focus:outline-none focus:border-cyan-400"
                >
                  <option value={0} className="bg-slate-800">Now</option>
                  <option value={6} className="bg-slate-800">+6h</option>
                  <option value={12} className="bg-slate-800">+12h</option>
                  <option value={18} className="bg-slate-800">+18h</option>
                  <option value={24} className="bg-slate-800">+24h</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Top Rankings */}
        <div className={`transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0'} overflow-hidden flex-shrink-0`}>
          <div className="h-full bg-black/20 backdrop-blur-lg border-r border-white/10">
            <AlternativeDashboard
              weatherData={weatherData}
              electricityData={electricityData}
              businessData={businessData}
              selectedLocation={currentLocation}
              activeLayer={activeLayer}
              timeOffset={timeOffset}
              onLocationChange={setCurrentLocation}
            />
          </div>
        </div>

        {/* Center - Map Area (70% of screen) */}
        <div className="w-[70%] bg-white flex flex-col">
          {/* Map Container */}
          <div className="flex-1">
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
          
          {/* Timeline Below the Map - Center Column Only */}
          <div className="bg-black/20 backdrop-blur-lg border-t border-white/10 px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-200">Timeline Analysis</span>
              <span className="text-sm text-cyan-400">
                {timeOffset === 0 ? 'Now' : `+${timeOffset} hours`}
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="24"
                step="1"
                value={timeOffset}
                onChange={(e) => setTimeOffset(parseInt(e.target.value))}
                className="w-full h-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-green-500 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, 
                    #3b82f6 0%, 
                    #06b6d4 ${(timeOffset / 24) * 100}%, 
                    #374151 ${(timeOffset / 24) * 100}%, 
                    #374151 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Now</span>
                <span>+6h</span>
                <span>+12h</span>
                <span>+18h</span>
                <span>+24h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Quick Actions, Summary, Updates */}
        <div className="w-64 bg-black/20 backdrop-blur-lg border-l border-white/10 overflow-y-auto flex-shrink-0">
          <div className="p-4 space-y-4">
            {/* Current Selection Stats */}
            {currentLocation && (
              <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
                <h3 className="text-lg font-bold mb-3 text-cyan-400">{currentLocation}</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Weather:</span>
                    <span className="text-lg font-bold text-green-400">87</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Energy:</span>
                    <span className="text-lg font-bold text-yellow-400">92</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Business:</span>
                    <span className="text-lg font-bold text-blue-400">78</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-300">Overall:</span>
                    <span className="text-lg font-bold text-cyan-400">85</span>
                  </div>
                </div>
              </div>
            )}

            {/* Optimization Result */}
            {optimizationResult && (
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-lg rounded-xl p-4 border border-cyan-400/30">
                <h3 className="text-lg font-bold mb-3 text-cyan-400">🎯 Best Location Found!</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Location:</span>
                    <span className="text-cyan-400 font-semibold">{optimizationResult.bestSite}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Setup Date:</span>
                    <span className="text-green-400 font-semibold">{optimizationResult.optimalDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Rain Period:</span>
                    <span className="text-blue-400 font-semibold">
                      {optimizationResult.rainPeriodStart.toLocaleDateString('fi-FI')} - {optimizationResult.rainPeriodEnd.toLocaleDateString('fi-FI')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total Rain:</span>
                    <span className="text-blue-400 font-semibold">{optimizationResult.totalRainfall.toFixed(1)}mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Energy Price:</span>
                    <span className="text-yellow-400 font-semibold">{optimizationResult.electricityPrice.toFixed(2)}€/MWh</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold mb-3 text-gray-200">Quick Actions</h4>
              <div className="space-y-2">
                <button 
                  onClick={handleFindBestLocation}
                  disabled={optimizing}
                  className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-sm">
                    {optimizing ? '🔄 Finding Best Location...' : '📍 Find Best Location'}
                  </span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <span className="text-sm">📊 Generate Report</span>
                </button>
                <button className="w-full text-left p-3 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
                  <span className="text-sm">⚙️ Advanced Settings</span>
                </button>
              </div>
            </div>

            {/* Analysis Summary */}
            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold mb-3 text-gray-200">📊 Analysis Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-300">Best Overall:</span>
                  <span className="text-cyan-400 font-semibold">Helsinki</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Worst Weather:</span>
                  <span className="text-green-400 font-semibold">Rovaniemi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Cheapest Energy:</span>
                  <span className="text-yellow-400 font-semibold">Tornio</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Most Business:</span>
                  <span className="text-blue-400 font-semibold">Helsinki</span>
                </div>
              </div>
            </div>

            {/* Real-time Updates */}
            <div className="bg-black/40 backdrop-blur-lg rounded-xl p-4 border border-white/10">
              <h4 className="font-semibold mb-3 text-gray-200">🔄 Live Updates</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Weather data refreshed 2 min ago</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Energy prices updated 5 min ago</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-300">Business data synced 1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AlternativeApp
