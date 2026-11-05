import { useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, BadgeIndianRupee, Bell, BriefcaseBusiness,
  Building2, Check, ChevronDown, CircleHelp, FileText, LayoutDashboard, LogOut,
  KeyRound, Plus, Search, ShieldCheck, Users, X,
} from "lucide-react";
import api, { accessKey, PUBLIC_SITE_URL, refreshKey } from "./api.js";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "company", label: "Company profile", icon: Building2 },
  { id: "apps", label: "Platforms", icon: BriefcaseBusiness },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "financial", label: "Financial entries", icon: BadgeIndianRupee },
  { id: "investors", label: "Investors", icon: Users },
  { id: "account", label: "Change password", icon: KeyRound },
];

const resources = {
  company: {
    title: "Company profile", endpoint: "/company/", singular: "profile",
    fields: [
      { key: "legal_name", label: "Legal name", required: true },
      { key: "tagline", label: "Tagline" },
      { key: "email", label: "Contact email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "overview", label: "Overview", type: "textarea" },
      { key: "mission", label: "Mission", type: "textarea" },
      { key: "vision", label: "Vision", type: "textarea" },
      { key: "address", label: "Address", type: "textarea" },
    ],
    columns: [["legal_name", "Company"], ["tagline", "Tagline"], ["email", "Email"], ["updated_at", "Updated"]],
  },
  apps: {
    title: "Platforms", endpoint: "/apps/", singular: "platform",
    fields: [
      { key: "name", label: "Platform name", required: true },
      { key: "short_description", label: "Description", type: "textarea", required: true },
      { key: "website_url", label: "Website URL", type: "url" },
      { key: "play_store_url", label: "Google Play URL", type: "url" },
      { key: "app_store_url", label: "App Store URL", type: "url" },
      { key: "display_order", label: "Display order", type: "number" },
      { key: "is_published", label: "Visible on website", type: "checkbox" },
    ],
    columns: [["name", "Platform"], ["short_description", "Description"], ["display_order", "Order"], ["is_published", "Published"]],
  },
  announcements: {
    title: "Announcements", endpoint: "/announcements/", singular: "announcement",
    fields: [
      { key: "title", label: "Title", required: true },
      { key: "body", label: "Announcement", type: "textarea", required: true },
      { key: "published", label: "Publish on website", type: "checkbox" },
    ],
    columns: [["title", "Title"], ["body", "Announcement"], ["published", "Published"], ["created_at", "Created"]],
  },
  financial: {
    title: "Financial entries", endpoint: "/admin/financial-entries/", singular: "entry",
    fields: [
      { key: "entry_type", label: "Entry type", type: "select", required: true, options: [["INCOME", "Income"], ["EXPENSE", "Expense"], ["INVESTMENT", "Investment received"]] },
      { key: "date", label: "Date", type: "date", required: true },
      { key: "category", label: "Category", required: true },
      { key: "description", label: "Description", required: true },
      { key: "amount", label: "Amount (INR)", type: "number", step: "0.01", required: true },
      { key: "reference", label: "Reference" },
      { key: "investor", label: "Linked investor (optional)", type: "investor" },
      { key: "visible_to_investors", label: "Show in investor portal", type: "checkbox" },
    ],
    columns: [["date", "Date"], ["entry_type", "Type"], ["description", "Description"], ["category", "Category"], ["amount", "Amount"], ["visible_to_investors", "Investor view"]],
  },
  investors: {
    title: "Investors", endpoint: "/admin/investors/", singular: "investor account",
    fields: [
      { key: "username", label: "Username", required: true },
      { key: "investor_code", label: "Investor code", required: true },
      { key: "first_name", label: "First name" },
      { key: "last_name", label: "Last name" },
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone" },
      { key: "is_active_investor", label: "Investor account active", type: "checkbox" },
      { key: "password", label: "New password (optional)", type: "password", hint: "Leave blank to keep the current password." },
    ],
    columns: [["username", "Username"], ["investor_code", "Investor code"], ["name", "Name"], ["email", "Email"], ["phone", "Phone"], ["is_active_investor", "Active"]],
  },
};

function messageFrom(error) {
  const data = error.response?.data;
  if (typeof data?.detail === "string") return data.detail;
  if (data && typeof data === "object") return Object.values(data).flat().join(" ");
  return "The request could not be completed. Please try again.";
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0));
}

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const token = await api.post("/auth/token/", { username, password });
      localStorage.setItem(accessKey, token.data.access);
      localStorage.setItem(refreshKey, token.data.refresh);
      const response = await api.get("/auth/me/");
      if (!response.data.is_staff) throw new Error("This account does not have administrator access.");
      onLogin(response.data);
    } catch (exception) {
      localStorage.removeItem(accessKey); localStorage.removeItem(refreshKey);
      setError(exception.message === "This account does not have administrator access."
        ? exception.message : "Sign-in failed. Check your details and try again.");
    } finally { setBusy(false); }
  }
  return <main className="login-screen">
    <div className="login-brand"><span className="brand-mark">N</span><span>Neo JobZinda</span><span className="brand-tag">ADMIN</span></div>
    <form className="login-card" onSubmit={submit}>
      <div className="login-icon"><ShieldCheck size={23}/></div>
      <div className="eyebrow">ADMINISTRATOR WORKSPACE</div>
      <h1>Welcome back</h1>
      <p>Sign in with your Django staff account to manage company content and records.</p>
      <label>Username<input value={username} onChange={event => setUsername(event.target.value)} autoComplete="username" required /></label>
      <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password" required /></label>
      {error && <div className="form-error">{error}</div>}
      <button className="primary-button login-submit" disabled={busy}>{busy ? "Signing in…" : "Sign in securely"}<ArrowUpRight size={17}/></button>
      <div className="login-foot"><ShieldCheck size={14}/> Protected company administration</div>
    </form>
    <a className="back-to-site" href={PUBLIC_SITE_URL}>← Back to company website</a>
  </main>;
}

