const sharp = require('../node_modules/sharp')
const fs = require('fs')
const path = require('path')

const logoPath = path.join(process.cwd(), 'public', 'attireburg-logo.png')
const outputPath = path.join(process.cwd(), 'src', 'lib', 'email', 'logoBase64.ts')

sharp(logoPath)
  .png({ compressionLevel: 6, progressive: false })
  .toBuffer()
  .then(buf => {
    const b64 = buf.toString('base64')
    const content = `// Auto-generated — run scripts/generate-logo-base64.js to refresh\nexport const logoBase64 = 'data:image/png;base64,${b64}';\n`
    fs.writeFileSync(outputPath, content)
    console.log(`Done. Written ${buf.length} bytes to ${outputPath}`)
  })
  .catch(e => {
    console.error('Failed:', e.message)
    process.exit(1)
  })
