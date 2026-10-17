/**
 * Automated Frontend-to-Backend End-to-End Test Suite.
 * Validates HTTP connectivity, data contract schemas, and view models.
 */

async function runTests() {
  console.log('🧪 Starting SkillSync AI Frontend & API Verification Suite...\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Verify Frontend Vite Server
  console.log('--- 1. Testing Frontend Dev Server (http://127.0.0.1:5173/) ---');
  try {
    const feRes = await fetch('http://127.0.0.1:5173/');
    assert(feRes.status === 200, 'Frontend server returned HTTP 200 OK');
    const html = await feRes.text();
    assert(html.includes('<title>SkillSync AI'), 'Frontend index.html contains SkillSync AI title');
    assert(html.includes('/src/main.tsx'), 'Frontend index.html includes main.tsx entrypoint');
  } catch (err) {
    assert(false, `Frontend server connection failed: ${err.message}`);
  }

  // 2. Verify Backend Health
  console.log('\n--- 2. Testing FastAPI Backend Health (http://127.0.0.1:8000/api/health) ---');
  try {
    const healthRes = await fetch('http://127.0.0.1:8000/api/health');
    assert(healthRes.status === 200, 'Backend health returned HTTP 200 OK');
    const healthData = await healthRes.json();
    assert(healthData.status === 'ok', `Backend reports status: "${healthData.status}"`);
  } catch (err) {
    assert(false, `Backend connection failed: ${err.message}`);
  }

  // 3. Verify Demo Bundle (Projects & Candidates)
  console.log('\n--- 3. Testing Demo Dataset Loading ---');
  let projects = [];
  try {
    const demoRes = await fetch('http://127.0.0.1:8000/api/demo');
    assert(demoRes.status === 200, 'Demo endpoint returned HTTP 200 OK');
    const demoData = await demoRes.json();
    projects = demoData.projects;
    assert(projects.length >= 3, `Loaded ${projects.length} staffing projects (>= 3 required)`);
    assert(demoData.employees.length >= 5, `Loaded ${demoData.employees.length} candidates (>= 5 required)`);
  } catch (err) {
    assert(false, `Demo loading failed: ${err.message}`);
  }

  // 4. Test View 1: Candidate Rankings for All Projects
  console.log('\n--- 4. Testing View 1: Candidate Rankings ---');
  for (const proj of projects) {
    try {
      const matchRes = await fetch(`http://127.0.0.1:8000/api/projects/${proj.id}/matches`);
      assert(matchRes.status === 200, `Matches for project ${proj.id} returned HTTP 200`);
      const matches = await matchRes.json();
      assert(matches.length > 0, `Received ${matches.length} ranked candidates for ${proj.id}`);

      const top = matches[0];
      assert(top.overall_score >= 0 && top.overall_score <= 100, `Top candidate score valid: ${top.overall_score}%`);
      assert(top.component_scores !== undefined, `Component scores present for ${top.employee_name || top.employee_id}`);
      assert(Array.isArray(top.reasons), `Evidence reasons array present (${top.reasons.length} rationales)`);
    } catch (err) {
      assert(false, `Candidate rankings failed for ${proj.id}: ${err.message}`);
    }
  }

  // 5. Test View 2: Team Builder Optimization
  console.log('\n--- 5. Testing View 2: Combinatorial Team Optimizer ---');
  for (const proj of projects) {
    try {
      const teamRes = await fetch(`http://127.0.0.1:8000/api/projects/${proj.id}/recommend-team`, {
        method: 'POST',
      });
      assert(teamRes.status === 200, `Team optimizer for ${proj.id} returned HTTP 200`);
      const team = await teamRes.json();
      assert(team.members.length === proj.team_size, `Optimized team size matches target: ${team.members.length}/${proj.team_size}`);
      assert(team.weighted_coverage_pct >= 80, `Weighted skill coverage is high: ${team.weighted_coverage_pct}%`);
      assert(team.is_feasible === true, `Team meets hard constraints (feasible: true)`);
    } catch (err) {
      assert(false, `Team optimizer failed for ${proj.id}: ${err.message}`);
    }
  }

  // 6. Test View 3: Baseline vs Optimizer Comparison
  console.log('\n--- 6. Testing View 3: Baseline vs Optimizer Benchmark ---');
  try {
    const compRes = await fetch(`http://127.0.0.1:8000/api/projects/PRJ-101/compare`, {
      method: 'POST',
    });
    assert(compRes.status === 200, 'Baseline comparison returned HTTP 200');
    const comp = await compRes.json();
    assert(comp.baseline !== undefined, 'Baseline configuration present');
    assert(comp.optimized !== undefined, 'Optimized configuration present');
    assert(comp.deltas !== undefined, 'Comparative deltas computed');
    assert(comp.evaluation_notes.length > 0, `Evaluation notes provided: ${comp.evaluation_notes.length} notes`);
  } catch (err) {
    assert(false, `Baseline comparison failed: ${err.message}`);
  }

  // 7. Test View 4: What-If Swap Simulator
  console.log('\n--- 7. Testing View 4: What-If Swap Simulator ---');
  try {
    const swapPayload = {
      project_id: 'PRJ-101',
      current_team_ids: ['EMP-001', 'EMP-005', 'EMP-006'],
      remove_employee_id: 'EMP-005',
      add_employee_id: 'EMP-004',
    };
    const swapRes = await fetch('http://127.0.0.1:8000/api/simulate/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(swapPayload),
    });
    assert(swapRes.status === 200, 'Swap simulator returned HTTP 200');
    const swapResult = await swapRes.json();
    assert(swapResult.valid === true, 'Swap result is marked valid');
    assert(swapResult.before !== undefined, 'Before team state returned');
    assert(swapResult.after !== undefined, 'After team state returned');
    assert(swapResult.impact_summary.length > 0, `Impact summary generated: "${swapResult.impact_summary[0]}"`);
  } catch (err) {
    assert(false, `Swap simulation failed: ${err.message}`);
  }

  // Summary
  console.log('\n======================================================');
  console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
