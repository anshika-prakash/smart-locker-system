// ============================================================
//  app.js  –  College Resource Platform  |  All Data & Logic
// ============================================================

// ── DUMMY DATA ───────────────────────────────────────────────

const transactions = [
  { id: "TXN001", student: "Rahul Sharma",   rollNo: "CS21001", resource: "Scientific Calculator", type: "Electronics",  borrowDate: "2025-03-01", dueDate: "2025-03-08",  returnDate: null,         status: "borrowed"  },
  { id: "TXN002", student: "Priya Kulkarni", rollNo: "CS21002", resource: "Physics Lab Coat",      type: "Clothing",     borrowDate: "2025-02-28", dueDate: "2025-03-07",  returnDate: "2025-03-05", status: "returned"  },
  { id: "TXN003", student: "Amit Verma",     rollNo: "ME21010", resource: "Drawing Board Kit",     type: "Stationery",   borrowDate: "2025-03-03", dueDate: "2025-03-10",  returnDate: null,         status: "borrowed"  },
  { id: "TXN004", student: "Sneha Patil",    rollNo: "EC21015", resource: "Oscilloscope",           type: "Electronics",  borrowDate: "2025-02-20", dueDate: "2025-02-27",  returnDate: "2025-02-25", status: "returned"  },
  { id: "TXN005", student: "Karan Mehta",    rollNo: "IT21008", resource: "Digital Multimeter",    type: "Electronics",  borrowDate: "2025-03-05", dueDate: "2025-03-12",  returnDate: null,         status: "borrowed"  },
  { id: "TXN006", student: "Divya Joshi",    rollNo: "CS21020", resource: "Breadboard Kit",        type: "Electronics",  borrowDate: "2025-03-02", dueDate: "2025-03-09",  returnDate: "2025-03-07", status: "returned"  },
  { id: "TXN007", student: "Rohan Desai",    rollNo: "ME21033", resource: "Vernier Caliper",       type: "Measurement",  borrowDate: "2025-03-06", dueDate: "2025-03-13",  returnDate: null,         status: "overdue"   },
  { id: "TXN008", student: "Anjali Singh",   rollNo: "CS21041", resource: "Raspberry Pi 4",        type: "Electronics",  borrowDate: "2025-02-25", dueDate: "2025-03-04",  returnDate: "2025-03-04", status: "returned"  },
  { id: "TXN009", student: "Vishal Nair",    rollNo: "EC21022", resource: "Soldering Station",     type: "Electronics",  borrowDate: "2025-03-07", dueDate: "2025-03-14",  returnDate: null,         status: "borrowed"  },
  { id: "TXN010", student: "Pooja Rao",      rollNo: "IT21031", resource: "Arduino Starter Kit",   type: "Electronics",  borrowDate: "2025-02-18", dueDate: "2025-02-25",  returnDate: null,         status: "overdue"   },
];

