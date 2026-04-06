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
- id, date
- thb_amount       ← จำนวนบาท
- foreign_amount   ← จำนวนเงินต่างประเทศที่ได้
- currency         ← default USD
- mid_rate         ← rate กลางตลาด (optional)
- actual_rate      ← rate จริงที่ใช้ (รวม spread)
- spread           ← คำนวณอัตโนมัติ (actual - mid)
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

## AI Instructions
- ใช้ภาษาไทยใน comment เสมอ
- เขียน error handling ทุกครั้ง
- ไม่เขียน business logic ใน Controller
- แยก Service layer เสมอ