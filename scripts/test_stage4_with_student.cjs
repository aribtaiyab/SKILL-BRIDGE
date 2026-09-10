const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const { getSupabaseAdmin } = require(path.join(__dirname, '../backend/dist/config/supabase.js'));
const { CareerNavigatorService } = require(path.join(__dirname, '../backend/dist/services/careerNavigatorService.js'));
const { buildCareerNavigatorUserPrompt } = require(path.join(__dirname, '../backend/dist/services/ai/prompts/careerNavigator.prompt.js'));

async function testWithRealStudent() {
  const sb = getSupabaseAdmin();
  const testEmail = `stage4_student_${Date.now()}@example.com`;

  console.log('1. Creating test student in Supabase...');
  const { data: authData, error: authErr } = await sb.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'Priya Patel', role: 'student' }
  });
  if (authErr) throw authErr;
  const userId = authData.user.id;
  console.log('Created student ID:', userId, 'Name: Priya Patel');

  try {
    // Add verified skill for student
    const { data: skillRow } = await sb.from('skills').select('id').eq('name', 'Node.js').maybeSingle();
    const skillId = skillRow?.id || '20000000-0000-0000-0000-000000000001';

    await sb.from('student_skills').insert({
      student_id: userId,
      skill_id: skillId,
      current_level: 75,
      verified_level: 75,
      verification_status: 'assessment_verified'
    });
    console.log('2. Inserted verified skill: Node.js (75%)');

    console.log('\n3. Testing Career Navigator with "Full Stack or Data Science?"...');
    const res1 = await CareerNavigatorService.analyze({
      query: 'Full Stack or Data Science?',
      userId: userId
    });

    console.log('Query 1 Top Pick:', res1.recommendation.careerName);
    console.log('Query 1 Confidence % (Fit Score):', res1.recommendation.confidence);
    console.log('Query 1 Comparison:', res1.comparison.map(c => `${c.careerName} (fit: ${c.fitScore}%, outlook: ${c.marketOutlook})`));
    console.log('Query 1 Gaps:', res1.gaps);
    console.log('Query 1 Summary:', res1.summary);

    console.log('\n4. Testing Career Navigator with "Should I learn Java or Python?"...');
    const res2 = await CareerNavigatorService.analyze({
      query: 'Should I learn Java or Python?',
      userId: userId
    });

    console.log('Query 2 Top Pick:', res2.recommendation.careerName);
    console.log('Query 2 Confidence % (Fit Score):', res2.recommendation.confidence);
    console.log('Query 2 Comparison:', res2.comparison.map(c => `${c.careerName} (fit: ${c.fitScore}%, outlook: ${c.marketOutlook})`));
    console.log('Query 2 Gaps:', res2.gaps);
    console.log('Query 2 Summary:', res2.summary);

  } finally {
    console.log('\nCleaning up test student...');
    await sb.from('student_skills').delete().eq('student_id', userId);
    await sb.from('career_navigator_decisions').delete().eq('student_id', userId);
    await sb.auth.admin.deleteUser(userId);
    console.log('Cleaned up test student.');
  }
}

testWithRealStudent().catch(console.error);
