import playersUrl from './players.json?url'
export const playersPromise = fetch(playersUrl).then(r => r.json())