function AdminApp() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(localStorage.getItem(accessKey)));
  const [active, setActive] = useState("overview");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const expired = () => { setUser(null); setChecking(false); };
    window.addEventListener("admin-session-expired", expired);
    const token = localStorage.getItem(accessKey);
    if (!token) { setChecking(false); return () => window.removeEventListener("admin-session-expired", expired); }
    api.get("/auth/me/").then(({ data }) => {
      if (data.is_staff) setUser(data);
      else { localStorage.removeItem(accessKey); localStorage.removeItem(refreshKey); }
    }).catch(() => { localStorage.removeItem(accessKey); localStorage.removeItem(refreshKey); }).finally(() => setChecking(false));
    return () => window.removeEventListener("admin-session-expired", expired);
  }, []);

  function logout() {
    localStorage.removeItem(accessKey); localStorage.removeItem(refreshKey); setUser(null); setActive("overview");
  }
  function notify(text) { setToast(text); window.setTimeout(() => setToast(""), 3200); }

  if (checking) return <div className="loading-screen"><div className="spinner"/>Checking your secure session…</div>;
  if (!user) return <Login onLogin={setUser}/>;

  const activeItem = navItems.find(item => item.id === active) || navItems[0];
  const ActiveIcon = activeItem.icon;
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-brand" href={PUBLIC_SITE_URL}><span className="brand-mark">N</span><span>Neo JobZinda<small>CONTROL CENTER</small></span></a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="admin-nav">{navItems.map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={active === item.id ? "nav-item selected" : "nav-item"} onClick={() => setActive(item.id)}><Icon size={18}/><span>{item.label}</span>{item.id === "overview" && <span className="nav-dot"/>}</button>;
      })}</nav>
      <div className="sidebar-bottom"><div className="signed-user"><div className="avatar">{user.username.slice(0, 1).toUpperCase()}</div><div><strong>{user.username}</strong><span>Administrator</span></div><ChevronDown size={15}/></div><button className="logout-button" onClick={logout}><LogOut size={17}/>Sign out</button></div>
    </aside>
    <main className="admin-main">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{activeItem.label}</strong></div><div className="topbar-right"><div className="secure-label"><ShieldCheck size={15}/> Secure session</div><button className="avatar small-avatar" title={user.username}>{user.username.slice(0, 1).toUpperCase()}</button></div></header>
      <div className="page-content">
        <div className="page-heading"><div><div className="eyebrow">NEO JOBZINDA · ADMIN</div><h1><ActiveIcon size={26}/>{activeItem.label}</h1><p>{active === "overview" ? "A clear view of your company content and operations." : active === "investors" ? "Review investor profiles and account status." : `Manage ${activeItem.label.toLowerCase()} from one place.`}</p></div><div className="live-status"><span/> Workspace active</div></div>
        {toast && <div className="toast"><Check size={16}/>{toast}</div>}
        {active === "overview" ? <Overview onNavigate={setActive}/> : active === "account" ? <ChangePasswordPage onNotify={notify}/> : <RecordsPage key={active} kind={active} onNotify={notify}/>}
      </div>
    </main>
  </div>;
}

