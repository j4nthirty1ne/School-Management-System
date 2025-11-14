type Invite = {
  userId: string
  role?: string
  createdAt: number
  expiresAt: number
}

const invites = new Map<string, Invite>()

export function createInvite(userId: string, opts?: { role?: string; ttlMinutes?: number }) {
  const token = cryptoRandom()
  const now = Date.now()
  const ttl = (opts?.ttlMinutes ?? 60 * 24) * 60 * 1000 // default 24 hours
  invites.set(token, {
    userId,
    role: opts?.role,
    createdAt: now,
    expiresAt: now + ttl,
  })
  return token
}

export function getInvite(token: string) {
  const invite = invites.get(token)
  if (!invite) return null
  if (Date.now() > invite.expiresAt) {
    invites.delete(token)
    return null
  }
  return invite
}

export function deleteInvite(token: string) {
  invites.delete(token)
}

function cryptoRandom(len = 48) {
  // fallback to Node crypto if available
  try {
    // prefer Node 'crypto' when available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = (() => {
      try { return require('crypto') } catch { return null }
    })()

    if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
      return nodeCrypto.randomBytes(len).toString('hex')
    }

    // Web Crypto
    const webCrypto: any = (globalThis as any)?.crypto
    if (webCrypto && typeof webCrypto.getRandomValues === 'function') {
      const arr = new Uint8Array(len)
      webCrypto.getRandomValues(arr)
      return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('')
    }
  } catch {
    // noop - fallback below
  }

  // fallback weak RNG
  let out = ''
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)]
  return out
}
