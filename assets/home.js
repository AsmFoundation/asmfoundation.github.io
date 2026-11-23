// The home page: fills the opcode table, then builds the seal with the animation the page's head script
// picked for this visit (see pages/index.html). Runs at the end of <body>, after opcodes.js and seal.js.
"use strict";
(() => {
  const table = document.getElementById("op"), readout = document.getElementById("readout");
  if (!table || !readout) return;
  buildOpcodeTable(table, readout);
  // the letter count in the note is measured, not typed: it is every non-space character of the 256 cells
  const n = [...table.querySelectorAll("td")].reduce((s, td) => s + td.textContent.replace(/\s/g, "").length, 0);
  const count = n.toLocaleString("en-US");
  document.getElementById("count").textContent = count;
  const cap = document.getElementById("cap");
  const variant = document.documentElement.getAttribute("data-seal") || "static";

  /**
   * Keeps the caption and the readout in step with what the stage shows.
   * @param {"seal"|"table"} m The mode the seal just entered.
   * @returns {void}
   */
  function onMode(m) {
    cap.textContent = m === "seal" ? "The same letters, assembled" : "One-byte opcode map, 64-bit mode";
    readout.innerHTML = m === "seal"
      ? `<div class="hex">A</div><div class="what"><strong>${count} letters, one seal</strong>The ring spells our name; the A is the rest of the table, read left to right.<span class="use">Read the table to send every letter back to its instruction.</span></div>`
      : `<div class="hex">00</div><div class="what"><strong>The opcode map</strong>Hover, or tab in and use the arrow keys, to read any instruction.<span class="use">Row = the byte's high digit, column = its low digit.</span></div>`;
  }

  // the captions match the first thing shown at once: the table for the swirl, the seal for the others
  onMode(variant === "swirl" ? "table" : "seal");
  // the seal measures the table's text in its real fonts: wait for them, or every letter lands off its cell
  document.fonts.ready.then(() => buildSeal(document.getElementById("stage"), table,
    { toggle: document.getElementById("mode"), replay: document.getElementById("replay"), onMode }, variant));
})();
