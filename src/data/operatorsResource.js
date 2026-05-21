import operatorsUrl from './operators.json?url'
export const operatorsPromise = fetch(operatorsUrl).then(r => r.json())
