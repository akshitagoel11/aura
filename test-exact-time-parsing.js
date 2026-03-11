// Test exact time parsing
const { parseRelativeDate } = require('./src/utils/dateUtils.ts');

function testExactTimeParsing() {
  console.log('🧪 Testing exact time parsing...');
  
  const testCases = [
    '8pm tomorrow',
    '2:30pm tomorrow', 
    '8:00 pm tomorrow',
    '20:00 tomorrow',
    '9am tomorrow',
    '6:15pm today',
    '11:59pm tomorrow',
    '12am tomorrow',
    '12pm tomorrow'
  ];
  
  testCases.forEach(testCase => {
    const result = parseRelativeDate(testCase);
    console.log(`📅 "${testCase}" -> ${result.toISOString()}`);
    console.log(`   Time: ${result.toLocaleTimeString()}`);
    console.log(`   Date: ${result.toLocaleDateString()}`);
    console.log('');
  });
}

testExactTimeParsing();
