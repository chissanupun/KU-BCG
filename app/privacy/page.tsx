import AppShell from "../components/AppShell";
import { FONT, PRIMARY } from "../components/roadmap/tokens";

const NOTICE_VERSION = "2026-10";

// Keep in step with what the backend really stores; bump NOTICE_VERSION together with PDPA_CONSENT_VERSION.
const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "ข้อมูลที่ระบบเก็บ",
    items: [
      "ชื่อ อีเมล และรูปโปรไฟล์จากบัญชี Google ที่ใช้เข้าสู่ระบบ (ระบบไม่ได้รับรหัสผ่าน Google ของคุณ)",
      "คณะ สาขา บทบาท และรหัสนิสิตหรือรหัสพนักงานที่คุณกรอกตอนลงทะเบียน",
      "คำที่คุณค้นหาและผลลัพธ์ที่ระบบสร้างให้",
      "ความก้าวหน้าในเส้นทางการเรียนรู้ (หัวข้อที่ทำเครื่องหมายว่าเรียนจบ)",
      "ข้อมูลการใช้งานทางเทคนิค ได้แก่ หมายเลข IP ประเภทเบราว์เซอร์ และบันทึกการเข้าใช้งาน",
      "วันเวลาและฉบับของประกาศนี้ที่คุณให้ความยินยอม",
    ],
  },
  {
    title: "วัตถุประสงค์",
    items: [
      "ยืนยันตัวตนและให้บริการค้นหาความรู้ด้าน BCG ของมหาวิทยาลัยเกษตรศาสตร์",
      "แนะนำเนื้อหาและเส้นทางการเรียนรู้ให้ตรงกับคณะและความสนใจของคุณ",
      "แสดงประวัติการค้นหาและความก้าวหน้าให้คุณกลับมาดูได้",
      "ดูแลความปลอดภัยของระบบ ตรวจสอบการใช้งานผิดปกติ และปรับปรุงบริการ",
    ],
  },
  {
    title: "การส่งข้อมูลให้ผู้ให้บริการภายนอก",
    items: [
      "Google: ใช้สำหรับเข้าสู่ระบบด้วยบัญชี Google",
      "Google Gemini API: คำค้นหาของคุณและเอกสารที่เกี่ยวข้องถูกส่งไปเพื่อสรุปคำตอบ โดยไม่ส่งชื่อ อีเมล หรือรหัสนิสิต",
      "ระบบไม่ขายหรือเปิดเผยข้อมูลส่วนบุคคลของคุณให้บุคคลอื่นเพื่อการตลาด",
    ],
  },
  {
    title: "ระยะเวลาเก็บ",
    items: [
      "ข้อมูลบัญชี ประวัติการค้นหา และความก้าวหน้า เก็บไว้ตลอดที่คุณยังมีบัญชี และถูกลบทันทีเมื่อคุณลบบัญชี",
      "เซสชันหมดอายุเมื่อไม่มีการใช้งาน 30 นาที",
      "บันทึกการเข้าใช้งานเก็บไว้เพื่อความปลอดภัยของระบบ และจะไม่ผูกกับตัวตนของคุณอีกหลังลบบัญชี",
    ],
  },
  {
    title: "สิทธิ์ของคุณ",
    items: [
      "ขอเข้าถึง แก้ไข หรือขอสำเนาข้อมูลของคุณ",
      "ลบบัญชีพร้อมข้อมูลทั้งหมดได้เองที่หน้าโปรไฟล์",
      "ถอนความยินยอมได้ทุกเมื่อโดยการลบบัญชี ซึ่งจะทำให้ใช้บริการต่อไม่ได้",
      "คัดค้านหรือขอจำกัดการใช้ข้อมูล และร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <AppShell logo={false}>
      <main className="flex flex-col items-center pt-6! min-[1025px]:pt-11!" style={{ paddingBottom: 60, fontFamily: FONT }}>
        <article style={{ width: "100%", maxWidth: 640, padding: "0 16px", color: "var(--ku-text)" }}>
          <div className="flex items-center" style={{ gap: 16, marginBottom: 20 }}>
            <span style={{ background: PRIMARY, color: "#fff", fontSize: 15, fontWeight: 600, padding: "0 14px", height: 29, borderRadius: 6, display: "flex", alignItems: "center" }}>PDPA</span>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>ประกาศความเป็นส่วนตัว</h1>
          </div>
          <p style={{ fontSize: 14, lineHeight: "24px" }}>
            มหาวิทยาลัยเกษตรศาสตร์ในฐานะผู้ควบคุมข้อมูลส่วนบุคคล เก็บและใช้ข้อมูลของคุณในระบบภูมิปัญญาตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ดังนี้
          </p>
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginTop: 24 }}>{section.title}</h2>
              <ul style={{ marginTop: 8, paddingLeft: 20, listStyle: "disc", fontSize: 14, lineHeight: "24px" }}>
                {section.items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          ))}
          <p style={{ fontSize: 14, lineHeight: "24px", marginTop: 24 }}>
            จัดการข้อมูลหรือลบบัญชีได้ที่หน้า <a href="/profile/" style={{ textDecoration: "underline" }}>โปรไฟล์</a> หากต้องการใช้สิทธิ์อื่น ติดต่อทีมโครงการภูมิปัญญา มหาวิทยาลัยเกษตรศาสตร์
          </p>
          <p style={{ fontSize: 13, lineHeight: "22px", marginTop: 24, color: "var(--ku-text-muted)" }}>
            ฉบับ {NOTICE_VERSION} หากประกาศนี้เปลี่ยน ระบบจะขอความยินยอมจากคุณอีกครั้ง
          </p>
        </article>
      </main>
    </AppShell>
  );
}
