"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

const SUGGESTIONS = [
  "การวิเคราะห์คาร์บอนนาโนทิวบ์",
  "สรุปการเปลี่ยนแปลงสภาพภูมิอากาศ 2024",
  "ผลการวิจัยสำคัญด้านโครงข่ายประสาท",
];

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleLogin = () => signIn("google", { callbackUrl: "/" });
  const handleRegister = () => signIn("google", { callbackUrl: "/register" });

  const handleSearch = () => {
    if (!query.trim()) return;
    router.push(`/api/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="w-[190px] shrink-0 flex flex-col border-r border-gray-100 px-4 py-5">
        {/* User info */}
        <div className="flex items-center gap-2 mb-6">
          {session?.user?.image ? (
            <img src={session.user.image} className="w-8 h-8 rounded-full" alt="avatar" />
          ) : (
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          <div>
            <p className="text-xs text-gray-400">
              {session ? "ผู้ใช้งาน" : "Free plan"}
            </p>
            <p className="text-xs font-medium text-gray-700">
              {session?.user?.name || "ผู้เยี่ยมชม"}
            </p>
          </div>
        </div>

        {/* Nav */}
        <p className="text-[11px] text-gray-400 mb-2">หลัก</p>
        <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4 text-left">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          ค้นหา
        </button>

        {/* Recent */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] text-gray-400">ล่าสุด</p>
          <button className="text-gray-400 hover:text-gray-600 text-base leading-none">+</button>
        </div>

        {/* Login CTA */}
        {!session && (
          <div className="mt-auto border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-gray-800 mb-1">เริ่มต้นกัน !</p>
            <p className="text-xs text-gray-500 mb-4">การค้นหาหรือจัดระเบียบงานวิจัย</p>
            <button
              onClick={handleLogin}
              className="w-full bg-[#2D5A27] text-white text-xs py-2.5 rounded-xl mb-2 hover:bg-[#234820] transition-colors flex items-center justify-center gap-1 font-medium"
            >
              + เข้าสู่ระบบ
            </button>
            <button
              onClick={handleRegister}
              className="w-full border border-gray-200 text-gray-700 text-xs py-2.5 rounded-xl hover:border-[#2D5A27] transition-colors font-medium"
            >
              ลงทะเบียน
            </button>
          </div>
        )}

        {session && (
          <button
            onClick={() => signOut()}
            className="mt-auto text-xs text-gray-400 hover:text-gray-600"
          >
            ออกจากระบบ
          </button>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center relative px-8">
        {/* Logo top right */}
        <div className="absolute top-5 right-8 flex flex-col items-center">
          <Image src="/logo.png" alt="KU Phumpanya" width={80} height={80} className="object-contain" />
          <p className="text-sm mt-1">
            <span className="font-bold text-[#1a6b5a]">KU</span>{" "}
            <span className="text-gray-400">Phumpanya</span>
          </p>
        </div>

        {/* Hero */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-[#2D5A27] text-4xl leading-none">✦</span>
          <h1 className="text-4xl font-serif text-gray-900">Start your next discovery.</h1>
        </div>

        {/* Search bar */}
        <div className="flex w-full max-w-2xl rounded-2xl overflow-hidden border border-gray-200 shadow-md">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="วันนี้อยากสำรวจเรื่องอะไร?"
            className="flex-1 px-6 py-4 text-sm outline-none text-gray-700 placeholder-gray-400 bg-white"
          />
          <button
            onClick={handleSearch}
            className="bg-[#2D5A27] text-white px-10 text-sm font-semibold hover:bg-[#234820] transition-colors"
          >
            เริ่มต้น
          </button>
        </div>

        {/* Suggestion chips */}
        <div className="flex gap-3 mt-6 flex-wrap justify-center">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="border border-gray-200 text-gray-500 text-xs px-5 py-4 rounded-2xl hover:border-[#2D5A27] hover:text-[#2D5A27] transition-colors text-left w-[150px]"
            >
              {s}
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