const materials = [
  { id: 1,  title: "Data Structures & Algorithms – Complete Notes",   subject: "CSE",  semester: 3, tags: ["DSA", "Trees", "Graphs", "Sorting"],        votes: 242, uploadDate: "2025-01-15", uploader: "Priya K.",    fileType: "PDF"  },
  { id: 2,  title: "Digital Electronics Lab Manual",                   subject: "ECE",  semester: 4, tags: ["Logic Gates", "Flip-flops", "Counters"],      votes: 178, uploadDate: "2025-01-20", uploader: "Rahul S.",    fileType: "PDF"  },
  { id: 3,  title: "Engineering Mathematics – Unit 3 (Laplace)",       subject: "MATH", semester: 2, tags: ["Laplace", "Transforms", "Integration"],       votes: 315, uploadDate: "2025-02-01", uploader: "Amit V.",     fileType: "PDF"  },
  { id: 4,  title: "Object Oriented Programming – Java Cheatsheet",    subject: "CSE",  semester: 2, tags: ["Java", "OOP", "Polymorphism"],                 votes: 198, uploadDate: "2025-02-10", uploader: "Sneha P.",    fileType: "DOCX" },
  { id: 5,  title: "Thermodynamics – Cycle Analysis",                  subject: "MECH", semester: 5, tags: ["Rankine", "Carnot", "Entropy"],               votes: 134, uploadDate: "2025-02-14", uploader: "Karan M.",    fileType: "PDF"  },
  { id: 6,  title: "Computer Networks – OSI Model & Protocols",        subject: "CSE",  semester: 5, tags: ["OSI", "TCP/IP", "HTTP", "DNS"],               votes: 289, uploadDate: "2025-02-18", uploader: "Divya J.",    fileType: "PDF"  },
  { id: 7,  title: "Control Systems – Bode Plot Practice Problems",    subject: "ECE",  semester: 6, tags: ["Bode", "Nyquist", "Stability"],               votes: 112, uploadDate: "2025-02-22", uploader: "Rohan D.",    fileType: "PDF"  },
  { id: 8,  title: "DBMS – SQL Query Bank (50 Questions)",             subject: "CSE",  semester: 4, tags: ["SQL", "Joins", "Normalization", "Indexing"],  votes: 401, uploadDate: "2025-03-01", uploader: "Anjali S.",   fileType: "DOCX" },
  { id: 9,  title: "Fluid Mechanics – Solved Numericals",              subject: "MECH", semester: 4, tags: ["Bernoulli", "Flow", "Viscosity"],             votes: 87,  uploadDate: "2025-03-03", uploader: "Vishal N.",   fileType: "PDF"  },
  { id: 10, title: "Machine Learning – Regression & Classification",   subject: "CSE",  semester: 7, tags: ["ML", "Regression", "SVM", "Neural Net"],      votes: 356, uploadDate: "2025-03-05", uploader: "Pooja R.",    fileType: "PDF"  },
  { id: 11, title: "Signals & Systems – Unit 1 Summary",              subject: "ECE",  semester: 3, tags: ["Fourier", "Convolution", "LTI"],              votes: 145, uploadDate: "2025-03-07", uploader: "Rahul S.",    fileType: "PDF"  },
  { id: 12, title: "Engineering Drawing – Projection Methods",         subject: "MECH", semester: 1, tags: ["Orthographic", "Isometric", "Section"],       votes: 93,  uploadDate: "2025-03-09", uploader: "Karan M.",    fileType: "PDF"  },
];

const historyData = [
  { date: "2025-03-07", event: "Returned",  resource: "Breadboard Kit",       txnId: "TXN006", note: "Returned in good condition."        },
  { date: "2025-03-05", event: "Returned",  resource: "Physics Lab Coat",     txnId: "TXN002", note: "Returned on time."                  },
  { date: "2025-03-05", event: "Borrowed",  resource: "Digital Multimeter",   txnId: "TXN005", note: "Due by 2025-03-12."                 },
  { date: "2025-03-04", event: "Returned",  resource: "Raspberry Pi 4",       txnId: "TXN008", note: "Returned on due date."              },
  { date: "2025-03-03", event: "Borrowed",  resource: "Drawing Board Kit",    txnId: "TXN003", note: "Due by 2025-03-10."                 },
  { date: "2025-03-02", event: "Borrowed",  resource: "Breadboard Kit",       txnId: "TXN006", note: "Issued for circuit lab assignment." },
  { date: "2025-03-01", event: "Borrowed",  resource: "Scientific Calculator",txnId: "TXN001", note: "Issued for exam week."              },
  { date: "2025-02-28", event: "Borrowed",  resource: "Physics Lab Coat",     txnId: "TXN002", note: "Issued for lab session."            },
  { date: "2025-02-25", event: "Returned",  resource: "Oscilloscope",         txnId: "TXN004", note: "Returned early."                   },
  { date: "2025-02-25", event: "Borrowed",  resource: "Raspberry Pi 4",       txnId: "TXN008", note: "Issued for IoT project."            },
  { date: "2025-02-20", event: "Borrowed",  resource: "Oscilloscope",         txnId: "TXN004", note: "Issued for ECE lab."                },
  { date: "2025-02-18", event: "Borrowed",  resource: "Arduino Starter Kit",  txnId: "TXN010", note: "Issued for mini project work."      },
];

// ── HELPERS ──────────────────────────────────────────────────

function statusBadge(status) {
  const map = {
    borrowed: "bg-primary",
    returned: "bg-success",
    overdue:  "bg-danger",
  };
  return `<span class="badge ${map[status] || "bg-secondary"} text-capitalize">${status}</span>`;
}

