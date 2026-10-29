"use client";

import { useState } from "react";
import { ApiError, apiFetch, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import AppShell from "../components/AppShell";
import { FONT, PRIMARY } from "../components/roadmap/tokens";

const ROLE_LABEL: Record<string, string> = { student: "นิสิต", teacher: "อาจารย์", researcher: "นักวิจัย", admin: "ผู้ดูแลระบบ" };

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: "12px 0", borderBottom: "0.5px solid var(--ku-card-border)" }}>
      <dt style={{ width: 90, flexShrink: 0, fontSize: 13, color: "var(--ku-text-muted)" }}>{label}</dt>
      <dd style={{ fontSize: 14, color: "var(--ku-text)", overflowWrap: "anywhere" }}>{value || "-"}</dd>
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading, applyUser } = useUser();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Case does not matter, same as the backend's check.
  const matches = Boolean(user) && typed.trim().toLowerCase() === user!.email.toLowerCase();

  const deleteAccount = async () => {
    if (!user || !matches || busy) return;
    setBusy(true);
    setError(null);
    try {
      await apiFetch("/api/profile", { method: "DELETE", body: { confirm_email: typed.trim() } });
      applyUser(null); // 204: the backend already ended the session
      window.location.assign("/");
    } catch (err) {
      const fieldError = err instanceof ApiError && err.status === 422 ? (err.body as { errors?: { confirm_email?: string[] } } | undefined)?.errors?.confirm_email?.[0] : undefined;
      setError(fieldError ?? "ลบบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง");
      setBusy(false);
    }
  };

  return (
    <AppShell logo={false}>
      <main className="flex flex-col items-center pt-6! min-[1025px]:pt-11!" style={{ paddingBottom: 60, fontFamily: FONT }}>
        <div style={{ width: "100%", maxWidth: 600, padding: "0 16px" }}>
          <div className="flex items-center" style={{ gap: 16, marginBottom: 24 }}>
            <span style={{ background: PRIMARY, color: "#fff", fontSize: 15, fontWeight: 600, padding: "0 14px", height: 29, borderRadius: 6, display: "flex", alignItems: "center" }}>โปรไฟล์</span>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: "var(--ku-text)" }}>ข้อมูลของคุณ</h1>
          </div>

          {loading ? (
            <p style={{ fontSize: 14, color: "var(--ku-text-muted)" }}>กำลังโหลด...</p>
          ) : !user ? (
            <div>
              <p style={{ fontSize: 14, color: "var(--ku-text-muted)" }}>กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์</p>
              <button onClick={() => { window.location.href = googleLoginUrl(); }} className="hover:opacity-90 active:scale-[0.98] transition-all" style={{ marginTop: 12, background: PRIMARY, color: "white", fontSize: 14, borderRadius: 8, padding: "10px 20px" }}>
                เข้าสู่ระบบด้วย Google
              </button>
            </div>
          ) : (
            <>
              {/* Only what the user gave us; no ids or tokens. */}
              <dl>
                <Field label="ชื่อ" value={user.name} />
                <Field label="อีเมล" value={user.email} />
                <Field label="คณะ" value={user.faculty ?? ""} />
                <Field label="บทบาท" value={user.role ? ROLE_LABEL[user.role] ?? user.role : ""} />
              </dl>
              <p style={{ fontSize: 13, marginTop: 16 }}>
                <a href="/privacy/" style={{ color: "var(--ku-text-muted)", textDecoration: "underline" }}>ประกาศความเป็นส่วนตัว</a>
              </p>

              <section aria-labelledby="delete-title" style={{ marginTop: 40, border: "0.5px solid #dc2626", borderRadius: 10, padding: 20 }}>
                <h2 id="delete-title" style={{ fontSize: 15, fontWeight: 700, color: "var(--ku-text)" }}>ลบบัญชี</h2>
                <p style={{ fontSize: 13, lineHeight: "20px", marginTop: 6, color: "var(--ku-text-muted)" }}>
                  ลบบัญชี ประวัติการค้นหา และความก้าวหน้าทั้งหมดอย่างถาวร ย้อนกลับไม่ได้
                </p>
                <label htmlFor="confirm-email" style={{ display: "block", fontSize: 13, marginTop: 14, color: "var(--ku-text)" }}>
                  พิมพ์อีเมลของคุณ ({user.email}) เพื่อยืนยัน
                </label>
                <input
                  id="confirm-email"
                  type="email"
                  autoComplete="off"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "delete-error" : undefined}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  style={{ marginTop: 6, width: "100%", height: 40, padding: "0 12px", borderRadius: 8, border: "0.5px solid var(--ku-card-border)", background: "var(--ku-card-bg)", color: "var(--ku-text)", fontSize: 14 }}
                />
                {error && <p id="delete-error" role="alert" style={{ fontSize: 13, color: "#dc2626", marginTop: 8 }}>{error}</p>}
                <button
                  type="button"
                  disabled={!matches || busy}
                  onClick={deleteAccount}
                  style={{ marginTop: 14, fontSize: 14, padding: "10px 18px", borderRadius: 8, background: "#dc2626", color: "#fff", opacity: !matches || busy ? 0.4 : 1, cursor: !matches || busy ? "not-allowed" : "pointer" }}
                >
                  {busy ? "กำลังลบ..." : "ลบบัญชีถาวร"}
                </button>
              </section>
            </>
          )}
        </div>
      </main>
    </AppShell>
  );
}
