// The x86-64 one-byte opcode map (64-bit mode) for the home page, with the logo's A drawn on it.
// Sources: Intel SDM volume 2, appendix A (opcode map and operand notation). The hero is about assembly
// language itself, so nothing here describes any one program.
"use strict";

/**
 * The 256 one-byte opcodes, in byte order: m = mnemonic ("" for a byte that is invalid in 64-bit mode),
 * o = operands in the SDM's notation, or "prefix", "escape", "2-byte".
 * @type {{m: string, o: string}[]}
 */
const OP = (() => {
  /** One opcode's entry. @param {string} m The mnemonic. @param {string} o The operands. @returns {{m: string, o: string}} The entry. */
  const row = (m, o) => ({ m, o });
  const R = [];
  /** The six classic forms of an ALU family, in the map's order. @param {string} n The mnemonic. @returns {{m: string, o: string}[]} Six entries. */
  const alu = (n) => [row(n, "Eb,Gb"), row(n, "Ev,Gv"), row(n, "Gb,Eb"), row(n, "Gv,Ev"), row(n, "AL,Ib"), row(n, "rAX,Iz")];
  const inv = row("", "i64");
  // rows 0-3: the eight ALU families, with the legacy slots that 64-bit mode removed
  R.push(...alu("ADD"), inv, inv, ...alu("OR"), inv, row("0F", "2-byte"));
  R.push(...alu("ADC"), inv, inv, ...alu("SBB"), inv, inv);
  R.push(...alu("AND"), row("ES:", "prefix"), inv, ...alu("SUB"), row("CS:", "prefix"), inv);
  R.push(...alu("XOR"), row("SS:", "prefix"), inv, ...alu("CMP"), row("DS:", "prefix"), inv);
  // row 4: in 64-bit mode the old INC/DEC bytes are the sixteen REX prefixes
  ["", "B", "X", "XB", "R", "RB", "RX", "RXB", "W", "WB", "WX", "WXB", "WR", "WRB", "WRX", "WRXB"].forEach(s => R.push(row("REX", s || "prefix")));
  const regs = ["rAX/r8", "rCX/r9", "rDX/r10", "rBX/r11", "rSP/r12", "rBP/r13", "rSI/r14", "rDI/r15"];
  regs.forEach(r => R.push(row("PUSH", r))); regs.forEach(r => R.push(row("POP", r)));
  R.push(inv, inv, row("EVEX", "prefix"), row("MOVSXD", "Gv,Ed"), row("FS:", "prefix"), row("GS:", "prefix"), row("66", "prefix"), row("67", "prefix"),
         row("PUSH", "Iz"), row("IMUL", "Gv,Ev,Iz"), row("PUSH", "Ib"), row("IMUL", "Gv,Ev,Ib"), row("INS", "Yb,DX"), row("INS", "Yz,DX"), row("OUTS", "DX,Xb"), row("OUTS", "DX,Xz"));
  ["JO", "JNO", "JB", "JAE", "JE", "JNE", "JBE", "JA", "JS", "JNS", "JP", "JNP", "JL", "JGE", "JLE", "JG"].forEach(j => R.push(row(j, "Jb")));
  R.push(row("GRP1", "Eb,Ib"), row("GRP1", "Ev,Iz"), inv, row("GRP1", "Ev,Ib"), row("TEST", "Eb,Gb"), row("TEST", "Ev,Gv"), row("XCHG", "Eb,Gb"), row("XCHG", "Ev,Gv"),
         row("MOV", "Eb,Gb"), row("MOV", "Ev,Gv"), row("MOV", "Gb,Eb"), row("MOV", "Gv,Ev"), row("MOV", "Ev,Sw"), row("LEA", "Gv,M"), row("MOV", "Sw,Ew"), row("POP", "Ev"));
  R.push(row("NOP", ""), ...regs.slice(1).map(r => row("XCHG", r.split("/")[0] + ",rAX")), row("CDQE", ""), row("CQO", ""), inv, row("FWAIT", ""), row("PUSHF", ""), row("POPF", ""), row("SAHF", ""), row("LAHF", ""));
  R.push(row("MOV", "AL,Ob"), row("MOV", "rAX,Ov"), row("MOV", "Ob,AL"), row("MOV", "Ov,rAX"), row("MOVS", "b"), row("MOVS", "w/d/q"), row("CMPS", "b"), row("CMPS", "w/d/q"),
         row("TEST", "AL,Ib"), row("TEST", "rAX,Iz"), row("STOS", "b"), row("STOS", "w/d/q"), row("LODS", "b"), row("LODS", "w/d/q"), row("SCAS", "b"), row("SCAS", "w/d/q"));
  ["AL", "CL", "DL", "BL", "AH", "CH", "DH", "BH"].forEach(r => R.push(row("MOV", r + ",Ib")));
  ["rAX", "rCX", "rDX", "rBX", "rSP", "rBP", "rSI", "rDI"].forEach(r => R.push(row("MOV", r + ",Iv")));
  R.push(row("SHIFT", "Eb,Ib"), row("SHIFT", "Ev,Ib"), row("RET", "Iw"), row("RET", ""), row("VEX3", "prefix"), row("VEX2", "prefix"), row("MOV", "Eb,Ib"), row("MOV", "Ev,Iz"),
         row("ENTER", "Iw,Ib"), row("LEAVE", ""), row("RETF", "Iw"), row("RETF", ""), row("INT3", ""), row("INT", "Ib"), inv, row("IRET", ""));
  R.push(row("SHIFT", "Eb,1"), row("SHIFT", "Ev,1"), row("SHIFT", "Eb,CL"), row("SHIFT", "Ev,CL"), inv, inv, inv, row("XLAT", ""), ...Array(8).fill(0).map(() => row("x87", "escape")));
  R.push(row("LOOPNE", "Jb"), row("LOOPE", "Jb"), row("LOOP", "Jb"), row("JRCXZ", "Jb"), row("IN", "AL,Ib"), row("IN", "eAX,Ib"), row("OUT", "Ib,AL"), row("OUT", "Ib,eAX"),
         row("CALL", "Jz"), row("JMP", "Jz"), inv, row("JMP", "Jb"), row("IN", "AL,DX"), row("IN", "eAX,DX"), row("OUT", "DX,AL"), row("OUT", "DX,eAX"));
  R.push(row("LOCK", "prefix"), row("INT1", ""), row("REPNE", "prefix"), row("REP", "prefix"), row("HLT", ""), row("CMC", ""), row("GRP3", "Eb"), row("GRP3", "Ev"),
         row("CLC", ""), row("STC", ""), row("CLI", ""), row("STI", ""), row("CLD", ""), row("STD", ""), row("GRP4", "Eb"), row("GRP5", "Ev"));
  return R;
})();

