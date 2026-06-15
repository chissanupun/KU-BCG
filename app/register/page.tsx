"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useState } from "react";

export default function RegisterPage() {
  const [remember, setRemember] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="flex flex-col w-1/2 px-16 py-10">
        <div className="flex items-center gap-2 mb-16">
          <Image src="/ku-logo.png" alt="KU Phumpanya" width={48} height={48} />
          <span className="text-sm font-semibold text-[#2D5A27]">KU Phumpanya</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Register</h1>
        <p className="text-gray-500 mb-24">ตั้งค่าข้อมูลของคุณ</p>

        <div className="max-w-md">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full bg-[#2D5A27] text-white py-4 rounded-lg text-sm font-medium hover:bg-[#234820] transition-colors mb-4"
          >
            Register
          </button>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setRemember(!remember)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                remember ? "bg-[#2D5A27]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  remember ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">Remember me</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-1/2 bg-[#8FAF7E] flex items-center justify-center">
        <div className="text-9xl select-none">💻</div>
      </div>
    </div>
  );
}
