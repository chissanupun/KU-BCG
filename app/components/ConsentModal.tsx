"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useUser } from "@/lib/UserContext";

/** Contract C4: blocks the app while `consent_required` is true (also again after a new notice version). */
export default function ConsentModal() {
  const { user, applyUser, logout } = useUser();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialog = useRef<HTMLDivElement>(null);
  // The notice itself must stay readable.
  const open = Boolean(user?.consent_required) && !pathname.startsWith("/privacy");
  useFocusTrap(dialog, open);
  if (!open) return null;

  const accept = async () => {
    setBusy(true);
    setError(null);
    try {
      applyUser(await apiFetch<User>("/api/consent", { method: "POST" }));
    } catch {
      setError("บันทึกการยอมรับไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="consent-title" className="fixed inset-0 z-[70] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", padding: 16 }}>
      <div ref={dialog} style={{ width: "100%", maxWidth: 480, maxHeight: "100%", overflowY: "auto", background: "var(--ku-bg)", color: "var(--ku-text)", border: "0.5px solid var(--ku-card-border)", borderRadius: 12, padding: 24 }}>
        <h2 id="consent-title" style={{ fontSize: 18, fontWeight: 700 }}>ประกาศความเป็นส่วนตัว (PDPA)</h2>
        <p style={{ fontSize: 14, lineHeight: "22px", marginTop: 10, color: "var(--ku-text-muted)" }}>
          KU Phumpanya เก็บชื่อ อีเมล คณะ บทบาท ประวัติการค้นหา และความก้าวหน้าในการเรียน เพื่อแสดงเส้นทางการเรียนรู้และคำแนะนำที่เหมาะกับคุณ
          คุณลบบัญชีและข้อมูลทั้งหมดได้เองที่หน้าโปรไฟล์
        </p>
        <p style={{ fontSize: 14, marginTop: 10 }}>
          <a href="/privacy/" target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>อ่านประกาศฉบับเต็ม</a>
        </p>
        {error && <p role="alert" style={{ fontSize: 13, color: "#dc2626", marginTop: 10 }}>{error}</p>}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={() => void logout()} style={{ fontSize: 14, padding: "10px 16px", color: "var(--ku-text-muted)" }}>
            ไม่ยอมรับและออกจากระบบ
          </button>
          <button type="button" disabled={busy} autoFocus onClick={accept} style={{ fontSize: 14, padding: "10px 20px", borderRadius: 8, background: "#3b6347", color: "#fff", opacity: busy ? 0.6 : 1 }}>
            {busy ? "กำลังบันทึก..." : "ยอมรับ"}
          </button>
        </div>
      </div>
    </div>
  );
}
