export async function onRequest({ env, request }) {
  const origin = request.headers.get('Origin') ?? ''
  const allowedOrigin =
    origin.includes('localhost') || origin.includes('127.0.0.1')
      ? origin
      : 'https://departmentofeh.org'

  const cors = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Content-Type': 'application/json',
  }

  try {
    const { keys } = await env.R6_STATS.list({ prefix: 'player:' })

    const entries = await Promise.all(
      keys.map(async ({ name }) => {
        const tracker = name.replace('player:', '')
        const raw = await env.R6_STATS.get(name)
        return [tracker, raw ? JSON.parse(raw) : null]
      })
    )

    const result = Object.fromEntries(entries.filter(([, v]) => v !== null))

    return new Response(JSON.stringify(result), {
      headers: { ...cors, 'Cache-Control': 'public, max-age=300' },
    })
  } catch (err) {
    console.error('Stats read failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to load live stats' }), {
      status: 500,
      headers: cors,
    })
  }
}
