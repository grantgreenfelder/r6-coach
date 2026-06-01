// GET /api/season?tracker=Eh_Grant&season=Y10S4
export async function onRequest({ env, request }) {
  const origin = request.headers.get('Origin') ?? ''
  const cors = {
    'Access-Control-Allow-Origin':
      origin.includes('localhost') || origin.includes('127.0.0.1')
        ? origin
        : 'https://departmentofeh.org',
    'Content-Type': 'application/json',
  }

  const { searchParams } = new URL(request.url)
  const tracker = searchParams.get('tracker')
  const season  = searchParams.get('season')

  if (!tracker || !season) {
    return new Response(JSON.stringify({ error: 'tracker and season required' }), {
      status: 400, headers: cors,
    })
  }

  try {
    const raw = await env.R6_STATS.get(`season:${tracker}:${season}`)
    if (!raw) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        status: 404, headers: cors,
      })
    }
    return new Response(raw, {
      headers: { ...cors, 'Cache-Control': 'public, max-age=86400' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'failed to load season' }), {
      status: 500, headers: cors,
    })
  }
}
