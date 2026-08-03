/**
 * Shared Garment Pool Utility Functions
 */

const KEY_ALIASES: Record<string, string> = {
  // fit
  fit: 'fit',
  fits: 'fit',
  passform: 'fit',
  Passform: 'fit',
  // size
  size: 'size',
  sizes: 'size',
  größe: 'size',
  Größe: 'size',
  groesse: 'size',
  // color
  color: 'color',
  colors: 'color',
  farbe: 'color',
  Farbe: 'color',
  colour: 'color',
}

/**
 * Normalise key names to standard canonical key aliases
 */
export function normaliseKey(key: string): string {
  const trimmed = key.trim()
  return KEY_ALIASES[trimmed] || KEY_ALIASES[trimmed.toLowerCase()] || trimmed.toLowerCase()
}

/**
 * Compute sorted, normalised canonical key for pool matching & deduplication
 */
export function computeCanonicalKey(garmentType: string, attributes: Record<string, string>): string {
  const normalised: Record<string, string> = {}
  if (attributes && typeof attributes === 'object') {
    for (const [k, v] of Object.entries(attributes)) {
      if (v !== undefined && v !== null && String(v).trim() !== '') {
        const canonicalK = normaliseKey(k)
        normalised[canonicalK] = String(v).trim().toLowerCase()
      }
    }
  }
  const sorted = Object.fromEntries(
    Object.entries(normalised).sort(([a], [b]) => a.localeCompare(b))
  )
  return `${garmentType.trim().toLowerCase()}::${JSON.stringify(sorted)}`
}
