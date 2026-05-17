import { useState, useMemo, useEffect } from "react";
import { Plus, ExternalLink, Trash2, Pencil, X, Check, ChevronDown, Search, Sparkles, Globe, Loader2 } from "lucide-react";

const STATUSES = [
  { value: "待投递",   color: "bg-gray-100 text-gray-600",        dot: "bg-gray-400" },
  { value: "已投递",   color: "bg-blue-100 text-blue-700",         dot: "bg-blue-500" },
  { value: "等待回复", color: "bg-yellow-100 text-yellow-700",     dot: "bg-yellow-500" },
  { value: "笔试",     color: "bg-purple-100 text-purple-700",     dot: "bg-purple-500" },
  { value: "面试",     color: "bg-indigo-100 text-indigo-700",     dot: "bg-indigo-500" },
  { value: "已录用",   color: "bg-green-100 text-green-700",       dot: "bg-green-500" },
  { value: "已拒绝",   color: "bg-red-100 text-red-700",           dot: "bg-red-400" },
  { value: "已过期",   color: "bg-orange-100 text-orange-600",     dot: "bg-orange-400" },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.value, s]));

const LOCATIONS = [
  "上海", "北京", "深圳", "杭州", "广州", "成都", "南京", "武汉", "苏州", "西安",
  "远程", "海外",
];

const EMPTY_FORM = { company: "", website: "", position: "", location: "", status: "已投递", appliedDate: "", jdUrl: "", jd: "", notes: "" };

const sampleData = [
  { id: 1, company: "字节跳动", website: "https://jobs.bytedance.com", position: "产品实习生", location: "北京", status: "面试", appliedDate: "2026-05-01", notes: "二面约在下周" },
  { id: 2, company: "腾讯", website: "https://careers.tencent.com", position: "后端开发实习", location: "深圳", status: "已投递", appliedDate: "2026-05-05", notes: "" },
  { id: 3, company: "阿里巴巴", website: "https://talent.alibaba.com", position: "数据分析实习", location: "杭州", status: "等待回复", appliedDate: "2026-04-28", notes: "" },
];

// ───────── 公司名称 ↔ 官网 双向映射 ─────────