/** What each mnemonic does, in plain words, for the readout under the table. */
const SAY = {
  ADD: "Add", OR: "Bitwise or", ADC: "Add with carry", SBB: "Subtract with borrow", AND: "Bitwise and", SUB: "Subtract", XOR: "Exclusive or", CMP: "Compare",
  "0F": "Escape to the two-byte map: SSE, AES-NI, CMOVcc, near jumps, SYSCALL and more", "ES:": "Segment prefix, ignored in 64-bit mode", "CS:": "Segment prefix, ignored in 64-bit mode",
  "SS:": "Segment prefix, ignored in 64-bit mode", "DS:": "Segment prefix, ignored in 64-bit mode", REX: "REX prefix: 64-bit operands and registers r8 to r15",
  PUSH: "Push onto the stack", POP: "Pop from the stack", EVEX: "EVEX prefix: AVX-512", MOVSXD: "Move with sign extension, 32 to 64 bits", "FS:": "FS segment: thread-local storage",
  "GS:": "GS segment override", "66": "Operand-size prefix; also selects SSE forms", "67": "Address-size prefix", IMUL: "Signed multiply", INS: "Input string from a port", OUTS: "Output string to a port",
  JO: "Jump if overflow", JNO: "Jump if not overflow", JB: "Jump if below", JAE: "Jump if above or equal", JE: "Jump if equal", JNE: "Jump if not equal", JBE: "Jump if below or equal",
  JA: "Jump if above", JS: "Jump if sign", JNS: "Jump if not sign", JP: "Jump if parity", JNP: "Jump if not parity", JL: "Jump if less", JGE: "Jump if greater or equal",
  JLE: "Jump if less or equal", JG: "Jump if greater", GRP1: "Group 1: add, or, adc, sbb, and, sub, xor or cmp with an immediate", TEST: "Logical compare", XCHG: "Exchange",
  MOV: "Move", LEA: "Load effective address: address arithmetic without touching memory", NOP: "No operation", CDQE: "Sign-extend eax into rax", CQO: "Sign-extend rax into rdx:rax",
  FWAIT: "Wait for the x87 unit", PUSHF: "Push the flags", POPF: "Pop the flags", SAHF: "Store ah into the flags", LAHF: "Load the flags into ah", MOVS: "Move string", CMPS: "Compare strings",
  STOS: "Store string", LODS: "Load string", SCAS: "Scan string", SHIFT: "Group 2: rotate and shift", RET: "Return from a call", VEX3: "Three-byte VEX prefix: AVX",
  VEX2: "Two-byte VEX prefix: AVX", ENTER: "Make a stack frame", LEAVE: "Release a stack frame", RETF: "Far return", INT3: "Breakpoint", INT: "Software interrupt", IRET: "Return from an interrupt",
  XLAT: "Table lookup", x87: "Escape to the x87 floating-point unit", LOOPNE: "Loop while not equal", LOOPE: "Loop while equal", LOOP: "Loop", JRCXZ: "Jump if rcx is zero", IN: "Input from a port",
  OUT: "Output to a port", CALL: "Call", JMP: "Jump", LOCK: "Lock prefix: makes the next read-modify-write atomic", INT1: "Debug trap", REPNE: "Repeat-while-not-equal prefix",
  REP: "Repeat prefix; also selects SSE forms", HLT: "Halt", CMC: "Complement carry", GRP3: "Group 3: test, not, neg, mul, imul, div, idiv", CLC: "Clear carry", STC: "Set carry",
  CLI: "Clear the interrupt flag", STI: "Set the interrupt flag", CLD: "Clear direction", STD: "Set direction", GRP4: "Group 4: increment or decrement a byte",
  GRP5: "Group 5: increment, decrement, call, jump or push on a register or memory"
};