function eventBadge(event) {
  return event === "Borrowed"
    ? `<span class="badge bg-primary">${event}</span>`
    : `<span class="badge bg-success">${event}</span>`;
}

function fileTypeBadge(type) {
  return type === "PDF"
    ? `<span class="badge bg-danger">${type}</span>`
    : `<span class="badge bg-info text-dark">${type}</span>`;
}

function tagsHtml(tags) {
  return tags.map(t => `<span class="badge bg-secondary me-1">${t}</span>`).join("");
}

function formatDate(str) {
  if (!str) return "—";
  const d = new Date(str);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── DASHBOARD ────────────────────────────────────────────────

function loadDashboard() {
  const totalResources = 48;
  const borrowed   = transactions.filter(t => t.status === "borrowed").length;
  const overdue    = transactions.filter(t => t.status === "overdue").length;
  const available  = totalResources - borrowed - overdue;
  const totalMats  = materials.length;

  setEl("stat-total",     totalResources);
  setEl("stat-borrowed",  borrowed + overdue);
  setEl("stat-available", available);
  setEl("stat-materials", totalMats);

  // Recent transactions
  const tbody = document.getElementById("recent-txn");
  if (!tbody) return;
  transactions.slice(0, 5).forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><code>${t.id}</code></td>
        <td>${t.student}</td>
        <td>${t.resource}</td>
        <td>${formatDate(t.borrowDate)}</td>
        <td>${statusBadge(t.status)}</td>
      </tr>`;
  });

  // Top materials
  const matList = document.getElementById("top-materials");
  if (!matList) return;
  [...materials].sort((a, b) => b.votes - a.votes).slice(0, 5).forEach(m => {
    matList.innerHTML += `
      <li class="list-group-item d-flex justify-content-between align-items-center bg-transparent border-secondary text-body">
        <span><i class="bi bi-file-earmark-text me-2 text-primary"></i>${m.title}</span>
        <span class="badge bg-warning text-dark rounded-pill"><i class="bi bi-hand-thumbs-up-fill me-1"></i>${m.votes}</span>
      </li>`;
  });
}

// ── TRANSACTIONS ─────────────────────────────────────────────

let txnData = [...transactions];
let selectedTxn = null;

function renderTransactions(data) {
  const tbody = document.getElementById("txn-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted py-4">No records found.</td></tr>`;
    return;
  }
  data.forEach(t => {
    tbody.innerHTML += `
      <tr>
        <td><code>${t.id}</code></td>
        <td>${t.student}<br><small class="text-muted">${t.rollNo}</small></td>
        <td>${t.resource}</td>
        <td><span class="badge bg-info text-dark">${t.type}</span></td>
        <td>${formatDate(t.borrowDate)}</td>
        <td>${formatDate(t.dueDate)}</td>
        <td>${formatDate(t.returnDate)}</td>
        <td>${statusBadge(t.status)}</td>
      </tr>`;
  });
}

function filterTransactions() {
  const query  = (document.getElementById("txn-search")?.value || "").toLowerCase();
  const status = document.getElementById("txn-filter")?.value || "all";
  const result = transactions.filter(t => {
    const matchQuery  = !query || t.student.toLowerCase().includes(query) ||
                        t.resource.toLowerCase().includes(query) || t.id.toLowerCase().includes(query);
    const matchStatus = status === "all" || t.status === status;
    return matchQuery && matchStatus;
  });
  renderTransactions(result);
}

function loadTransactions() {
  renderTransactions(transactions);
  document.getElementById("txn-search")?.addEventListener("input", filterTransactions);
  document.getElementById("txn-filter")?.addEventListener("change", filterTransactions);
  updateTxnCounts();
}

function updateTxnCounts() {
  setEl("count-all",      transactions.length);
  setEl("count-borrowed", transactions.filter(t => t.status === "borrowed").length);
  setEl("count-returned", transactions.filter(t => t.status === "returned").length);
  setEl("count-overdue",  transactions.filter(t => t.status === "overdue").length);
}

