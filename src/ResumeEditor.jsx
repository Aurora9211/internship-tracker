import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2, Sparkles, Loader2, Eye, EyeOff, Upload, FileText, Check, X } from "lucide-react";

const STORAGE_KEY = "resume-data";
const API_KEY_STORAGE = "resume-ai-api-key";

const DEGREES = ["本科", "硕士", "博士", "大专", "MBA"];

const EMPTY_RESUME = {
  photo: "",
  basicInfo: {
    name: "", email: "", phone: "", city: "", desiredPosition: "",
    github: "", linkedin: "", personalSite: "",
  },
  education: [
    { id: Date.now(), school: "", major: "", degree: "本科", startDate: "", endDate: "", gpa: "", courses: "" },
  ],
  internships: [
    { id: Date.now() + 1, company: "", role: "", startDate: "", endDate: "", description: "" },
  ],
  projects: [
    { id: Date.now() + 2, name: "", role: "", startDate: "", endDate: "", description: "", techStack: "" },
  ],
  skills: "",
  other: "",
};

function loadResume() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return EMPTY_RESUME;
}

// ───────── Sub-components ─────────

function CollapsibleSection({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        {title}
        {open ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
        {...props}
      />
    </div>
  );
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-y"
      />
    </div>
  );
}

function AIButton({ section, field, currentText, context, onResult, disabled }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(false);

  const apiKey = localStorage.getItem(API_KEY_STORAGE);

  const buildPrompt = () => {
    const base = `你是一位专业的中文简历优化顾问。`;
    if (section === "internship" || section === "project") {
      return `${base}请根据以下经历要点，生成一段 STAR 法则（情境-任务-行动-结果）格式的简历描述。使用专业、简洁的中文，突出量化成果。每次描述控制在3-4句话。\n\n原始内容：${currentText || "（无）"}\n\n岗位意向：${context.desiredPosition || "未填写"}\n\n只输出优化后的文字，不要任何解释、前缀或后缀。`;
    }
    if (section === "skills") {
      return `${base}根据以下岗位意向和经历，推荐 8-12 个相关技能关键词。\n\n岗位意向：${context.desiredPosition || "未填写"}\n已有技能：${currentText || "（无）"}\n经历摘要：${context.experience || "未填写"}\n\n请以中文逗号分隔输出，只输出技能列表，不要解释。`;
    }
    return `${base}请润色优化以下内容，使表达更专业、简洁。\n\n原始内容：${currentText || "（无）"}\n\n只输出优化后的文字，不要解释。`;
  };

  const handleClick = async () => {
    if (!apiKey) { setError("请先在下方 AI 设置中输入 API Key"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{ role: "user", content: buildPrompt() }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (!resp.ok) {
        if (resp.status === 401) throw new Error("API Key 无效，请检查");
        if (resp.status === 429) throw new Error("请求过于频繁，请稍后再试");
        throw new Error(`请求失败 (${resp.status})`);
      }
      const data = await resp.json();
      const text = data.content?.[0]?.text || "";
      if (text) {
        setResult(text);
      } else {
        setError("AI 未返回有效内容");
      }
    } catch (e) {
      setError(e.message || "请求失败，请检查网络");
    } finally {
      setLoading(false);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 3000);
    }
  };

  return (
    <div className="mt-1.5 space-y-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading || cooldown || disabled}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
        {loading ? "生成中..." : cooldown ? "请稍候..." : "AI 建议"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {result && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {result}
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={() => { onResult(result); setResult(null); }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Check size={11} /> 采用
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-500 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <X size={11} /> 忽略
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PhotoUpload({ value, onChange }) {
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("照片不能超过 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const max = 200;
        let { width, height } = img;
        if (width > height) { height = (height / width) * max; width = max; }
        else { width = (width / height) * max; height = max; }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        onChange(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
        {value ? (
          <img src={value} alt="头像" className="w-full h-full object-cover" />
        ) : (
          <Upload size={18} className="text-gray-300" />
        )}
      </div>
      <div>
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
          <Upload size={12} />
          上传照片
          <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="ml-2 text-xs text-red-400 hover:text-red-600"
          >
            移除
          </button>
        )}
        <p className="text-xs text-gray-400 mt-1">自动压缩至 200px</p>
      </div>
    </div>
  );
}

function RepeatingSection({ items, onChange, renderFields }) {
  const add = () => {
    onChange([...items, { id: Date.now(), school: "", major: "", degree: "本科", startDate: "", endDate: "", gpa: "", courses: "", company: "", role: "", description: "", name: "", techStack: "" }]);
  };
  const remove = (id) => {
    if (items.length <= 1) return;
    onChange(items.filter(i => i.id !== id));
  };
  const update = (id, field, value) => {
    onChange(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id} className="border border-gray-100 rounded-lg p-3 relative">
          {items.length > 1 && (
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-400 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
          {renderFields(item, idx, (field, value) => update(item.id, field, value))}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <Plus size={12} /> 添加一项
      </button>
    </div>
  );
}

// ───────── Main Component ─────────

export default function ResumeEditor() {
  const [resume, setResume] = useState(loadResume);
  const [showAI, setShowAI] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || "");
  const [showPreview, setShowPreview] = useState(true);
  const previewRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(resume)); } catch {}
  }, [resume]);

  const update = (path, value) => {
    setResume(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split(".");
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) {
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const saveApiKey = () => {
    localStorage.setItem(API_KEY_STORAGE, apiKey);
    setShowAI(false);
  };

  const expSummary = resume.internships.map(i => i.description).filter(Boolean).join("；") + " " +
    resume.projects.map(p => p.description).filter(Boolean).join("；");

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col lg:flex-row gap-4" style={{ height: "calc(100vh - 60px)" }}>
      {/* Left Panel — Form */}
      <div className="lg:w-5/12 overflow-y-auto space-y-4 pr-1 flex-shrink-0">
        {/* Mobile preview toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded-xl"
        >
          <Eye size={13} />
          {showPreview ? "隐藏预览" : "显示预览"}
        </button>

        {/* AI Settings */}
        <CollapsibleSection title="AI 设置" defaultOpen={false}>
          <p className="text-xs text-gray-400">输入你的 Anthropic API Key，用于生成简历优化建议。</p>
          <div className="flex gap-2">
            <input
              type={showAI ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
            <button
              type="button"
              onClick={() => setShowAI(!showAI)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {showAI ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-xs text-gray-400">API Key 仅存储在本浏览器中，不会上传到任何服务器。</p>
          <button
            type="button"
            onClick={saveApiKey}
            className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            保存
          </button>
        </CollapsibleSection>

        {/* 1. 基本信息 */}
        <CollapsibleSection title="基本信息">
          <PhotoUpload value={resume.photo} onChange={v => update("photo", v)} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="姓名 *" value={resume.basicInfo.name} onChange={e => update("basicInfo.name", e.target.value)} placeholder="张三" />
            <Input label="意向岗位" value={resume.basicInfo.desiredPosition} onChange={e => update("basicInfo.desiredPosition", e.target.value)} placeholder="产品实习生" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="手机" value={resume.basicInfo.phone} onChange={e => update("basicInfo.phone", e.target.value)} placeholder="138xxxx" />
            <Input label="邮箱" value={resume.basicInfo.email} onChange={e => update("basicInfo.email", e.target.value)} placeholder="zhangsan@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="城市" value={resume.basicInfo.city} onChange={e => update("basicInfo.city", e.target.value)} placeholder="上海" />
            <Input label="GitHub" value={resume.basicInfo.github} onChange={e => update("basicInfo.github", e.target.value)} placeholder="github.com/..." />
          </div>
          <Input label="个人网站" value={resume.basicInfo.personalSite} onChange={e => update("basicInfo.personalSite", e.target.value)} placeholder="https://..." />
        </CollapsibleSection>

        {/* 2. 教育背景 */}
        <CollapsibleSection title="教育背景">
          <RepeatingSection
            items={resume.education}
            onChange={v => update("education", v)}
            renderFields={(item, idx, upd) => (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input label="学校" value={item.school} onChange={e => upd("school", e.target.value)} placeholder="北京大学" />
                  <Input label="专业" value={item.major} onChange={e => upd("major", e.target.value)} placeholder="计算机科学" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">学历</label>
                    <select
                      value={item.degree}
                      onChange={e => upd("degree", e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                    >
                      {DEGREES.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <Input label="开始" type="date" value={item.startDate} onChange={e => upd("startDate", e.target.value)} />
                  <Input label="结束" type="date" value={item.endDate} onChange={e => upd("endDate", e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="GPA" value={item.gpa} onChange={e => upd("gpa", e.target.value)} placeholder="3.8/4.0" />
                </div>
                <TextArea label="主修课程 / 描述" value={item.courses} onChange={e => upd("courses", e.target.value)} placeholder="数据结构、算法设计..." rows={2} />
              </div>
            )}
          />
        </CollapsibleSection>

        {/* 3. 实习经历 */}
        <CollapsibleSection title="实习经历">
          <RepeatingSection
            items={resume.internships}
            onChange={v => update("internships", v)}
            renderFields={(item, idx, upd) => (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input label="公司" value={item.company} onChange={e => upd("company", e.target.value)} placeholder="字节跳动" />
                  <Input label="岗位" value={item.role} onChange={e => upd("role", e.target.value)} placeholder="产品实习生" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="开始" type="date" value={item.startDate} onChange={e => upd("startDate", e.target.value)} />
                  <Input label="结束" type="date" value={item.endDate} onChange={e => upd("endDate", e.target.value)} />
                </div>
                <TextArea label="工作描述" value={item.description} onChange={e => upd("description", e.target.value)} placeholder="负责xxx项目，通过xxx实现了xxx" rows={3} />
                <AIButton
                  section="internship"
                  currentText={item.description}
                  context={{ desiredPosition: resume.basicInfo.desiredPosition, experience: expSummary }}
                  onResult={text => upd("description", text)}
                />
              </div>
            )}
          />
        </CollapsibleSection>

        {/* 4. 项目经历 */}
        <CollapsibleSection title="项目经历">
          <RepeatingSection
            items={resume.projects}
            onChange={v => update("projects", v)}
            renderFields={(item, idx, upd) => (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input label="项目名称" value={item.name} onChange={e => upd("name", e.target.value)} placeholder="校园二手交易平台" />
                  <Input label="你的角色" value={item.role} onChange={e => upd("role", e.target.value)} placeholder="前端开发" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input label="开始" type="date" value={item.startDate} onChange={e => upd("startDate", e.target.value)} />
                  <Input label="结束" type="date" value={item.endDate} onChange={e => upd("endDate", e.target.value)} />
                </div>
                <Input label="技术栈" value={item.techStack} onChange={e => upd("techStack", e.target.value)} placeholder="React, Node.js, MongoDB" />
                <TextArea label="项目描述" value={item.description} onChange={e => upd("description", e.target.value)} placeholder="使用xxx技术实现了xxx功能，解决了xxx问题" rows={3} />
                <AIButton
                  section="project"
                  currentText={item.description}
                  context={{ desiredPosition: resume.basicInfo.desiredPosition, experience: expSummary }}
                  onResult={text => upd("description", text)}
                />
              </div>
            )}
          />
        </CollapsibleSection>

        {/* 5. 技能 */}
        <CollapsibleSection title="技能">
          <TextArea
            label="技能（逗号或换行分隔）"
            value={resume.skills}
            onChange={e => update("skills", e.target.value)}
            placeholder="Python, SQL, React, 数据分析, 用户研究..."
            rows={2}
          />
          <AIButton
            section="skills"
            currentText={resume.skills}
            context={{ desiredPosition: resume.basicInfo.desiredPosition, experience: expSummary }}
            onResult={text => update("skills", text)}
          />
        </CollapsibleSection>

        {/* 6. 其他 */}
        <CollapsibleSection title="其他">
          <TextArea
            label="证书、语言能力、奖项等"
            value={resume.other}
            onChange={e => update("other", e.target.value)}
            placeholder="CET-6, 全国大学生数学建模竞赛一等奖..."
            rows={3}
          />
        </CollapsibleSection>

        <div className="h-4" />
      </div>

      {/* Right Panel — A4 Preview */}
      <div className={`lg:flex-1 lg:flex lg:justify-center overflow-y-auto ${showPreview ? "" : "hidden lg:flex"}`}>
        <div className="lg:sticky lg:top-4 h-fit w-full max-w-[210mm]">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400 flex items-center gap-1.5">
              <FileText size={13} />
              实时预览
            </span>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              导出 PDF
            </button>
          </div>

          {/* A4 Paper */}
          <div ref={previewRef} className="resume-preview-container bg-white shadow-lg border border-gray-100 rounded-lg overflow-hidden">
            <div className="p-8" style={{ minHeight: "297mm" }}>
              {/* Header */}
              <div className="flex items-start gap-5 mb-6">
                {resume.photo ? (
                  <img src={resume.photo} alt="头像" className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border-2 border-gray-100" />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-3xl font-bold text-blue-600 flex-shrink-0">
                    {(resume.basicInfo.name || "?")[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">
                    {resume.basicInfo.name || "姓名"}
                  </h1>
                  <p className="text-sm text-blue-600 font-medium mb-2">
                    {resume.basicInfo.desiredPosition || "意向岗位"}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                    {resume.basicInfo.phone && <span>{resume.basicInfo.phone}</span>}
                    {resume.basicInfo.email && <span>{resume.basicInfo.email}</span>}
                    {resume.basicInfo.city && <span>{resume.basicInfo.city}</span>}
                    {resume.basicInfo.github && <span>{resume.basicInfo.github}</span>}
                    {resume.basicInfo.personalSite && <span>{resume.basicInfo.personalSite}</span>}
                  </div>
                </div>
              </div>

              <hr className="border-gray-100 mb-5" />

              {/* Education */}
              {resume.education.some(e => e.school) && (
                <div className="mb-5 resume-section">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-500 inline-block">教育背景</h2>
                  <div className="space-y-3">
                    {resume.education.map((e, i) => e.school ? (
                      <div key={e.id || i}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-800">{e.school}</span>
                          <span className="text-xs text-gray-400">{e.startDate} - {e.endDate}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                          <span>{e.major} · {e.degree}</span>
                          {e.gpa && <span>GPA: {e.gpa}</span>}
                        </div>
                        {e.courses && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{e.courses}</p>}
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Internships */}
              {resume.internships.some(i => i.company) && (
                <div className="mb-5 resume-section">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-500 inline-block">实习经历</h2>
                  <div className="space-y-4">
                    {resume.internships.map((i, idx) => i.company ? (
                      <div key={i.id || idx}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-800">{i.company}</span>
                          <span className="text-xs text-gray-400">{i.startDate} - {i.endDate}</span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">{i.role}</p>
                        {i.description && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{i.description}</p>}
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Projects */}
              {resume.projects.some(p => p.name) && (
                <div className="mb-5 resume-section">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-500 inline-block">项目经历</h2>
                  <div className="space-y-4">
                    {resume.projects.map((p, idx) => p.name ? (
                      <div key={p.id || idx}>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-gray-800">{p.name}</span>
                          <span className="text-xs text-gray-400">{p.startDate} - {p.endDate}</span>
                        </div>
                        <p className="text-xs text-blue-600 font-medium mt-0.5">{p.role}</p>
                        {p.techStack && <p className="text-xs text-gray-400 mt-0.5">{p.techStack}</p>}
                        {p.description && <p className="text-xs text-gray-600 mt-1.5 leading-relaxed whitespace-pre-wrap">{p.description}</p>}
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}

              {/* Skills */}
              {resume.skills && (
                <div className="mb-5 resume-section">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-500 inline-block">技能</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {resume.skills.split(/[,，\n]/).filter(Boolean).map((s, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s.trim()}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Other */}
              {resume.other && (
                <div className="mb-5 resume-section">
                  <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-3 pb-2 border-b-2 border-blue-500 inline-block">其他</h2>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{resume.other}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
