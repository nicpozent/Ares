import { PublicClientApplication, type Configuration, type AccountInfo } from '@azure/msal-browser'

const clientId = import.meta.env.VITE_ENTRA_CLIENT_ID
const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID
export const apiScope = import.meta.env.VITE_API_SCOPE
export const demoAuth = String(import.meta.env.VITE_ALLOW_DEMO_AUTH).toLowerCase() === 'true'

// Entra is "wired" only when a real client id/tenant were provided at build time.
export const entraConfigured = Boolean(clientId && tenantId && clientId !== '00000000-0000-0000-0000-000000000000')

const config: Configuration = {
  auth: {
    clientId: clientId || 'unconfigured',
    authority: `https://login.microsoftonline.com/${tenantId || 'common'}`,
    redirectUri: window.location.origin,
  },
  cache: { cacheLocation: 'sessionStorage' },
}

export const msal = new PublicClientApplication(config)

let initialized = false
export async function ensureMsal() {
  if (!initialized) { await msal.initialize(); initialized = true }
}

export function activeAccount(): AccountInfo | null {
  return msal.getActiveAccount() ?? msal.getAllAccounts()[0] ?? null
}

/** Acquire an access token for the ARES API, or null when running demo/unconfigured. */
export async function getApiToken(): Promise<string | null> {
  if (!entraConfigured) return null
  await ensureMsal()
  const account = activeAccount()
  if (!account) return null
  try {
    const res = await msal.acquireTokenSilent({ scopes: [apiScope], account })
    return res.accessToken
  } catch {
    const res = await msal.acquireTokenPopup({ scopes: [apiScope] })
    return res.accessToken
  }
}

export async function signIn() {
  await ensureMsal()
  const res = await msal.loginPopup({ scopes: [apiScope] })
  msal.setActiveAccount(res.account)
}

export async function signOut() {
  await ensureMsal()
  await msal.logoutPopup()
}
