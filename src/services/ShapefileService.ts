import * as shapefile from 'shapefile'
import { geoPath, geoMercator } from 'd3-geo'
import { Feature, FeatureCollection, Geometry } from 'geojson'

interface FinlandGeoData extends FeatureCollection {
  type: 'FeatureCollection'
  features: Feature<Geometry>[]
}

export class ShapefileService {
  static async loadFinlandBorders(): Promise<FinlandGeoData | null> {
    try {
      console.log('Loading Finland shapefile...')
      
      // Try to load the shapefile
      const response = await fetch('/data/Finland_border.shp')
      if (!response.ok) {
        throw new Error(`Failed to fetch shapefile: ${response.status}`)
      }
      
      const arrayBuffer = await response.arrayBuffer()
      
      // Convert shapefile to GeoJSON
      const geojson = await shapefile.read(arrayBuffer)
      
      console.log('Shapefile loaded successfully:', geojson)
      return geojson as FinlandGeoData
      
    } catch (error) {
      console.error('Error loading shapefile:', error)
      return null
    }
  }
  
  static async getFinlandPath(width: number = 300, height: number = 400): Promise<string> {
    try {
      const geoData = await this.loadFinlandBorders()
      
      if (!geoData || !geoData.features || geoData.features.length === 0) {
        console.warn('No valid geo data, using fallback path')
        return this.getFallbackFinlandPath()
      }
      
      // Create a projection for Finland with improved parameters
      const projection = geoMercator()
        .center([25.5, 64.0]) // Better center for Finland
        .scale(1800) // Adjusted scale
        .translate([width / 2, height / 2])
        .precision(0.1)
      
      // Create path generator
      const pathGenerator = geoPath().projection(projection)
      
      // Generate SVG path for the first feature (should be Finland)
      const finlandFeature = geoData.features[0] as Feature<Geometry>
      const svgPath = pathGenerator(finlandFeature)
      
      return svgPath || this.getFallbackFinlandPath()
      
    } catch (error) {
      console.error('Error generating Finland path:', error)
      return this.getFallbackFinlandPath()
    }
  }
  
  static getFallbackFinlandPath(): string {
    // Fallback Finland path that matches our coordinate system (300x400 viewBox)
    return `M 30 380 
            L 35 370 L 40 360 L 45 350 L 50 340 L 55 330 L 60 320 L 65 310 
            L 70 300 L 75 290 L 80 280 L 85 270 L 90 260 L 95 250 
            L 100 240 L 105 230 L 110 220 L 115 210 L 120 200 L 125 190 
            L 130 180 L 135 170 L 140 160 L 145 150 L 150 140 L 155 130 
            L 160 120 L 165 110 L 170 100 L 175 90 L 180 80 L 185 70 
            L 190 60 L 195 50 L 200 40 L 205 30 L 210 25 L 215 20 
            L 220 15 L 225 10 L 230 8 L 235 10 L 240 15 L 245 25 
            L 250 35 L 255 45 L 260 55 L 265 65 L 270 75 L 275 85 
            L 280 95 L 285 105 L 290 115 L 285 125 L 280 135 L 275 145 
            L 270 155 L 265 165 L 260 175 L 255 185 L 250 195 L 245 205 
            L 240 215 L 235 225 L 230 235 L 225 245 L 220 255 L 215 265 
            L 210 275 L 205 285 L 200 295 L 195 305 L 190 315 L 185 325 
            L 180 335 L 175 345 L 170 355 L 165 365 L 160 375 L 155 385 
            L 150 390 L 145 392 L 140 393 L 135 392 L 130 390 L 125 385 
            L 120 380 L 115 375 L 110 370 L 105 365 L 100 360 L 95 355 
            L 90 350 L 85 345 L 80 340 L 75 335 L 70 330 L 65 325 
            L 60 330 L 55 335 L 50 340 L 45 350 L 40 360 L 35 370 L 30 380 Z`
  }
  
  static projectCoordinates(lon: number, lat: number, width: number = 300, height: number = 400): [number, number] {
    // Simple and accurate projection for Finnish coordinates
    // Finland bounds: longitude 19.5-31.6°E, latitude 59.8-70.1°N
    const lonMin = 19.5, lonMax = 31.6
    const latMin = 59.8, latMax = 70.1
    
    // Simple linear projection
    const x = ((lon - lonMin) / (lonMax - lonMin)) * width
    const y = height - ((lat - latMin) / (latMax - latMin)) * height
    
    console.log(`Projecting ${lon}°E, ${lat}°N -> (${x.toFixed(1)}, ${y.toFixed(1)})`)
    
    return [x, y]
  }
}

export default ShapefileService
