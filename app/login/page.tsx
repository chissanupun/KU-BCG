"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";
import type { User } from "@/lib/types";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";
const FIELD_SHADOW =
  "0px 2px 4px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.06), 0px 0px 0.5px rgba(0,0,0,0.06)";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: userLoading, refetch } = useUser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userLoading || !user) return;
    router.replace(user.role === "admin" ? "/admin/" : "/learn/");
  }, [user, userLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const loggedIn = await apiFetch<User>("/api/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await refetch();
      router.push(loggedIn.role === "admin" ? "/admin/" : "/learn/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { message?: string; errors?: Record<string, string[]> };
        setError(body.errors?.email?.[0] ?? body.message ?? "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (err instanceof ApiError && err.status === 403) {
        setError("ระบบปิดการเข้าสู่ระบบด้วยอีเมลชั่วคราว");
      } else {
        setError("เข้าสู่ระบบไม่สำเร็จ ลองอีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (userLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          fontFamily: FONT,
          color: "#71717a",
        }}
      >
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--ku-bg, #f7f7f5)",
        fontFamily: FONT,
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "#fff",
          borderRadius: 16,
          padding: "36px 32px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <Image
            src="/ku-bcg.png"
            alt="KU Phumpanya"
            width={48}
            height={52}
            className="object-contain"
            unoptimized
          />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "#1a1a1a" }}>
              เข้าสู่ระบบ
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#71717a" }}>
              อีเมล / รหัสผ่าน หรือ Google
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#18181b" }}>อีเมล</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                height: 40,
                borderRadius: 12,
                border: "none",
                boxShadow: FIELD_SHADOW,
                padding: "8px 12px",
                fontFamily: FONT,
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 14, color: "#18181b" }}>รหัสผ่าน</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                height: 40,
                borderRadius: 12,
                border: "none",
                boxShadow: FIELD_SHADOW,
                padding: "8px 12px",
                fontFamily: FONT,
                fontSize: 14,
                outline: "none",
              }}
            />
          </label>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "#ff383c" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              height: 42,
              borderRadius: 8,
              border: "none",
              background: PRIMARY,
              color: "#fff",
              fontFamily: FONT,
              fontSize: 15,
              fontWeight: 500,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            margin: "20px 0",
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e4e4e7" }} />
          <span style={{ fontSize: 12, color: "#a1a1aa" }}>หรือ</span>
          <div style={{ flex: 1, height: 1, background: "#e4e4e7" }} />
        </div>

        <button
          type="button"
          onClick={() => {
            window.location.href = googleLoginUrl();
          }}
          style={{
            width: "100%",
            height: 42,
            borderRadius: 8,
            border: "1px solid #d4d4d8",
            background: "#fff",
            color: "#18181b",
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          เข้าสู่ระบบด้วย Google
        </button>

        <p style={{ margin: "20px 0 0", textAlign: "center", fontSize: 13, color: "#71717a" }}>
          <Link href="/" style={{ color: PRIMARY, textDecoration: "none" }}>
            กลับหน้าแรก
          </Link>
        </p>
      </div>
    </div>
  );
}
