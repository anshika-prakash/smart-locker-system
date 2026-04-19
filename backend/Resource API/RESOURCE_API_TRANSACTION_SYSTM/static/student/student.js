/**
 * Student portal: presets (students only), lanes, explicit Borrow/Return buttons, drag-and-drop.
 * Depends on /static/shared/api.js (window.ResourceLabApi).
 */
const { $, apiJson, toast, escapeHtml } = window.ResourceLabApi;

/** Logged-in user id from last successful /demo/state (used to enable Return). */
let currentUserId = null;

function setBorrowedTotalDisplay(count) {
  $("stat-borrowed-total").textContent =
    count === null || count === undefined ? "—" : String(count);
}

function setSessionChip(text, role) {
  const chip = $("session-chip");
  chip.textContent = text;
  chip.classList.toggle("muted", text.startsWith("Not"));
  chip.dataset.role = role || "";
}

/** Only student presets on this portal. */
function renderPresets(accounts) {
  const grid = $("preset-buttons");
  grid.innerHTML = "";
  const labels = { student_a: "Student A", student_b: "Student B" };
  const students = (accounts || []).filter((a) => a.role === "student");
  for (const acc of students) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset";
    btn.dataset.preset = acc.preset;
    btn.innerHTML = `<strong>${labels[acc.preset] || acc.preset}</strong><small>#${
      acc.user_id
    } · ${acc.roll_no}</small>`;
    btn.addEventListener("click", () => loginPreset(acc.preset));
    grid.appendChild(btn);
  }
  const disabled = students.length === 0;
  grid.querySelectorAll(".preset").forEach((b) => {
    b.disabled = disabled;
  });
}

async function refreshBootstrap() {
  const { body } = await apiJson("/demo/bootstrap", { method: "GET" });
  if (!body.success) {
    toast(body.message || "Bootstrap failed", "err");
    renderPresets(body.data?.accounts || []);
    $("out-state").textContent = JSON.stringify(body, null, 2);
    return;
  }
  renderPresets(body.data.accounts || []);
  $("out-state").textContent = JSON.stringify(body, null, 2);
}

async function seedDemo() {
  const { body } = await apiJson("/demo/seed", { method: "POST", body: "{}" });
  if (body.success) toast("Demo data ready");
  else toast(body.message || "Seed failed", "err");
  await refreshBootstrap();
}

async function loginPreset(preset) {
  const { body } = await apiJson("/demo/login", {
    method: "POST",
    body: JSON.stringify({ preset }),
  });
  if (!body.success) {
    toast(body.message || "Login failed", "err");
    return;
  }
  if (body.data.role !== "student") {
    toast("This portal is for students only.", "err");
    return;
  }
  toast(`Signed in as ${body.data.name} (${body.data.role})`);
  $("btn-logout").disabled = false;
  setSessionChip(`${body.data.name} · ${body.data.role}`, body.data.role);
  currentUserId = Number(body.data.user_id);
  await refreshState();
}

async function logout() {
  const { body } = await apiJson("/demo/logout", { method: "POST", body: "{}" });
  if (body.success) toast("Logged out");
  $("btn-logout").disabled = true;
  setSessionChip("Not signed in", "");
  currentUserId = null;
  await refreshState();
}

async function doBorrow(resourceId) {
  const dueDays = Number($("slider-due").value);
  const { body } = await apiJson("/borrow", {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId, due_in_days: dueDays }),
  });
  if (body.success) toast(`Borrowed #${resourceId} · due ${body.data.due_date}`);
  else toast(body.message || "Borrow failed", "err");
  await refreshState();
}

async function doReturn(resourceId) {
  const { body } = await apiJson("/return", {
    method: "POST",
    body: JSON.stringify({ resource_id: resourceId }),
  });
  if (body.success) toast(`Returned #${resourceId} — now available again.`);
  else toast(body.message || "Return failed", "err");
  await refreshState();
}

async function refreshState() {
  const { res, body } = await apiJson("/demo/state", { method: "GET" });
  if (res.status === 401) {
    $("list-available").innerHTML = "";
    $("list-borrowed").innerHTML = "";
    setSessionChip("Not signed in", "");
    $("btn-logout").disabled = true;
    currentUserId = null;
    setBorrowedTotalDisplay(null);
    $("out-state").textContent = JSON.stringify(body, null, 2);
    renderTxnRows([]);
    return;
  }
  if (!body.success) {
    toast(body.message || "State failed", "err");
    return;
  }
  $("out-state").textContent = JSON.stringify(body, null, 2);
  const d = body.data;
  if (d.session) {
    const s = d.session;
    $("btn-logout").disabled = false;
    setSessionChip(`${s.name || "User"} · ${s.role}`, s.role);
    if (s.user_id != null) currentUserId = Number(s.user_id);
  }
  setBorrowedTotalDisplay((d.borrowed || []).length);
  paintLane("list-available", d.available || [], "available");
  paintLane("list-borrowed", d.borrowed || [], "borrowed");
  renderTxnRows(d.transactions || []);
}

