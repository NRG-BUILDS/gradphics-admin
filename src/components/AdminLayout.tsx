import { HugeiconsIcon } from "@hugeicons/react"
import {
  DashboardBrowsingIcon,
  Building02Icon,
  Image01Icon,
  Mail01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { NavLink, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/api"
import type { RootState } from "@/lib/store"

const navigation = [
  { to: "/", label: "Overview", icon: DashboardBrowsingIcon, end: true },
  { to: "/users", label: "Users", icon: UserGroupIcon },
  { to: "/support", label: "Support", icon: Mail01Icon },
  { to: "/templates", label: "Templates", icon: Image01Icon },
  { to: "/institutions", label: "Institutions", icon: Building02Icon },
]

function BrandMark() {
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="rounded-lg bg-white px-2">
        <img alt="Gradphics" className="block w-[132px]" src="/gradphics-logo.png" />
      </div>
      <p className="pl-1 text-[10px] tracking-[0.12em] text-white/45">ADMIN WORKSPACE</p>
    </div>
  )
}

function NavigationLinks({ compact = false }: { compact?: boolean }) {
  return navigation.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "group flex items-center gap-3 rounded-xl text-sm transition-colors",
          compact ? "shrink-0 px-3 py-2" : "px-3 py-3",
          isActive
            ? "bg-white/12 font-medium text-white"
            : "text-white/60 hover:bg-white/6 hover:text-white",
        )
      }
    >
      {() => (
        <>
          <HugeiconsIcon
            icon={item.icon}
            strokeWidth={1.8}
            className="size-[18px] shrink-0"
          />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  ))
}

export function AdminLayout() {
  const user = useSelector((state: RootState) => state.auth.user)
  return (
    <div className="min-h-svh bg-background">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-[#274d45] px-5 py-6 lg:flex">
        <BrandMark />
        <div className="mt-12 px-3 text-[10px] font-medium tracking-[0.16em] text-white/35">
          WORKSPACE
        </div>
        <nav aria-label="Main navigation" className="mt-3 flex flex-col gap-1">
          <NavigationLinks />
        </nav>
        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
            <span className="size-2 rounded-full bg-[#a7ba93]" /> Admin session
            active
          </div>
          <p className="text-xs leading-relaxed text-white/40">
            Gradphics admin · v0.1.0
          </p>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-border/80 bg-background/95 px-5 backdrop-blur-sm sm:px-8">
          <div className="flex h-[72px] items-center justify-between gap-4">
            <div className="hidden w-full max-w-md sm:block">
              <label className="sr-only" htmlFor="global-search">
                Search workspace
              </label>
              <div className="relative">
                <HugeiconsIcon
                  icon={Search01Icon}
                  strokeWidth={1.8}
                  className="pointer-events-none absolute top-1/2 left-3.5 size-[17px] -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="global-search"
                  placeholder="Search anything..."
                  className="h-10 rounded-xl border-transparent bg-[#efede9] pl-10 focus-visible:bg-white"
                />
                <kbd className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md border border-border bg-white px-1.5 py-0.5 text-[10px] text-muted-foreground">
                  ⌘ K
                </kbd>
              </div>
            </div>
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <BrandMarkMobile />
              <div className="flex items-center gap-3">
                <div className="hidden h-8 w-px bg-border sm:block" />
                <button
                  onClick={() => void signOut()}
                  className="flex items-center gap-2.5 rounded-xl px-1 py-1 text-left hover:bg-white"
                  aria-label="Sign out"
                >
                  <Avatar className="size-9">
                    <AvatarFallback className="bg-[#e9ded2] text-xs font-semibold text-[#274d45]">
                      {user?.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("") ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-left sm:block">
                    <span className="block text-xs font-semibold">
                      {user?.name ?? "Administrator"}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">
                      Administrator
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
          <nav
            aria-label="Mobile navigation"
            className="flex gap-1 overflow-x-auto pb-3 lg:hidden"
          >
            <NavigationLinks compact />
          </nav>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 sm:px-8 sm:py-9">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function BrandMarkMobile() {
  return (
    <div className="flex items-center lg:hidden">
      <img alt="Gradphics" className="block w-[112px]" src="/gradphics-logo.png" />
    </div>
  )
}
