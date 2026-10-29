"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError, googleLoginUrl } from "@/lib/api";
import { useUser } from "@/lib/UserContext";

const PRIMARY = "#3b6347";
const FONT = "Poppins, sans-serif";

const FIELD_SHADOW = "0px 2px 4px rgba(0,0,0,0.04), 0px 1px 2px rgba(0,0,0,0.06), 0px 0px 0.5px rgba(0,0,0,0.06)";

type Role = { value: string; label: string };

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
      <span style={{ fontFamily: FONT, fontSize: 16, fontWeight: 400, lineHeight: "24px", color: "#18181b" }}>
        {text}
      </span>
      {required && (
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 500, color: "#ff383c" }}>*</span>
      )}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p style={{ margin: "4px 0 0", fontFamily: FONT, fontSize: 13, fontWeight: 400, color: "#ff383c" }}>
      {message}
    </p>
  );
}

function TextField({
  label,
  hint,
  value,
  onChange,
  required,
  error,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label text={label} required={required} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          height: 36,
          background: "white",
          borderRadius: 12,
          border: "none",
          boxShadow: FIELD_SHADOW,
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: 14,
          color: "#18181b",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      {hint && !error && (
        <p style={{ margin: "4px 0 0", fontFamily: FONT, fontSize: 14, fontWeight: 400, lineHeight: "20px", color: "#71717a" }}>
          {hint}
        </p>
      )}
      <FieldError message={error} />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div>
      <Label text={label} required={required} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          display: "block",
          width: "100%",
          height: 36,
          background: "white",
          borderRadius: 12,
          border: "none",
          boxShadow: FIELD_SHADOW,
          padding: "8px 12px",
          fontFamily: FONT,
          fontSize: 14,
          color: value ? "#18181b" : "#a1a1aa",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <FieldError message={error} />
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: userLoading, refetch } = useUser();

  const [faculties, setFaculties] = useState<string[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [refLoading, setRefLoading] = useState(true);

  const [form, setForm] = useState({
    role: "",
    faculty: "",
    department: "",
    student_id: "",
    employee_id: "",
    research_affiliation: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const set = (key: keyof typeof form) => (v: string) => {
    setForm((f) => ({ ...f, [key]: v }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  useEffect(() => {
    Promise.all([
      apiFetch<{ faculties: string[] }>("/api/reference/faculties"),
      apiFetch<{ roles: Role[] }>("/api/reference/roles"),
    ])
      .then(([f, r]) => {
        setFaculties(f.faculties);
        setRoles(r.roles);
      })
      .catch(() => {
        setFormError("โหลดข้อมูลคณะ/บทบาทไม่สำเร็จ ลองรีเฟรชหน้านี้");
      })
      .finally(() => setRefLoading(false));
  }, []);

  useEffect(() => {
    if (userLoading) return;
    if (user?.profile_completed_at) {
      router.replace("/");
    }
  }, [user, userLoading, router]);

  const isStudent = form.role === "student";
  const isStaff = form.role === "researcher" || form.role === "teacher";

  async function handleSubmit() {
    if (submitting) return;
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      await apiFetch("/api/auth/register/complete", {
        method: "POST",
        body: {
          role: form.role,
          faculty: form.faculty,
          department: form.department,
          student_id: isStudent ? form.student_id : undefined,
          employee_id: isStaff ? form.employee_id : undefined,
          research_affiliation: form.research_affiliation || undefined,
        },
      });
      await refetch();
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const body = err.body as { errors?: Record<string, string[]> };
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(body.errors ?? {})) {
          fieldErrors[field] = messages[0];
        }
        setErrors(fieldErrors);
      } else if (err instanceof ApiError && err.status === 401) {
        window.location.href = googleLoginUrl();
      } else {
        setFormError("บันทึกข้อมูลไม่สำเร็จ ลองอีกครั้ง");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!userLoading && !user) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, fontFamily: FONT }}>
        <p>กรุณาเข้าสู่ระบบก่อนตั้งค่าข้อมูล</p>
        <button
          onClick={() => { window.location.href = googleLoginUrl(); }}
          style={{ background: PRIMARY, color: "white", border: "none", borderRadius: 4, padding: "10px 24px", fontFamily: FONT, fontSize: 16, cursor: "pointer" }}
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full bg-white">
      {/* Logo — top-left */}
      <div className="absolute" style={{ left: 30, top: 28, width: 34, height: 33 }}>
        <Image src="/ku-bcg.png" alt="KU Phumpanya" width={34} height={33} className="object-contain" unoptimized />
      </div>

      <div className="min-w-0 flex-1 px-6! pb-16! pt-24! min-[1025px]:pl-[139px]! min-[1025px]:pt-[179px]!">
        <div style={{ maxWidth: 594 }}>
          <p style={{ fontFamily: FONT, fontSize: 20, fontWeight: 600, lineHeight: "28px", color: "#1a1a1a", margin: 0 }}>Register</p>
          <p style={{ fontFamily: FONT, fontSize: 16, fontWeight: 400, lineHeight: "24px", color: "#737373", margin: "10px 0 40px" }}>
            ตั้งค่าข้อมูลของคุณ
          </p>

          {/* Fields wrap to one column on narrow screens; order matches the mockup's rows. */}
          <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <SelectField
              label="สถานะ"
              value={form.role}
              onChange={set("role")}
              options={roles}
              placeholder={refLoading ? "กำลังโหลด..." : "เลือกสถานะ"}
              required
              error={errors.role}
            />
            <SelectField
              label="คณะ"
              value={form.faculty}
              onChange={set("faculty")}
              options={faculties.map((f) => ({ value: f, label: f }))}
              placeholder={refLoading ? "กำลังโหลด..." : "เลือกคณะ"}
              required
              error={errors.faculty}
            />
            <TextField label="สาขา / ภาควิชา" value={form.department} onChange={set("department")} required error={errors.department} />
            {isStudent && (
              <TextField label="รหัสนิสิต" value={form.student_id} onChange={set("student_id")} hint="ตัวเลข 10 หลัก" required error={errors.student_id} />
            )}
            {isStaff && (
              <TextField label="รหัสพนักงาน" value={form.employee_id} onChange={set("employee_id")} required error={errors.employee_id} />
            )}
            {isStaff && (
              <TextField label="สังกัดวิจัย" value={form.research_affiliation} onChange={set("research_affiliation")} hint="ไม่บังคับ" error={errors.research_affiliation} />
            )}
          </div>

          {formError && (
            <p style={{ marginTop: 20, fontFamily: FONT, fontSize: 14, color: "#ff383c" }}>{formError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || refLoading}
            style={{
              marginTop: 48,
              width: "100%",
              maxWidth: 511,
              height: 40,
              background: PRIMARY,
              opacity: submitting || refLoading ? 0.6 : 1,
              borderRadius: 4,
              color: "white",
              fontFamily: FONT,
              fontSize: 16,
              fontWeight: 500,
              lineHeight: "24px",
              border: "none",
              cursor: submitting || refLoading ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "กำลังบันทึก..." : "Register"}
          </button>
        </div>
      </div>

      {/* Decorative panel: only where there is room for it. */}
      <div
        aria-hidden
        className="relative hidden shrink-0 overflow-hidden min-[1025px]:block"
        style={{ width: "37%", maxWidth: 527, background: "#8a9e72" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/laptop.png"
          alt=""
          style={{ position: "absolute", top: "2%", left: 0, width: "100%", objectFit: "contain", filter: "grayscale(1)" }}
        />
      </div>
    </div>
  );
}
