import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUpRight01Icon,
  ChartLineData01Icon,
  Image01Icon,
  Mail01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons"
import { Link } from "react-router-dom"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRequest } from "@/hooks/useRequest"

type Summary = {
  generatedAt: string
  window: { from: string; to: string }
  metrics: {
    totalUsers: number
    newUsers30d: number
    totalDesigns: number
    newDesigns30d: number
    designsInProgress: number
    netRevenueMinor: number
    successfulPayments: number
    refundedRevenueMinor: number
    refundedPayments: number
    openSupportTickets: number
  }
  revenueByMonth: {
    year: number
    month: number
    amountMinor: number
    payments: number
  }[]
  recentActivity: {
    id: string
    type: string
    subjectType: string
    subjectId: string | null
    occurredAt: string
    metadata: Record<string, unknown>
  }[]
}
type AdminUserRow = {
  id: string
  name: string
  email: string
  institution: string | null
  status: "active" | "suspended"
  joinedAt: string
  designCount: number
}
type UserList = { users: AdminUserRow[]; total: number }

const emptySummary: Summary = {
  generatedAt: "",
  window: { from: "", to: "" },
  metrics: {
    totalUsers: 0,
    newUsers30d: 0,
    totalDesigns: 0,
    newDesigns30d: 0,
    designsInProgress: 0,
    netRevenueMinor: 0,
    successfulPayments: 0,
    refundedRevenueMinor: 0,
    refundedPayments: 0,
    openSupportTickets: 0,
  },
  revenueByMonth: [],
  recentActivity: [],
}
const money = (amountMinor: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amountMinor / 100)
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(value),
  )
const eventLabel: Record<string, string> = {
  "support.ticket.resolved": "Support ticket resolved",
  "support.ticket.reopened": "Support ticket reopened",
  "support.reply.sent": "Support reply emailed",
  "support.reply.email_retried": "Support email retried",
  "template.created": "Template created",
  "template.version.published": "Template version published",
  "template.published": "Template published",
  "template.hidden": "Template hidden",
  "template.archived": "Template archived",
  "user.suspended": "Customer suspended",
  "user.reactivated": "Customer reactivated",
  "payment.refund.processed": "Payment refund processed",
  "payment.refund.failed": "Payment refund needs attention",
}