function Overview({ onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([
      api.get("/company/"), api.get("/apps/"), api.get("/announcements/"),
      api.get("/admin/financial-entries/"), api.get("/admin/investors/"),
    ]).then(([company, apps, announcements, financial, investors]) => setData({
      company: company.data, apps: apps.data, announcements: announcements.data,
      financial: financial.data, investors: investors.data,
    })).catch(error => setError(messageFrom(error)));
  }, []);
  if (error) return <div className="empty-state"><ShieldCheck/><h2>Couldn’t load workspace</h2><p>{error}</p><button className="quiet-button" onClick={() => window.location.reload()}>Try again</button></div>;
  if (!data) return <div className="loading-panel"><div className="spinner"/>Loading workspace…</div>;
  const income = data.financial.filter(row => row.entry_type === "INCOME").reduce((total, row) => total + Number(row.amount), 0);
  const expenses = data.financial.filter(row => row.entry_type === "EXPENSE").reduce((total, row) => total + Number(row.amount), 0);
  const metrics = [
    ["Published platforms", data.apps.filter(row => row.is_published).length, BriefcaseBusiness, "Across your digital ecosystem"],
    ["Announcements", data.announcements.length, Bell, "Published company updates"],
    ["Investor profiles", data.investors.length, Users, "Accounts in the investor workspace"],
    ["Net operating result", money(income - expenses), Activity, "Based on recorded entries"],
  ];
  return <>
    <section className="welcome-banner"><div className="welcome-orb orb-one"/><div className="welcome-orb orb-two"/><div className="welcome-copy"><span className="welcome-kicker">YOUR COMPANY, AT A GLANCE</span><h2>Good to see you, {data.company[0]?.legal_name?.split(" ")[0] || "Admin"}.</h2><p>Keep your company information current and your operations moving.</p></div><div className="welcome-graphic"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-center"><Activity size={25}/></div></div></section>
    <section className="metric-grid">{metrics.map(([label, value, Icon, caption]) => <article className="metric-card" key={label}><div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={17}/></span></div><strong>{value}</strong><small>{caption}</small></article>)}</section>
    <div className="overview-grid"><section className="content-card"><div className="card-heading"><div><span className="section-kicker">QUICK ACCESS</span><h2>Management areas</h2></div><CircleHelp size={17}/></div><div className="quick-grid">{navItems.slice(1).map(item => { const Icon = item.icon; return <button key={item.id} className="quick-link" onClick={() => onNavigate(item.id)}><span><Icon size={18}/></span><strong>{item.label}</strong><ArrowUpRight size={15}/></button>; })}</div></section>
      <section className="content-card activity-card"><div className="card-heading"><div><span className="section-kicker">RECENT ACTIVITY</span><h2>Latest financial entries</h2></div><button className="text-button" onClick={() => onNavigate("financial")}>View all <ArrowUpRight size={14}/></button></div>{data.financial.slice(0, 5).map(row => <div className="activity-row" key={row.id}><div className={row.entry_type === "INCOME" ? "activity-icon income" : "activity-icon expense"}>{row.entry_type === "INCOME" ? <ArrowDownRight size={16}/> : <ArrowUpRight size={16}/>}</div><div className="activity-details"><strong>{row.description}</strong><span>{row.date} · {row.category}</span></div><b className={row.entry_type === "INCOME" ? "amount-positive" : ""}>{row.entry_type === "EXPENSE" ? "−" : "+"}{money(row.amount)}</b></div>)}{!data.financial.length && <div className="empty-inline">No financial entries yet.</div>}</section></div>
  </>;
}

