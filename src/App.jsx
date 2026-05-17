import { useState } from "react";
import InternshipTracker from "./InternshipTracker";
import ResumeEditor from "./ResumeEditor";

const TABS = [
  { key: "tracker", label: "投递追踪" },
  { key: "resume", label: "简历编辑" },
];

export default function App() {
  const [page, setPage] = useState("tracker");

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setPage(tab.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  page === tab.key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">实习生求职助手</span>
        </div>
      </nav>
      {page === "tracker" ? <InternshipTracker /> : <ResumeEditor />}
    </>
  );
}
