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
- id, date, thb_amount, foreign_amount
- currency (default: USD), rate, note

### stock_transactions  
- id, date, ticker, type (buy/sell)
- quantity, price_foreign, rate_at_trade
- price_thb, fee_foreign, fee_thb, note

### tax_summary
- id, year, total_income_thb
- total_cost_thb, total_fee_thb
- net_profit_thb, tax_rate, tax_amount

## Business Rules
- ภาษีคิดจากกำไรสุทธิเป็นบาท ณ วันที่ขาย
- อัตราแลกเปลี่ยนต้องบันทึก ณ วันที่ทำรายการ
- รองรับหลายสกุลเงิน (USD เป็น default)

## AI Instructions
- ใช้ภาษาไทยใน comment เสมอ
- เขียน error handling ทุกครั้ง
- ไม่เขียน business logic ใน Controller
- แยก Service layer เสมอ