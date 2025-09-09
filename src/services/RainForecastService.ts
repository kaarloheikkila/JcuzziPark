// RainForecastService.ts
// TypeScript utility to fetch FMI 10-day edited forecast and return daily rainfall totals

export interface DailyRainData {
  [site: string]: {
    [date: string]: number // mm of rain
  }
}

interface HourlyRainPoint {
  time: string
  value: number
}

class RainForecastService {
  private static readonly BASE_URL = "https://opendata.fmi.fi/wfs"
  private static readonly STOREDQUERY_ID = "fmi::forecast::edited::weather::scandinavia::point::timevaluepair"

  // Build a WFS URL for precipitation1h for one site
  private static buildUrl(site: string): string {
    const url = new URL(this.BASE_URL)
    url.searchParams.set("service", "WFS")
    url.searchParams.set("version", "2.0.0")
    url.searchParams.set("request", "getFeature")
    url.searchParams.set("storedquery_id", this.STOREDQUERY_ID)
    url.searchParams.set("place", site)
    // ask only for hourly precipitation to reduce payload
    url.searchParams.set("parameters", "precipitation1h")
    // hourly is the natural timestep; FMI will return ~240 hours by default
    url.searchParams.set("timestep", "60")
    return url.toString()
  }

  // Parse FMI WML2 timevaluepair XML -> array of {time, value}
  private static parsePrecipitation1h(xmlText: string): HourlyRainPoint[] {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml")
    const points = Array.from(
      doc.querySelectorAll(
        "wml2\\:MeasurementTimeseries > wml2\\:point, MeasurementTimeseries > point"
      )
    )
    
    return points.map((p) => {
      const timeElement = p.querySelector("wml2\\:time, time") || 
                         p.querySelector("gml\\:time, beginPosition, gml\\:beginPosition")
      const time = timeElement?.textContent?.trim() ?? ""
      
      const valueElement = p.querySelector("wml2\\:value, value")
      const v = Number(valueElement?.textContent ?? "0")
      
      return { 
        time, 
        value: Number.isFinite(v) ? v : 0 
      }
    })
  }

  // Group by local day (Europe/Helsinki) and sum mm
  private static toDailyRainfallMM(
    hourly: HourlyRainPoint[], 
    days: number = 10, 
    tz: string = "Europe/Helsinki"
  ): { [date: string]: number } {
    const out: { [date: string]: number } = {}
    
    // from today 00:00 local to +days
    const now = new Date()
    const startDateString = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .format(now)
      .split("/")
      .reverse()
      .join("-") + "T00:00:00"
    
    const start = new Date(startDateString)
    
    for (let d = 0; d < days; d++) {
      const day = new Date(start.getTime())
      day.setDate(start.getDate() + d)
      const label = new Intl.DateTimeFormat("fi-FI", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
      })
        .format(day)
        .replace(/\u200E/g, "")
      out[label] = 0
    }
    
    // sum values into matching local day keys
    for (const { time, value } of hourly) {
      const local = new Date(time)
      const key = new Intl.DateTimeFormat("fi-FI", {
        timeZone: tz,
        day: "2-digit",
        month: "2-digit",
      })
        .format(local)
        .replace(/\u200E/g, "")
      
      if (out.hasOwnProperty(key)) {
        out[key] += value
      }
    }
    
    // round to one decimal
    for (const k of Object.keys(out)) {
      out[k] = Math.round(out[k] * 10) / 10
    }
    
    return out
  }

  // Fetch one site and return { [dd.mm]: mm } for next 10 days
  private static async fetchSiteDailyRain(site: string): Promise<{ [date: string]: number }> {
    const url = this.buildUrl(site)
    const resp = await fetch(url, { 
      headers: { Accept: "application/xml" } 
    })
    
    if (!resp.ok) {
      throw new Error(`${site}: HTTP ${resp.status}`)
    }
    
    const xml = await resp.text()
    const hourly = this.parsePrecipitation1h(xml)
    return this.toDailyRainfallMM(hourly, 10, "Europe/Helsinki")
  }

  // Main: returns { [site]: { [dd.mm]: mm } } for a list of sites
  static async getDailyRainForSites(sites: string[]): Promise<DailyRainData> {
    const results: DailyRainData = {}
    const promises = sites.map((s) => 
      this.fetchSiteDailyRain(s).then((data) => [s, data] as [string, { [date: string]: number }])
    )
    
    const settled = await Promise.allSettled(promises)
    
    for (let i = 0; i < settled.length; i++) {
      const item = settled[i]
      if (item.status === "fulfilled") {
        const [site, data] = item.value
        results[site] = data
      } else {
        // include site with empty data if fetch failed
        console.warn(`Failed to fetch rain data for ${sites[i]}:`, item.reason)
        results[sites[i]] = {}
      }
    }
    
    return results
  }

  // Calculate rain score based on forecast (higher rain = better for jacuzzi business)
  static calculateRainScore(dailyRain: { [date: string]: number }): number {
    const rainAmounts = Object.values(dailyRain)
    if (rainAmounts.length === 0) return 0
    
    const avgRain = rainAmounts.reduce((sum, rain) => sum + rain, 0) / rainAmounts.length
    const maxRain = Math.max(...rainAmounts)
    
    // Score based on average and peak rainfall
    // 0mm = 0 points, 10mm+ average = 100 points
    const avgScore = Math.min(100, (avgRain / 10) * 100)
    const peakScore = Math.min(100, (maxRain / 20) * 100)
    
    return Math.round((avgScore * 0.7 + peakScore * 0.3))
  }
}

export default RainForecastService
