import { useEffect, useState, type FormEvent } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mail01Icon,
  Search01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRequest } from "@/hooks/useRequest";
import { apiRequest } from "@/lib/api";

type UserRow = {
  id: string;
  name: string;
  email: string;
  institution: string | null;
  status: "active" | "suspended" | "deletion_pending" | "deleted";
  emailVerified: boolean;
  joinedAt: string;
  lastLoginAt: string | null;
  designCount: number;
};
type UserList = {
  users: UserRow[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};
type UserDetail = {
  user: Omit<UserRow, "designCount"> & { role: "customer" };
  designs: {
    id: string;
    name: string;
    template: string;
    status: string;
    createdAt: string;
    readyAt: string | null;
  }[];
  payments: {
    id: string;
    reference: string;
    amountMinor: number;
    currency: string;
    status: string;
    paidAt: string | null;
    refundedAmountMinor: number;
    refundedAt: string | null;
    createdAt: string;
  }[];
  templateMonitorAccess: {
    templates: {
      id: string;
      name: string;
      slug: string;
      visible: boolean;
      archived: boolean;
      granted: boolean;
    }[];
    orphanedTemplateIds: string[];
  };
};
const emptyList: UserList = {
  users: [],
  page: 1,
  limit: 20,
  total: 0,
  pages: 0,
};
const money = (minor: number, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(minor / 100);
const dateLabel = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "—";

export function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [monitorSearch, setMonitorSearch] = useState("");
  const [monitorSelection, setMonitorSelection] = useState("");
  const [monitorBusyId, setMonitorBusyId] = useState("");
  const listPath = `admin/users?limit=20&page=${page}&q=${encodeURIComponent(search.trim())}`;
  const list = useRequest<UserList>(listPath, emptyList);
  const details = useRequest<UserDetail>(
    selectedId ? `admin/users/${selectedId}` : "",
    {
      user: {
        id: "",
        name: "",
        email: "",
        institution: null,
        status: "active",
        emailVerified: false,
        joinedAt: "",
        lastLoginAt: null,
        role: "customer",
      },
      designs: [],
      payments: [],
      templateMonitorAccess: { templates: [], orphanedTemplateIds: [] },
    },
  );

  useEffect(() => {
    setPage(1);
  }, [search]);
  useEffect(() => {
    if (!selectedId && list.data.users[0]) setSelectedId(list.data.users[0].id);
    if (
      selectedId &&
      !list.data.users.some((user) => user.id === selectedId) &&
      list.data.users[0]
    )
      setSelectedId(list.data.users[0].id);
    if (selectedId && !list.isLoading && !list.data.users.length)
      setSelectedId("");
  }, [list.data.users, list.isLoading, selectedId]);

  async function changeStatus() {
    const user = details.data.user;
    if (!user.id) return;
    const status = user.status === "suspended" ? "active" : "suspended";
    setBusy(true);
    setNotice("");
    setActionError("");
    try {
      await apiRequest(`admin/users/${user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setNotice(
        `${user.name} ${status === "suspended" ? "was suspended" : "was reactivated"}.`,
      );
      await Promise.all([list.refetch(), details.refetch()]);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update this account.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function sendUserEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user?.id) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const subject = String(form.get("subject") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    setEmailBusy(true);
    setNotice("");
    setActionError("");
    try {
      await apiRequest(`admin/users/${user.id}/email`, {
        method: "POST",
        body: JSON.stringify({ subject, message }),
      });
      setNotice(`Email sent to ${user.email}.`);
      formElement.reset();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not send this email.",
      );
    } finally {
      setEmailBusy(false);
    }
  }

  async function changeMonitorAccess(templateId: string, granted: boolean) {
    const selectedUser = details.data.user;
    if (!selectedUser.id || !templateId) return;
    setMonitorBusyId(templateId);
    setNotice("");
    setActionError("");
    try {
      await apiRequest(
        `admin/users/${selectedUser.id}/template-monitor-access/${templateId}`,
        { method: granted ? "PUT" : "DELETE" },
      );
      const templateName =
        details.data.templateMonitorAccess.templates.find(
          (template) => template.id === templateId,
        )?.name ?? "Template";
      setNotice(
        granted
          ? `Monitoring access granted for ${templateName}.`
          : `Monitoring access revoked for ${templateName}.`,
      );
      setMonitorSelection("");
      await details.refetch();
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Could not update template monitoring access.",
      );
    } finally {
      setMonitorBusyId("");
    }
  }

  const user = details.data.user.id === selectedId ? details.data.user : null;
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted-foreground">
          People building their graduation story
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em]">
          Users
        </h1>
      </header>
      {notice ? (
        <p
          role="status"
          className="rounded-xl bg-[#e8eee7] px-4 py-3 text-sm text-[#456b50]"
        >
          {notice}
        </p>
      ) : null}
      {actionError || list.error || details.error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#f5e5e2] px-4 py-3 text-sm text-[#963f34]"
        >
          {actionError || list.error || details.error}
        </p>
      ) : null}
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(290px,0.8fr)]">
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          <CardHeader className="flex-row items-center justify-between gap-3 px-5 pt-5 pb-4 sm:px-6">
            <div>
              <CardTitle className="text-base font-semibold">
                Customer accounts
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {list.data.total.toLocaleString()} accounts
              </p>
            </div>
            <div className="relative w-full max-w-[220px]">
              <HugeiconsIcon
                icon={Search01Icon}
                strokeWidth={1.8}
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <label className="sr-only" htmlFor="user-search">
                Search users
              </label>
              <Input
                id="user-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name or email"
                className="h-9 rounded-xl bg-white pl-9 text-xs"
              />
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="border-y border-border/60 hover:bg-transparent">
                  <TableHead className="pl-5 text-[10px] tracking-wide text-muted-foreground sm:pl-6">
                    USER
                  </TableHead>
                  <TableHead className="hidden text-[10px] tracking-wide text-muted-foreground lg:table-cell">
                    INSTITUTION
                  </TableHead>
                  <TableHead className="hidden text-[10px] tracking-wide text-muted-foreground sm:table-cell">
                    DESIGNS
                  </TableHead>
                  <TableHead className="pr-5 text-right text-[10px] tracking-wide text-muted-foreground sm:pr-6">
                    STATUS
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.users.map((row) => (
                  <TableRow
                    key={row.id}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") setSelectedId(row.id);
                    }}
                    onClick={() => setSelectedId(row.id)}
                    aria-selected={selectedId === row.id}
                    className="cursor-pointer focus-visible:bg-muted/60"
                  >
                    <TableCell className="pl-5 sm:pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-[#e8eee7] text-[10px] font-semibold text-[#50725c]">
                            {row.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium">
                            {row.name}
                          </p>
                          <p className="mt-0.5 max-w-40 truncate text-[10px] text-muted-foreground">
                            {row.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden max-w-36 truncate text-xs text-muted-foreground lg:table-cell">
                      {row.institution ?? "—"}
                    </TableCell>
                    <TableCell className="hidden text-xs sm:table-cell">
                      {row.designCount}
                    </TableCell>
                    <TableCell className="pr-5 text-right sm:pr-6">
                      <Badge
                        variant="secondary"
                        className={`rounded-full text-[10px] ${row.status === "active" ? "bg-[#e8eee7] text-[#50725c]" : "bg-[#f3e7dc] text-[#a66642]"}`}
                      >
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {!list.isLoading && !list.data.users.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No customers match this search.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t border-border/60 px-5 py-3 text-[11px] text-muted-foreground sm:px-6">
              <span>
                Page {list.data.page} of {Math.max(1, list.data.pages)}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page <= 1 || list.isLoading}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={page >= list.data.pages || list.isLoading}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 rounded-2xl border-0 shadow-none ring-1 ring-border/80">
          {user?.id ? (
            <>
              <CardHeader className="items-center px-5 pt-6 pb-4 text-center">
                <Avatar className="size-16">
                  <AvatarFallback className="bg-[#e8eee7] text-lg font-semibold text-[#50725c]">
                    {user.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="mt-3 text-lg font-semibold">
                  {user.name}
                </CardTitle>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                <Badge
                  variant="secondary"
                  className="mt-2 rounded-full bg-[#e8eee7] text-[10px] text-[#50725c]"
                >
                  {user.status} ·{" "}
                  {user.emailVerified ? "Verified" : "Unverified"}
                </Badge>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-3 border-y border-border/70 py-4">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Institution
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {user.institution ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Joined</p>
                    <p className="mt-1 text-xs font-medium">
                      {dateLabel(user.joinedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Designs made
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {details.data.designs.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      Last login
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {dateLabel(user.lastLoginAt)}
                    </p>
                  </div>
                </div>
                <section className="mt-5 border-b border-border/70 pb-5">
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold">Send an email</h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      Send a one-to-one message to {user.email}.
                    </p>
                  </div>
                  <form
                    className="flex flex-col gap-3"
                    onSubmit={(event) => void sendUserEmail(event)}
                  >
                    <label className="flex flex-col gap-1.5 text-[10px] font-medium text-muted-foreground">
                      Subject
                      <Input
                        className="h-9 rounded-xl bg-white text-xs text-foreground"
                        maxLength={160}
                        name="subject"
                        placeholder="A note from Gradphics"
                        required
                      />
                    </label>
                    <label className="flex flex-col gap-1.5 text-[10px] font-medium text-muted-foreground">
                      Message
                      <Textarea
                        className="min-h-32 resize-y rounded-xl bg-white text-xs leading-relaxed text-foreground"
                        maxLength={10000}
                        name="message"
                        placeholder="Write your message…"
                        required
                      />
                    </label>
                    <Button
                      className="w-full rounded-xl"
                      disabled={emailBusy}
                      type="submit"
                    >
                      <HugeiconsIcon
                        aria-hidden="true"
                        icon={Mail01Icon}
                        size={15}
                        strokeWidth={1.8}
                      />
                      {emailBusy ? "Sending…" : "Send email"}
                    </Button>
                  </form>
                </section>
                <section className="mt-5 border-b border-border/70 pb-5">
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold">
                      Template monitoring access
                    </h3>
                    <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                      Grants do not expire. Revocation takes effect immediately.
                    </p>
                  </div>
                  <label
                    className="mb-2 block text-[10px] text-muted-foreground"
                    htmlFor="monitor-template-search"
                  >
                    Find a template to grant
                  </label>
                  <Input
                    id="monitor-template-search"
                    value={monitorSearch}
                    onChange={(event) => setMonitorSearch(event.target.value)}
                    placeholder="Search templates"
                    className="h-9 rounded-xl bg-white text-xs"
                  />
                  <div className="mt-2 flex gap-2">
                    <select
                      aria-label="Template to grant monitoring access"
                      value={monitorSelection}
                      onChange={(event) =>
                        setMonitorSelection(event.target.value)
                      }
                      className="h-9 min-w-0 flex-1 rounded-xl border border-input bg-white px-3 text-xs"
                    >
                      <option value="">Select a template</option>
                      {details.data.templateMonitorAccess.templates
                        .filter((template) => !template.granted)
                        .filter((template) =>
                          `${template.name} ${template.slug}`
                            .toLowerCase()
                            .includes(monitorSearch.trim().toLowerCase()),
                        )
                        .map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                            {template.archived
                              ? " · Archived"
                              : template.visible
                                ? " · Published"
                                : " · Unpublished"}
                          </option>
                        ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!monitorSelection || Boolean(monitorBusyId)}
                      onClick={() =>
                        void changeMonitorAccess(monitorSelection, true)
                      }
                      className="rounded-xl"
                    >
                      {monitorBusyId === monitorSelection ? "Saving…" : "Grant"}
                    </Button>
                  </div>
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-medium text-muted-foreground">
                      Current grants
                    </p>
                    {details.data.templateMonitorAccess.templates.some(
                      (template) => template.granted,
                    ) ||
                    details.data.templateMonitorAccess.orphanedTemplateIds
                      .length ? (
                      <div className="flex flex-col gap-2">
                        {details.data.templateMonitorAccess.templates
                          .filter((template) => template.granted)
                          .map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f5f3] p-3"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium">
                                  {template.name}
                                </p>
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  {template.archived
                                    ? "Archived · stats unavailable"
                                    : template.visible
                                      ? "Published"
                                      : "Unpublished · stats unavailable"}
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={Boolean(monitorBusyId)}
                                onClick={() =>
                                  void changeMonitorAccess(template.id, false)
                                }
                              >
                                {monitorBusyId === template.id
                                  ? "Saving…"
                                  : "Revoke"}
                              </Button>
                            </div>
                          ))}
                        {details.data.templateMonitorAccess.orphanedTemplateIds.map(
                          (templateId) => (
                            <div
                              key={templateId}
                              className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f5f3] p-3"
                            >
                              <p className="text-xs text-muted-foreground">
                                Unavailable template
                              </p>
                              <Button
                                variant="outline"
                                size="xs"
                                disabled={Boolean(monitorBusyId)}
                                onClick={() =>
                                  void changeMonitorAccess(templateId, false)
                                }
                              >
                                Revoke
                              </Button>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <p className="rounded-xl bg-[#f7f5f3] px-3 py-4 text-center text-[10px] text-muted-foreground">
                        No templates are currently assigned.
                      </p>
                    )}
                  </div>
                </section>
                <div className="pt-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold">Recent designs</h3>
                    <span className="text-[10px] text-muted-foreground">
                      {details.data.designs.length} shown
                    </span>
                  </div>
                  {details.data.designs.length ? (
                    <div className="flex flex-col gap-2">
                      {details.data.designs.map((design) => (
                        <div
                          key={design.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f5f3] p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">
                              {design.name}
                            </p>
                            <p className="mt-1 truncate text-[10px] text-muted-foreground">
                              {design.template} · {dateLabel(design.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full text-[9px]"
                          >
                            {design.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#f7f5f3] px-4 py-6 text-center">
                      <HugeiconsIcon
                        icon={UserGroupIcon}
                        strokeWidth={1.5}
                        className="mx-auto size-5 text-muted-foreground"
                      />
                      <p className="mt-2 text-xs text-muted-foreground">
                        No designs created yet.
                      </p>
                    </div>
                  )}
                </div>
                <div className="mt-5 border-t border-border/70 pt-4">
                  <h3 className="mb-3 text-xs font-semibold">
                    Recent payments
                  </h3>
                  {details.data.payments.length ? (
                    <div className="flex flex-col gap-2">
                      {details.data.payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#f7f5f3] p-3"
                        >
                          <div>
                            <p className="text-xs font-medium">
                              {money(payment.amountMinor, payment.currency)}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {dateLabel(payment.paidAt ?? payment.createdAt)}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full text-[9px]"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No payments yet.
                    </p>
                  )}
                </div>
                <Button
                  variant={
                    user.status === "suspended" ? "outline" : "destructive"
                  }
                  disabled={busy || details.isLoading}
                  onClick={() => void changeStatus()}
                  className="mt-5 w-full rounded-xl"
                >
                  {busy
                    ? "Saving…"
                    : user.status === "suspended"
                      ? "Reactivate account"
                      : "Suspend account"}
                </Button>
              </CardContent>
            </>
          ) : (
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              {list.isLoading
                ? "Loading customers…"
                : "Select a customer to see details."}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
