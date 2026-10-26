import { useEffect, useState } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import { useSelector } from "react-redux"
import { AdminLayout } from "@/components/AdminLayout"
import { DashboardPage } from "@/pages/DashboardPage"
import { SupportPage } from "@/pages/SupportPage"
import { TemplatesPage } from "@/pages/TemplatesPage"
import { InstitutionsPage } from "@/pages/InstitutionsPage"
import { UsersPage } from "@/pages/UsersPage"
import { SignInPage } from "@/pages/SignInPage"
import { restoreAdminSession } from "@/lib/api"
import type { RootState } from "@/lib/store"

export default function App() {
  const user = useSelector((state: RootState) => state.auth.user)
  const [restored, setRestored] = useState(false)

  useEffect(() => {
    void restoreAdminSession().finally(() => setRestored(true))
  }, [])

  if (!restored)
    return (
      <main className="grid min-h-svh place-items-center text-sm text-muted-foreground">
        Checking administrator session…
      </main>
    )
  if (!user) return <SignInPage />

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="support" element={<SupportPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="institutions" element={<InstitutionsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
