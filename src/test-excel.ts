// Test file to verify Excel reading functionality
import DataService from './services/DataService'

async function testExcelReading() {
  try {
    console.log('Testing Excel file reading...')
    
    // Test reading electricity prices from Excel
    const priceData = await (DataService as any).readElectricityPricesFromExcel()
    console.log('Excel price data:', priceData)
    
    // Test the full electricity data method
    const electricityData = await DataService.getElectricityData()
    console.log('Electricity data with Excel integration:', electricityData)
    
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run test if this file is executed directly
if (typeof window !== 'undefined') {
  testExcelReading()
}

export { testExcelReading }