function showBorrowModal() {
  const modal = new bootstrap.Modal(document.getElementById("borrowModal"));
  modal.show();
}
function confirmBorrow() {
  const name     = document.getElementById("borrow-name")?.value.trim();
  const resource = document.getElementById("borrow-resource")?.value.trim();
  if (!name || !resource) { alert("Please fill all fields."); return; }
  bootstrap.Modal.getInstance(document.getElementById("borrowModal")).hide();
  showSuccessToast(`✅ "${resource}" borrowed by ${name} successfully!`);
}

function showReturnModal() {
  const modal = new bootstrap.Modal(document.getElementById("returnModal"));
  modal.show();
}
function confirmReturn() {
  const txnId = document.getElementById("return-txnid")?.value.trim();
  if (!txnId) { alert("Please enter a Transaction ID."); return; }
  bootstrap.Modal.getInstance(document.getElementById("returnModal")).hide();
  showSuccessToast(`✅ Transaction ${txnId} marked as returned!`);
}

// ── MATERIALS ────────────────────────────────────────────────

let matVotes = {};
materials.forEach(m => { matVotes[m.id] = m.votes; });

function renderMaterials(data) {
  const grid = document.getElementById("mat-grid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!data.length) {
    grid.innerHTML = `<div class="col-12 text-center text-muted py-5">No materials found.</div>`;
    return;
  }
  data.forEach(m => {
    grid.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 border-secondary shadow-sm">
          <div class="card-header d-flex justify-content-between align-items-center border-secondary">
            ${fileTypeBadge(m.fileType)}
            <small class="text-muted">${formatDate(m.uploadDate)}</small>
          </div>
          <div class="card-body">
            <h6 class="card-title fw-semibold">${m.title}</h6>
            <p class="mb-2">
              <span class="badge bg-primary me-1">${m.subject}</span>
              <span class="badge bg-secondary">Sem ${m.semester}</span>
            </p>
            <div class="mb-2">${tagsHtml(m.tags)}</div>
            <small class="text-muted">Uploaded by <strong>${m.uploader}</strong></small>
          </div>
          <div class="card-footer border-secondary d-flex justify-content-between align-items-center">
            <button class="btn btn-sm btn-outline-success" onclick="upvoteMaterial(${m.id})">
              <i class="bi bi-hand-thumbs-up-fill me-1"></i>
              <span id="vote-${m.id}">${matVotes[m.id]}</span>
            </button>
            <button class="btn btn-sm btn-primary" onclick="downloadMaterial('${m.title}')">
              <i class="bi bi-download me-1"></i>Download
            </button>
          </div>
        </div>
      </div>`;
  });
}

function filterMaterials() {
  const query    = (document.getElementById("mat-search")?.value || "").toLowerCase();
  const subject  = document.getElementById("mat-subject")?.value  || "all";
  const semester = document.getElementById("mat-semester")?.value || "all";
  const sortBy   = document.getElementById("mat-sort")?.value     || "votes";

  let result = materials.filter(m => {
    const matchQ = !query || m.title.toLowerCase().includes(query) ||
                   m.tags.some(t => t.toLowerCase().includes(query));
    const matchS = subject  === "all" || m.subject  === subject;
    const matchSem = semester === "all" || String(m.semester) === semester;
    return matchQ && matchS && matchSem;
  });

  result = result.sort((a, b) =>
    sortBy === "votes"
      ? (matVotes[b.id] - matVotes[a.id])
      : (new Date(b.uploadDate) - new Date(a.uploadDate))
  );

  renderMaterials(result);
}

function upvoteMaterial(id) {
  matVotes[id] = (matVotes[id] || 0) + 1;
  const el = document.getElementById(`vote-${id}`);
  if (el) el.textContent = matVotes[id];
  showSuccessToast("👍 Upvote recorded!");
}

function downloadMaterial(title) {
  showSuccessToast(`⬇️ Downloading "${title}"...`);
}

function loadMaterials() {
  filterMaterials();
  ["mat-search", "mat-subject", "mat-semester", "mat-sort"].forEach(id => {
    document.getElementById(id)?.addEventListener("change", filterMaterials);
    document.getElementById(id)?.addEventListener("input",  filterMaterials);
  });
}

// ── UPLOAD ───────────────────────────────────────────────────

function handleUpload(e) {
  e.preventDefault();
  const title = document.getElementById("upload-title")?.value.trim();
  if (!title) return;
  const modal = new bootstrap.Modal(document.getElementById("uploadSuccessModal"));
  document.getElementById("uploaded-title").textContent = title;
  modal.show();
  e.target.reset();
  document.getElementById("tag-preview").innerHTML = "";
  tagList = [];
}

let tagList = [];
function addTag() {
  const input = document.getElementById("tag-input");
  const val = input?.value.trim();
  if (!val || tagList.includes(val)) { input.value = ""; return; }
  tagList.push(val);
  input.value = "";
  renderTags();
}
function removeTag(tag) {
  tagList = tagList.filter(t => t !== tag);
  renderTags();
}
function renderTags() {
  const preview = document.getElementById("tag-preview");
  if (!preview) return;
  preview.innerHTML = tagList.map(t =>
    `<span class="badge bg-secondary me-1 mb-1" style="cursor:pointer" onclick="removeTag('${t}')">${t} ×</span>`
  ).join("");
}

// ── HISTORY ──────────────────────────────────────────────────

function loadHistory() {
  const tbody = document.getElementById("history-tbody");
  if (!tbody) return;
  historyData.forEach((h, i) => {
    tbody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${formatDate(h.date)}</td>
        <td>${eventBadge(h.event)}</td>
        <td>${h.resource}</td>
        <td><code>${h.txnId}</code></td>
        <td>${h.note}</td>
      </tr>`;
  });

  const timeline = document.getElementById("history-timeline");
  if (!timeline) return;
  historyData.forEach(h => {
    const isReturn = h.event === "Returned";
    timeline.innerHTML += `
      <div class="d-flex gap-3 mb-3">
        <div class="d-flex flex-column align-items-center">
          <div class="rounded-circle ${isReturn ? "bg-success" : "bg-primary"} d-flex align-items-center justify-content-center" style="width:36px;height:36px;min-width:36px;">
            <i class="bi ${isReturn ? "bi-arrow-return-left" : "bi-box-arrow-in-right"} text-white"></i>
          </div>
          <div class="border-start border-secondary flex-grow-1 mt-1" style="width:2px;"></div>
        </div>
        <div class="card border-secondary w-100 mb-1">
          <div class="card-body py-2 px-3">
            <div class="d-flex justify-content-between">
              <strong>${h.resource}</strong>
              ${eventBadge(h.event)}
            </div>
            <small class="text-muted">${formatDate(h.date)} · <code>${h.txnId}</code></small>
            <p class="mb-0 mt-1 small">${h.note}</p>
          </div>
        </div>
      </div>`;
  });
}

