/**
 * Admin portal: admin preset, add-resources, read-only lanes, GET /transactions table.
 * Depends on /static/shared/api.js (window.ResourceLabApi).
 */
const { $, apiJson, toast, escapeHtml } = window.ResourceLabApi;

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

/** Only admin presets on this portal. */
function renderPresets(accounts) {
  const grid = $("preset-buttons");
  grid.innerHTML = "";
  const labels = { admin_main: "Demo Admin" };
  const admins = (accounts || []).filter((a) => a.role === "admin");
  for (const acc of admins) {
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
  const disabled = admins.length === 0;
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
  if (body.data.role !== "admin") {
    toast("This portal is for admins only.", "err");
    return;
  }
  toast(`Signed in as ${body.data.name} (${body.data.role})`);
  $("btn-logout").disabled = false;
  setSessionChip(`${body.data.name} · ${body.data.role}`, body.data.role);
  await refreshAll();
}

async function logout() {
  const { body } = await apiJson("/demo/logout", { method: "POST", body: "{}" });
  if (body.success) toast("Logged out");
  $("btn-logout").disabled = true;
  setSessionChip("Not signed in", "");
  await refreshAll();
}

/** Read-only resource cards (no drag, no borrow/return). */
function paintLane(containerId, items, laneKind) {
  const el = $(containerId);
  el.innerHTML = "";
  for (const it of items) {
    const card = document.createElement("div");
    card.className = "card readonly";
    card.draggable = false;
    const borrower =
      it.active_borrower && laneKind === "borrowed"
        ? `On loan to ${it.active_borrower.name} (#${it.active_borrower.user_id})`
        : it.status;
    card.innerHTML = `<div class="title">${escapeHtml(it.name)}</div>
      <div class="meta">#${it.resource_id} · ${escapeHtml(
      it.locker_id || ""
    )}<br/>${escapeHtml(borrower)}</div>`;
    el.appendChild(card);
  }
}

async function refreshState() {
  const { res, body } = await apiJson("/demo/state", { method: "GET" });
  if (res.status === 401) {
    $("list-available").innerHTML = "";
    $("list-borrowed").innerHTML = "";
    setSessionChip("Not signed in", "");
    $("btn-logout").disabled = true;
    setBorrowedTotalDisplay(null);
    renderAvailableRemovalList([]);
    $("out-state").textContent = JSON.stringify(body, null, 2);
    return;
  }
  if (!body.success) {
    toast(body.message || "State failed", "err");
    renderAvailableRemovalList([]);
    return;
  }
  $("out-state").textContent = JSON.stringify(body, null, 2);
  const d = body.data;
  if (d.session) {
    const s = d.session;
    $("btn-logout").disabled = false;
    setSessionChip(`${s.name || "User"} · ${s.role}`, s.role);
  }
  setBorrowedTotalDisplay((d.borrowed || []).length);
  paintLane("list-available", d.available || [], "available");
  paintLane("list-borrowed", d.borrowed || [], "borrowed");
  renderAvailableRemovalList(d.available || []);
}

/** Checklist of available resource_ids for admin bulk delete. */
function renderAvailableRemovalList(items) {
  const host = $("available-removal-list");
  host.innerHTML = "";
  if (!items.length) {
    const p = document.createElement("p");
    p.className = "hint";
    p.style.margin = "0.25rem 0";
    p.textContent = "No available resources right now.";
    host.appendChild(p);
    return;
  }
  for (const it of items) {
    const label = document.createElement("label");
    label.className = "check-row";
    const id = Number(it.resource_id);
    label.innerHTML = `<input type="checkbox" name="avail-del" value="${id}" />
      <span><strong>#${id}</strong> — ${escapeHtml(it.name)}<span class="check-meta"> · ${escapeHtml(
      it.locker_id || ""
    )}</span></span>`;
    host.appendChild(label);
  }
}

function selectedAvailableIds() {
  return Array.from(
    document.querySelectorAll('#available-removal-list input[name="avail-del"]:checked')
  ).map((el) => Number(el.value));
}

async function removeSelectedAvailable() {
  const ids = selectedAvailableIds();
  if (!ids.length) {
    toast("Select at least one available resource", "err");
    return;
  }
  if (!confirm(`Delete ${ids.length} available resource(s) from the database? This cannot be undone.`)) {
    return;
  }
  const { body } = await apiJson("/demo/remove-available-resources", {
    method: "POST",
    body: JSON.stringify({ resource_ids: ids }),
  });
  if (body.success) toast(body.message || "Removed");
  else toast(body.message || "Remove failed", "err");
  await refreshAll();
}

function renderFullTxnRows(rows) {
  const tbody = $("txn-table-admin").querySelector("tbody");
  tbody.innerHTML = "";
  if (!rows || rows.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="6" class="meta">No rows (sign in as admin).</td>`;
    tbody.appendChild(tr);
    return;
  }
  for (const t of rows) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${t.txn_id}</td><td>${escapeHtml(
      t.user_name || ""
    )} (#${t.user_id})</td><td>${escapeHtml(t.resource_name || "")} (#${
      t.resource_id
    })</td><td>${t.action}</td><td>${escapeHtml(t.timestamp || "")}</td><td>${escapeHtml(
      t.due_date || ""
    )}</td>`;
    tbody.appendChild(tr);
  }
}

async function refreshTransactions() {
  const { res, body } = await apiJson("/transactions", { method: "GET" });
  if (res.status === 401) {
    renderFullTxnRows([]);
    return;
  }
  if (!body.success) {
    renderFullTxnRows([]);
    if (res.status !== 403) toast(body.message || "Could not load transactions", "err");
    return;
  }
  renderFullTxnRows(body.data || []);
}

async function refreshAll() {
  await refreshState();
  await refreshTransactions();
}

function wireUi() {
  $("btn-seed").addEventListener("click", seedDemo);
  $("btn-refresh").addEventListener("click", refreshBootstrap);
  $("btn-logout").addEventListener("click", logout);
  $("btn-refresh-txns").addEventListener("click", async () => {
    await refreshAll();
    toast("Transactions refreshed");
  });
  $("btn-avail-select-all").addEventListener("click", () => {
    document
      .querySelectorAll('#available-removal-list input[name="avail-del"]')
      .forEach((el) => {
        el.checked = true;
      });
  });
  $("btn-avail-select-none").addEventListener("click", () => {
    document
      .querySelectorAll('#available-removal-list input[name="avail-del"]')
      .forEach((el) => {
        el.checked = false;
      });
  });
  $("btn-avail-remove-selected").addEventListener("click", removeSelectedAvailable);
  $("slider-add-res").addEventListener("input", () => {
    $("label-add-res").textContent = $("slider-add-res").value;
  });
  $("btn-add-resources").addEventListener("click", async () => {
    const count = Number($("slider-add-res").value);
    const { body } = await apiJson("/demo/add-resources", {
      method: "POST",
      body: JSON.stringify({ count }),
    });
    if (body.success) toast(body.message || "Added resources");
    else toast(body.message || "Add failed", "err");
    await refreshAll();
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
}

document.addEventListener("DOMContentLoaded", async () => {
  if (location.protocol === "file:") {
    toast("Open via http://127.0.0.1:5000/admin/ (run python app.py).", "err");
  }
  wireUi();
  $("label-add-res").textContent = $("slider-add-res").value;
  await refreshBootstrap();
  await refreshAll();
});