/** The logo's A on the 16x16 grid as [first row, last row, first column, last column] blocks: mint on top, teal below. */
const A_MINT = [[3, 4, 7, 8], [5, 6, 5, 10]];
const A_TEAL = [[7, 8, 4, 5], [7, 8, 10, 11], [9, 10, 3, 12], [11, 12, 2, 3], [11, 12, 12, 13]];

/** Plain words for the opcode map's operand notation (Intel SDM, appendix A): addressing kinds and sizes. */
const KIND = { E: "a register or memory", G: "a register", I: "an immediate value", J: "a jump offset", M: "memory", O: "a memory offset",
  S: "a segment register", X: "the string source", Y: "the string destination" };
const SIZE = { b: "byte", v: "16, 32 or 64-bit", z: "16 or 32-bit", w: "16-bit", d: "32-bit", q: "64-bit" };

/**
 * Explains an operand list in plain words, for the readout.
 * @param {string} o The operands in SDM notation, e.g. "Ev,Gv".
 * @returns {string} "Operands: ..." or "" for prefixes, escapes and bytes without operands.
 */
function explainOperands(o) {
  if (!o || o === "prefix" || o === "escape" || o === "2-byte" || o === "i64") return "";
  const parts = o.split(",").map(t => {
    const m = /^([EGIJMOSXY])([bvzwdq])?$/.exec(t);
    if (m) return `${t}: ${m[2] ? SIZE[m[2]] + " " : ""}${KIND[m[1]].replace(/^an? /, m[2] ? "" : "$&")}`;
    if (/^r[A-Z]{2}|^[ER]?[ABCD][XLH]|^r\d|^eAX|^AL|^DX|^CL/.test(t)) return `${t}: that register`;
    if (t === "1") return "1: the constant one";
    return t;
  });
  return "Operands: " + parts.join("; ") + ".";
}

