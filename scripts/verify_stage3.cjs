const path = require('path');
const dotenv = require(path.join(__dirname, '../backend/node_modules/dotenv'));
const { createClient } = require(path.join(__dirname, '../backend/node_modules/@supabase/supabase-js'));

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_URL = 'http://localhost:5000/api';

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('=== STAGE 3 DIAGNOSTIC: BRAND-NEW REAL ACCOUNT TEST ===\n');

  const testEmail = `stage3_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  console.log(`1. Creating brand-new real user: ${testEmail}`);
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: 'Brand New Student' }
  });

  if (createError) {
    console.error('Failed to create user:', createError);
    process.exit(1);
  }

  const userId = createData.user.id;
  console.log(`User created with ID: ${userId}`);

  try {
    console.log('2. Signing in as brand-new user...');
    const { data: signData, error: signError } = await client.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signError) {
      console.error('Sign-in failed:', signError);
      process.exit(1);
    }

    const token = signData.session.access_token;
    console.log('Successfully obtained real JWT token.');

    console.log('\n3. Inspecting GET /api/student/career-target for brand-new user...');
    const ctRes = await fetch(`${API_URL}/student/career-target`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const ctJson = await ctRes.json();
    console.log('career-target response:', JSON.stringify(ctJson, null, 2));

    console.log('\n4. Inspecting GET /api/student/skills for brand-new user...');
    const skillsRes = await fetch(`${API_URL}/student/skills`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const skillsJson = await skillsRes.json();
    console.log('skills response:', JSON.stringify(skillsJson, null, 2));

    console.log('\n5. Inspecting GET /api/student/readiness for brand-new user...');
    const readinessRes = await fetch(`${API_URL}/student/readiness`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const readinessJson = await readinessRes.json();
    console.log('readiness response:', JSON.stringify(readinessJson, null, 2));

    console.log('\n6. Inspecting GET /api/career-navigator/history for brand-new user...');
    const navHistoryRes = await fetch(`${API_URL}/career-navigator/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const navHistoryJson = await navHistoryRes.json();
    console.log('career-navigator/history response:', JSON.stringify(navHistoryJson, null, 2));

    console.log('\n=== DIAGNOSTIC SUMMARY ===');
    const ctHasTarget = ctJson?.data?.target_career_id != null;
    const skillsLength = skillsJson?.data?.length || 0;
    const navHistoryLength = navHistoryJson?.data?.length || 0;
    console.log(`- Career target pre-filled? ${ctHasTarget ? `YES: ${ctJson.data.target_career_id}` : 'NO (Clean empty state)'}`);
    console.log(`- Skills count: ${skillsLength}`);
    console.log(`- Career Navigator history count: ${navHistoryLength}`);

  } finally {
    console.log(`\nCleaning up user ${userId}...`);
    await admin.auth.admin.deleteUser(userId);
    console.log('User cleaned up.');
  }
}

main().catch(console.error);
