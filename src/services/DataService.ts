import { WeatherData, ElectricityData, BusinessData } from '../types'

class DataService {
  // Simuloidaan avoindata.fi API-kutsuja
  static async getWeatherData(): Promise<WeatherData[]> {
    // Oikeassa sovelluksessa tämä hakisi dataa Ilmatieteenlaitokselta
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            locationId: 'helsinki',
            locationName: 'Helsinki',
            temperature: 5,
            humidity: 85,
            precipitation: 2.5,
            windSpeed: 8,
            condition: 'rainy',
            timestamp: new Date(),
            badWeatherScore: 75 // Sade = hyvä jacuzzi-sää
          },
          {
            locationId: 'tampere',
            locationName: 'Tampere',
            temperature: 3,
            humidity: 90,
            precipitation: 5.2,
            windSpeed: 12,
            condition: 'stormy',
            timestamp: new Date(),
            badWeatherScore: 95 // Myrsky = erinomainen jacuzzi-sää
          },
          {
            locationId: 'turku',
            locationName: 'Turku',
            temperature: 8,
            humidity: 70,
            precipitation: 0,
            windSpeed: 4,
            condition: 'sunny',
            timestamp: new Date(),
            badWeatherScore: 25 // Aurinko = huono jacuzzi-sää
          },
          {
            locationId: 'lappeenranta',
            locationName: 'Lappeenranta',
            temperature: -5,
            humidity: 95,
            precipitation: 8.1,
            windSpeed: 15,
            condition: 'snowy',
            timestamp: new Date(),
            badWeatherScore: 98 // Lumimyrsky = täydellinen jacuzzi-sää
          }
        ])
      }, 1000)
    })
  }

  static async getElectricityData(): Promise<ElectricityData[]> {
    // Oikeassa sovelluksessa tämä hakisi dataa Fingridiltä
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            locationId: 'helsinki',
            locationName: 'Helsinki',
            pricePerKwh: 0.085,
            renewablePercent: 45,
            gridLoad: 85,
            timestamp: new Date(),
            costEfficiencyScore: 60
          },
          {
            locationId: 'tampere',
            locationName: 'Tampere',
            pricePerKwh: 0.078,
            renewablePercent: 55,
            gridLoad: 70,
            timestamp: new Date(),
            costEfficiencyScore: 75
          },
          {
            locationId: 'turku',
            locationName: 'Turku',
            pricePerKwh: 0.082,
            renewablePercent: 40,
            gridLoad: 80,
            timestamp: new Date(),
            costEfficiencyScore: 65
          },
          {
            locationId: 'lappi',
            locationName: 'Lappi',
            pricePerKwh: 0.045,
            renewablePercent: 95,
            gridLoad: 25,
            timestamp: new Date(),
            costEfficiencyScore: 95 // Ylijäämä tuulivoimaa = erittäin halpa
          }
        ])
      }, 800)
    })
  }

  static async getBusinessData(): Promise<BusinessData[]> {
    // Oikeassa sovelluksessa tämä hakisi dataa Tilastokeskukselta
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            locationId: 'helsinki',
            locationName: 'Helsinki',
            totalCompanies: 58000,
            techCompanies: 12000,
            avgEmployees: 25,
            businessDensity: 952,
            demandScore: 85,
            timestamp: new Date()
          },
          {
            locationId: 'espoo',
            locationName: 'Espoo',
            totalCompanies: 28000,
            techCompanies: 8500,
            avgEmployees: 35,
            businessDensity: 485,
            demandScore: 95, // Korkeapalkkaisia tech-työntekijöitä
            timestamp: new Date()
          },
          {
            locationId: 'tampere',
            locationName: 'Tampere',
            totalCompanies: 22000,
            techCompanies: 4200,
            avgEmployees: 28,
            businessDensity: 385,
            demandScore: 70,
            timestamp: new Date()
          },
          {
            locationId: 'turku',
            locationName: 'Turku',
            totalCompanies: 18500,
            techCompanies: 2800,
            avgEmployees: 22,
            businessDensity: 315,
            demandScore: 65,
            timestamp: new Date()
          }
        ])
      }, 1200)
    })
  }

  // Analysoi optimaalinen sijainti kaikki kriteerit huomioiden
  static calculateOptimalLocation(
    weatherData: WeatherData[],
    electricityData: ElectricityData[],
    businessData: BusinessData[]
  ) {
    const locations = weatherData.map(weather => {
      const electricity = electricityData.find(e => e.locationName === weather.locationName)
      const business = businessData.find(b => b.locationName === weather.locationName)

      if (!electricity || !business) return null

      // Painotettu pisteys (sää 40%, sähkö 35%, kysyntä 25%)
      const combinedScore = 
        (weather.badWeatherScore * 0.4) +
        (electricity.costEfficiencyScore * 0.35) +
        (business.demandScore * 0.25)

      return {
        locationName: weather.locationName,
        weatherScore: weather.badWeatherScore,
        electricityScore: electricity.costEfficiencyScore,
        businessScore: business.demandScore,
        combinedScore: Math.round(combinedScore),
        recommendation: combinedScore > 80 ? 'Erinomainen' : 
                      combinedScore > 65 ? 'Hyvä' : 
                      combinedScore > 50 ? 'Kohtalainen' : 'Huono'
      }
    }).filter(Boolean)

    return locations.sort((a, b) => b!.combinedScore - a!.combinedScore)
  }
}

export default DataService