const COMPANY_WEBSITES = {
  // ── 国内互联网 ──
  "字节跳动":        "https://jobs.bytedance.com",
  "腾讯":            "https://careers.tencent.com",
  "阿里巴巴":        "https://talent.alibaba.com",
  "阿里":            "https://talent.alibaba.com",
  "百度":            "https://talent.baidu.com",
  "美团":            "https://campus.meituan.com",
  "京东":            "https://campus.jd.com",
  "网易":            "https://campus.163.com",
  "拼多多":          "https://careers.pinduoduo.com",
  "快手":            "https://campus.kuaishou.cn",
  "小红书":          "https://job.xiaohongshu.com",
  "滴滴":            "https://campus.didiglobal.com",
  "哔哩哔哩":        "https://jobs.bilibili.com",
  "B站":             "https://jobs.bilibili.com",
  "小米":            "https://xiaomi.jobs.f.mioffice.cn",
  "华为":            "https://career.huawei.com",
  "蚂蚁集团":        "https://talent.antgroup.com",
  "蚂蚁":            "https://talent.antgroup.com",
  "携程":            "https://campus.ctrip.com",
  "商汤科技":        "https://www.sensetime.com/cn/careers",
  "商汤":            "https://www.sensetime.com/cn/careers",
  "旷视科技":        "https://www.megvii.com/careers",
  "旷视":            "https://www.megvii.com/careers",
  "知乎":            "https://www.zhihu.com/careers",
  "得物":            "https://campus.dewu.com",
  "SHEIN":           "https://careers.shein.com",
  "希音":            "https://careers.shein.com",
  "米哈游":          "https://campus.mihoyo.com",
  "mihoyo":          "https://campus.mihoyo.com",
  "大疆":            "https://we.dji.com",
  "DJI":             "https://we.dji.com",
  "理想汽车":        "https://www.lixiang.com/careers",
  "蔚来":            "https://campus.nio.com",
  "NIO":             "https://campus.nio.com",
  "小鹏汽车":        "https://campus.xiaopeng.com",
  "比亚迪":          "https://job.byd.com",
  "联想":            "https://careers.lenovo.com",
  "中兴":            "https://job.zte.com.cn",
  "OPPO":            "https://careers.oppo.com",
  "vivo":            "https://career.vivo.com",
  "荣耀":            "https://www.hihonor.com/cn/careers",
  "科大讯飞":        "https://campus.iflytek.com",
  "海康威视":        "https://campushr.hikvision.com",
  "深信服":          "https://hr.sangfor.com",
  "360":             "https://360campus.zhiye.com",
  "奇安信":          "https://campus.qianxin.com",
  "金山办公":        "https://join.wps.cn",
  "WPS":             "https://join.wps.cn",
  "虎牙":            "https://hr.huya.com",
  "斗鱼":            "https://www.douyu.com/careers",
  "唯品会":          "https://campus.vip.com",
  "吉利":            "https://campus.geely.com",
  "宁德时代":        "https://www.catl.com/careers",
  "CATL":            "https://www.catl.com/careers",
  "美的":            "https://careers.midea.com",
  "格力":            "https://careers.gree.com",
  "海尔":            "https://careers.haier.com",
  "TCL":             "https://campus.tcl.com",
  "施耐德电气":      "https://careers.se.com",
  "Schneider":       "https://careers.se.com",
  "西门子":          "https://jobs.siemens.com",
  "Siemens":         "https://jobs.siemens.com",
  "博世":            "https://www.bosch.com/careers",
  "Bosch":           "https://www.bosch.com/careers",
  "日立能源":        "https://hitachienergy.zhiye.com",
  "Hitachi Energy":  "https://hitachienergy.zhiye.com",
  "日立":            "https://hitachienergy.zhiye.com",
  "Hitachi":         "https://hitachienergy.zhiye.com",
  "ABB":             "https://careers.abb",
  "通用电气":        "https://jobs.gecareers.com",
  "GE":              "https://jobs.gecareers.com",
  "霍尼韦尔":        "https://careers.honeywell.com",
  "Honeywell":       "https://careers.honeywell.com",

  // ── 国际科技 ──
  "Google":          "https://careers.google.com",
  "谷歌":            "https://careers.google.com",
  "Microsoft":       "https://careers.microsoft.com",
  "微软":            "https://careers.microsoft.com",
  "Amazon":          "https://www.amazon.jobs",
  "亚马逊":          "https://www.amazon.jobs",
  "AWS":             "https://www.amazon.jobs",
  "Apple":           "https://jobs.apple.com",
  "苹果":            "https://jobs.apple.com",
  "Meta":            "https://www.metacareers.com",
  "Facebook":        "https://www.metacareers.com",
  "Netflix":         "https://jobs.netflix.com",
  "奈飞":            "https://jobs.netflix.com",
  "Tesla":           "https://www.tesla.com/careers",
  "特斯拉":          "https://www.tesla.com/careers",
  "Nvidia":          "https://nvidia.wd5.myworkdayjobs.com",
  "英伟达":          "https://nvidia.wd5.myworkdayjobs.com",
  "Uber":            "https://www.uber.com/careers",
  "Airbnb":          "https://careers.airbnb.com",
  "爱彼迎":          "https://careers.airbnb.com",
  "LinkedIn":        "https://careers.linkedin.com",
  "领英":            "https://careers.linkedin.com",
  "Stripe":          "https://stripe.com/jobs",
  "Shopify":         "https://www.shopify.com/careers",
  "Spotify":         "https://www.spotifyjobs.com",
  "Snowflake":       "https://careers.snowflake.com",
  "Databricks":      "https://www.databricks.com/company/careers",
  "Palantir":        "https://www.palantir.com/careers",
  "OpenAI":          "https://openai.com/careers",
  "Anthropic":       "https://www.anthropic.com/careers",
  "Canva":           "https://www.canva.com/careers",
  "Atlassian":       "https://www.atlassian.com/company/careers",
  "Figma":           "https://www.figma.com/careers",
  "Notion":          "https://www.notion.so/careers",
  "Zoom":            "https://careers.zoom.us",
  "Salesforce":      "https://www.salesforce.com/company/careers",
  "Oracle":          "https://www.oracle.com/careers",
  "IBM":             "https://www.ibm.com/careers",
  "Intel":           "https://jobs.intel.com",
  "英特尔":          "https://jobs.intel.com",
  "AMD":             "https://careers.amd.com",

  // ── 金融机构 / 咨询 ──
  "高盛":            "https://www.goldmansachs.com/careers",
  "Goldman Sachs":   "https://www.goldmansachs.com/careers",
  "摩根士丹利":      "https://www.morganstanley.com/careers",
  "Morgan Stanley":  "https://www.morganstanley.com/careers",
  "摩根大通":        "https://careers.jpmorgan.com",
  "JPMorgan":        "https://careers.jpmorgan.com",
  "花旗":            "https://jobs.citi.com",
  "Citibank":        "https://jobs.citi.com",
  "麦肯锡":          "https://www.mckinsey.com/careers",
  "McKinsey":        "https://www.mckinsey.com/careers",
  "BCG":             "https://careers.bcg.com",
  "贝恩":            "https://www.bain.com/careers",
  "Bain":            "https://www.bain.com/careers",
  "德勤":            "https://www.deloitte.com/careers",
  "Deloitte":        "https://www.deloitte.com/careers",
  "普华永道":        "https://www.pwc.com/careers",
  "PwC":             "https://www.pwc.com/careers",
  "安永":            "https://www.ey.com/careers",
  "EY":              "https://www.ey.com/careers",
  "毕马威":          "https://kpmg.com/careers",
  "KPMG":            "https://kpmg.com/careers",
};