function ChangePasswordPage({ onNotify }) {
  const [values, setValues] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function setField(key, value) { setValues(current => ({ ...current, [key]: value })); }
  async function submit(event) {
    event.preventDefault(); setError("");
    if (values.new_password !== values.confirm_password) { setError("The new passwords do not match."); return; }
    setSaving(true);
    try {
      await api.post("/auth/change-password/", { current_password: values.current_password, new_password: values.new_password });
      setValues({ current_password: "", new_password: "", confirm_password: "" });
      onNotify("Your password was changed successfully.");
    } catch (exception) { setError(messageFrom(exception)); }
    finally { setSaving(false); }
  }
  return <section className="content-card password-card">
    <span className="section-kicker">SECURITY</span>
    <h2>Change your password</h2>
    <p>Enter your current password, then choose a new one for your administrator account.</p>
    <form className="password-form" onSubmit={submit}>
      <label>Current password<input type="password" autoComplete="current-password" value={values.current_password} onChange={event => setField("current_password", event.target.value)} required/></label>
      <label>New password<input type="password" autoComplete="new-password" value={values.new_password} onChange={event => setField("new_password", event.target.value)} required/></label>
      <label>Confirm new password<input type="password" autoComplete="new-password" value={values.confirm_password} onChange={event => setField("confirm_password", event.target.value)} required/></label>
      {error && <div className="inline-error">{error}</div>}
      <button className="primary-button" disabled={saving}>{saving ? "Updating…" : "Update password"}</button>
    </form>
  </section>;
}