function filterHistory() {
  const query = (document.getElementById("history-search")?.value || "").toLowerCase();
  const type  = document.getElementById("history-filter")?.value || "all";
  const rows  = document.querySelectorAll("#history-tbody tr");
  rows.forEach(row => {
    const text  = row.textContent.toLowerCase();
    const event = row.children[2]?.textContent.trim().toLowerCase();
    const matchQ = !query || text.includes(query);
    const matchT = type === "all" || event.includes(type.toLowerCase());
    row.style.display = matchQ && matchT ? "" : "none";
  });
}

// ── UTILS ────────────────────────────────────────────────────

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showSuccessToast(msg) {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const id = "toast-" + Date.now();
  container.innerHTML += `
    <div id="${id}" class="toast align-items-center text-bg-success border-0 mb-2" role="alert" aria-live="assertive">
      <div class="d-flex">
        <div class="toast-body fw-semibold">${msg}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`;
  const el = document.getElementById(id);
  const toast = new bootstrap.Toast(el, { delay: 3500 });
  toast.show();
  el.addEventListener("hidden.bs.toast", () => el.remove());
}

// ── INIT ─────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
  loadTransactions();
  loadMaterials();
  loadHistory();

  // Upload form
  const uploadForm = document.getElementById("upload-form");
  if (uploadForm) uploadForm.addEventListener("submit", handleUpload);

  // Tag input Enter key
  document.getElementById("tag-input")?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); addTag(); }
  });

  // History search/filter
  document.getElementById("history-search")?.addEventListener("input",  filterHistory);
  document.getElementById("history-filter")?.addEventListener("change", filterHistory);

  // Set active nav link
  const page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === page) link.classList.add("active");
  });
});