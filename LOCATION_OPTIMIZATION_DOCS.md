# Location Optimization Feature Documentation

## Overview

The JacuzziPark application now includes intelligent location optimization using real weather forecast data and electricity pricing to determine the optimal jacuzzi park location within the next 10 days.

## How It Works

### 1. Data Sources
- **Weather Data**: Real 10-day weather forecasts from Finnish Meteorological Institute (FMI)
- **Electricity Prices**: Daily electricity pricing data from Finnish energy market
- **Target Cities**: Helsinki, Tampere, Turku, Oulu, Espoo (top 5 Finnish cities for business potential)

### 2. Optimization Algorithm

The system uses the `pickSiteDateAndRainPeriod.js` utility to:

1. **Fetch Rain Forecasts**: Get hourly precipitation data for next 10 days for all 5 cities
2. **Find Best Rain Period**: Identify 1-4 day continuous rain periods (more rain = higher jacuzzi demand)
3. **Optimize Setup Date**: Find the date with lowest electricity prices before the rain period
4. **Return Recommendation**: Best city + optimal setup date + rain period details

### 3. Business Logic

**Why Rain Matters**: Poor weather drives jacuzzi demand - people seek warm, relaxing activities when it's cold and rainy outside.

**Why Electricity Pricing Matters**: Lower energy costs during setup reduce operational expenses.

**Why Timing Matters**: Setting up just before a rain period maximizes customer demand from day one.

## Implementation Details

### LocationOptimizer Service

```typescript
class LocationOptimizer {
  // Main method
  async findBestLocation(): Promise<OptimizationResult>
  
  // Result formatting
  formatResult(result: OptimizationResult): string
}
```

### Integration Points

1. **UI Button**: "Find Best Location" button in the Quick Actions panel
2. **Loading State**: Shows "Finding Best Location..." while processing
3. **Result Display**: Dedicated panel showing:
   - Best location city
   - Optimal setup date
   - Rain period dates
   - Total expected rainfall
   - Electricity price on setup date

### Data Flow

```
User Click → LocationOptimizer → FMI API → Weather Processing → 
Electricity Data → Algorithm → UI Update → Location Selection
```

## Usage Instructions

### For Users

1. **Open Alternative UI**: Use the UI toggle to switch to the alternative dashboard
2. **Click "Find Best Location"**: Located in the Quick Actions panel on the right
3. **Wait for Analysis**: The system fetches real weather data (may take 5-10 seconds)
4. **View Results**: Optimization results appear in a highlighted panel
5. **Map Updates**: The map automatically focuses on the recommended location

### For Developers

```typescript
import LocationOptimizer from '../services/LocationOptimizer';

const optimizer = new LocationOptimizer();
const result = await optimizer.findBestLocation();
console.log(result);
// {
//   bestSite: "Helsinki",
//   optimalDate: "12.09",
//   rainPeriodStart: Date,
//   rainPeriodEnd: Date,
//   totalRainfall: 15.2,
//   electricityPrice: 11.93
// }
```

## API Integration

### FMI Weather API
- **Endpoint**: `https://opendata.fmi.fi/wfs`
- **Query**: `fmi::forecast::edited::weather::scandinavia::point::timevaluepair`
- **Parameters**: `precipitation1h` for hourly rainfall data
- **Coverage**: 10-day forecast horizon

### Data Processing
- **Hourly → Daily**: Aggregates hourly precipitation to daily totals
- **Timezone**: All calculations in Europe/Helsinki timezone
- **Date Format**: dd.mm format for consistency with electricity pricing data

## Error Handling

- **Network Failures**: Graceful fallback with user notification
- **Missing Data**: Continues with available data, excludes failed cities
- **API Limits**: Respects FMI rate limits and request structure
- **Data Validation**: Validates weather and pricing data integrity

## Performance Considerations

- **Concurrent Requests**: Fetches data for all 5 cities in parallel
- **Caching**: Consider implementing result caching for repeated requests
- **Rate Limiting**: FMI API has usage limits - avoid rapid repeated requests
- **Response Size**: Uses targeted parameters to minimize data transfer

## Future Enhancements

1. **Historical Validation**: Compare predictions with actual demand data
2. **Machine Learning**: Learn from past optimization results
3. **Real-time Updates**: Refresh recommendations as weather forecasts change
4. **Multiple Factors**: Include additional criteria (local events, competition, etc.)
5. **Custom Timeframes**: Allow users to specify different optimization periods

## Dependencies

- **Frontend**: React, TypeScript, Fetch API
- **Backend Utilities**: `pickSiteDateAndRainPeriod.js`, `getDailyRain.js`, `findMinKeskihintaDate.js`
- **Data Files**: `sahkonhinta.json` (electricity pricing data)
- **External APIs**: FMI Open Data API

## Testing

Run the test script to verify functionality:

```bash
npm run test:optimizer
```

Or test manually:
```typescript
import { testLocationOptimizer } from './test-location-optimizer';
await testLocationOptimizer();
```
