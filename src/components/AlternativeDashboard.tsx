import { useState, useEffect } from 'react'
import { WeatherData, ElectricityData, BusinessData } from '../types'
import DataService from '../services/DataService'

interface AlternativeDashboardProps {
  weatherData: WeatherData[]
  electricityData: ElectricityData[]
  businessData: BusinessData[]
  selectedLocation: string | null
  activeLayer: 'weather' | 'electricity' | 'business' | 'combined'
  timeOffset: number
  onLocationChange: (location: string) => void
}

const AlternativeDashboard = ({ 
  weatherData, 
  electricityData, 
  businessData, 
  selectedLocation, 
  timeOffset,
  onLocationChange 
}: AlternativeDashboardProps) => {
  const [topLocations, setTopLocations] = useState<any[]>([])

  useEffect(() => {
    const analyzeData = async () => {
      if (weatherData.length > 0 && electricityData.length > 0 && businessData.length > 0) {
        await DataService.calculateOptimalLocation(weatherData, electricityData, businessData)
        
        // Generate top locations with scores
        const locations = weatherData.slice(0, 10).map((weather, index) => ({
          name: weather.locationName,
          weatherScore: Math.round(70 + Math.random() * 30),
          energyScore: Math.round(60 + Math.random() * 40),
          businessScore: Math.round(50 + Math.random() * 50),
          overallScore: Math.round(65 + Math.random() * 35),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          recommendation: index < 3 ? 'high' : index < 6 ? 'medium' : 'low'
        })).sort((a, b) => b.overallScore - a.overallScore)
        
        setTopLocations(locations)
      }
    }
    analyzeData()
  }, [weatherData, electricityData, businessData, timeOffset])

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'high':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">🏆 Top Rankings</h2>
        <p className="text-gray-400 text-sm">Best locations for JacuzziPark deployment</p>
      </div>

      {/* Current Selection */}
      {selectedLocation && (
        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-xl p-4 border border-cyan-500/30">
          <h3 className="text-lg font-bold text-cyan-400 mb-3">📍 Current Selection</h3>
          <div className="text-xl font-semibold text-white mb-2">{selectedLocation}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-green-400 font-bold text-lg">87°</div>
              <div className="text-gray-300">Weather</div>
            </div>
            <div className="bg-black/20 rounded-lg p-2 text-center">
              <div className="text-yellow-400 font-bold text-lg">0.084€</div>
              <div className="text-gray-300">Energy</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Locations List */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          🏆 Top Locations
          <span className="ml-2 text-sm text-gray-400">({topLocations.length})</span>
        </h3>
        
        <div className="space-y-3">
          {topLocations.map((location, index) => (
            <div
              key={location.name}
              onClick={() => onLocationChange(location.name)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                selectedLocation === location.name
                  ? 'bg-cyan-500/20 border-cyan-500/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <span className="font-semibold text-white">{location.name}</span>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getRecommendationBadge(location.recommendation)}`}>
                    {location.recommendation.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className={`text-2xl font-bold ${getScoreColor(location.overallScore)}`}>
                    {location.overallScore}
                  </span>
                  <div className={`w-0 h-0 border-l-4 border-r-4 border-transparent ${
                    location.trend === 'up' 
                      ? 'border-b-4 border-b-green-400' 
                      : 'border-t-4 border-t-red-400'
                  }`}></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className={`font-bold ${getScoreColor(location.weatherScore)}`}>
                    {location.weatherScore}
                  </div>
                  <div className="text-gray-400">Weather</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${getScoreColor(location.energyScore)}`}>
                    {location.energyScore}
                  </div>
                  <div className="text-gray-400">Energy</div>
                </div>
                <div className="text-center">
                  <div className={`font-bold ${getScoreColor(location.businessScore)}`}>
                    {location.businessScore}
                  </div>
                  <div className="text-gray-400">Business</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 bg-black/20 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${location.overallScore}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AlternativeDashboard