// 反向索引：域名片段 → 公司名称（用于从 URL 反查）
const DOMAIN_TO_COMPANY = {};
for (const [name, url] of Object.entries(COMPANY_WEBSITES)) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // 抽取核心域名（去掉 careers/jobs/talent 等前缀）
    const parts = hostname.split(".");
    // 找到有意义的主域名段
    let core = parts[0];
    const skipWords = ["careers", "career", "jobs", "job", "talent", "campus", "campushr", "we", "join", "hr", "xiaomi"];
    if (skipWords.includes(core) && parts.length > 1) {
      // 尝试第二个段：如 careers.tencent.com → tencent
      core = parts[1];
    }
    if (skipWords.includes(core) && parts.length > 2) {
      core = parts[2];
    }
    // 去除非字母前缀（如 mihoyo, shein 等已在映射中）
    if (!DOMAIN_TO_COMPANY[core]) {
      DOMAIN_TO_COMPANY[core] = name;
    }
    // 也存完整 hostname
    DOMAIN_TO_COMPANY[hostname] = name;
  } catch { /* skip malformed URLs */ }
}

// ───────── 智能搜索 ─────────

function lookupWebsite(companyName) {
  const trimmed = companyName.trim();
  // 精确匹配
  if (COMPANY_WEBSITES[trimmed]) return COMPANY_WEBSITES[trimmed];
  // 大小写不敏感匹配
  const lower = trimmed.toLowerCase();
  for (const [name, url] of Object.entries(COMPANY_WEBSITES)) {
    if (name.toLowerCase() === lower) return url;
  }
  // 模糊匹配：公司名包含输入
  for (const [name, url] of Object.entries(COMPANY_WEBSITES)) {
    if (name.toLowerCase().includes(lower) || lower.includes(name.toLowerCase())) {
      return url;
    }
  }
  return null;
}

