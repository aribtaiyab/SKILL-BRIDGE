const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { CareerNavigatorService } = require(path.join(__dirname, '../backend/dist/services/careerNavigatorService.js'));

async function test() {
  console.log('--- Testing Query 1: "Full Stack or Data Science?" ---');
  const res1 = await CareerNavigatorService.analyze({
    query: 'Full Stack or Data Science?',
    userId: '00000000-0000-0000-0000-000000000001'
  });
  console.log('Query 1 Top Pick:', res1.recommendation.careerName);
  console.log('Query 1 Confidence:', res1.recommendation.confidence);
  console.log('Query 1 Comparison Slugs:', res1.comparison.map(c => c.careerSlug));
  console.log('Query 1 Gaps:', res1.gaps.map(g => `${g.careerName}: ${g.skills.join(', ')}`));
  console.log('Query 1 Headline:', res1.headline);
  console.log('Query 1 Summary:', res1.summary);

  console.log('\n--- Testing Query 2: "Should I learn Java or Python?" ---');
  const res2 = await CareerNavigatorService.analyze({
    query: 'Should I learn Java or Python?',
    userId: '00000000-0000-0000-0000-000000000001'
  });
  console.log('Query 2 Top Pick:', res2.recommendation.careerName);
  console.log('Query 2 Confidence:', res2.recommendation.confidence);
  console.log('Query 2 Comparison Slugs:', res2.comparison.map(c => c.careerSlug));
  console.log('Query 2 Gaps:', res2.gaps.map(g => `${g.careerName}: ${g.skills.join(', ')}`));
  console.log('Query 2 Headline:', res2.headline);
  console.log('Query 2 Summary:', res2.summary);
}

test().catch(console.error);
