import mapsUrl from './maps.json?url'
export const mapsPromise = fetch(mapsUrl).then(r => r.json())