export function DashboardPage() {
  const summary = useRequest<Summary>("admin/dashboard/summary", emptySummary)
  const userList = useRequest<UserList>("admin/users?limit=4", {
    users: [],
    total: 0,
  })
  const metrics = summary.data.metrics
  const bars = summary.data.revenueByMonth
  const maxAmount = Math.max(1, ...bars.map((bar) => bar.amountMinor))
  const currentDate = new Date()
  const greeting =
    currentDate.getHours() < 12
      ? "Good morning"
      : currentDate.getHours() < 18
        ? "Good afternoon"
        : "Good evening"
  const metricCards = [
    {
      title: "Total users",
      value: metrics.totalUsers.toLocaleString(),
      note: `${metrics.newUsers30d.toLocaleString()} new in 30 days`,
      icon: UserGroupIcon,
      tint: "bg-[#e8eee7] text-[#50725c]",
    },
    {
      title: "Net revenue",
      value: money(metrics.netRevenueMinor),
      note: `${metrics.successfulPayments.toLocaleString()} paid transactions`,
      icon: ChartLineData01Icon,
      tint: "bg-[#f3e7dc] text-[#a66642]",
    },
    {
      title: "Designs created",
      value: metrics.totalDesigns.toLocaleString(),
      note: `${metrics.designsInProgress.toLocaleString()} in progress`,
      icon: Image01Icon,
      tint: "bg-[#e8e7f0] text-[#6d6988]",
    },
    {
      title: "Open support",
      value: metrics.openSupportTickets.toLocaleString(),
      note: "Open and replied tickets",
      icon: Mail01Icon,
      tint: "bg-[#f5e5e2] text-[#bb6356]",
    },
  ]

  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            {currentDate.toLocaleDateString("en-NG", { dateStyle: "full" })}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-[34px]">
            {greeting}, {"Gradphics"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Live overview from verified payments, customer accounts, designs,
            and support.
          </p>
        </div>
        <Button
          render={<Link to="/templates" />}
          nativeButton={false}
          className="h-10 gap-2 rounded-xl px-4 text-sm"
        >
          <HugeiconsIcon
            icon={Image01Icon}
            strokeWidth={1.8}
            data-icon="inline-start"
          />
          Manage templates
        </Button>
      </section>
      {summary.error || userList.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]"
        >
          {summary.error ?? userList.error}
        </p>
      ) : null}
      <section
        aria-label="Key metrics"
        className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4"
      >
        {metricCards.map((metric) => (
          <Card
            key={metric.title}
            className="gap-4 rounded-2xl border-0 p-5 shadow-none ring-1 ring-border/80"
          >
            <CardHeader className="flex-row items-center justify-between gap-3 p-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <span
                className={`grid size-9 place-items-center rounded-xl ${metric.tint}`}
              >
                <HugeiconsIcon
                  icon={metric.icon}
                  strokeWidth={1.7}
                  className="size-[18px]"
                />
              </span>
            </CardHeader>
            <CardContent className="flex items-end justify-between gap-2 p-0">
              <p className="text-[26px] leading-none font-semibold tracking-[-0.05em]">
                {summary.isLoading ? "—" : metric.value}
              </p>
              <p className="text-right text-[10px] text-muted-foreground">
                {metric.note}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.85fr)]">
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          <CardHeader className="px-5 pt-5 pb-1 sm:px-6">
            <CardTitle className="text-base font-semibold">
              Revenue overview
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Net successful payments over the last 12 months · refunded amount
              excluded
            </p>
          </CardHeader>
          <CardContent className="px-5 pt-5 pb-5 sm:px-6">
            <p className="mb-5 text-2xl font-semibold tracking-[-0.04em]">
              {money(metrics.netRevenueMinor)}
            </p>
            <svg
              role="img"
              aria-label="Monthly net revenue over the last twelve months"
              viewBox="0 0 480 140"
              className="h-44 w-full border-b border-border/70 pb-1"
            >
              {bars.map((item, index) => {
                const height = Math.max(2, (item.amountMinor / maxAmount) * 108)
                return (
                  <rect
                    key={`${item.year}-${item.month}`}
                    x={index * 39 + 3}
                    y={120 - height}
                    width="25"
                    height={height}
                    rx="5"
                    className={
                      index === bars.length - 1
                        ? "fill-[#274d45]"
                        : "fill-[#d7dfd7] hover:fill-[#9caf9e]"
                    }
                  />
                )
              })}
            </svg>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              {bars
                .filter(
                  (_, index) => index % 2 === 0 || index === bars.length - 1,
                )
                .map((bar) => (
                  <span key={`${bar.year}-${bar.month}`}>
                    {new Date(bar.year, bar.month - 1, 1).toLocaleDateString(
                      "en-NG",
                      { month: "short", year: "2-digit" },
                    )}
                  </span>
                ))}
            </div>
            <p className="mt-4 text-[10px] text-muted-foreground">
              {metrics.refundedPayments} refunded payment(s) ·{" "}
              {money(metrics.refundedRevenueMinor)} returned
            </p>
          </CardContent>
        </Card>
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          <CardHeader className="px-5 pt-5 pb-3 sm:px-6">
            <CardTitle className="text-base font-semibold">
              Recent activity
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Recorded admin and support actions
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-0 px-5 pb-3 sm:px-6">
            {summary.data.recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0"
              >
                <Avatar className="size-9">
                  <AvatarFallback className="bg-[#e8eee7] text-[10px] font-semibold text-[#50725c]">
                    {activity.subjectType.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">
                    {eventLabel[activity.type] ?? activity.type}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {activity.subjectType} · {activity.subjectId ?? "System"}
                  </p>
                </div>
                <time className="shrink-0 text-[10px] text-muted-foreground">
                  {dateLabel(activity.occurredAt)}
                </time>
              </div>
            ))}
            {!summary.isLoading && !summary.data.recentActivity.length ? (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No recorded activity yet.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </section>
      <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
        <CardHeader className="flex-row items-center justify-between gap-3 px-5 pt-5 pb-3 sm:px-6">
          <div>
            <CardTitle className="text-base font-semibold">
              Recently joined users
            </CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              {userList.data.total.toLocaleString()} customer accounts
            </p>
          </div>
          <Button
            render={<Link to="/users" />}
            nativeButton={false}
            variant="outline"
            size="sm"
            className="h-9 rounded-xl text-xs"
          >
            View all{" "}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              strokeWidth={1.8}
              data-icon="inline-end"
            />
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-1">
          <Table>
            <TableHeader>
              <TableRow className="border-y border-border/60 hover:bg-transparent">
                <TableHead className="pl-5 text-[10px] font-medium tracking-wide text-muted-foreground sm:pl-6">
                  USER
                </TableHead>
                <TableHead className="hidden text-[10px] font-medium tracking-wide text-muted-foreground md:table-cell">
                  INSTITUTION
                </TableHead>
                <TableHead className="text-[10px] font-medium tracking-wide text-muted-foreground">
                  DESIGNS
                </TableHead>
                <TableHead className="hidden text-[10px] font-medium tracking-wide text-muted-foreground sm:table-cell">
                  JOINED
                </TableHead>
                <TableHead className="pr-5 text-right text-[10px] font-medium tracking-wide text-muted-foreground sm:pr-6">
                  STATUS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userList.data.users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="pl-5 sm:pl-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarFallback className="bg-[#e8eee7] text-[10px] font-semibold text-[#50725c]">
                          {user.name
                            .split(" ")
                            .map((part) => part[0])
                            .slice(0, 2)
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{user.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {user.institution ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">{user.designCount}</TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">
                    {dateLabel(user.joinedAt)}
                  </TableCell>
                  <TableCell className="pr-5 text-right sm:pr-6">
                    <Badge
                      variant="secondary"
                      className={`rounded-full text-[10px] ${user.status === "active" ? "bg-[#e8eee7] text-[#50725c]" : "bg-[#f3e7dc] text-[#a66642]"}`}
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {!userList.isLoading && !userList.data.users.length ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No customer accounts found.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
