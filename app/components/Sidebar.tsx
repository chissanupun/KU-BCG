"use client";

import { useSession, signIn, signOut } from "next-auth/react";

const PRIMARY = "#3b6347";

export default function Sidebar({ height = "100%" }: { height?: number | string }) {
  const { data: session } = useSession();

  return (
    <aside
      className="flex flex-col bg-white shrink-0"
      style={{ width: 195, height, borderRight: "0.5px solid rgba(115,115,115,0.5)" }}
    >
      {/* User Profile */}
      <div
        className="flex items-center shrink-0"
        style={{ paddingLeft: 18.5, paddingTop: 50, paddingBottom: 14, paddingRight: 18.5, gap: 9 }}
      >
        <div
          className="rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0"
          style={{ width: 36.5, height: 36.5 }}
        >
          {session?.user?.image ? (
            <img src={session.user.image} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <svg style={{ width: 16, height: 16, color: "#9ca3af" }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[12px] leading-[16px] truncate" style={{ color: "rgba(36,34,32,0.4)" }}>แผนฟรี</p>
          <p className="text-[12px] leading-[16px] truncate" style={{ color: "#242220" }}>{session?.user?.name || "ผู้เยี่ยมชม"}</p>
        </div>
      </div>

      {/* Divider 1 */}
      <div style={{ height: 0.38, background: PRIMARY, opacity: 0.24, flexShrink: 0 }} />

      {/* Main Nav */}
      <div className="shrink-0" style={{ paddingLeft: 18.5, paddingRight: 18.5, paddingTop: 12 }}>
        <p className="text-[12px] leading-[16px] mb-[7px]" style={{ color: "rgba(36,34,32,0.4)", paddingLeft: 15 }}>หลัก</p>
        <button
          className={`flex items-center w-full rounded-[9px] transition-colors relative overflow-hidden ${session ? "" : "hover:bg-gray-50"}`}
          style={{
            gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12,
            ...(session && { background: "rgba(36,34,32,0.04)", border: "0.38px solid #3b6347" }),
          }}
        >
          <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke={session ? "#3b6347" : "rgba(36,34,32,0.56)"} strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <span className="flex-1 text-[12px] leading-[16px] text-left" style={{ color: session ? "#242220" : "rgba(36,34,32,0.56)", fontWeight: session ? 500 : 400 }}>ค้นหา</span>
          {session && (
            <svg style={{ width: 16, height: 16, flexShrink: 0, color: "rgba(36,34,32,0.4)" }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>

        {session && (
          <button
            className="flex items-center w-full rounded-[9px] hover:bg-gray-50 transition-colors"
            style={{ gap: 12, paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12 }}
          >
            <svg style={{ width: 16, height: 16, flexShrink: 0 }} fill="none" stroke="rgba(36,34,32,0.56)" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            <span className="text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.56)" }}>แนะนำอัจฉริยะ</span>
          </button>
        )}
      </div>

      {/* Divider 2 */}
      <div style={{ height: 0.38, background: PRIMARY, opacity: 0.24, flexShrink: 0, marginTop: 8 }} />

      {/* Recent Section */}
      <div
        className="flex items-center shrink-0"
        style={{ paddingLeft: 18.5 + 15, paddingRight: 18.5 + 3, paddingTop: 12, paddingBottom: 12 }}
      >
        <p className="flex-1 text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.4)" }}>ล่าสุด</p>
        <span className="text-[12px]" style={{ color: "rgba(36,34,32,0.4)" }}>+</span>
      </div>

      {session && (
        <div className="shrink-0" style={{ paddingLeft: 18.5, paddingRight: 18.5 }}>
          {[
            "สำรวจบทความ\nคอมพิวเตอร์ควอนตัม",
            "สรุปการเปลี่ยนแปลง\nสภาพภูมิอากาศ 2024",
            "ผลการวิจัยสำคัญ\nด้านโครงข่ายประสาท",
          ].map((item, i) => (
            <button
              key={i}
              className="flex w-full rounded-[9px] hover:bg-gray-50 transition-colors text-left"
              style={{ paddingLeft: 15, paddingRight: 3, paddingTop: 12, paddingBottom: 12 }}
            >
              <span className="text-[12px] leading-[16px] whitespace-pre-line" style={{ color: "rgba(36,34,32,0.56)", width: 128 }}>{item}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1" />

      {!session && (
        <div style={{ padding: "0 18.5px 20px" }}>
          <div className="flex flex-col rounded-[21px]" style={{ border: `1px solid ${PRIMARY}`, background: "rgba(255,255,255,0.12)", paddingLeft: 12, paddingRight: 12, paddingTop: 18, paddingBottom: 12, gap: 11 }}>
            <div className="text-center flex flex-col" style={{ gap: 4.5 }}>
              <p className="text-[12px] leading-[16px] font-medium" style={{ color: "#242220" }}>เริ่มต้นกัน !</p>
              <p className="text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.56)" }}>การค้นหาหรือ<br />จัดระเบียบงานวิจัย</p>
            </div>
            <button onClick={() => signIn("google", { callbackUrl: "/" })} className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY} 100%)`, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 36.5, gap: 4.5 }}>
              <span>+</span><span>เข้าสู่ระบบ</span>
            </button>
            <button onClick={() => signIn("google", { callbackUrl: "/register" })} className="flex items-center justify-center font-medium text-[14px] leading-[20px] rounded-[9px] w-full hover:opacity-90 transition-opacity" style={{ border: `1px solid ${PRIMARY}`, background: "#ffffff", color: PRIMARY, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 36.5 }}>
              ลงทะเบียน
            </button>
          </div>
        </div>
      )}

      {session && (
        <div style={{ padding: "0 18.5px 20px" }}>
          <div className="flex flex-col rounded-[21px]" style={{ border: `1px solid ${PRIMARY}`, background: "rgba(255,255,255,0.12)", paddingLeft: 12, paddingRight: 12, paddingTop: 18, paddingBottom: 12, gap: 11 }}>
            <div className="flex flex-col" style={{ gap: 4.5 }}>
              <p className="text-[12px] leading-[16px] font-medium" style={{ color: "#242220" }}>เริ่มต้นกันเลย!</p>
              <p className="text-[12px] leading-[16px]" style={{ color: "rgba(36,34,32,0.56)" }}>การค้นหาหรือ<br />จัดระเบียบงานวิจัย</p>
            </div>
            <button className="flex items-center justify-center font-medium text-[14px] leading-[20px] text-white rounded-[9px] w-full hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(90deg, ${PRIMARY} 0%, ${PRIMARY} 100%)`, boxShadow: "0px 3px 9px rgba(59,99,71,0.3)", height: 36.5, gap: 4.5 }}>
              <span>+</span><span>แชทใหม่</span>
            </button>
            <button onClick={() => signOut()} className="text-[12px] leading-[16px] hover:opacity-70 transition-opacity text-center w-full" style={{ color: "rgba(36,34,32,0.4)" }}>
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
