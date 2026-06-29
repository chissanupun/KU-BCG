"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "../components/Sidebar";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: "easeOut" as const, delay },
});

const LOG_ROWS = [
  { id: "4586932", user: "Kate Moore", action: "SELECT Query", component: "Database", avatar: "KM" },
  { id: "4586931", user: "John Smith", action: "UPDATE Record", component: "User API", avatar: "JS" },
  { id: "4586930", user: "Sarah Chen", action: "DELETE Entry", component: "Auth Service", avatar: "SC" },
  { id: "4586929", user: "Mike Davis", action: "INSERT Row", component: "Database", avatar: "MD" },
  { id: "4586928", user: "Lisa Park", action: "GET Request", component: "REST API", avatar: "LP" },
  { id: "4586927", user: "Tom Wilson", action: "POST Submit", component: "Form Handler", avatar: "TW" },
  { id: "4586926", user: "Anna Lee", action: "PATCH Update", component: "User API", avatar: "AL" },
  { id: "4586925", user: "Chris Brown", action: "SELECT Query", component: "Database", avatar: "CB" },
];

/* SVG line chart — Jan–Jul, two lines */
function LineChart() {
  const W = 685, H = 200;
  const padL = 48, padR = 16, padT = 16, padB = 32;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."];
  const yLabels = ["30K", "20K", "10K", "0"];
  const maxY = 30000;

  const line1 = [8000, 12000, 9500, 18000, 15000, 22000, 27000];
  const line2 = [3000, 5000, 4000, 8000, 6000, 10000, 13000];

  const xPos = (i: number) => padL + (i / (months.length - 1)) * chartW;
  const yPos = (v: number) => padT + chartH - (v / maxY) * chartH;

  const toPath = (vals: number[]) =>
    vals.map((v, i) => `${i === 0 ? "M" : "L"}${xPos(i)},${yPos(v)}`).join(" ");

  const areaPath =
    toPath(line1) +
    ` L${xPos(line1.length - 1)},${padT + chartH} L${xPos(0)},${padT + chartH} Z`;

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      {/* Y grid lines */}
      {yLabels.map((_, i) => {
        const y = padT + (i / (yLabels.length - 1)) * chartH;
        return <line key={i} x1={padL} y1={y} x2={W - padR} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />;
      })}
      {/* Y labels */}
      {yLabels.map((label, i) => {
        const y = padT + (i / (yLabels.length - 1)) * chartH;
        return (
          <text key={i} x={padL - 6} y={y + 4} textAnchor="end" fontSize={10} fill="rgba(36,34,32,0.4)" fontFamily={FONT}>
            {label}
          </text>
        );
      })}
      {/* X labels */}
      {months.map((m, i) => (
        <text key={i} x={xPos(i)} y={H - 6} textAnchor="middle" fontSize={10} fill="rgba(36,34,32,0.4)" fontFamily={FONT}>
          {m}
        </text>
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="rgba(59,99,71,0.08)" />
      {/* Line 1 (solid green) */}
      <path d={toPath(line1)} fill="none" stroke={PRIMARY} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Line 2 (dashed muted) */}
      <path d={toPath(line2)} fill="none" stroke="rgba(59,99,71,0.35)" strokeWidth={1.5} strokeDasharray="5,4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots line1 */}
      {line1.map((v, i) => (
        <circle key={i} cx={xPos(i)} cy={yPos(v)} r={3} fill={PRIMARY} />
      ))}
    </svg>
  );
}

/* Modal */
function LogModal({ row, onClose }: { row: typeof LOG_ROWS[0]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ duration: 0.22, ease: "easeOut" as const }}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, background: "#fff", borderRadius: 16, padding: "28px 32px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: FONT,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#242220" }}>
            รายละเอียดกิจกรรม — Log #{row.id}
          </h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            style={{ width: 28, height: 28, borderRadius: 6, border: "none", background: "rgba(0,0,0,0.06)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <svg width={14} height={14} fill="none" stroke="#737373" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <Row label="ผู้ใช้" value={row.user} />
          <Row label="การกระทำ" value={row.action} />
          <Row label="ส่วนประกอบ" value={row.component} />
          <div style={{ background: "#f4f4f4", borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontSize: 11, color: "rgba(36,34,32,0.45)", marginBottom: 4 }}>Raw Query</p>
            <code style={{ fontSize: 12, color: "#242220", fontFamily: "monospace" }}>
              {`SELECT * FROM users WHERE id = '${row.id}' LIMIT 1`}
            </code>
          </div>
          <Row label="ผลลัพธ์" value="1 แถว · 0.42ms" />
          <Row label="เวลา" value="2024-07-15 14:32:08 UTC" />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{
              height: 38, paddingLeft: 20, paddingRight: 20, borderRadius: 8,
              border: "0.5px solid #737373", background: "transparent",
              fontSize: 13, fontWeight: 500, color: "#242220", cursor: "pointer", fontFamily: FONT,
            }}
          >
            ยกเลิก
          </button>
          <button
            style={{
              height: 38, paddingLeft: 20, paddingRight: 20, borderRadius: 8,
              border: "none", background: "#0485f7",
              fontSize: 13, fontWeight: 500, color: "#fff", cursor: "pointer", fontFamily: FONT,
            }}
          >
            ยืนยัน
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span style={{ width: 100, fontSize: 12, color: "rgba(36,34,32,0.45)", flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#242220" }}>{value}</span>
    </div>
  );
}

export default function AdminPage() {
  const [selectedRow, setSelectedRow] = useState<typeof LOG_ROWS[0] | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ทั้งหมด");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const filteredRows = LOG_ROWS.filter((r) =>
    r.user.toLowerCase().includes(search.toLowerCase()) ||
    r.action.toLowerCase().includes(search.toLowerCase()) ||
    r.component.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCheck = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <div style={{ width: 1440, height: 900, display: "flex", overflow: "hidden", background: "var(--ku-bg)" }}>
        {/* Sidebar */}
        <div style={{ width: 195, height: 900, flexShrink: 0 }}>
          <Sidebar height={900} activeNav="admin" />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, height: 900, overflowY: "auto", paddingLeft: 36, paddingRight: 36, paddingTop: 44, paddingBottom: 44, fontFamily: FONT }}>

          {/* Page title */}
          <motion.h1 {...fadeIn(0)} style={{ fontSize: 22, fontWeight: 700, color: "var(--ku-text)", marginBottom: 28 }}>
            แดชบอร์ดผู้ดูแล
          </motion.h1>

          {/* Stat cards */}
          <div style={{ display: "flex", gap: 16, marginBottom: 32 }}>
            {/* Card 1 — dark green */}
            <motion.div
              {...fadeIn(0.06)}
              style={{
                flex: 1, borderRadius: 20, background: PRIMARY, padding: "22px 24px",
                display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>การเข้าชม</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>7,265</p>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>+11.01% เดือนนี้</p>
            </motion.div>

            {/* Card 2 — white */}
            <motion.div
              {...fadeIn(0.1)}
              style={{
                flex: 1, borderRadius: 20, background: "var(--ku-card-bg)", border: "0.5px solid #737373",
                padding: "22px 24px", display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <p style={{ fontSize: 13, color: "var(--ku-text-muted)" }}>ผู้ใช้</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: "var(--ku-text)" }}>342</p>
              <p style={{ fontSize: 11, color: "var(--ku-text-muted)" }}>+8.3% เดือนนี้</p>
            </motion.div>

            {/* Card 3 — light green */}
            <motion.div
              {...fadeIn(0.14)}
              style={{
                flex: 1, borderRadius: 20, background: "#eaf0e4", border: "none",
                padding: "22px 24px", display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <p style={{ fontSize: 13, color: "rgba(59,99,71,0.65)" }}>ผู้ใช้งานอยู่</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: PRIMARY }}>120</p>
              <p style={{ fontSize: 11, color: "rgba(59,99,71,0.5)" }}>ขณะนี้</p>
            </motion.div>
          </div>

          {/* Chart */}
          <motion.div
            {...fadeIn(0.18)}
            style={{
              borderRadius: 16, background: "#f9f9fa", border: "0.5px solid rgba(161,161,161,0.3)",
              padding: "20px 20px 12px", marginBottom: 32,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--ku-text)" }}>ผู้ใช้ทั้งหมด</p>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 2, background: PRIMARY, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--ku-text-muted)" }}>ผู้ใช้ใหม่</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 20, height: 0, border: `1.5px dashed rgba(59,99,71,0.4)`, borderRadius: 1 }} />
                  <span style={{ fontSize: 11, color: "var(--ku-text-muted)" }}>ผู้ใช้กลับมา</span>
                </div>
              </div>
            </div>
            <LineChart />
          </motion.div>

          {/* Activity log */}
          <motion.div {...fadeIn(0.22)}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--ku-text)" }}>บันทึกกิจกรรมล่าสุด</p>
              <div style={{ display: "flex", gap: 10 }}>
                {/* Search */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "var(--ku-card-bg)", border: "0.5px solid var(--ku-card-border)",
                  borderRadius: 8, paddingLeft: 10, paddingRight: 10, height: 36,
                }}>
                  <svg width={14} height={14} fill="none" stroke="var(--ku-text-muted)" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg>
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ค้นหา..."
                    style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, color: "var(--ku-text)", width: 130 }}
                  />
                </div>
                {/* Status filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10, borderRadius: 8,
                    border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)",
                    fontSize: 12, color: "var(--ku-text)", cursor: "pointer", outline: "none", fontFamily: FONT,
                  }}
                >
                  <option>ทั้งหมด</option>
                  <option>Database</option>
                  <option>User API</option>
                  <option>Auth Service</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div style={{ borderRadius: 12, border: "0.5px solid var(--ku-card-border)", overflow: "hidden" }}>
              {/* Header */}
              <div style={{
                display: "grid", gridTemplateColumns: "36px 100px 1fr 1fr 1fr 44px",
                background: "var(--ku-surface)", padding: "10px 16px", gap: 12,
                borderBottom: "0.5px solid var(--ku-card-border)",
              }}>
                {["", "ID", "ผู้ใช้", "การกระทำ", "ส่วนประกอบ", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 11, fontWeight: 600, color: "var(--ku-text-muted)", textTransform: "uppercase" as const }}>{h}</span>
                ))}
              </div>
              {/* Rows */}
              {filteredRows.map((row, i) => (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24 + i * 0.04, duration: 0.25, ease: "easeOut" as const }}
                  style={{
                    display: "grid", gridTemplateColumns: "36px 100px 1fr 1fr 1fr 44px",
                    alignItems: "center", padding: "12px 16px", gap: 12,
                    borderBottom: i < filteredRows.length - 1 ? "0.5px solid var(--ku-card-border)" : "none",
                    background: "var(--ku-card-bg)", transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ku-surface)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--ku-card-bg)"; }}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(row.id)}
                    onChange={() => toggleCheck(row.id)}
                    style={{ width: 14, height: 14, accentColor: PRIMARY, cursor: "pointer" }}
                  />
                  <span style={{ fontSize: 12, color: "var(--ku-text-muted)", fontFamily: "monospace" }}>#{row.id}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", background: "rgba(59,99,71,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: PRIMARY }}>{row.avatar}</span>
                    </div>
                    <span style={{ fontSize: 13, color: "var(--ku-text)" }}>{row.user}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>{row.action}</span>
                  <span style={{ fontSize: 12, color: "var(--ku-text-muted)" }}>{row.component}</span>
                  <button
                    onClick={() => setSelectedRow(row)}
                    aria-label={`ดูรายละเอียด log ${row.id}`}
                    style={{
                      width: 28, height: 28, borderRadius: 6, border: "0.5px solid var(--ku-card-border)",
                      background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width={14} height={14} fill="none" stroke="var(--ku-text-muted)" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedRow && (
          <LogModal row={selectedRow} onClose={() => setSelectedRow(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
