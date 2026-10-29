import AppShell from "../components/AppShell";
import { FONT, PRIMARY } from "../components/roadmap/tokens";

// The collected-data list below is what the app really stores. The legal wording (purpose, retention,
// controller, contact, rights) is the team's to supply: replace NOTICE_PENDING when it arrives.
const COLLECTED = [
  "ชื่อและอีเมลจากบัญชี Google ที่ใช้เข้าสู่ระบบ",
  "คณะ สาขา บทบาท และรหัสนิสิตหรือพนักงานที่คุณกรอกตอนลงทะเบียน",
  "คำที่คุณค้นหาและผลลัพธ์ที่ระบบสร้างให้",
  "ความก้าวหน้าในเส้นทางการเรียนรู้ (หัวข้อที่ทำเครื่องหมายว่าเรียนจบ)",
];
const NOTICE_PENDING = "ข้อความประกาศฉบับเต็ม (วัตถุประสงค์ ระยะเวลาเก็บ ผู้ควบคุมข้อมูล และช่องทางติดต่อ) อยู่ระหว่างการจัดทำโดยทีมโครงการ";

export default function PrivacyPage() {
  return (
    <AppShell logo={false}>
      <main className="flex flex-col items-center pt-6! min-[1025px]:pt-11!" style={{ paddingBottom: 60, fontFamily: FONT }}>
        <article style={{ width: "100%", maxWidth: 640, padding: "0 16px", color: "var(--ku-text)" }}>
          <div className="flex items-center" style={{ gap: 16, marginBottom: 20 }}>
            <span style={{ background: PRIMARY, color: "#fff", fontSize: 15, fontWeight: 600, padding: "0 14px", height: 29, borderRadius: 6, display: "flex", alignItems: "center" }}>PDPA</span>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>ประกาศความเป็นส่วนตัว</h1>
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 24 }}>ข้อมูลที่ระบบเก็บ</h2>
          <ul style={{ marginTop: 8, paddingLeft: 20, listStyle: "disc", fontSize: 14, lineHeight: "24px" }}>
            {COLLECTED.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 24 }}>สิทธิ์ของคุณ</h2>
          <p style={{ fontSize: 14, lineHeight: "24px", marginTop: 8 }}>
            ดูข้อมูลของคุณและลบบัญชีพร้อมข้อมูลทั้งหมดได้เองที่หน้า <a href="/profile/" style={{ textDecoration: "underline" }}>โปรไฟล์</a>
          </p>
          <p style={{ fontSize: 14, lineHeight: "24px", marginTop: 24, color: "var(--ku-text-muted)" }}>{NOTICE_PENDING}</p>
        </article>
      </main>
    </AppShell>
  );
}