function paintLane(containerId, items, laneKind) {
  const el = $(containerId);
  el.innerHTML = "";
  const role = $("session-chip").dataset.role;
  const isStudent = role === "student";
  for (const it of items) {
    el.appendChild(resourceCard(it, laneKind, isStudent));
  }
}

function resourceCard(item, laneKind, isStudent) {
  const card = document.createElement("div");
  card.dataset.resourceId = String(item.resource_id);
  card.dataset.lane = laneKind;

  const borrower =
    item.active_borrower && laneKind === "borrowed"
      ? `On loan to ${item.active_borrower.name} (#${item.active_borrower.user_id})`
      : item.status;

  const mine =
    item.active_borrower &&
    currentUserId != null &&
    Number(item.active_borrower.user_id) === Number(currentUserId);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  card.draggable = Boolean(isStudent);
  card.className = isStudent ? "card draggable" : "card readonly";

  if (laneKind === "available" && isStudent) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "btn btn-sm btn-borrow";
    b.textContent = "Borrow";
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      doBorrow(item.resource_id);
    });
    actions.appendChild(b);
  }

  if (laneKind === "borrowed" && isStudent && mine) {
    const r = document.createElement("button");
    r.type = "button";
    r.className = "btn btn-sm btn-return";
    r.textContent = "Return";
    r.addEventListener("click", (e) => {
      e.stopPropagation();
      doReturn(item.resource_id);
    });
    actions.appendChild(r);
  }

  card.innerHTML = `<div class="title">${escapeHtml(item.name)}</div>
    <div class="meta">#${item.resource_id} · ${escapeHtml(
    item.locker_id || ""
  )}<br/>${escapeHtml(borrower)}</div>`;
  card.appendChild(actions);

  card.addEventListener("dragstart", (ev) => {
    ev.dataTransfer.setData("text/plain", String(item.resource_id));
    ev.dataTransfer.setData("application/x-lane", laneKind);
    ev.dataTransfer.effectAllowed = "move";
  });
  return card;
}

function renderTxnRows(rows) {
  const tbody = $("txn-table").querySelector("tbody");
  tbody.innerHTML = "";
  for (const t of rows) {
    const tr = document.createElement("tr");
    const userCell =
      t.user_name != null
        ? `${escapeHtml(t.user_name)} (#${t.user_id})`
        : "—";
    tr.innerHTML = `<td>${t.txn_id}</td><td>${userCell}</td><td>${escapeHtml(
      t.resource_name || ""
    )} (#${t.resource_id})</td><td>${t.action}</td><td>${escapeHtml(
      t.timestamp || ""
    )}</td><td>${escapeHtml(t.due_date || "")}</td>`;
    tbody.appendChild(tr);
  }
}

function setupDnD() {
  for (const id of ["lane-available", "lane-borrowed"]) {
    const lane = $(id);
    lane.addEventListener("dragover", (e) => {
      e.preventDefault();
      lane.classList.add("drag-over");
    });
    lane.addEventListener("dragleave", () => lane.classList.remove("drag-over"));
    lane.addEventListener("drop", async (e) => {
      e.preventDefault();
      lane.classList.remove("drag-over");
      const resourceId = Number(e.dataTransfer.getData("text/plain"));
      const fromLane = e.dataTransfer.getData("application/x-lane");
      const toLane = lane.dataset.lane;
      await handleDrop(resourceId, fromLane, toLane);
    });
  }
}

async function handleDrop(resourceId, fromLane, toLane) {
  if (!Number.isFinite(resourceId) || fromLane === toLane) return;
  const sessionRole = $("session-chip").dataset.role;
  if (!sessionRole) {
    toast("Sign in first", "err");
    return;
  }
  if (sessionRole !== "student") {
    toast("Student session required for drag borrow/return.", "err");
    return;
  }
  if (fromLane === "available" && toLane === "borrowed") await doBorrow(resourceId);
  if (fromLane === "borrowed" && toLane === "available") await doReturn(resourceId);
}

function wireUi() {
  $("btn-seed").addEventListener("click", seedDemo);
  $("btn-refresh").addEventListener("click", refreshBootstrap);
  $("btn-logout").addEventListener("click", logout);
  $("btn-refresh-txns").addEventListener("click", async () => {
    await refreshState();
    toast("Transactions refreshed");
  });
  $("slider-due").addEventListener("input", () => {
    $("label-due").textContent = $("slider-due").value;
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const which = tab.dataset.tab;
      $("out-state").classList.toggle("hidden", which !== "state");
      $("out-raw").classList.toggle("hidden", which !== "raw");
    });
  });
  setupDnD();
}

document.addEventListener("DOMContentLoaded", async () => {
  if (location.protocol === "file:") {
    toast("Open via http://127.0.0.1:5000/student/ (run python app.py).", "err");
  }
  wireUi();
  $("label-due").textContent = $("slider-due").value;
  await refreshBootstrap();
  await refreshState();
});
