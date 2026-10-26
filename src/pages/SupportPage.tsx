import { useEffect, useState, type FormEvent } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Mail01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useRequest } from "@/hooks/useRequest"
import { apiRequest } from "@/lib/api"

type Ticket = {
  id: string
  name: string
  email: string
  topic: string
  status: "open" | "replied" | "resolved"
  relatedDesignId: string | null
  relatedPaymentId: string | null
  createdAt: string
  lastMessageAt: string
  resolvedAt: string | null
}
type TicketList = {
  tickets: Ticket[]
  page: number
  limit: number
  total: number
  pages: number
}
type SupportMessage = {
  id: string
  senderType: "customer" | "admin" | "system"
  body: string
  sentAt: string
  emailDeliveryStatus?: "not_applicable" | "pending" | "sent" | "failed"
  emailProvider?: string | null
  emailProviderId?: string | null
  emailFailureCode?: string | null
}
type TicketDetail = { ticket: Ticket; messages: SupportMessage[] }
const emptyList: TicketList = {
  tickets: [],
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
}
const emptyDetail: TicketDetail = {
  ticket: {
    id: "",
    name: "",
    email: "",
    topic: "",
    status: "open",
    relatedDesignId: null,
    relatedPaymentId: null,
    createdAt: "",
    lastMessageAt: "",
    resolvedAt: null,
  },
  messages: [],
}
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
const statusClasses = {
  open: "bg-[#f5e5e2] text-[#ad5146]",
  replied: "bg-[#f3e7dc] text-[#a66642]",
  resolved: "bg-[#e8eee7] text-[#50725c]",
}

