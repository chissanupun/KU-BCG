"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { idleStep, KEEPALIVE_MS, LOGOUT_AFTER_MS, readSharedActive, writeSharedActive } from "@/lib/idle";
import { useFocusTrap } from "@/lib/useFocusTrap";
import { useUser } from "@/lib/UserContext";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "scroll"] as const;

/** Contract C5: warn after 25 idle minutes, sign out at 30. Renders nothing until the warning. */
export default function SessionGuard() {
  const { user, logout } = useUser();
  const signedIn = Boolean(user);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const lastActive = useRef(Date.now());
  const lastPing = useRef(Date.now());
  const warning = useRef(false);
  const dialog = useRef<HTMLDivElement>(null);
  useFocusTrap(dialog, remainingSec !== null);

  const stayActive = () => {
    const now = Date.now();
    lastActive.current = now;
    writeSharedActive(now);
    warning.current = false;
    setRemainingSec(null);
    if (now - lastPing.current >= KEEPALIVE_MS) {
      lastPing.current = now;
      // /api/user does not raise UNAUTHORIZED_EVENT (it is the signed-out probe), so handle its 401 here.
      apiFetch("/api/user").catch((err) => err instanceof ApiError && err.status === 401 && void logout());
    }
  };

  useEffect(() => {
    if (!signedIn) return;
    lastActive.current = lastPing.current = Date.now();
    warning.current = false;

    // While the warning is up only its own button counts, so a stray mouse move cannot hide it.
    const onActivity = () => !warning.current && stayActive();
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { capture: true, passive: true }));

    const timer = setInterval(() => {
      const idle = Date.now() - Math.max(lastActive.current, readSharedActive());
      const step = idleStep(idle);
      if (step === "active" && warning.current) {
        // Another tab was used meanwhile.
        warning.current = false;
        setRemainingSec(null);
      } else if (step === "logout") {
        clearInterval(timer);
        void logout();
      } else if (step === "warn") {
        warning.current = true;
        setRemainingSec(Math.ceil((LOGOUT_AFTER_MS - idle) / 1000));
      }
    }, 1000);

    return () => {
      clearInterval(timer);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity, { capture: true }));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stayActive only touches refs and a stable setter
  }, [signedIn, logout]);

  if (!signedIn || remainingSec === null) return null;

  const mm = String(Math.floor(remainingSec / 60));
  const ss = String(remainingSec % 60).padStart(2, "0");
  return (
    <div role="alertdialog" aria-modal="true" aria-labelledby="idle-title" aria-describedby="idle-desc" className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.55)", padding: 16 }}>
      <div ref={dialog} style={{ width: "100%", maxWidth: 400, background: "var(--ku-bg)", color: "var(--ku-text)", border: "0.5px solid var(--ku-card-border)", borderRadius: 12, padding: 24 }}>
        <h2 id="idle-title" style={{ fontSize: 16, fontWeight: 700 }}>ไม่มีการใช้งานนาน</h2>
        <p id="idle-desc" style={{ fontSize: 14, lineHeight: "22px", marginTop: 8, color: "var(--ku-text-muted)" }}>
          เพื่อความปลอดภัย ระบบจะออกจากระบบอัตโนมัติใน {mm}:{ss} นาที
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
          <button type="button" onClick={() => void logout()} style={{ fontSize: 14, padding: "10px 16px", color: "var(--ku-text-muted)" }}>
            ออกจากระบบ
          </button>
          <button type="button" autoFocus onClick={stayActive} style={{ fontSize: 14, padding: "10px 16px", borderRadius: 8, background: "#3b6347", color: "#fff" }}>
            ใช้งานต่อ
          </button>
        </div>
      </div>
    </div>
  );
}
