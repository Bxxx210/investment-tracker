export default function Home() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-300/80">
          Overview
        </p>
        <h3 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
          จัดการการลงทุนได้ในมุมมองเดียว
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
          หน้านี้เป็นโครงหลักสำหรับบันทึกแลกเงิน ซื้อขายหุ้น และสรุปภาษี พร้อมต่อยอดเป็น dashboard จริงในขั้นถัดไป
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "แลกเงิน", value: "USD / THB" },
            { label: "หุ้น", value: "Buy / Sell" },
            { label: "ภาษี", value: "Annual Summary" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-3xl border border-white/10 bg-slate-950/40 p-4"
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-lg font-semibold text-white">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6 backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/70">
            Today
          </p>
          <p className="mt-3 text-2xl font-semibold text-white">
            Welcome back
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">
            ใช้เมนูด้านซ้ายเพื่อเริ่มบันทึกรายการ หรือเชื่อม backend ในขั้นถัดไป
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-slate-950/40 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
            Notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>• Responsive sidebar บน desktop และ mobile</li>
            <li>• Header แสดงชื่อแอปชัดเจน</li>
            <li>• พร้อมต่อยอดเป็นหน้า CRUD จริง</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
