import { clearCredentials, setCredentials, setUser, store } from "@/lib/store"

type ApiErrorBody = {
  error?: {
    message?: string
    code?: string
    fields?: { path: string; message: string }[]
  }
}
const baseUrl = import.meta.env.VITE_API_URL

function apiUrl(path: string) {
  if (!baseUrl)
    throw new Error("Admin API is not configured. Set VITE_API_URL.")
  return new URL(path.replace(/^\//, ""), `${baseUrl.replace(/\/$/, "")}/`)
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json().catch(() => ({}))) as T & ApiErrorBody
  if (!response.ok) {
    const message = body.error?.message ?? `Request failed (${response.status}).`
    const fieldDetails = body.error?.fields
      ?.map((field) => `${field.path}: ${field.message}`)
      .join("; ")
    throw new Error(fieldDetails ? `${message} ${fieldDetails}` : message)
  }
  return body
}

let refreshing: Promise<boolean> | null = null

async function refreshCredentials() {
  const refreshToken =
    store.getState().auth.refreshToken ??
    sessionStorage.getItem("gradgram_admin_refresh")
  if (!refreshToken) return false
  if (!refreshing) {
    refreshing = fetch(apiUrl("auth/refresh"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) return false
        const result = await parseResponse<{
          accessToken: string
          refreshToken: string
        }>(response)
        sessionStorage.setItem("gradgram_admin_refresh", result.refreshToken)
        store.dispatch(setCredentials(result))
        return true
      })
      .catch(() => false)
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const { accessToken } = store.getState().auth
  const headers = new Headers(init.headers)
  headers.set("Accept", "application/json")
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json")
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  let response = await fetch(apiUrl(path), { ...init, headers })
  if (response.status === 401 && retry && path !== "auth/refresh") {
    if (await refreshCredentials()) return apiRequest<T>(path, init, false)
    store.dispatch(clearCredentials())
    sessionStorage.removeItem("gradgram_admin_refresh")
  }
  return parseResponse<T>(response)
}

export async function signOut() {
  try {
    await apiRequest("auth/signout", { method: "POST" }, false)
  } finally {
    store.dispatch(clearCredentials())
    sessionStorage.removeItem("gradgram_admin_refresh")
  }
}

export async function revokeSessionToken(accessToken: string) {
  try {
    await fetch(apiUrl("auth/signout"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
  } catch {
    return
  }
}

export async function uploadAdminImage(
  file: File,
  purpose: "template_preview" | "template_reference" | "institution_logo",
) {
  const signatureResult = await apiRequest<{
    upload: {
      publicId: string
      timestamp: number
      signature: string
      apiKey: string
      uploadUrl: string
      uploadParams: Record<string, string | number | boolean>
    }
  }>("admin/assets/upload-signature", {
    method: "POST",
    body: JSON.stringify({ purpose }),
  })
  const { upload } = signatureResult
  const form = new FormData()
  form.set("file", file)
  form.set("api_key", upload.apiKey)
  form.set("signature", upload.signature)
  for (const [key, value] of Object.entries(upload.uploadParams)) {
    form.set(key, String(value))
  }

  const cloudinaryResponse = await fetch(upload.uploadUrl, {
    method: "POST",
    body: form,
  })
  const cloudinaryResult = (await cloudinaryResponse
    .json()
    .catch(() => ({}))) as { public_id?: string; error?: { message?: string } }
  if (!cloudinaryResponse.ok || cloudinaryResult.public_id !== upload.publicId) {
    throw new Error(
      cloudinaryResult.error?.message ??
        "Image upload could not be confirmed by Cloudinary.",
    )
  }

  const confirmation = await apiRequest<{
    asset: { id: string; purpose: string }
  }>("admin/assets/confirm", {
    method: "POST",
    body: JSON.stringify({ publicId: upload.publicId, purpose }),
  })
  return confirmation.asset.id
}

export async function restoreAdminSession() {
  const refreshToken = sessionStorage.getItem("gradgram_admin_refresh")
  if (!refreshToken) return false
  const refreshed = await refreshCredentials()
  if (!refreshed) {
    sessionStorage.removeItem("gradgram_admin_refresh")
    return false
  }
  try {
    const result = await apiRequest<{
      user: { id: string; name: string; email: string; role: "admin" }
    }>("admin/me")
    store.dispatch(setUser(result.user))
    return true
  } catch {
    store.dispatch(clearCredentials())
    sessionStorage.removeItem("gradgram_admin_refresh")
    return false
  }
}
