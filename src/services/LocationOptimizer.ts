// LocationOptimizer.ts
// Service to find the best location using weather forecasts and electricity prices

interface RainData {
  [site: string]: {
    [date: string]: number; // dd.mm: rainfall in mm
  };
}

interface OptimizationResult {
  bestSite: string;
  optimalDate: string;
  rainPeriodStart: Date;
  rainPeriodEnd: Date;
  totalRainfall: number;
  electricityPrice: number;
}

// Top 5 cities in Finland for jacuzzi business potential
const TOP_CITIES = ['Helsinki', 'Tampere', 'Turku', 'Oulu', 'Espoo'];

class LocationOptimizer {
  private baseUrl = 'https://opendata.fmi.fi/wfs';
  private storedQueryId = 'fmi::forecast::edited::weather::scandinavia::point::timevaluepair';

  /**
   * Build FMI API URL for precipitation data
   */
  private buildFmiUrl(site: string): string {
    const url = new URL(this.baseUrl);
    url.searchParams.set('service', 'WFS');
    url.searchParams.set('version', '2.0.0');
    url.searchParams.set('request', 'getFeature');
    url.searchParams.set('storedquery_id', this.storedQueryId);
    url.searchParams.set('place', site);
    url.searchParams.set('parameters', 'precipitation1h');
    url.searchParams.set('timestep', '60');
    return url.toString();
  }

  /**
   * Parse FMI XML response to extract precipitation data
   */
  private parsePrecipitationXml(xmlText: string): Array<{ time: string; value: number }> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    
    // Handle different XML namespaces
    const points = Array.from(
      doc.querySelectorAll(
        'wml2\\:MeasurementTimeseries > wml2\\:point, MeasurementTimeseries > point'
      )
    );

