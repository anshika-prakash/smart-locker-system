/**
 * Shared helpers for the student and admin lab pages (session cookie + JSON API).
 * Loaded before each portal’s page-specific script.
 */
(function (global) {
  /** @type {any} */
  let lastRawResponse = null;

  function $(id) {
    const el = document.getElementById(id);
    if (!el) throw new Error(`Missing #${id}`);
    return el;
  }

  function apiHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  function writeRawPanel(payload) {
    const raw = document.getElementById("out-raw");
    if (raw) raw.textContent = JSON.stringify(payload, null, 2);
  }

  async function apiJson(path, options = {}) {
    let res;
    try {
      res = await fetch(path, {
        credentials: "include",
        headers: apiHeaders(),
        ...options,
      });
    } catch (e) {
      const body = {
        success: false,
        message: `Network error: ${e instanceof Error ? e.message : String(e)}`,
        hint: "Run `python app.py` and open the app from http://127.0.0.1:5000/ (same origin).",
      };
      lastRawResponse = { path, status: 0, body };
      writeRawPanel(lastRawResponse);
      return { res: { status: 0 }, body };
    }

    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";
    let body = null;
    try {
      body = text ? JSON.parse(text) : {};
    } catch {
      const isHtml = contentType.includes("html") || /^\s*</.test(text);
      body = {
        success: false,
        message: isHtml
          ? "Server returned HTML instead of JSON (often a Flask error page). Use the Flask URL, not a file:// path."
          : "Response was not valid JSON.",
        status: res.status,
        contentType,
        preview: text.slice(0, 500),
      };
    }
    lastRawResponse = { path, status: res.status, body };
    writeRawPanel(lastRawResponse);
    return { res, body };
  }

  function toast(message, type = "ok") {
    const host = document.getElementById("toasts");
    if (!host) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    host.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  global.ResourceLabApi = {
    $,
    apiJson,
    toast,
    escapeHtml,
    get lastRawResponse() {
      return lastRawResponse;
    },
  };
})(window);
