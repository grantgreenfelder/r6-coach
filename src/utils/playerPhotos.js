// Static map of player name (lowercase) → photo path in /public/players/
// Add new entries here as more player photos are added.
const PLAYER_PHOTOS = {
  grant: '/players/grant.jpg',
  sarge: '/players/sarge.jpg',
  hound: '/players/hound.jpg',
  smigs: '/players/smigs.jpg',
  peej: '/players/peej.jpg',
  slug: '/players/slug.jpg',
}

/**
 * Returns the photo URL for a player, or null if no photo exists.
 * @param {string} name  Player display name (any casing)
 */
export function getPlayerPhotoUrl(name) {
  if (!name) return null
  return PLAYER_PHOTOS[name.toLowerCase()] || null
}