function RecordsPage({ kind, onNotify }) {
  const resource = resources[kind];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [investorOptions, setInvestorOptions] = useState([]);
  const [creatingInvestor, setCreatingInvestor] = useState(false);
  const [investorDraft, setInvestorDraft] = useState({ username: "", email: "", first_name: "", last_name: "", investor_code: "", phone: "", password: "", confirm_password: "" });
  const [accountError, setAccountError] = useState("");
  async function load() {
    setLoading(true); setError("");
    try { const { data } = await api.get(resource.endpoint); setRecords(Array.isArray(data) ? data : []); }
    catch (exception) { setError(messageFrom(exception)); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    load();
    if (kind === "financial") api.get("/admin/investors/").then(({ data }) => setInvestorOptions(data)).catch(() => setInvestorOptions([]));
  }, [kind]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? records.filter(record => resource.columns.some(([key]) => String(record[key] ?? "").toLowerCase().includes(q))) : records;
  }, [records, query, kind]);
  function startEdit(record) {
    const value = record ? { ...record } : Object.fromEntries(resource.fields.map(field => [field.key, field.type === "checkbox" ? false : ""]));
    if (kind === "financial" && !record) value.date = new Date().toISOString().slice(0, 10);
    setEditing({ record, value });
  }
  function setField(key, value) { setEditing(current => ({ ...current, value: { ...current.value, [key]: value } })); }
  async function save(event) {
    event.preventDefault(); setSaving(true); setError("");
    const payload = Object.fromEntries(resource.fields.map(field => [field.key, editing.value[field.key] ?? (field.type === "checkbox" ? false : "")]));
    for (const field of resource.fields) {
      if (field.type === "number" && payload[field.key] === "") {
        payload[field.key] = field.key === "display_order" ? 0 : null;
      }
    }
    if (kind === "financial" && !payload.investor) payload.investor = null;
    try {
      if (editing.record) await api.put(`${resource.endpoint}${editing.record.id}/`, payload);
      else await api.post(resource.endpoint, payload);
      setEditing(null); await load(); onNotify(`${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} saved successfully.`);
    } catch (exception) { setError(messageFrom(exception)); }
    finally { setSaving(false); }
  }
  async function remove(record) {
    if (!window.confirm(`Delete this ${resource.singular}? This cannot be undone.`)) return;
    try { await api.delete(`${resource.endpoint}${record.id}/`); await load(); onNotify(`${resource.singular[0].toUpperCase()}${resource.singular.slice(1)} deleted.`); }
    catch (exception) { setError(messageFrom(exception)); }
  }
  async function createInvestor(event) {
    event.preventDefault(); setAccountError("");
    if (investorDraft.password !== investorDraft.confirm_password) {
      setAccountError("The passwords do not match."); return;
    }
    setSaving(true);
    const { confirm_password, ...payload } = investorDraft;
    try {
      await api.post("/admin/investors/create-account/", payload);
      setCreatingInvestor(false);
      setInvestorDraft({ username: "", email: "", first_name: "", last_name: "", investor_code: "", phone: "", password: "", confirm_password: "" });
      await load();
      onNotify("Investor login created. The password was saved securely.");
    } catch (exception) { setAccountError(messageFrom(exception)); }
    finally { setSaving(false); }
  }
  function changeInvestorField(key, value) { setInvestorDraft(current => ({ ...current, [key]: value })); }
  const labelValue = (record, key) => {
    const value = record[key];
    if (typeof value === "boolean") return <span className={value ? "state-pill on" : "state-pill off"}>{value ? "Yes" : "No"}</span>;
    if (key === "amount") return money(value);
    if (key.endsWith("_at") && value) return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    return value || <span className="muted-dash">—</span>;
  };
  const canAdd = !resource.readonly && kind !== "investors" && !(kind === "company" && records.length > 0);
  return <section className="content-card records-card">
    <div className="records-heading"><div><span className="section-kicker">{kind === "financial" || kind === "investors" ? "RESTRICTED · STAFF ONLY" : "CONTENT MANAGEMENT"}</span><h2>{resource.title}</h2><p>{kind === "investors" ? "Investor accounts linked to the company workspace." : `${records.length} ${resource.title.toLowerCase()} ${records.length === 1 ? "record" : "records"}`}</p></div>{kind === "investors" ? <button className="primary-button" onClick={() => { setAccountError(""); setCreatingInvestor(true); }}><Plus size={17}/> Create investor login</button> : canAdd && <button className="primary-button" onClick={() => startEdit(null)}><Plus size={17}/> Add {resource.singular}</button>}</div>
    <div className="table-toolbar"><div className="search-box"><Search size={16}/><input placeholder={`Search ${resource.title.toLowerCase()}…`} value={query} onChange={event => setQuery(event.target.value)}/></div><button className="quiet-button" onClick={load}>Refresh</button></div>
    {error && <div className="inline-error">{error}</div>}
    {loading ? <div className="loading-panel"><div className="spinner"/>Loading records…</div> : filtered.length ? <div className="table-wrap"><table className="records-table"><thead><tr>{resource.columns.map(([key, label]) => <th key={key}>{label}</th>)}{(!resource.readonly || kind === "investors") && <th className="actions-heading">Actions</th>}</tr></thead><tbody>{filtered.map(record => <tr key={record.id ?? "company"}>{resource.columns.map(([key]) => <td key={key} className={key === "amount" ? "money-cell" : ""}>{labelValue(record, key)}</td>)}{(!resource.readonly || kind === "investors") && <td><div className="row-actions"><button onClick={() => startEdit(record)}>Edit</button>{!resource.readonly && kind !== "company" && kind !== "investors" && <button className="delete-action" onClick={() => remove(record)}>Delete</button>}</div></td>}</tr>)}</tbody></table></div> : <div className="empty-state"><FileText size={27}/><h3>{query ? "No matching records" : kind === "investors" ? "No investor accounts yet" : "Nothing here yet"}</h3><p>{query ? "Try a different search." : kind === "investors" ? "Create the first investor login above. After it’s created, use Edit on its row to update details, change its password, or deactivate access." : "Add your first record to get started."}</p>{!query && canAdd && <button className="primary-button" onClick={() => startEdit(null)}><Plus size={16}/> Add {resource.singular}</button>}</div>}
    {editing && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setEditing(null); }}><form className="edit-modal" onSubmit={save}><div className="modal-heading"><div><span className="section-kicker">{kind === "investors" ? "INVESTOR ACCOUNT" : editing.record ? "EDIT RECORD" : "NEW RECORD"}</span><h2>{kind === "investors" ? "Manage investor" : `${editing.record ? "Update" : "Add"} ${resource.singular}`}</h2></div><button type="button" className="icon-button" onClick={() => setEditing(null)} aria-label="Close"><X size={19}/></button></div>{kind === "investors" && <p className="modal-intro">Update the investor’s profile or access. Leave the password blank to keep the current one. Deactivating the account prevents investor access.</p>}<div className="modal-fields">{resource.fields.map(field => <label key={field.key} className={field.type === "textarea" || field.type === "password" ? "field-wide" : ""}>{field.type === "checkbox" ? <span className="check-field"><input type="checkbox" checked={Boolean(editing.value[field.key])} onChange={event => setField(field.key, event.target.checked)}/>{field.label}</span> : <>{field.label}{field.hint && <small>{field.hint}</small>}{field.type === "select" ? <select value={editing.value[field.key] || ""} required={field.required} onChange={event => setField(field.key, event.target.value)}><option value="">Select a type</option>{field.options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select> : field.type === "investor" ? <select value={editing.value[field.key] || ""} onChange={event => setField(field.key, event.target.value)}><option value="">No linked investor</option>{investorOptions.map(person => <option key={person.id} value={person.id}>{person.investor_code} · {person.name || person.username}</option>)}</select> : field.type === "textarea" ? <textarea rows="4" value={editing.value[field.key] || ""} required={field.required} onChange={event => setField(field.key, event.target.value)}/> : <input type={field.type || "text"} value={editing.value[field.key] ?? ""} required={field.required} step={field.step} autoComplete={field.type === "password" ? "new-password" : undefined} onChange={event => setField(field.key, event.target.value)}/>}</>}</label>)}</div><div className="modal-actions"><button type="button" className="quiet-button" onClick={() => setEditing(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></form></div>}
    {creatingInvestor && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setCreatingInvestor(false); }}><form className="edit-modal" onSubmit={createInvestor}><div className="modal-heading"><div><span className="section-kicker">NEW INVESTOR ACCOUNT</span><h2>Create investor login</h2></div><button type="button" className="icon-button" onClick={() => setCreatingInvestor(false)} aria-label="Close" disabled={saving}><X size={19}/></button></div><p className="modal-intro">This creates a standard investor account with read-only access to published financial information.</p><div className="modal-fields"><label>Username<input autoComplete="off" value={investorDraft.username} onChange={event => changeInvestorField("username", event.target.value)} required/></label><label>Investor code<input value={investorDraft.investor_code} onChange={event => changeInvestorField("investor_code", event.target.value)} required/></label><label>Email<input type="email" autoComplete="off" value={investorDraft.email} onChange={event => changeInvestorField("email", event.target.value)}/></label><label>Phone<input value={investorDraft.phone} onChange={event => changeInvestorField("phone", event.target.value)}/></label><label>First name<input autoComplete="off" value={investorDraft.first_name} onChange={event => changeInvestorField("first_name", event.target.value)}/></label><label>Last name<input autoComplete="off" value={investorDraft.last_name} onChange={event => changeInvestorField("last_name", event.target.value)}/></label><label>Password<input type="password" autoComplete="new-password" value={investorDraft.password} onChange={event => changeInvestorField("password", event.target.value)} required/></label><label>Confirm password<input type="password" autoComplete="new-password" value={investorDraft.confirm_password} onChange={event => changeInvestorField("confirm_password", event.target.value)} required/></label><p className="password-hint field-wide">Django’s password rules apply. The password is write-only and won’t be shown again after account creation.</p></div>{accountError && <div className="inline-error">{accountError}</div>}<div className="modal-actions"><button type="button" className="quiet-button" onClick={() => setCreatingInvestor(false)} disabled={saving}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Creating account…" : "Create account"}</button></div></form></div>}
  </section>;
}

export default AdminApp;
