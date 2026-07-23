const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');

// Credentials
const tokyoUrl = 'https://qcvwzcosllwsvgubbmwh.supabase.co';
const tokyoAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjdnd6Y29zbGx3c3ZndWJibXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzEyODUsImV4cCI6MjA5MjI0NzI4NX0.oSpzAU_0wMZApeL7vJnQLsJQGRiR7zM-V2uuaPYW6gg';
const tokyoDbUrl = 'postgresql://postgres.qcvwzcosllwsvgubbmwh:cocArief2510%40@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres';

const sgUrl = 'https://rwwrdxaggybieemgzszu.supabase.co';
const sgAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d3JkeGFnZ3liaWVlbWd6c3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4MDAzMDksImV4cCI6MjEwMDM3NjMwOX0.TEDv3-O9Wc-Zr_MMw-rmMrWn1OynmeqXTdVu9kQNOZg';

async function measureHttpLatency(url, headers, iterations = 5) {
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    try {
      await fetch(url, { headers });
      const end = performance.now();
      times.push(end - start);
    } catch (e) {
      // ignore
    }
  }
  if (times.length === 0) return 0;
  const sum = times.reduce((a, b) => a + b, 0);
  return (sum / times.length).toFixed(2);
}

async function measurePgLatency(connectionString, iterations = 5) {
  const client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await client.query('SELECT 1;');
      const end = performance.now();
      times.push(end - start);
    }
    await client.end();
    const sum = times.reduce((a, b) => a + b, 0);
    return (sum / times.length).toFixed(2);
  } catch (err) {
    return null;
  }
}

async function runBenchmark() {
  console.log('============ ⚡ ARISA DATABASE & SUPABASE SPEED BENCHMARK ⚡ ============');
  console.log('Comparing Tokyo (ap-northeast-1) vs Singapore (ap-southeast-1)...');
  console.log('------------------------------------------------------------------------\n');

  // 1. Auth API Health Ping Latency
  console.log('🔍 1. Measuring Auth API Latency (5 requests average)...');
  const tokyoAuthLatency = await measureHttpLatency(`${tokyoUrl}/auth/v1/health`, { apikey: tokyoAnonKey });
  const sgAuthLatency = await measureHttpLatency(`${sgUrl}/auth/v1/health`, { apikey: sgAnonKey });

  console.log(`   - Tokyo Auth API     : ${tokyoAuthLatency} ms`);
  console.log(`   - Singapore Auth API : ${sgAuthLatency} ms`);

  // 2. Direct PostgreSQL Ping Latency (if DB connected)
  console.log('\n🔍 2. Measuring Direct PostgreSQL Query Latency (SELECT 1)...');
  const tokyoPgLatency = await measurePgLatency(tokyoDbUrl);
  console.log(`   - Tokyo DB Query     : ${tokyoPgLatency ? tokyoPgLatency + ' ms' : 'Connection failed'}`);

  // Summary & Speedup Calculation
  console.log('\n========================= 📊 BENCHMARK SUMMARY 📊 =========================');
  if (tokyoAuthLatency > 0 && sgAuthLatency > 0) {
    const diff = (tokyoAuthLatency - sgAuthLatency).toFixed(2);
    const speedup = (tokyoAuthLatency / sgAuthLatency).toFixed(2);
    const percentReduction = (((tokyoAuthLatency - sgAuthLatency) / tokyoAuthLatency) * 100).toFixed(1);

    console.log(`🚀 Latency Reduction  : ${diff} ms faster (${percentReduction}% decrease in latency)`);
    console.log(`⚡ Speed Improvement : ~${speedup}x faster response time from Indonesia!`);
  }
  console.log('========================================================================\n');
}

runBenchmark().catch(err => console.error('Benchmark Error:', err));
