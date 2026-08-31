# CarFlow — ระบบจองรถโรงเรียนดอนตาลวิทยา

ระบบจองรถสำหรับ **โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร**  
Deploy บน Vercel · ข้อมูลใน Google Sheets · รูปภาพจาก Google Drive (lh3) · แจ้งเตือน Telegram

## ความสามารถหลัก

### ผู้ใช้ทั่วไป
- จองรถผ่าน **ปฏิทิน** เลือกวัน/เดือน
- กันจองซ้ำในวันเดียวกัน (ยกเว้นมีรถหลายคันว่าง)
- ฟอร์มจอง: ชื่อ-นามสกุล, เบอร์โทร, กิจกรรม, ปลายทาง, จังหวัด (77 จังหวัด), จำนวนผู้โดยสาร, เลือกรถ

### Admin
- **จัดการรถ** — เพิ่ม/ลบ/แก้ไข (ยี่ห้อ, รุ่น, สี, ทะเบียน, พนักงานขับ, ที่นั่ง, รูป Drive)
- **Dashboard** — ระยะทางรวม/เดือน, วันเดินทาง, สถิติการจอง
- **จัดการการจอง** — อนุมัติ, ยกเลิก, แก้ไขระยะทาง, ลบ
- **ตั้งค่า** — Telegram Chat ID, Webhook

### Telegram
- แจ้งเตือนเมื่อมีการจองใหม่
- ปุ่ม **อนุมัติ / ยกเลิก** ในแชท Telegram

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Deploy | Vercel |
| Database | Google Sheets |
| รูปภาพ | Google Drive → `lh3.googleusercontent.com` |
| Lightbox | yet-another-react-lightbox |
| แจ้งเตือน | Telegram Bot API |

## เริ่มต้นใช้งาน

### 1. ติดตั้ง

```bash
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

> หากยังไม่ตั้งค่า Google Sheets ระบบจะใช้ **ข้อมูล Demo** (รถ 2 คัน) ให้ทดสอบได้ทันที

### 2. สร้าง Google Sheet

สร้าง Spreadsheet แล้วเพิ่ม Sheet 3 แผ่น:

**Sheet: `Vehicles`** (แถว 1 = header)

| id | brand | model | color | licensePlate | driver | seats | imageDriveId | active |
|----|-------|-------|-------|--------------|--------|-------|--------------|--------|

**Sheet: `Bookings`**

| id | date | firstName | lastName | phone | activity | destination | province | passengers | vehicleId | vehicleName | status | distance | notes | createdAt | updatedAt |

**Sheet: `Settings`**

| key | value |
|-----|-------|
| telegramChatId | |
| telegramBotToken | |
| adminPassword | |
| schoolName | โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร |

### 3. Google Service Account

1. ไป [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project → เปิด **Google Sheets API** และ **Google Drive API**
3. สร้าง Service Account → ดาวน์โหลด JSON key
4. แชร์ Spreadsheet ให้ email ของ Service Account (Editor)
5. แชร์โฟลเดอร์ Google Drive ที่เก็บรูปรถ (Viewer)

### 4. รูปภาพรถ (Google Drive → lh3)

1. อัปโหลดรูปไป Google Drive
2. ตั้ง sharing เป็น "Anyone with the link can view"
3. คัดลอก **File ID** จาก URL: `https://drive.google.com/file/d/FILE_ID/view`
4. ใส่ใน Admin → จัดการรถ → Google Drive File ID  
   ระบบแสดงผ่าน `https://lh3.googleusercontent.com/d/FILE_ID`
5. คลิกรูปเพื่อดูแบบ Lightbox (ขยายภาพ)

### 5. Environment Variables

คัดลอก `.env.example` เป็น `.env.local`:

```env
GOOGLE_SHEET_ID=xxxxxxxx
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
TELEGRAM_BOT_TOKEN=123456:ABC...
TELEGRAM_CHAT_ID=-1001234567890
ADMIN_PASSWORD=รหัสผ่านที่ปลอดภัย
```

บน **Vercel**: Project Settings → Environment Variables → ใส่ค่าเดียวกัน  
(`GOOGLE_SERVICE_ACCOUNT_JSON` ใส่ JSON ทั้งก้อนในบรรทัดเดียว)

### 6. Telegram Bot

1. สร้าง Bot ที่ [@BotFather](https://t.me/BotFather) → ได้ Token
2. เพิ่ม Bot เข้ากลุ่ม Admin
3. หา Chat ID ด้วย [@userinfobot](https://t.me/userinfobot) หรือ [@getidsbot](https://t.me/getidsbot)
4. Admin → ตั้งค่า → ใส่ Chat ID → **ตั้งค่า Telegram Webhook**

## Deploy บน Vercel

```bash
npm i -g vercel
vercel
```

หรือเชื่อม GitHub repo แล้ว Import ใน Vercel Dashboard

## โครงสร้างหน้า

| เส้นทาง | คำอธิบาย |
|---------|----------|
| `/` | ปฏิทินจองรถ (ผู้ใช้ทั่วไป) |
| `/admin` | Dashboard |
| `/admin/vehicles` | จัดการรถ |
| `/admin/bookings` | จัดการการจอง |
| `/admin/settings` | Telegram & ตั้งค่า |

## สถานะการจอง

- `pending` — รออนุมัติ
- `approved` — อนุมัติแล้ว
- `cancelled` — ยกเลิก
- `completed` — เสร็จสิ้น

---

พัฒนาสำหรับ โรงเรียนดอนตาลวิทยา สพม.มุกดาหาร
