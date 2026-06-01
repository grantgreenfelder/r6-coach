// GET /api/operators — serves the operator reference blob (roster, profiles,
// loadouts) built by the Worker. Same data for everyone, cached at the edge.
export async function onRequest({ env, request }) {
  const origin = request.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin':
      origin.includes('localhost') || origin.includes('127.0.0.1')
        ? origin
        : 'https://departmentofeh.org',
    'Content-Type': 'application/json',
  }

  try {
    const raw = await env.R6_STATS.get('reference:operators')
    if (!raw) {
      return new Response(JSON.stringify({ operators: {}, weaponStats: {}, operatorWeapons: {} }), {
        headers: { ...cors, 'Cache-Control': 'public, max-age=300' },
      })
    }
    return new Response(raw, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'failed to load operator reference' }), {
      status: 500, headers: cors,
    })
  }
}
