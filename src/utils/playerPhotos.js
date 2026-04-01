// Static map of player name (lowercase) → photo path in /public/players/
// Add new entries here as more player photos are added.
const PLAYER_PHOTOS = {
  sarge: '/players/sarge.png',
  smigs: '/players/smigs.png',
}

/**
 * Returns the photo URL for a player, or null if no photo exists.
 * @param {string} name  Player display name (any casing)
 */
export function getPlayerPhotoUrl(name) {
  if (!name) return null
  return PLAYER_PHOTOS[name.toLowerCase()] || null
}