export function SupportPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState("")
  const [reply, setReply] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const path = `admin/support?limit=20&page=${page}&q=${encodeURIComponent(search.trim())}${statusFilter ? `&status=${statusFilter}` : ""}`
  const tickets = useRequest<TicketList>(path, emptyList)
  const detail = useRequest<TicketDetail>(
    selectedId ? `admin/support/${selectedId}` : "",
    emptyDetail,
  )

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])
  useEffect(() => {
    if (!selectedId && tickets.data.tickets[0])
      setSelectedId(tickets.data.tickets[0].id)
    if (
      selectedId &&
      !tickets.data.tickets.some((ticket) => ticket.id === selectedId) &&
      tickets.data.tickets[0]
    )
      setSelectedId(tickets.data.tickets[0].id)
  }, [tickets.data.tickets, selectedId])

  async function reload() {
    await Promise.all([tickets.refetch(), detail.refetch()])
  }
  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedId || !reply.trim()) return
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(`admin/support/${selectedId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: reply.trim() }),
      })
      setReply("")
      setNotice("Reply emailed to the requester.")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Reply delivery failed.",
      )
    } finally {
      await reload()
      setBusy(false)
    }
  }
  async function updateStatus(status: "open" | "resolved") {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(`admin/support/${selectedId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setNotice(
        status === "resolved"
          ? "Ticket marked as resolved."
          : "Ticket reopened.",
      )
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not update ticket.",
      )
    } finally {
      await reload()
      setBusy(false)
    }
  }
  async function retryEmail(messageId: string) {
    setBusy(true)
    setError("")
    setNotice("")
    try {
      await apiRequest(
        `admin/support/${selectedId}/messages/${messageId}/retry-email`,
        { method: "POST" },
      )
      setNotice("Reply email delivered successfully.")
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Email delivery failed again.",
      )
    } finally {
      await reload()
      setBusy(false)
    }
  }

  const currentDetail =
    detail.data.ticket.id === selectedId ? detail.data : emptyDetail
  const ticket = currentDetail.ticket
  const openCount = tickets.data.tickets.filter(
    (item) => item.status !== "resolved",
  ).length
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            A thoughtful reply can make someone’s day
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
            Support inbox
          </h1>
        </div>
        <Badge
          variant="secondary"
          className="w-fit gap-1.5 rounded-full bg-[#f5e5e2] px-3 py-1.5 text-xs font-medium text-[#ad5146]"
        >
          <span className="size-1.5 rounded-full bg-[#c45f53]" />
          {openCount} needing attention on this page
        </Badge>
      </header>
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-[#e8eee7] px-4 py-3 text-sm text-[#456b50]"
        >
          {notice}
        </p>
      ) : null}
      {error || tickets.error || detail.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]"
        >
          {error || tickets.error || detail.error}
        </p>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(280px,0.82fr)_minmax(0,1.4fr)]">
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          <CardHeader className="gap-4 px-5 pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">
                  Requests
                </CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Newest activity first · {tickets.data.total} total
                </p>
              </div>
            </div>
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label htmlFor="support-search" className="sr-only">
                Search support requests
              </label>
              <Input
                id="support-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search requests"
                className="h-9 rounded-xl bg-white pl-9 text-xs"
              />
            </div>
            <label className="sr-only" htmlFor="support-status">
              Filter by ticket status
            </label>
            <select
              id="support-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-9 rounded-xl border border-input bg-white px-3 text-xs"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="replied">Replied</option>
              <option value="resolved">Resolved</option>
            </select>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {tickets.data.tickets.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedId(item.id)
                  setReply("")
                  setError("")
                  setNotice("")
                }}
                className={`flex w-full flex-col gap-2 border-t border-border/60 px-5 py-4 text-left transition-colors hover:bg-[#fbfaf8] ${selectedId === item.id ? "bg-[#f7f5f3]" : "bg-white"}`}
              >
                <div className="flex w-full items-center gap-2">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-[#e8eee7] text-[10px] font-semibold text-[#50725c]">
                      {item.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">
                    {item.name}
                  </span>
                  <time className="shrink-0 text-[10px] text-muted-foreground">
                    {dateLabel(item.lastMessageAt)}
                  </time>
                </div>
                <div className="flex w-full items-center justify-between gap-2 pl-11">
                  <span className="truncate text-xs font-medium">
                    {item.topic}
                  </span>
                  <Badge
                    variant="secondary"
                    className={`rounded-full text-[9px] ${statusClasses[item.status]}`}
                  >
                    {item.status}
                  </Badge>
                </div>
                <p className="truncate pl-11 text-[11px] text-muted-foreground">
                  {item.email}
                </p>
              </button>
            ))}
            {!tickets.isLoading && !tickets.data.tickets.length ? (
              <p className="px-5 py-12 text-center text-sm text-muted-foreground">
                No requests found.
              </p>
            ) : null}
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground">
              <span>
                Page {tickets.data.page} of {Math.max(1, tickets.data.pages)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1 || tickets.isLoading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= tickets.data.pages || tickets.isLoading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {ticket.id ? (
          <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
            <CardHeader className="flex-row items-start justify-between gap-4 px-5 pt-5 pb-4 sm:px-6">
              <div className="flex items-start gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-[#f3e7dc] text-xs font-semibold text-[#a66642]">
                    {ticket.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {ticket.name}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {ticket.email}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {dateLabel(ticket.createdAt)} · {ticket.id}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={`rounded-full text-[10px] ${statusClasses[ticket.status]}`}
              >
                {ticket.status}
              </Badge>
            </CardHeader>
            <CardContent className="px-5 pb-5 sm:px-6">
              <div className="border-y border-border/60 py-5">
                <p className="text-[10px] font-medium tracking-wide text-muted-foreground">
                  {ticket.topic.toUpperCase()}
                </p>
                {currentDetail.messages.map((message) => (
                  <article
                    key={message.id}
                    className={`mt-4 rounded-xl p-4 ${message.senderType === "admin" ? "ml-5 bg-[#e8eee7]" : "mr-5 bg-[#f7f5f3]"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide">
                        {message.senderType === "admin"
                          ? "Gradphics support"
                          : "Customer"}
                      </p>
                      <time className="text-[10px] text-muted-foreground">
                        {dateLabel(message.sentAt)}
                      </time>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#5f645f]">
                      {message.body}
                    </p>
                    {message.senderType === "admin" &&
                    message.emailDeliveryStatus ? (
                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-black/5 pt-2 text-[10px]">
                        <span>
                          Email: {message.emailDeliveryStatus}
                          {message.emailProvider
                            ? ` via ${message.emailProvider}`
                            : ""}
                          {message.emailProviderId
                            ? ` · ${message.emailProviderId}`
                            : ""}
                          {message.emailFailureCode
                            ? ` · ${message.emailFailureCode}`
                            : ""}
                        </span>
                        {message.emailDeliveryStatus === "failed" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="xs"
                            disabled={busy}
                            onClick={() => void retryEmail(message.id)}
                          >
                            Retry email
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
              {ticket.status !== "resolved" ? (
                <form onSubmit={sendReply} className="mt-5 flex flex-col gap-3">
                  <label
                    htmlFor="reply-message"
                    className="text-xs font-semibold"
                  >
                    Write a reply
                  </label>
                  <Textarea
                    id="reply-message"
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    required
                    minLength={1}
                    maxLength={10000}
                    placeholder={`Reply to ${ticket.name.split(" ")[0]}…`}
                    className="min-h-32 resize-y rounded-xl border-border bg-white p-3 text-sm leading-relaxed"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                      <HugeiconsIcon
                        icon={Mail01Icon}
                        strokeWidth={1.8}
                        className="size-3.5"
                      />
                      Email reply to {ticket.email}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void updateStatus("resolved")}
                        className="h-9 gap-1.5 rounded-xl px-3 text-xs"
                      >
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          strokeWidth={1.8}
                          data-icon="inline-start"
                        />
                        Resolve
                      </Button>
                      <Button
                        type="submit"
                        disabled={busy}
                        className="h-9 rounded-xl px-4 text-xs"
                      >
                        {busy ? "Sending…" : "Send reply"}
                      </Button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    This request has been resolved.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void updateStatus("open")}
                    className="h-9 rounded-xl px-3 text-xs"
                  >
                    Reopen
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-0 p-12 text-center text-sm text-muted-foreground shadow-none ring-1 ring-border/80">
            Choose a request to read and reply.
          </Card>
        )}
      </div>
    </div>
  )
}
