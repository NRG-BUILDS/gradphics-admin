import { useState, type FormEvent } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useRequest } from "@/hooks/useRequest"
import { apiRequest, uploadAdminImage } from "@/lib/api"

type Institution = {
  id: string
  name: string
  acronym: string
  logoAssetId: string | null
  logoUrl: string | null
  active: boolean
  isDefault: boolean
}

type InstitutionList = { institutions: Institution[] }

function validateLogo(file: File) {
  if (!file.type || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP logo.")
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Logos must be 10 MB or smaller.")
  }
}

export function InstitutionsPage() {
  const institutions = useRequest<InstitutionList>("admin/institutions", {
    institutions: [],
  })
  const [name, setName] = useState("")
  const [acronym, setAcronym] = useState("")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [editingId, setEditingId] = useState("")
  const [editName, setEditName] = useState("")
  const [editAcronym, setEditAcronym] = useState("")
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function createInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setNotice("")
    try {
      let logoAssetId: string | undefined
      if (logoFile) {
        validateLogo(logoFile)
        logoAssetId = await uploadAdminImage(logoFile, "institution_logo")
      }
      await apiRequest("admin/institutions", {
        method: "POST",
        body: JSON.stringify({
          name,
          acronym: acronym.toUpperCase(),
          ...(logoAssetId ? { logoAssetId } : {}),
        }),
      })
      setName("")
      setAcronym("")
      setLogoFile(null)
      setNotice("Institution saved as inactive. Activate it after confirming its logo.")
      await institutions.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Institution could not be saved.")
    } finally {
      setBusy(false)
    }
  }

  function startEditing(institution: Institution) {
    setEditingId(institution.id)
    setEditName(institution.name)
    setEditAcronym(institution.acronym)
    setEditLogoFile(null)
    setError("")
    setNotice("")
  }

  async function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError("")
    setNotice("")
    try {
      const body: Record<string, string> = {
        name: editName,
        acronym: editAcronym.toUpperCase(),
      }
      if (editLogoFile) {
        validateLogo(editLogoFile)
        body.logoAssetId = await uploadAdminImage(editLogoFile, "institution_logo")
      }
      await apiRequest(`admin/institutions/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      })
      setEditingId("")
      setEditLogoFile(null)
      setNotice("Institution details saved. Queued designs will use the updated logo if generation has not started.")
      await institutions.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Institution could not be updated.")
    } finally {
      setBusy(false)
    }
  }

  async function setDefault(institution: Institution) {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(`admin/institutions/${institution.id}/default`, {
        method: "PATCH",
      })
      setNotice(`${institution.acronym} is now the default institution.`)
      await institutions.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Default institution could not be changed.")
    } finally {
      setBusy(false)
    }
  }

  async function setActive(institution: Institution) {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(`admin/institutions/${institution.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ active: !institution.active }),
      })
      setNotice(`${institution.acronym} is now ${institution.active ? "inactive" : "active"}.`)
      await institutions.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Institution status could not be changed.")
    } finally {
      setBusy(false)
    }
  }

  async function archive(institution: Institution) {
    if (!window.confirm(`Archive ${institution.name} (${institution.acronym})? Existing designs will keep their selection.`)) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(`admin/institutions/${institution.id}`, { method: "DELETE" })
      setNotice(`${institution.acronym} was archived.`)
      await institutions.refetch()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Institution could not be archived.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground">School names and logos offered during design creation</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Institutions</h1>
      </header>

      {notice ? <p role="status" className="rounded-xl bg-[#e8eee7] px-4 py-3 text-sm text-[#456b50]">{notice}</p> : null}
      {error || institutions.error ? <p role="alert" className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]">{error || institutions.error}</p> : null}

      <Card className="gap-0 rounded-2xl shadow-none">
        <CardHeader className="px-5 pt-5 pb-4 sm:px-6">
          <CardTitle className="text-base font-semibold">Add an institution</CardTitle>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Save a school first, then activate it. A confirmed logo is required before it can be active or default.
          </p>
        </CardHeader>
        <CardContent className="border-t border-border/60 px-5 pt-5 pb-5 sm:px-6">
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void createInstitution(event)}>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Full institution name
              <Input required value={name} maxLength={160} onChange={(event) => setName(event.target.value)} placeholder="Federal University of Technology, Akure" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium">
              Acronym
              <Input required value={acronym} maxLength={16} onChange={(event) => setAcronym(event.target.value.toUpperCase())} placeholder="FUTA" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-medium sm:col-span-2">
              Logo (optional until activation)
              <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
              <span className="font-normal text-muted-foreground">JPG, PNG, or WebP · up to 10 MB</span>
            </label>
            <div className="sm:col-span-2">
              <Button disabled={busy} type="submit" size="sm">{busy ? "Saving…" : "Save institution"}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3" aria-labelledby="institution-list-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="institution-list-title" className="text-lg font-semibold tracking-[-0.03em]">Institution list</h2>
            <p className="mt-1 text-xs text-muted-foreground">The default appears preselected for customers. Changing it does not alter submitted designs.</p>
          </div>
          <p className="text-xs text-muted-foreground">{institutions.data.institutions.filter((item) => item.active).length} active</p>
        </div>

        {institutions.isLoading ? (
          <p className="rounded-xl border border-border bg-white px-4 py-5 text-sm text-muted-foreground" role="status">Loading institutions…</p>
        ) : institutions.data.institutions.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No institutions yet. Add the first school and set it as the default.</p>
        ) : (
          institutions.data.institutions.map((institution) => (
            <Card className="gap-0 rounded-2xl shadow-none" key={institution.id}>
              {editingId === institution.id ? (
                <CardContent className="px-5 py-5 sm:px-6">
                  <form className="grid gap-4 sm:grid-cols-2" onSubmit={(event) => void saveEdit(event)}>
                    <label className="flex flex-col gap-2 text-xs font-medium">
                      Full institution name
                      <Input required value={editName} maxLength={160} onChange={(event) => setEditName(event.target.value)} />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-medium">
                      Acronym
                      <Input required value={editAcronym} maxLength={16} onChange={(event) => setEditAcronym(event.target.value.toUpperCase())} />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-medium sm:col-span-2">
                      Replace logo
                      <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setEditLogoFile(event.target.files?.[0] ?? null)} />
                    </label>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button disabled={busy} type="submit" size="sm">{busy ? "Saving…" : "Save changes"}</Button>
                      <Button disabled={busy} onClick={() => setEditingId("")} type="button" size="sm" variant="outline">Cancel</Button>
                    </div>
                  </form>
                </CardContent>
              ) : (
                <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-muted/30">
                      {institution.logoUrl ? (
                        <img alt={`${institution.acronym} logo`} className="size-full object-contain p-1.5" src={institution.logoUrl} />
                      ) : <span className="text-xs font-semibold text-muted-foreground">{institution.acronym}</span>}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold">{institution.name}</h3>
                        <Badge variant="outline">{institution.acronym}</Badge>
                        {institution.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                        <Badge variant={institution.active ? "secondary" : "outline"}>{institution.active ? "Active" : "Inactive"}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {institution.logoAssetId ? "Logo uploaded" : "Logo required before activation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!institution.isDefault ? <Button disabled={busy || !institution.logoAssetId} onClick={() => void setDefault(institution)} size="xs" variant="outline">Set as default</Button> : null}
                    <Button disabled={busy} onClick={() => startEditing(institution)} size="xs" variant="outline">Edit</Button>
                    <Button disabled={busy || institution.isDefault} onClick={() => void setActive(institution)} size="xs" variant="outline">{institution.active ? "Deactivate" : "Activate"}</Button>
                    <Button disabled={busy || institution.isDefault} onClick={() => void archive(institution)} size="xs" variant="ghost">Archive</Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </section>
    </div>
  )
}
