// Test script for FMI weather API integration (observations + forecasts)
import DataService from './services/DataService'

async function testWeatherData() {
  console.log('🌤️  Testing FMI Weather API integration...')
  
  try {
    // Test current weather observations
    console.log('\n📡 Fetching current weather observations from FMI...')
    const currentWeather = await DataService.getRealWeatherData()
    console.log('Current weather data:', currentWeather)
    
    // Test weather forecasts
    console.log('\n🔮 Fetching 24-hour weather forecast from FMI...')
    const forecastWeather = await DataService.getWeatherForecastData(24)
    console.log(`Forecast data (${forecastWeather.length} entries):`, forecastWeather.slice(0, 5)) // Show first 5
    
    // Test 6-hour forecast for specific location
    console.log('\n📍 Testing 6-hour forecast for Helsinki...')
    const helsinkiForecast = await DataService.fetchWeatherForecast({
      site: 'Helsinki',
      hours: 6
    })
    console.log('Helsinki 6-hour forecast:', helsinkiForecast)
    
    // Test simulated weather data (fallback)
    console.log('\n🎭 Testing simulated weather data...')
    const simulatedWeather = await DataService.getSimulatedWeatherData()
    console.log('Simulated weather data:', simulatedWeather)
    
    // Test simulated forecast data
    console.log('\n🎭 Testing simulated forecast data...')
    const simulatedForecast = DataService.getSimulatedWeatherForecastData(12)
    console.log(`Simulated forecast (${simulatedForecast.length} entries):`, simulatedForecast.slice(0, 3))
    
    // Test main method (automatic fallback)
    console.log('\n🔄 Testing main weather data method (with automatic fallback)...')
    const weatherData = await DataService.getWeatherData()
    console.log('Weather data:', weatherData)
    
    // Test individual observation fetch
    console.log('\n� Testing individual observation fetch...')
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const helsinkiObservation = await DataService.fetchWeatherObservations({
      site: 'Helsinki',
      begin: oneHourAgo,
      end: now
    })
    console.log('Helsinki observation:', helsinkiObservation)
    
  } catch (error) {
    console.error('❌ Error testing weather data:', error)
  }
}

// Advanced test: Compare forecast accuracy
async function testForecastAccuracy() {
  console.log('\n🎯 Testing forecast accuracy...')
  
  try {
    // Get current conditions
    const current = await DataService.getWeatherData()
    console.log('Current conditions:', current[0]) // Helsinki
    
    // Get short-term forecast
    const forecast = await DataService.getWeatherForecastData(3)
    const helsinkiForecast = forecast.filter(f => f.locationName.includes('Helsinki'))
    console.log('Helsinki forecast next 3 hours:', helsinkiForecast)
    
    // Compare scores
    if (current[0] && helsinkiForecast[0]) {
      console.log('Score comparison:')
      console.log(`Current bad weather score: ${current[0].badWeatherScore}`)
      console.log(`Forecast bad weather score: ${helsinkiForecast[0].badWeatherScore}`)
      console.log(`Expected change: ${helsinkiForecast[0].badWeatherScore - current[0].badWeatherScore}`)
    }
    
  } catch (error) {
    console.error('❌ Error testing forecast accuracy:', error)
  }
}

// Run the tests
console.log('🚀 Starting comprehensive weather API tests...')
testWeatherData()
  .then(() => testForecastAccuracy())
  .then(() => console.log('✅ All tests completed!'))
  .catch(error => console.error('❌ Test suite failed:', error))