/**
 * Fills the table with the opcode map and wires its readout: hover, focus and the arrow keys show an opcode.
 * The table is one tab stop; the arrows move inside it. When motion is allowed, the A's cells fill in from
 * its feet up, once.
 * @param {HTMLTableElement} table The empty table to fill.
 * @param {HTMLElement} out The readout that describes the opcode under the pointer or the focus.
 * @returns {{show: function(HTMLTableCellElement): void, cells: HTMLTableCellElement[]}} The readout function and the 256 cells.
 */
function buildOpcodeTable(table, out) {
  /** Hex digits for the readout (two) and the headers (one). @param {number} n The byte or digit. @returns {string} Upper-case hex. */
  const hex2 = n => n.toString(16).toUpperCase().padStart(2, "0"), hex1 = n => n.toString(16).toUpperCase();
  /** Whether a cell lies in one of the A's blocks. @param {number[][]} bs The blocks. @param {number} r The row. @param {number} c The column. @returns {boolean} True inside a block. */
  const inBlocks = (bs, r, c) => bs.some(([r0, r1, c0, c1]) => r >= r0 && r <= r1 && c >= c0 && c <= c1);
  let h = '<thead><tr><th class="rowh"></th>' + [...Array(16)].map((_, c) => `<th scope="col">${hex1(c)}</th>`).join("") + "</tr></thead><tbody>";
  for (let r = 0; r < 16; r++) {
    h += `<tr><th scope="row" class="rowh">${hex1(r)}</th>`;
    for (let c = 0; c < 16; c++) {
      const i = r * 16 + c, op = OP[i];
      const a = inBlocks(A_MINT, r, c) ? "a-m" : inBlocks(A_TEAL, r, c) ? "a-t" : "";
      const cls = [a, op.m ? "" : "inv", op.o === "prefix" || op.m === "REX" ? "pre" : ""].filter(Boolean).join(" ");
      h += `<td tabindex="-1" class="${cls}" data-i="${i}" data-a="${a}"><b>${op.m || "—"}</b><i>${op.m ? op.o : "i64"}</i></td>`;
    }
    h += "</tr>";
  }
  table.innerHTML = h + "</tbody>";
  const cells = [...table.querySelectorAll("td")];
  /** Describes one cell's opcode in the readout. @param {HTMLTableCellElement} td The cell. @returns {void} */
  const show = td => {
    const i = +td.dataset.i, op = OP[i];
    const name = op.m ? `${op.m}${op.o && op.o !== "prefix" ? " " + op.o : ""}` : "Not valid in 64-bit mode";
    const what = op.m ? (SAY[op.m] || "") : "Legacy opcode, removed from 64-bit mode";
    const use = explainOperands(op.o) || (op.o === "prefix" ? "A prefix changes the instruction that follows it." : "");
    out.innerHTML = `<div class="hex">${hex2(i)}</div><div class="what"><strong>${name}</strong>${what}.<span class="use">${use}</span></div>`;
  };
  table.addEventListener("mouseover", e => { const td = e.target.closest("td"); if (td) show(td); });
  table.addEventListener("focusin", e => { const td = e.target.closest("td"); if (td) show(td); });
  // keyboard: one tab stop for the whole table (a roving tabindex), arrows move between cells
  let cur = cells[0]; cur.tabIndex = 0;
  table.addEventListener("keydown", e => {
    const i = +document.activeElement.dataset.i; if (isNaN(i)) return;
    const d = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 16, ArrowUp: -16 }[e.key]; if (!d) return;
    const j = Math.min(255, Math.max(0, i + d)); e.preventDefault(); cur.tabIndex = -1; cur = cells[j]; cur.tabIndex = 0; cur.focus();
  });
  // one orchestrated moment: the A assembles from its feet up (seen only when the table starts visible)
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const a = cells.filter(td => td.dataset.a);
    a.forEach(td => td.classList.add("cold"));
    a.forEach(td => { const r = Math.floor(+td.dataset.i / 16); setTimeout(() => td.classList.remove("cold"), 250 + (12 - r) * 85); });
  }
  return { show, cells };
}
