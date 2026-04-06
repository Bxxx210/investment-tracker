"use client";

import { useEffect, useState } from "react";

type SettingState = {
  enterToSend: boolean;
  showHistory: boolean;
  compactBubbles: boolean;
};

const defaultSettings: SettingState = {
  enterToSend: true,
  showHistory: true,
  compactBubbles: false,
};

function loadSettings() {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  try {
    const raw = window.localStorage.getItem("investment-tracker-settings");
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SettingState>(defaultSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      "investment-tracker-settings",
      JSON.stringify(settings)
    );
  }, [settings]);

  const toggle = (key: keyof SettingState) => {
    setSettings((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 px-4 py-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">
            Settings
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
            ตั้งค่า
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
            เก็บค่าที่ใช้บ่อยไว้บนเครื่อง เพื่อให้ประสบการณ์การใช้งานเหมือนแอปแชทจริง
          </p>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          {[
            {
              key: "enterToSend" as const,
              title: "กด Enter เพื่อส่ง",
              description: "พิมพ์แล้วกด Enter เพื่อส่งข้อความได้ทันที",
            },
            {
              key: "showHistory" as const,
              title: "แสดงประวัติย้อนหลัง",
              description: "โชว์ bubble รายการที่บันทึกไว้ก่อนเริ่มคุยใหม่",
            },
            {
              key: "compactBubbles" as const,
              title: "Bubble แบบกระชับ",
              description: "ลดระยะห่างและความสูงของข้อความในหน้าจอเล็ก",
            },
          ].map((item) => {
            const enabled = settings[item.key];

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className={[
                  "flex w-full items-center justify-between gap-4 rounded-[1.6rem] border px-4 py-4 text-left transition",
                  enabled
                    ? "border-cyan-400/30 bg-cyan-400/10"
                    : "border-white/10 bg-slate-900/70 hover:bg-white/5",
                ].join(" ")}
              >
                <div>
                  <p className="text-base font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">
                    {item.description}
                  </p>
                </div>
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    enabled
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-white/5 text-slate-400",
                  ].join(" ")}
                >
                  {enabled ? "เปิด" : "ปิด"}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
