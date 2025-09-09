import { WeatherData, ElectricityData, BusinessData } from '../types'
import * as XLSX from 'xlsx'

class DataService {
  // Main method - tries real data first, falls back to simulated
  static async getWeatherData(): Promise<WeatherData[]> {
    try {
      return await this.getRealWeatherData();
    } catch (error) {
      console.warn('Real weather data unavailable, using simulated data:', error);
      return this.getSimulatedWeatherData();
    }
  }

  // Get weather forecasts for all locations
  static async getWeatherForecastData(hours: number = 24): Promise<WeatherData[]> {
    try {
      return await this.getRealWeatherForecastData(hours);
    } catch (error) {
      console.warn('Real weather forecast unavailable, using simulated data:', error);
      return this.getSimulatedWeatherForecastData(hours);
    }
  }

  // Simuloidaan avoindata.fi API-kutsuja (fallback method)
  static async getSimulatedWeatherData(): Promise<WeatherData[]> {
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

  // Read electricity prices from Excel file
  static async readElectricityPricesFromExcel(): Promise<{ [date: string]: number }> {
    try {
      const response = await fetch('/data/Sahkonhinta.xlsx');
      if (!response.ok) {
        throw new Error(`Failed to fetch Excel file: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Assume the first sheet contains the data
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON - expecting columns: Date, Price
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      console.log('Excel data structure:', {
        sheetNames: workbook.SheetNames,
        firstRows: jsonData.slice(0, 5),
        totalRows: jsonData.length
      });
      
      const priceData: { [date: string]: number } = {};
      
      // Skip header row (index 0) and process data rows
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as any[];
        if (row.length >= 2 && row[0] && row[1] != null) {
          const dateValue = row[0];
          const priceValue = row[1];
          
          // Handle different date formats
          let dateStr: string;
          if (dateValue instanceof Date) {
            dateStr = dateValue.toISOString().split('T')[0];
          } else if (typeof dateValue === 'number') {
            // Excel serial date
            const date = XLSX.SSF.parse_date_code(dateValue);
            dateStr = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
          } else {
            dateStr = dateValue.toString();
          }
          
          // Convert price to number and from €/MWh to €/kWh if needed
          let price: number;
          if (typeof priceValue === 'number') {
            price = priceValue;
          } else {
            price = parseFloat(priceValue);
          }
          
          // If price seems to be in €/MWh (>1), convert to €/kWh
          if (price > 1) {
            price = price / 1000;
          }
          
          if (!isNaN(price) && price > 0) {
            priceData[dateStr] = price;
            console.log(`Parsed: ${dateStr} -> ${price} €/kWh`);
          }
        }
      }
      
      console.log('Final price data:', priceData);
      return priceData;
    } catch (error) {
      console.error('Error reading electricity prices from Excel:', error);
      // Return fallback data
      const today = new Date().toISOString().split('T')[0];
      return {
        [today]: 0.078 // Default price €/kWh
      };
    }
  }

  static async getElectricityData(): Promise<ElectricityData[]> {
    // Return static electricity data without price-based scoring
    // Electricity prices from Excel will be used separately for timing decisions
    const locations = [
      {
        locationId: 'helsinki',
        locationName: 'Helsinki',
        renewablePercent: 45,
        gridLoad: 85
      },
      {
        locationId: 'tampere',
        locationName: 'Tampere',
        renewablePercent: 55,
        gridLoad: 70
      },
      {
        locationId: 'turku',
        locationName: 'Turku',
        renewablePercent: 40,
        gridLoad: 80
      },
      {
        locationId: 'lappi',
        locationName: 'Lappi',
        renewablePercent: 95,
        gridLoad: 25
      }
    ];

    return locations.map(location => {
      // Calculate cost efficiency score based only on renewable % and grid load
      // No price-based scoring here
      let costEfficiencyScore = 50; // Base score
      
      // Renewable energy scoring
      if (location.renewablePercent > 80) costEfficiencyScore += 30;
      else if (location.renewablePercent > 60) costEfficiencyScore += 20;
      else if (location.renewablePercent > 40) costEfficiencyScore += 10;
      else costEfficiencyScore -= 10;
      
      // Grid load scoring (lower load = better efficiency)
      if (location.gridLoad < 40) costEfficiencyScore += 20;
      else if (location.gridLoad < 60) costEfficiencyScore += 15;
      else if (location.gridLoad < 80) costEfficiencyScore += 5;
      else costEfficiencyScore -= 10;

      return {
        locationId: location.locationId,
        locationName: location.locationName,
        pricePerKwh: 0, // Not used for scoring anymore
        renewablePercent: location.renewablePercent,
        gridLoad: location.gridLoad,
        timestamp: new Date(),
        costEfficiencyScore: Math.max(0, Math.min(100, Math.round(costEfficiencyScore)))
      };
    });
  }

  // Get electricity price data for timing decisions (when to move between cities)
  static async getElectricityPriceTimingData(): Promise<{ [date: string]: number }> {
    return await this.readElectricityPricesFromExcel();
  }

  // Analyze optimal timing for location moves based on electricity prices
  static async getOptimalMovingTimes(daysAhead: number = 7): Promise<{
    currentPrice: number;
    averagePrice: number;
    priceData: { date: string; price: number; recommendation: 'move' | 'stay' | 'wait' }[];
    bestMoveDays: string[];
  }> {
    try {
      const priceData = await this.readElectricityPricesFromExcel();
      const dates = Object.keys(priceData).sort();
      const prices = Object.values(priceData);
      
      if (dates.length === 0) {
        throw new Error('No price data available');
      }

      const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const today = new Date().toISOString().split('T')[0];
      const currentPrice = priceData[today] || prices[prices.length - 1] || averagePrice;

      // Analyze price trends for next few days
      const analysisData = dates.slice(-daysAhead).map(date => {
        const price = priceData[date];
        let recommendation: 'move' | 'stay' | 'wait';
        
        // Low price = good time to move (high energy consumption activities)
        // High price = wait or stay put
        if (price < averagePrice * 0.8) {
          recommendation = 'move';
        } else if (price > averagePrice * 1.2) {
          recommendation = 'wait';
        } else {
          recommendation = 'stay';
        }

        return {
          date,
          price,
          recommendation
        };
      });

      const bestMoveDays = analysisData
        .filter(day => day.recommendation === 'move')
        .map(day => day.date);

      return {
        currentPrice,
        averagePrice,
        priceData: analysisData,
        bestMoveDays
      };
    } catch (error) {
      console.error('Error analyzing electricity price timing:', error);
      // Return fallback data
      const today = new Date().toISOString().split('T')[0];
      return {
        currentPrice: 0.078,
        averagePrice: 0.078,
        priceData: [{
          date: today,
          price: 0.078,
          recommendation: 'stay'
        }],
        bestMoveDays: []
      };
    }
  }

  // Fallback method with simulated data
  static async getSimulatedElectricityData(): Promise<ElectricityData[]> {
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

  // Fetch real weather observations from FMI API
  // Note: FMI API might have CORS restrictions in browser environments
  // For production, consider using a proxy server or serverless function
  static async fetchWeatherObservations({
    site = "Helsinki",
    parameter = "temperature,humidity,windspeedms,precipitation1h",
    begin,
    end,
    timestep = 60 // FMI expects minutes
  }: {
    site?: string;
    parameter?: string;
    begin: Date;
    end: Date;
    timestep?: number;
  }) {
    const SERVER_URL = "https://opendata.fmi.fi/wfs";
    const STORED_QUERY_OBSERVATION = "fmi::observations::weather::multipointcoverage";
    
    const params = new URLSearchParams({
      service: "WFS",
      version: "2.0.0",
      request: "getFeature",
      storedquery_id: STORED_QUERY_OBSERVATION,
      place: site,
      parameters: parameter,
      starttime: begin.toISOString(),
      endtime: end.toISOString(),
      timestep: String(timestep)
    });

    const url = `${SERVER_URL}?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'Content-Type': 'application/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`FMI API error: ${response.status} ${response.statusText}`);
      }
      const xmlData = await response.text();
      return this.parseWeatherXML(xmlData, site);
    } catch (error) {
      console.error('Error fetching weather observations from FMI:', error);
      // Fallback to simulated data if API fails
      return this.getSimulatedWeatherDataForLocation(site);
    }
  }

  // Fetch weather forecasts from FMI API
  static async fetchWeatherForecast({
    site = "Helsinki",
    parameter = "temperature,humidity,windspeedms,precipitation1h",
    hours = 24 // How many hours ahead to forecast
  }: {
    site?: string;
    parameter?: string;
    hours?: number;
  }) {
    const SERVER_URL = "https://opendata.fmi.fi/wfs";
    const STORED_QUERY_FORECAST = "fmi::forecast::harmonie::surface::point::multipointcoverage";
    
    const now = new Date();
    const forecastEnd = new Date(now.getTime() + (hours * 60 * 60 * 1000));
    
    const params = new URLSearchParams({
      service: "WFS",
      version: "2.0.0",
      request: "getFeature",
      storedquery_id: STORED_QUERY_FORECAST,
      place: site,
      parameters: parameter,
      starttime: now.toISOString(),
      endtime: forecastEnd.toISOString()
    });

    const url = `${SERVER_URL}?${params.toString()}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/xml, text/xml, */*',
          'Content-Type': 'application/xml'
        }
      });
      
      if (!response.ok) {
        throw new Error(`FMI Forecast API error: ${response.status} ${response.statusText}`);
      }
      const xmlData = await response.text();
      return this.parseWeatherForecastXML(xmlData, site, hours);
    } catch (error) {
      console.error('Error fetching weather forecast from FMI:', error);
      // Fallback to simulated forecast data if API fails
      return this.getSimulatedWeatherForecast(site, hours);
    }
  }

  // Legacy method for backward compatibility
  static async fetchWeatherData(params: {
    site?: string;
    parameter?: string;
    begin: Date;
    end: Date;
    timestep?: number;
  }) {
    return this.fetchWeatherObservations(params);
  }

  // Parse FMI forecast XML response to WeatherData array format
  static parseWeatherForecastXML(xmlData: string, locationName: string, hours: number): WeatherData[] {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      
      // Check for XML parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML parsing failed");
      }

      // Extract forecast data points from FMI XML format
      const values = xmlDoc.querySelectorAll("gml:doubleOrNilReason");
      const times = xmlDoc.querySelectorAll("gml:timePosition");
      
      const forecasts: WeatherData[] = [];
      const parametersPerTimeStep = 4; // temperature, humidity, windSpeed, precipitation
      
      // Process forecast data for each time step
      for (let i = 0; i < Math.min(hours, times.length); i++) {
        const baseIndex = i * parametersPerTimeStep;
        
        let temperature = 0;
        let humidity = 80;
        let windSpeed = 5;
        let precipitation = 0;

        // Parse weather values for this time step
        if (values.length > baseIndex + 3) {
          temperature = parseFloat(values[baseIndex]?.textContent || "0");
          humidity = parseFloat(values[baseIndex + 1]?.textContent || "80");
          windSpeed = parseFloat(values[baseIndex + 2]?.textContent || "5");
          precipitation = parseFloat(values[baseIndex + 3]?.textContent || "0");
        }

        // Determine weather condition
        let condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
        if (temperature < 0 && precipitation > 0) {
          condition = 'snowy';
        } else if (precipitation > 5) {
          condition = 'stormy';
        } else if (precipitation > 0.5) {
          condition = 'rainy';
        } else if (temperature < 10) {
          condition = 'cloudy';
        } else {
          condition = 'sunny';
        }

        // Calculate bad weather score
        let badWeatherScore = 50;
        if (temperature < -10) badWeatherScore += 35;
        else if (temperature < 0) badWeatherScore += 25;
        else if (temperature < 10) badWeatherScore += 15;
        else if (temperature > 25) badWeatherScore -= 20;
        
        if (precipitation > 10) badWeatherScore += 30;
        else if (precipitation > 5) badWeatherScore += 20;
        else if (precipitation > 1) badWeatherScore += 10;
        
        if (windSpeed > 15) badWeatherScore += 15;
        else if (windSpeed > 10) badWeatherScore += 10;
        else if (windSpeed > 5) badWeatherScore += 5;

        const forecastTime = times[i]?.textContent 
          ? new Date(times[i].textContent)
          : new Date(Date.now() + (i * 60 * 60 * 1000));

        forecasts.push({
          locationId: `${locationName.toLowerCase().replace(/\s+/g, '')}_forecast_${i}`,
          locationName: `${locationName} (+${i}h)`,
          temperature: Math.round(temperature * 10) / 10,
          humidity: Math.round(humidity),
          precipitation: Math.round(precipitation * 10) / 10,
          windSpeed: Math.round(windSpeed * 10) / 10,
          condition: condition,
          timestamp: forecastTime,
          badWeatherScore: Math.max(0, Math.min(100, Math.round(badWeatherScore)))
        });
      }

      return forecasts;
    } catch (error) {
      console.error('Error parsing forecast XML:', error);
      return this.getSimulatedWeatherForecast(locationName, hours);
    }
  }

  // Generate simulated weather forecast data
  static getSimulatedWeatherForecast(locationName: string, hours: number): WeatherData[] {
    const baseData = this.getSimulatedWeatherDataForLocation(locationName);
    const forecasts: WeatherData[] = [];
    
    for (let i = 0; i < hours; i++) {
      // Simulate weather changes over time
      const tempVariation = (Math.random() - 0.5) * 4; // ±2°C variation
      const humidityVariation = (Math.random() - 0.5) * 20; // ±10% variation
      const windVariation = (Math.random() - 0.5) * 6; // ±3 m/s variation
      const precipVariation = Math.random() * 2; // 0-2mm variation
      
      const forecastTime = new Date(Date.now() + (i * 60 * 60 * 1000));
      
      // Simulate day/night temperature cycle
      const hourOfDay = forecastTime.getHours();
      const nightCooling = hourOfDay >= 22 || hourOfDay <= 6 ? -3 : 0;
      const daytimeWarming = hourOfDay >= 12 && hourOfDay <= 16 ? 2 : 0;
      
      const temperature = baseData.temperature + tempVariation + nightCooling + daytimeWarming;
      const humidity = Math.max(0, Math.min(100, baseData.humidity + humidityVariation));
      const windSpeed = Math.max(0, baseData.windSpeed + windVariation);
      const precipitation = Math.max(0, baseData.precipitation + precipVariation);
      
      // Determine condition based on new values
      let condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
      if (temperature < 0 && precipitation > 0) {
        condition = 'snowy';
      } else if (precipitation > 5) {
        condition = 'stormy';
      } else if (precipitation > 0.5) {
        condition = 'rainy';
      } else if (temperature < 10 || humidity > 85) {
        condition = 'cloudy';
      } else {
        condition = 'sunny';
      }
      
      // Recalculate bad weather score
      let badWeatherScore = 50;
      if (temperature < -10) badWeatherScore += 35;
      else if (temperature < 0) badWeatherScore += 25;
      else if (temperature < 10) badWeatherScore += 15;
      else if (temperature > 25) badWeatherScore -= 20;
      
      if (precipitation > 10) badWeatherScore += 30;
      else if (precipitation > 5) badWeatherScore += 20;
      else if (precipitation > 1) badWeatherScore += 10;
      
      if (windSpeed > 15) badWeatherScore += 15;
      else if (windSpeed > 10) badWeatherScore += 10;
      else if (windSpeed > 5) badWeatherScore += 5;

      forecasts.push({
        locationId: `${baseData.locationId}_forecast_${i}`,
        locationName: `${locationName} (+${i}h)`,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity),
        precipitation: Math.round(precipitation * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10,
        condition: condition,
        timestamp: forecastTime,
        badWeatherScore: Math.max(0, Math.min(100, Math.round(badWeatherScore)))
      });
    }
    
    return forecasts;
  }

  // Get real weather forecast data for all locations
  static async getRealWeatherForecastData(hours: number = 24): Promise<WeatherData[]> {
    const locations = ['Helsinki', 'Tampere', 'Turku', 'Lappeenranta'];
    
    const forecastPromises = locations.map(async (location) => {
      try {
        return await this.fetchWeatherForecast({
          site: location,
          hours: hours
        });
      } catch (error) {
        console.error(`Error fetching forecast for ${location}:`, error);
        return this.getSimulatedWeatherForecast(location, hours);
      }
    });

    try {
      const forecastResults = await Promise.all(forecastPromises);
      // Flatten the array of arrays into a single array
      return forecastResults.flat();
    } catch (error) {
      console.error('Error fetching real weather forecasts:', error);
      return this.getSimulatedWeatherForecastData(hours);
    }
  }

  // Get simulated weather forecast data for all locations
  static getSimulatedWeatherForecastData(hours: number = 24): WeatherData[] {
    const locations = ['Helsinki', 'Tampere', 'Turku', 'Lappeenranta'];
    const allForecasts: WeatherData[] = [];
    
    locations.forEach(location => {
      const locationForecasts = this.getSimulatedWeatherForecast(location, hours);
      allForecasts.push(...locationForecasts);
    });
    
    return allForecasts;
  }

  // Parse FMI XML response to WeatherData format
  static parseWeatherXML(xmlData: string, locationName: string): WeatherData {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlData, "text/xml");
      
      // Check for XML parsing errors
      const parserError = xmlDoc.querySelector("parsererror");
      if (parserError) {
        throw new Error("XML parsing failed");
      }

      // Extract weather parameters from FMI XML format
      const values = xmlDoc.querySelectorAll("gml:doubleOrNilReason");
      
      let temperature = 0;
      let humidity = 80;
      let windSpeed = 5;
      let precipitation = 0;

      // Parse weather values (FMI returns multiple parameters in order)
      if (values.length >= 4) {
        temperature = parseFloat(values[0]?.textContent || "0");
        humidity = parseFloat(values[1]?.textContent || "80");
        windSpeed = parseFloat(values[2]?.textContent || "5");
        precipitation = parseFloat(values[3]?.textContent || "0");
      }

      // Determine weather condition based on temperature and precipitation
      let condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
      if (temperature < 0 && precipitation > 0) {
        condition = 'snowy';
      } else if (precipitation > 5) {
        condition = 'stormy';
      } else if (precipitation > 0.5) {
        condition = 'rainy';
      } else if (temperature < 10) {
        condition = 'cloudy';
      } else {
        condition = 'sunny';
      }

      // Calculate bad weather score (higher = better for jacuzzi business)
      let badWeatherScore = 50; // Base score
      
      // Temperature scoring (colder = better for hot tubs)
      if (temperature < -10) badWeatherScore += 35;
      else if (temperature < 0) badWeatherScore += 25;
      else if (temperature < 10) badWeatherScore += 15;
      else if (temperature > 25) badWeatherScore -= 20;
      
      // Precipitation scoring (more rain/snow = better for jacuzzi)
      if (precipitation > 10) badWeatherScore += 30;
      else if (precipitation > 5) badWeatherScore += 20;
      else if (precipitation > 1) badWeatherScore += 10;
      
      // Wind scoring (windy weather = better for hot tubs)
      if (windSpeed > 15) badWeatherScore += 15;
      else if (windSpeed > 10) badWeatherScore += 10;
      else if (windSpeed > 5) badWeatherScore += 5;

      return {
        locationId: locationName.toLowerCase().replace(/\s+/g, ''),
        locationName: locationName,
        temperature: Math.round(temperature * 10) / 10,
        humidity: Math.round(humidity),
        precipitation: Math.round(precipitation * 10) / 10,
        windSpeed: Math.round(windSpeed * 10) / 10,
        condition: condition,
        timestamp: new Date(),
        badWeatherScore: Math.max(0, Math.min(100, Math.round(badWeatherScore)))
      };
    } catch (error) {
      console.error('Error parsing weather XML:', error);
      // Return fallback data if parsing fails
      return this.getSimulatedWeatherDataForLocation(locationName);
    }
  }

  // Fallback method for simulated data when API fails
  static getSimulatedWeatherDataForLocation(locationName: string): WeatherData {
    const simulatedData: { [key: string]: WeatherData } = {
      'Helsinki': {
        locationId: 'helsinki',
        locationName: 'Helsinki',
        temperature: 5,
        humidity: 85,
        precipitation: 2.5,
        windSpeed: 8,
        condition: 'rainy',
        timestamp: new Date(),
        badWeatherScore: 75
      },
      'Tampere': {
        locationId: 'tampere',
        locationName: 'Tampere',
        temperature: 3,
        humidity: 90,
        precipitation: 5.2,
        windSpeed: 12,
        condition: 'stormy',
        timestamp: new Date(),
        badWeatherScore: 95
      },
      'Turku': {
        locationId: 'turku',
        locationName: 'Turku',
        temperature: 8,
        humidity: 70,
        precipitation: 0,
        windSpeed: 4,
        condition: 'sunny',
        timestamp: new Date(),
        badWeatherScore: 25
      },
      'Lappeenranta': {
        locationId: 'lappeenranta',
        locationName: 'Lappeenranta',
        temperature: -5,
        humidity: 95,
        precipitation: 8.1,
        windSpeed: 15,
        condition: 'snowy',
        timestamp: new Date(),
        badWeatherScore: 98
      }
    };
    
    return simulatedData[locationName] || simulatedData['Helsinki'];
  }

  // Updated getWeatherData to use real FMI API observations
  static async getRealWeatherData(): Promise<WeatherData[]> {
    const locations = ['Helsinki', 'Tampere', 'Turku', 'Lappeenranta'];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const weatherPromises = locations.map(async (location) => {
      try {
        return await this.fetchWeatherObservations({
          site: location,
          begin: oneHourAgo,
          end: now
        });
      } catch (error) {
        console.error(`Error fetching weather for ${location}:`, error);
        return this.getSimulatedWeatherDataForLocation(location);
      }
    });

    try {
      const weatherResults = await Promise.all(weatherPromises);
      return weatherResults;
    } catch (error) {
      console.error('Error fetching real weather data:', error);
      // Fallback to simulated data
      return this.getSimulatedWeatherData();
    }
  }

  // Analysoi optimaalinen sijainti (sää + kysyntä) ja erillisenä sähkön hintatrendi
  static async calculateOptimalLocation(
    weatherData: WeatherData[],
    electricityData: ElectricityData[],
    businessData: BusinessData[]
  ) {
    const locations = weatherData.map(weather => {
      const electricity = electricityData.find(e => e.locationName === weather.locationName)
      const business = businessData.find(b => b.locationName === weather.locationName)

      if (!electricity || !business) return null

      // Painotettu pisteys ilman sähkön hintaa (sää 60%, infrastruktuuri 20%, kysyntä 20%)
      // Sähkön hinta käytetään erikseen siirtopäätösten tekoon
      const combinedScore = 
        (weather.badWeatherScore * 0.6) +
        (electricity.costEfficiencyScore * 0.2) + // Uusiutuva energia ja grid-kuorma
        (business.demandScore * 0.2)

      return {
        locationName: weather.locationName,
        weatherScore: weather.badWeatherScore,
        infrastructureScore: electricity.costEfficiencyScore, // Uusiutuva energia + grid
        businessScore: business.demandScore,
        combinedScore: Math.round(combinedScore),
        recommendation: combinedScore > 80 ? 'Erinomainen' : 
                      combinedScore > 65 ? 'Hyvä' : 
                      combinedScore > 50 ? 'Kohtalainen' : 'Huono'
      }
    }).filter(Boolean)

    // Hae sähkön hintatrendi erikseen siirtopäätöksiä varten
    const electricityTiming = await this.getOptimalMovingTimes(7);

    return {
      locationRankings: locations.sort((a, b) => b!.combinedScore - a!.combinedScore),
      electricityTiming: electricityTiming
    }
  }
}

export default DataService
