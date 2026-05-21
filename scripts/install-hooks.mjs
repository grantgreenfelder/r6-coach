import fs from 'fs'
import path from 'path'

const hooksDir = '.git/hooks'
const src = path.join('scripts', 'pre-push.sh')
const dest = path.join(hooksDir, 'pre-push')

if (!fs.existsSync(hooksDir)) process.exit(0)  // not a git repo (e.g. CI checkout without .git)

fs.copyFileSync(src, dest)
fs.chmodSync(dest, 0o755)
console.log('✅ pre-push hook installed')
