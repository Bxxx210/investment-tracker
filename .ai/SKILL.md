# Investment Tracker — AI Context

## Project Overview
Web app บันทึกการลงทุนหุ้นต่างประเทศ
รองรับการคำนวณภาษีตามกฎหมายไทย
รองรับ PWA สำหรับ iPhone

## Tech Stack
- Frontend: Next.js 14 + TypeScript + Tailwind CSS
- Backend: .NET Core 10 (C#)
- Database: PostgreSQL
- AI: Gemini API (อ่านสลิปรูปภาพ)

## Folder Structure
investment-tracker/
├── frontend/    ← Next.js
├── backend/     ← .NET Core C#
└── .ai/         ← AI context files

## Coding Style
- C#: PascalCase สำหรับ class/method
- TypeScript: camelCase สำหรับ variable
- Component: Functional component เท่านั้น
- ภาษา comment: ไทย

## Database Schema

### exchange_transactions
- id
- created_at      ← datetime UTC เก็บใน backend
- date            ← วันที่ทำรายการ
- type            ← "buy_usd" (THB→USD) หรือ "sell_usd" (USD→THB)
- thb_amount      ← จำนวนบาท
- foreign_amount  ← จำนวน USD
- currency        ← default USD
- mid_rate        ← rate กลางตลาด (optional)
- actual_rate     ← rate จริงที่ใช้ (รวม spread)
- spread          ← คำนวณอัตโนมัติ
- note

### stock_transactions
- id
- executed_at      ← datetime (ถ้าไม่ระบุใช้เวลาปัจจุบัน)
- ticker           ← ชื่อหุ้น เช่น AAPL
- type             ← buy/sell
- quantity         ← จำนวนหุ้น
- price_usd        ← ราคาต่อหุ้น USD
- fee_usd          ← ค่าธรรมเนียม USD
- vat_usd          ← VAT USD
- total_cost_usd   ← คำนวณอัตโนมัติ
- rate_at_trade    ← optional ใส่ทีหลังได้
- price_thb        ← คำนวณได้ถ้ารู้ rate
- note

### tax_summary
- id, year
- total_income_thb
- total_cost_thb
- total_fee_thb
- net_profit_thb
- tax_rate
- tax_amount

## Business Rules
- ถ้าไม่ระบุวันที่ → ใช้ datetime ปัจจุบันอัตโนมัติ
- spread = actual_rate - mid_rate
- total_cost_usd = (price_usd x quantity) + fee_usd + vat_usd
- price_thb = total_cost_usd x rate_at_trade (ถ้ามี rate)
- rate_at_trade optional → กรอกทีหลังได้เพื่อคำนวณภาษี
- อัตราภาษีตาม bracket กรมสรรพากรไทย

### Business Rules — Exchange
- buy_usd (THB→USD): ไม่เสียภาษี เป็นแค่แลกเงิน
- sell_usd (USD→THB): อาจเสียภาษีถ้ากำไรจาก rate
- ภาษีจาก exchange คิดจาก: 
  (actual_rate ตอนขาย - actual_rate ตอนซื้อ) x จำนวน USD

### Timezone
- Backend เก็บ DateTime เป็น UTC เสมอ
- Frontend แปลงเป็น UTC+7 ก่อนแสดงเสมอ

## Summary & Tax Calculation Rules

### วิธีคำนวณกำไร
- ใช้ FIFO (First In First Out)
- กำไร = (ราคาขาย x rate_at_trade) - (ต้นทุน FIFO x rate_at_trade ตอนซื้อ) - ค่าธรรมเนียม

### rate_at_trade
- ถ้าไม่มี rate_at_trade → คำนวณภาษีไม่ได้
- ต้องเตือน user ทุกครั้งที่เปิดหน้า summary
- user เลือกได้ 2 แบบ:
  1. กรอก rate ก่อน → คำนวณแม่นยำ
  2. ข้ามไปก่อน → คำนวณได้บางส่วน แต่เตือนทุกครั้ง

### Tax Bracket ไทย (ม.40(4))
- 0 - 150,000       → ยกเว้น
- 150,001 - 300,000 → 5%
- 300,001 - 500,000 → 10%
- 500,001 - 750,000 → 15%
- 750,001-1,000,000 → 20%
- 1,000,001+        → 25-35%

### Summary UI (C)
- Card ด้านบน: ตัวเลขสรุป
- Chat ด้านล่าง: ถามตอบกับ AI เรื่องภาษี

## AI Instructions
- ใช้ภาษาไทยใน comment เสมอ
- เขียน error handling ทุกครั้ง
- ไม่เขียน business logic ใน Controller
- แยก Service layer เสมอ