// 拆解域名中的核心标识段（处理 hitachienergy / bytedance 这类复合词）
function splitPascalCase(word) {
  // 在大写字母前、数字与字母之间插入空格
  return word
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

function extractCompanyFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, "");

    // 先尝试反向索引完整 hostname 精确匹配
    if (DOMAIN_TO_COMPANY[hostname]) return DOMAIN_TO_COMPANY[hostname];

    const parts = hostname.split(".");
    const skipWords = ["careers", "career", "jobs", "job", "talent", "campus", "campushr", "we", "join", "hr"];

    // 常见招聘平台二级域名：company.platform.com → 提取 company 部分
    const recruitmentPlatforms = ["zhiye.com", "mioffice.cn", "myworkdayjobs.com", "f.mioffice.cn"];
    const tld2 = parts.slice(-2).join(".");
    if (recruitmentPlatforms.includes(tld2) && parts.length >= 3) {
      const subParts = parts.slice(0, -2);  // 去掉 platform.com 部分
      const sub = subParts.join(".");
      if (DOMAIN_TO_COMPANY[sub]) return DOMAIN_TO_COMPANY[sub];
      // 对子域名部分做 PascalCase 拆分
      const readable = splitPascalCase(sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase());
      if (readable.length >= 2 && readable.length <= 30) return readable;
    }

    // 泛用：找到第一个非 skip 的段
    let core = parts[0];
    for (const part of parts) {
      if (!skipWords.includes(part.toLowerCase())) {
        core = part;
        break;
      }
    }

    // 再次反向查索引
    if (DOMAIN_TO_COMPANY[core]) return DOMAIN_TO_COMPANY[core];

    // 生成候选
    const titled = core.charAt(0).toUpperCase() + core.slice(1).toLowerCase();
    const guess = splitPascalCase(titled);
    if (guess.length < 2 || guess.length > 30) return null;
    return guess;
  } catch {
    return null;
  }
}

// ───────── JD 抓取 ─────────

// ───────── JD 抓取：平台检测 + API 直连 + HTML 兜底 ─────────

const CORS_PROXY = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

// 平台检测 → 返回 { platform, apiCandidates }，每个 candidate 是 { url, method?, body? }
function detectPlatform(pageUrl) {
  const u = new URL(pageUrl);
  const host = u.hostname;

  // ── zhiye.com / 北森 Beisen ──
  if (host.endsWith("zhiye.com")) {
    const jobAdId = u.searchParams.get("jobAdId") || u.searchParams.get("id");
    const origin = u.origin;  // https://hitachienergy.zhiye.com
    if (jobAdId) {
      return {
        platform: "zhiye",
        apiCandidates: [
          // 北森 v6 常见内部 API
          { url: `${origin}/api/Recruit/GetJobAdDetail`, method: "POST", body: JSON.stringify({ jobAdId }) },
          { url: `${origin}/api/recruit/v2/job/detail`, method: "POST", body: JSON.stringify({ jobAdId }) },
          { url: `${origin}/api/JobAd/Detail?jobAdId=${encodeURIComponent(jobAdId)}` },
          { url: `${origin}/api/Intern/GetJobDetail`, method: "POST", body: JSON.stringify({ jobAdId }) },
          { url: `${origin}/api/Campus/GetJobDetail`, method: "POST", body: JSON.stringify({ jobAdId }) },
        ],
      };
    }
  }

  // ── Greenhouse ──
  if (host === "boards.greenhouse.io" || host.endsWith(".greenhouse.io")) {
    // Greenhouse has a public JSON API: boards.greenhouse.io/embed/job_app?for={company}&token={id}
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const company = parts[0];
      const id = parts[1];
      return {
        platform: "greenhouse",
        apiCandidates: [
          { url: `https://boards.greenhouse.io/embed/job_app?for=${company}&token=${id}&bust=${Date.now()}` },
        ],
      };
    }
  }

  // ── Lever ──
  if (host === "jobs.lever.co") {
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return {
        platform: "lever",
        apiCandidates: [{ url: `https://jobs.lever.co/${parts[0]}/${parts[1]}?format=json` }],
      };
    }
  }

  // ── Workday / myworkdayjobs ──
  if (host.endsWith("myworkdayjobs.com")) {
    return { platform: "workday", apiCandidates: [] };  // Workday 几乎是纯 SPA，无公开 API
  }

  // ── 未知平台 → 走 HTML 抓取 ──
  return { platform: "generic", apiCandidates: [{ url: pageUrl }] };
}