    return points.map((point) => {
      const timeElement = point.querySelector('wml2\\:time, time');
      const valueElement = point.querySelector('wml2\\:value, value');
      
      const time = timeElement?.textContent?.trim() || '';
      const value = Number(valueElement?.textContent || '0');
      
      return {
        time,
        value: Number.isFinite(value) ? value : 0
      };
    });
  }

  /**
   * Convert hourly data to daily rainfall totals
   */
  private toDailyRainfall(
    hourlyData: Array<{ time: string; value: number }>, 
    days: number = 10
  ): { [key: string]: number } {
    const dailyRain: { [key: string]: number } = {};
    
    // Initialize next 10 days
    const now = new Date();
    for (let d = 0; d < days; d++) {
      const date = new Date(now);
      date.setDate(now.getDate() + d);
      const key = date.toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Europe/Helsinki'
      }).replace(/\u200E/g, ''); // Remove invisible characters
      dailyRain[key] = 0;
    }

    // Sum hourly values into daily totals
    for (const { time, value } of hourlyData) {
      const date = new Date(time);
      const key = date.toLocaleDateString('fi-FI', {
        day: '2-digit',
        month: '2-digit',
        timeZone: 'Europe/Helsinki'
      }).replace(/\u200E/g, '');
      
      if (dailyRain.hasOwnProperty(key)) {
        dailyRain[key] += value;
      }
    }

    // Round to one decimal place
    Object.keys(dailyRain).forEach(key => {
      dailyRain[key] = Math.round(dailyRain[key] * 10) / 10;
    });

    return dailyRain;
  }

  /**
   * Fetch daily rainfall data for a single site
   */
  private async fetchSiteRainData(site: string): Promise<{ [key: string]: number }> {
    try {
      const url = this.buildFmiUrl(site);
      const response = await fetch(url, {
        headers: { Accept: 'application/xml' }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch data for ${site}: HTTP ${response.status}`);
      }

      const xmlText = await response.text();
      const hourlyData = this.parsePrecipitationXml(xmlText);
      return this.toDailyRainfall(hourlyData, 10);
    } catch (error) {
      console.error(`Error fetching rain data for ${site}:`, error);
      return {}; // Return empty data on error
    }
  }

  /**
   * Fetch rainfall data for all sites
   */
  private async fetchAllRainData(): Promise<RainData> {
    const promises = TOP_CITIES.map(async (site) => {
      const data = await this.fetchSiteRainData(site);
      return [site, data] as [string, { [key: string]: number }];
    });

    const results = await Promise.allSettled(promises);
    const rainData: RainData = {};

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const [site, data] = result.value;
        rainData[site] = data;
      } else {
        rainData[TOP_CITIES[index]] = {};
      }
    });

    return rainData;
  }

  /**
   * Find the best contiguous rain period for a site
   */
  private findBestRainPeriod(dailyRain: { [key: string]: number }) {
    const dates = Object.keys(dailyRain).sort((a, b) => {
      // Sort by date (dd.mm format)
      const [dayA, monthA] = a.split('.').map(Number);
      const [dayB, monthB] = b.split('.').map(Number);
      const dateA = new Date(new Date().getFullYear(), monthA - 1, dayA);
      const dateB = new Date(new Date().getFullYear(), monthB - 1, dayB);
      return dateA.getTime() - dateB.getTime();
    });

    let bestPeriod = {
      totalRain: 0,
      startIndex: 0,
      endIndex: 0,
      length: 0
    };

    // Find best 1-4 day period with continuous rain
    for (let start = 0; start < dates.length; start++) {
      if (dailyRain[dates[start]] <= 0) continue; // Must start with rain

      let totalRain = 0;
      for (let length = 1; length <= 4 && start + length <= dates.length; length++) {
        const currentDate = dates[start + length - 1];
        const rain = dailyRain[currentDate];
        
        if (rain <= 0) break; // Period ends if no rain
        
        totalRain += rain;
        
        if (length >= 1 && totalRain > bestPeriod.totalRain) {
          bestPeriod = {
            totalRain,
            startIndex: start,
            endIndex: start + length - 1,
            length
          };
        }
      }
    }

    return {
      ...bestPeriod,
      startDate: dates[bestPeriod.startIndex],
      endDate: dates[bestPeriod.endIndex],
      dates: dates
    };
  }

  /**
   * Find the date with minimum electricity price
   */
  private async findOptimalElectricityDate(availableDates: string[]): Promise<string> {
    try {
      const response = await fetch('/sahkonhinta.json');
      if (!response.ok) {
        throw new Error('Failed to load electricity price data');
      }
      
      const prices = await response.json();
      
      let minDate = availableDates[0];
      let minPrice = Number.POSITIVE_INFINITY;

      for (const date of availableDates) {
        const price = prices[date];
        if (typeof price === 'number' && price < minPrice) {
          minPrice = price;
          minDate = date;
        }
      }

      return minDate;
    } catch (error) {
      console.error('Error finding optimal electricity date:', error);
      return availableDates[0]; // Fallback to first available date
    }
  }

  /**
   * Main function to find the best location for jacuzzi setup
   */
  public async findBestLocation(): Promise<OptimizationResult> {
    try {
      // Step 1: Fetch rain data for all cities
      const rainData = await this.fetchAllRainData();
      
      // Step 2: Find the city with the best rain period
      let bestResult = {
        site: '',
        totalRain: 0,
        period: null as any,
        optimalDate: ''
      };

      for (const [site, dailyRain] of Object.entries(rainData)) {
        if (Object.keys(dailyRain).length === 0) continue;
        
        const period = this.findBestRainPeriod(dailyRain);
        
        if (period.totalRain > bestResult.totalRain) {
          bestResult = {
            site,
            totalRain: period.totalRain,
            period,
            optimalDate: ''
          };
        }
      }

      if (!bestResult.site) {
        throw new Error('No suitable location found');
      }

      // Step 3: Find optimal date based on electricity prices
      const availableDates = bestResult.period.dates.slice(0, bestResult.period.startIndex);
      if (availableDates.length === 0) {
        availableDates.push(bestResult.period.startDate);
      }
      
      const optimalDate = await this.findOptimalElectricityDate(availableDates);

      // Step 4: Convert dates to proper Date objects
      const year = new Date().getFullYear();
      const [startDay, startMonth] = bestResult.period.startDate.split('.').map(Number);
      const [endDay, endMonth] = bestResult.period.endDate.split('.').map(Number);
      
      const startDate = new Date(year, startMonth - 1, startDay);
      const endDate = new Date(year, endMonth - 1, endDay);

      // Get electricity price for the optimal date
      let electricityPrice = 0;
      try {
        const response = await fetch('/sahkonhinta.json');
        if (response.ok) {
          const prices = await response.json();
          electricityPrice = prices[optimalDate] || 0;
        }
      } catch (error) {
        console.error('Error loading electricity price:', error);
      }

      return {
        bestSite: bestResult.site,
        optimalDate,
        rainPeriodStart: startDate,
        rainPeriodEnd: endDate,
        totalRainfall: bestResult.totalRain,
        electricityPrice
      };

    } catch (error) {
      console.error('Error in location optimization:', error);
      throw error;
    }
  }

  /**
   * Get formatted result summary
   */
  public formatResult(result: OptimizationResult): string {
    const startDate = result.rainPeriodStart.toLocaleDateString('fi-FI');
    const endDate = result.rainPeriodEnd.toLocaleDateString('fi-FI');
    
    return `Best location: ${result.bestSite}
Setup date: ${result.optimalDate}
Rain period: ${startDate} - ${endDate}
Total rainfall: ${result.totalRainfall.toFixed(1)}mm
Electricity price: ${result.electricityPrice.toFixed(2)}€/MWh`;
  }
}

export default LocationOptimizer;
