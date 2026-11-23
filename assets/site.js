// Behaviour shared by the site's pages. Each part looks for its own elements and does nothing without them,
// so one file serves every page; the pages read fully without it (it adds convenience, never content).
"use strict";
(() => {
  // ---------------------------------------------------------------------------------------- Copy buttons
  // Every command block carries the exact text to copy in data-copy (prompts and output lines removed at build time).
  document.querySelectorAll("pre.cmd[data-copy]").forEach(pre => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "copy"; b.textContent = "Copy";
    b.addEventListener("click", () => copy(pre.dataset.copy).then(ok => flash(b, ok ? "Copied" : "Press Ctrl+C")));
    pre.appendChild(b);
  });

  /**
   * Copies text to the clipboard, falling back to a hidden text area where the Clipboard API is unavailable
   * (a page opened from disk, an old browser).
   * @param {string} text The text to copy.
   * @returns {Promise<boolean>} True when the text reached the clipboard.
   */
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(() => true, () => false);
    const area = document.createElement("textarea");
    area.value = text; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
    document.body.appendChild(area); area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    area.remove();
    return Promise.resolve(ok);
  }

  /**
   * Shows a short confirmation on a button, then restores its label.
   * @param {HTMLButtonElement} b The button.
   * @param {string} text The confirmation.
   * @returns {void}
   */
  function flash(b, text) { b.textContent = text; setTimeout(() => { b.textContent = "Copy"; }, 1400); }

  // ---------------------------------------------------------------------------------------- Evidence tooltips
  document.querySelectorAll(".chart").forEach(chart => {
    const tip = document.createElement("div"); tip.className = "tip"; tip.setAttribute("aria-hidden", "true");
    chart.appendChild(tip);
    chart.addEventListener("mousemove", e => {
      const track = e.target.closest(".track");
      if (!track) { tip.style.display = "none"; return; }
      const r = chart.getBoundingClientRect();
      tip.textContent = track.dataset.tip;
      tip.style.display = "block"; tip.style.left = (e.clientX - r.left + 12) + "px"; tip.style.top = (e.clientY - r.top - 34) + "px";
    });
    chart.addEventListener("mouseleave", () => { tip.style.display = "none"; });
  });

  // ---------------------------------------------------------------------------------------- Map readout
  const ro = document.getElementById("ro");
  if (ro) document.querySelectorAll(".room").forEach(room => {
    /** Shows this room's description, "Name: text", in the readout. @returns {void} */
    const show = () => {
      const d = room.dataset.d, i = d.indexOf(": ");
      ro.replaceChildren(Object.assign(document.createElement("b"), { textContent: d.slice(0, i) }), Object.assign(document.createElement("span"), { textContent: d.slice(i + 2) }));
    };
    room.addEventListener("mouseenter", show); room.addEventListener("focus", show);
  });

  // ---------------------------------------------------------------------------------------- About log filters
  const log = document.querySelector("ol.log");
  if (log) {
    const state = { show: "all", repo: "" }, rows = [...log.children], shown = document.getElementById("log-shown");
    /** Hides the rows the two filters exclude and says how many remain. @returns {void} */
    const apply = () => {
      let n = 0;
      rows.forEach(li => { li.hidden = (state.show === "ms" && !li.dataset.ms) || (state.repo !== "" && li.dataset.repo !== state.repo); if (!li.hidden) n++; });
      if (shown) shown.textContent = n === rows.length ? "" : `Showing ${n.toLocaleString("en-US")}.`;
    };
    document.querySelectorAll(".log-tools button").forEach(b => b.addEventListener("click", () => {
      const key = "show" in b.dataset ? "show" : "repo";
      state[key] = b.dataset[key];
      b.parentElement.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
      apply();
    }));
  }

  // ---------------------------------------------------------------------------------------- Get started menu
  // The menu stays at the top right (CSS sticky). This marks the step being read and opens its section's list,
  // so a long page keeps a short menu: only the current section shows its steps.
  const menu = document.querySelector(".gs-menu");
  if (menu && "IntersectionObserver" in window) {
    const links = new Map([...menu.querySelectorAll("a[href^='#']")].map(a => [a.getAttribute("href").slice(1), a]));
    /**
     * Marks one step (or section) current in the menu.
     * @param {string} id The fragment id of the step or section now being read.
     * @returns {void}
     */
    const mark = id => {
      const a = links.get(id); if (!a) return;
      menu.querySelectorAll("a[aria-current]").forEach(x => x.removeAttribute("aria-current"));
      a.setAttribute("aria-current", "true");
      const sec = id.split("--")[0];
      menu.querySelectorAll("li[data-sec]").forEach(li => li.classList.toggle("open", li.dataset.sec === sec));
      // keep the current entry in view when the menu itself scrolls
      if (menu.scrollHeight > menu.clientHeight) a.scrollIntoView({ block: "nearest" });
    };
    // a step counts as being read once it crosses the upper fifth of the window
    const io = new IntersectionObserver(es => es.filter(e => e.isIntersecting).forEach(e => mark(e.target.id)), { rootMargin: "-18% 0px -72% 0px" });
    document.querySelectorAll(".gs-sec, .step").forEach(el => io.observe(el));
    const first = document.querySelector(".gs-sec");
    if (first) mark(first.id);
  }
})();
