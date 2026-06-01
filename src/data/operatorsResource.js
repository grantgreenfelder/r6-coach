import operatorsUrl from './operators.json?url'

const kbPromise = fetch(operatorsUrl).then(r => r.json())

// Live reference fetch with an 8s timeout — degrades to the KB-only catalog if
// the API is slow or down rather than blocking the operators pages.
function fetchLive(url, ms = 8000) {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  return fetch(url, { signal: ctrl.signal })
    .then(r => (r.ok ? r.json() : null))
    .catch(() => null)
    .finally(() => clearTimeout(t))
}

const refPromise = fetchLive('/api/operators')

const normName   = s => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ø/g, 'o').replace(/ð/g, 'd').replace(/[^a-z0-9]/g, '')
const normWeapon = s => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

function speedArmorStr(live) {
  if (live.speed == null || live.health == null) return null
  return `${live.speed} Speed / ${live.health} Armor`
}

// Attach live damage/firerate/ammo to a loadout row, matched by weapon name
function enrichRows(rows, statsByKey) {
  if (!Array.isArray(rows)) return rows
  return rows.map(r => {
    const st = statsByKey[normWeapon(r.weapon)]
    return st ? { ...r, damage: st.damage, firerate: st.firerate, ammo: st.ammo } : r
  })
}

// Build a full operator record for an op present in live data but absent from the KB
function synthNewOp(live, opWeapons, statsByKey) {
  const build = rows => (rows || []).map(w => {
    const st = statsByKey[normWeapon(w.weapon)]
    return { weapon: w.weapon, type: w.type, ...(st ? { damage: st.damage, firerate: st.firerate, ammo: st.ammo } : {}) }
  })
  return {
    name: live.name,
    side: live.side,
    category: 'New Operators',
    imageUrl: live.iconUrl,
    profile: {
      realName:   live.realName,
      ctu:        live.unit,
      speedArmor: speedArmorStr(live),
      role:       (live.roles || []).join(', '),
      seasonAdded: live.seasonIntroduced,
    },
    gadget:     { name: '', description: '', mechanics: [], tips: [] },
    loadout:    { primaries: build(opWeapons?.primaries), secondaries: build(opWeapons?.secondaries), secondaryGadgets: [] },
    strengths:  [],
    weaknesses: [],
    playstyle:  '',
    stats:      {},
    _isNew:     true,
  }
}

export const operatorsPromise = Promise.all([kbPromise, refPromise]).then(([kb, ref]) => {
  if (!ref || !ref.operators) return kb

  // weaponStats keyed by normalized weapon name for loadout enrichment
  const statsByKey = {}
  for (const [name, st] of Object.entries(ref.weaponStats || {})) statsByKey[normWeapon(name)] = st

  const kbKeys = new Set()
  const enrich = op => {
    const key = normName(op.name)
    kbKeys.add(key)
    const live = ref.operators[key]

    const loadout = op.loadout ? {
      ...op.loadout,
      primaries:   enrichRows(op.loadout.primaries, statsByKey),
      secondaries: enrichRows(op.loadout.secondaries, statsByKey),
    } : op.loadout

    // Keep curated KB profile prose; only fill gaps from live
    const profile = live ? {
      realName:   op.profile?.realName   || live.realName,
      ctu:        op.profile?.ctu        || live.unit,
      speedArmor: op.profile?.speedArmor || speedArmorStr(live),
      role:       op.profile?.role       || (live.roles || []).join(', '),
      seasonAdded: op.profile?.seasonAdded || live.seasonIntroduced,
    } : op.profile

    return { ...op, loadout, profile }
  }

  const atk = kb.atk.map(enrich)
  const def = kb.def.map(enrich)

  // Operators in live data but not in the KB (newly released). Skip ops with no
  // loadout data — filters out Recruit and any data glitches that would render
  // as an empty tile.
  const newOps = Object.entries(ref.operators)
    .filter(([k]) => !kbKeys.has(k))
    .filter(([k]) => {
      const w = ref.operatorWeapons?.[k]
      return w && ((w.primaries?.length || 0) + (w.secondaries?.length || 0)) > 0
    })
    .map(([k, live]) => synthNewOp(live, ref.operatorWeapons?.[k], statsByKey))

  const newAtk = newOps.filter(o => o.side === 'ATK')
  const newDef = newOps.filter(o => o.side === 'DEF')

  // Append any new categories so the grouped grid renders them
  const atkCategories = [...kb.atkCategories]
  const defCategories = [...kb.defCategories]
  newAtk.forEach(o => { if (!atkCategories.includes(o.category)) atkCategories.push(o.category) })
  newDef.forEach(o => { if (!defCategories.includes(o.category)) defCategories.push(o.category) })

  return {
    ...kb,
    atk: [...atk, ...newAtk],
    def: [...def, ...newDef],
    atkCategories,
    defCategories,
  }
})
