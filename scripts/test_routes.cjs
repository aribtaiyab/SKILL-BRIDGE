async function testRouting() {
  console.log('=== PHASE 2 ROUTE PROBE ===');
  const routes = ['/student', '/academia', '/industry', '/dashboard/academia', '/dashboard/student', '/dashboard/industry'];
  
  for (const r of routes) {
    try {
      const res = await fetch(`http://localhost:3000${r}`);
      console.log(`  Route ${r}: Status ${res.status}`);
    } catch (err) {
      console.error(`  Route ${r} Error:`, err.message);
    }
  }
  console.log('=== PHASE 2 ROUTE PROBE COMPLETED ===');
}

testRouting();
