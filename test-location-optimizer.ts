// test-location-optimizer.ts
// Simple test to verify the LocationOptimizer works

import LocationOptimizer from './src/services/LocationOptimizer';

async function testLocationOptimizer() {
  console.log('Testing LocationOptimizer...');
  
  try {
    const optimizer = new LocationOptimizer();
    const result = await optimizer.findBestLocation();
    
    console.log('✅ LocationOptimizer test successful!');
    console.log('Result:', result);
    console.log('Formatted result:');
    console.log(optimizer.formatResult(result));
    
  } catch (error) {
    console.error('❌ LocationOptimizer test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testLocationOptimizer();
}

export { testLocationOptimizer };