// 解析 Beisen/zhiye API 返回的 JSON
function parseZhiyeJSON(json) {
  // 北森 API 返回格式多变，尝试常见字段路径
  const data = json.Data || json.data || json;
  const job = data.JobAd || data.jobAd || data.Job || data.job || data;
  const title = job.JobTitle || job.jobTitle || job.Title || job.title || job.Position || job.Name || "";
  const descRaw = job.JobDescription || job.jobDescription || job.Description || job.description || job.Requirement || job.Duty || "";
  const location = job.Location || job.location || job.WorkPlace || job.City || "";
  // 北森常见：Description 带 HTML 标签
  const desc = descRaw.replace(/<[^>]*>/g, "\n").replace(/&nbsp;/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  return { title, desc, location: Array.isArray(location) ? location.join(", ") : location };
}

// HTML → 文本
function htmlToText(html) {
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");
  const jdPatterns = [
    /<[^>]+class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*job-detail[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*jd-content[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*position-description[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*job-content[^"]*"[^>]*>([\s\S]*?)<\//i,
    /<[^>]+class="[^"]*detail-content[^"]*"[^>]*>([\s\S]*?)<\//i,
  ];
  for (const re of jdPatterns) {
    const m = cleaned.match(re);
    if (m && m[1]) { cleaned = m[1]; break; }
  }
  let text = cleaned.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n").replace(/<\/div>/gi, "\n").replace(/<[^>]*>/g, "");
  text = text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&nbsp;/g, " ");
  text = text.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return text.substring(0, 6000);
}

async function fetchJD(url, { onStart, onDone, onError, onProgress }) {
  onStart?.();
  const info = detectPlatform(url);

  // ── Step 1: 尝试平台 API（JSON 响应） ──
  if (info.apiCandidates.length > 0 && info.platform !== "generic") {
    for (let i = 0; i < info.apiCandidates.length; i++) {
      const api = info.apiCandidates[i];
      onProgress?.(`正在查询 ${info.platform} API (${i + 1}/${info.apiCandidates.length})...`);
      try {
        const fetchOpts = { signal: AbortSignal.timeout(10000) };
        if (api.method === "POST") {
          fetchOpts.method = "POST";
          fetchOpts.headers = { "Content-Type": "application/json" };
          fetchOpts.body = api.body;
        }
        // API 请求先直连（部分 API 没有 CORS 限制），失败走代理
        let resp;
        try {
          resp = await fetch(api.url, fetchOpts);
        } catch { /* 直连失败 */ }
        if (!resp || !resp.ok) {
          resp = await fetch(CORS_PROXY(api.url), fetchOpts);
        }
        if (!resp.ok) continue;
        const text = await resp.text();
        try {
          const json = JSON.parse(text);
          const jd = parseZhiyeJSON(json);
          if (jd.desc || jd.title) {
            onDone?.({ title: jd.title, text: jd.desc, location: jd.location, url });
            return;
          }
        } catch { /* not JSON */ }
      } catch { /* 尝试下一个 */ }
    }
  }

  // ── Step 2: HTML 抓取兜底 ──
  if (info.platform === "workday") {
    onError?.("Workday 页面为纯 SPA，无法自动抓取。请手动复制 JD 粘贴到下方文本区域。");
    return;
  }

  onProgress?.("正在抓取页面内容...");
  try {
    let resp;
    try {
      resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    } catch { /* 直连失败 */ }
    if (!resp || !resp.ok) {
      resp = await fetch(CORS_PROXY(url), { signal: AbortSignal.timeout(15000) });
    }
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const html = await resp.text();

    const titleM = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleM ? titleM[1].replace(/\s+/g, " ").trim() : "";
    title = title.replace(/\s*[-–|]\s*(校园招聘|社会招聘|实习|校招|社招|Intern|Careers?|Jobs?).*$/i, "").trim();

    const text = htmlToText(html);

    if (!text || text.length < 20) {
      onError?.("页面为 SPA 动态加载，无法抓取到 JD。请手动复制岗位描述粘贴到下方文本区域。");
      return;
    }

    onDone?.({ title, text, url });
  } catch (e) {
    onError?.(e.message || "抓取失败，请手动复制粘贴 JD 内容");
  }
}

// ───────── 组件 ─────────

function StatusBadge({ value }) {
  const s = STATUS_MAP[value] || STATUSES[0];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {value}
    </span>
  );
}

function StatusDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const s = STATUS_MAP[value] || STATUSES[0];
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${s.color} cursor-pointer hover:opacity-80 transition-opacity`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {value}
        <ChevronDown size={11} className="ml-0.5 opacity-70" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-28">
          {STATUSES.map(st => (
            <button
              key={st.value}
              onClick={() => { onChange(st.value); setOpen(false); }}
              className={`flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-50 ${st.value === value ? "font-semibold" : ""}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
              {st.value}
              {st.value === value && <Check size={11} className="ml-auto text-gray-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, onSave, form, setForm }) {
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");
  const [scraping, setScraping] = useState(false);

  const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // 公司名 → 官网
  const handleCompanyBlur = () => {
    const name = form.company.trim();
    if (!name) { setSearchMsg(""); return; }
    if (form.website.trim()) return;
    const found = lookupWebsite(name);
    if (found) {
      setForm(f => ({ ...f, website: found }));
      setSearchMsg(`已匹配：${found}`);
      setTimeout(() => setSearchMsg(""), 2500);
    }
  };

  // 官网 → 公司名
  const handleWebsiteBlur = () => {
    const url = form.website.trim();
    if (!url || !url.startsWith("http")) { setSearchMsg(""); return; }
    if (form.company.trim()) return;
    const name = extractCompanyFromUrl(url);
    if (name) {
      const isExact = DOMAIN_TO_COMPANY[new URL(url).hostname.replace(/^www\./, "")];
      setForm(f => ({ ...f, company: name }));
      setSearchMsg(isExact ? `已识别：${name}` : `推测公司：${name}（可手动修改）`);
      setTimeout(() => setSearchMsg(""), 4000);
    }
  };

  const manualSearch = () => {
    const name = form.company.trim();
    if (!name) return;
    setSearching(true);
    const found = lookupWebsite(name);
    setTimeout(() => {
      setSearching(false);
      if (found) {
        setForm(f => ({ ...f, website: found }));
        setSearchMsg(`已匹配：${found}`);
        setTimeout(() => setSearchMsg(""), 2500);
      } else {
        setSearchMsg("未找到对应官网，请手动输入");
        setTimeout(() => setSearchMsg(""), 3000);
      }
    }, 300);
  };

  // JD 抓取
  const handleScrapeJD = () => {
    const url = form.jdUrl.trim();
    if (!url || !url.startsWith("http")) return;
    fetchJD(url, {
      onStart: () => {
        setScraping(true);
        setSearchMsg("正在连接...");
      },
      onProgress: (msg) => {
        setSearchMsg(msg);
      },
      onDone: ({ title, text, location }) => {
        setScraping(false);
        setForm(f => ({
          ...f,
          jd: text,
          ...(!f.position.trim() && title ? { position: title } : {}),
          ...(!f.location.trim() && location ? { location } : {}),
        }));
        setSearchMsg(title ? `已抓取：${title.substring(0, 50)}` : "已抓取JD内容");
        setTimeout(() => setSearchMsg(""), 4000);
      },
      onError: (msg) => {
        setScraping(false);
        setSearchMsg(msg);
        setTimeout(() => setSearchMsg(""), 5000);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* 公司名称 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">公司名称 *</label>
            <input
              value={form.company}
              onChange={handle("company")}
              onBlur={handleCompanyBlur}
              placeholder="例如：字节跳动"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          {/* 公司官网 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">公司官网</label>
            <div className="flex gap-2">
              <input
                value={form.website}
                onChange={handle("website")}
                onBlur={handleWebsiteBlur}
                placeholder="https://..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
              <button
                type="button"
                onClick={manualSearch}
                disabled={!form.company.trim() || searching}
                title="根据公司名自动检索官网"
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {searching ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search size={13} />
                )}
                <span className="hidden sm:inline">检索</span>
              </button>
            </div>
            {/* 智能提示 */}
            {searchMsg && (
              <p className={`mt-1 text-xs flex items-center gap-1 ${
                searchMsg.startsWith("未找到") || searchMsg.includes("失败") || searchMsg.includes("均失败")
                  ? "text-amber-500"
                  : searchMsg.includes("查询") || searchMsg.includes("抓取") || searchMsg.includes("连接")
                    ? "text-blue-500"
                    : "text-green-600"
              }`}>
                {(searchMsg.startsWith("正在") || searchMsg.includes("查询")) ? (
                  <Loader2 size={11} className="animate-spin" />
                ) : (
                  <Sparkles size={11} />
                )}
                {searchMsg}
              </p>
            )}
          </div>

          {/* 岗位链接 + 抓取 JD */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">岗位链接</label>
            <div className="flex gap-2">
              <input
                value={form.jdUrl || ""}
                onChange={handle("jdUrl")}
                placeholder="粘贴岗位详情页链接..."
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
              <button
                type="button"
                onClick={handleScrapeJD}
                disabled={!form.jdUrl?.trim()?.startsWith("http") || scraping}
                title="抓取岗位描述"
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                {scraping ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Globe size={13} />
                )}
                <span className="hidden sm:inline">抓取JD</span>
              </button>
            </div>
          </div>

          {/* 岗位描述 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              岗位描述
              {form.jd && <span className="ml-2 text-gray-400 font-normal">({form.jd.length} 字符)</span>}
            </label>
            <textarea
              value={form.jd || ""}
              onChange={handle("jd")}
              rows={4}
              placeholder="可手动粘贴JD，或在上方粘贴链接后点击「抓取JD」自动获取..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-y"
            />
          </div>

          {/* 应聘岗位 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">应聘岗位</label>
            <input
              value={form.position}
              onChange={handle("position")}
              placeholder="例如：产品实习生"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          {/* 工作地点 */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">工作地点</label>
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              {LOCATIONS.map(loc => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, location: f.location === loc ? "" : loc }))}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    form.location === loc
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {loc}
                </button>
              ))}
            </div>
            <input
              value={LOCATIONS.includes(form.location) ? "" : form.location}
              onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="或手动输入其他城市..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">当前状态</label>
              <select
                value={form.status}
                onChange={handle("status")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
              >
                {STATUSES.map(s => <option key={s.value}>{s.value}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">投递日期</label>
              <input
                type="date"
                value={form.appliedDate}
                onChange={handle("appliedDate")}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">备注</label>
            <textarea
              value={form.notes}
              onChange={handle("notes")}
              rows={2}
              placeholder="面试安排、联系人等..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSave}
            disabled={!form.company.trim()}
            className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "internship-apps";

function loadApps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch { /* corrupted data */ }
  return sampleData;
}

export default function InternshipTracker() {
  const [apps, setApps] = useState(loadApps);
  const [filterStatus, setFilterStatus] = useState("全部");
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(apps));
    } catch { /* quota exceeded, ignore */ }
  }, [apps]);

  const counts = useMemo(() => {
    const c = { 全部: apps.length };
    STATUSES.forEach(s => { c[s.value] = apps.filter(a => a.status === s.value).length; });
    return c;
  }, [apps]);

  const filtered = useMemo(() =>
    filterStatus === "全部" ? apps : apps.filter(a => a.status === filterStatus),
    [apps, filterStatus]
  );

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ mode: "add" }); };
  const openEdit = (app) => { setForm({ ...app }); setModal({ mode: "edit", id: app.id }); };

  const saveModal = () => {
    if (!form.company.trim()) return;
    if (modal.mode === "add") {
      setApps(prev => [{ ...form, id: Date.now() }, ...prev]);
    } else {
      setApps(prev => prev.map(a => a.id === modal.id ? { ...form, id: a.id } : a));
    }
    setModal(null);
  };

  const updateStatus = (id, status) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const deleteApp = (id) => {
    setApps(prev => prev.filter(a => a.id !== id));
    setDeleteConfirm(null);
  };

  const filterTabs = ["全部", ...STATUSES.map(s => s.value)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">实习投递追踪</h1>
            <p className="text-sm text-gray-400 mt-0.5">共 {apps.length} 条投递记录</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={16} />
            添加投递
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "总投递", value: apps.length, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "进行中", value: apps.filter(a => ["已投递","等待回复","笔试","面试"].includes(a.status)).length, color: "text-indigo-600", bg: "bg-indigo-50" },
            { label: "已录用", value: counts["已录用"] || 0, color: "text-green-600", bg: "bg-green-50" },
            { label: "已拒绝", value: counts["已拒绝"] || 0, color: "text-red-500", bg: "bg-red-50" },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-2xl p-4`}>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap mb-4">
          {filterTabs.map(tab => {
            const active = filterStatus === tab;
            return (
              <button
                key={tab}
                onClick={() => setFilterStatus(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  active
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-gray-500 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {tab}
                {counts[tab] !== undefined && (
                  <span className={`ml-1.5 ${active ? "opacity-80" : "text-gray-400"}`}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-sm">暂无投递记录</p>
              <button onClick={openAdd} className="mt-3 text-sm text-blue-500 hover:underline">添加第一条 →</button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 font-medium uppercase tracking-wide">
                  <th className="text-left px-5 py-3">公司</th>
                  <th className="text-left px-4 py-3">岗位</th>
                  <th className="text-left px-3 py-3">地点</th>
                  <th className="text-left px-4 py-3">状态</th>
                  <th className="text-left px-4 py-3">投递日期</th>
                  <th className="text-left px-4 py-3">备注</th>
                  <th className="text-right px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {app.company[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">{app.company}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {app.website && (
                              <a
                                href={app.website}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-blue-400 hover:text-blue-600 flex items-center gap-0.5"
                              >
                                官网 <ExternalLink size={10} />
                              </a>
                            )}
                            {app.jdUrl && (
                              <a
                                href={app.jdUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-purple-400 hover:text-purple-600 flex items-center gap-0.5"
                                title="岗位详情链接"
                              >
                                JD <ExternalLink size={10} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600">{app.position || <span className="text-gray-300">—</span>}</td>
                    <td className="px-3 py-3.5 text-gray-500 text-xs">
                      {app.location ? (
                        <span className="inline-block bg-gray-100 text-gray-600 rounded-full px-2 py-0.5 text-xs">{app.location}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusDropdown value={app.status} onChange={v => updateStatus(app.id, v)} />
                    </td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs">{app.appliedDate || <span className="text-gray-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-gray-500 max-w-40 truncate">{app.notes || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(app)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(app.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <Modal
          title={modal.mode === "add" ? "添加投递记录" : "编辑投递记录"}
          onClose={() => setModal(null)}
          onSave={saveModal}
          form={form}
          setForm={setForm}
        />
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <p className="text-gray-700 text-sm">
              删除「{apps?.find(a => a.id === deleteConfirm)?.company || '未知公司'}」的投递记录，此操作不可撤销。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm) {
                    deleteApp(deleteConfirm);
                    setDeleteConfirm(null);
                  }
                }}
                className="px-4 py-2 text-sm font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
