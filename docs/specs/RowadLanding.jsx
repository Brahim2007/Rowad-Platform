import { useState, useEffect, useRef, useCallback } from "react";
import {
  Network, Menu, X, ArrowLeft, ArrowUpRight, Users, Briefcase,
  Globe, Heart, Mail, Linkedin, Target, Lightbulb, Handshake,
  TrendingUp, Star, ChevronDown, BookOpen, Shield, Zap,
  Database, Activity, Fingerprint, ShieldCheck, Layers, Route,
  UserCheck, Archive, Search, Download, PieChart, RefreshCw,
  Compass, FileText, CheckSquare, BarChart2, Clock,
  Eye, Brain, Cpu, BarChart3, Percent, ArrowDown, ArrowUp,
  AlertTriangle, ThumbsUp, Flame, Award, Filter, ChevronLeft, ChevronRight
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend, AreaChart, Area
} from "recharts";

/* ─── Design Tokens ─── */
const C = {
  p50: "#F2F7F1", p100: "#DEEADC", p200: "#BFD5BA", p300: "#95B98C",
  p500: "#527F47", p600: "#3F6336", p700: "#324E2C", p900: "#20321E",
  s50: "#FBF7F0", s100: "#F4ECD6", s300: "#D9B872", s500: "#B8853A",
  s600: "#9B6E2F", s700: "#7C5728",
  n50: "#FAFAF9", n100: "#F5F4F1", n200: "#E8E6E0", n300: "#D4D1C8",
  n400: "#A8A496", n500: "#7C7868", n600: "#5C5849", n700: "#45423A",
  n900: "#1A1916",
};

/* ─── Inject Fonts + Keyframes ─── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'IBM Plex Sans Arabic',sans-serif;background:#fff;color:${C.n900};direction:rtl}
    @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
    @keyframes floatNode{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
    @keyframes drawLine{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}
    @keyframes scrollBand{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
    @keyframes countUp{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
    .reveal{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
    .reveal.visible{opacity:1;transform:translateY(0)}
    .card-hover{transition:transform .25s ease,box-shadow .25s ease}
    .card-hover:hover{transform:translateY(-6px);box-shadow:0 16px 32px -8px rgba(0,0,0,.13)}
    .nav-link{color:${C.n600};font-size:15px;font-weight:500;background:none;border:none;cursor:pointer;transition:color .2s;padding:4px 0}
    .nav-link:hover,.nav-link.active{color:${C.p500}}
    .btn-primary{display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:${C.p500};color:#fff;font-family:'IBM Plex Sans Arabic',sans-serif;font-size:15px;font-weight:600;border:none;border-radius:10px;cursor:pointer;transition:background .2s,transform .15s,box-shadow .2s;box-shadow:0 4px 12px rgba(82,127,71,.3)}
    .btn-primary:hover{background:${C.p600};transform:translateY(-1px);box-shadow:0 8px 20px rgba(82,127,71,.35)}
    .btn-outline{display:inline-flex;align-items:center;gap:8px;padding:11px 28px;background:transparent;color:${C.p600};font-family:'IBM Plex Sans Arabic',sans-serif;font-size:15px;font-weight:600;border:2px solid ${C.p500};border-radius:10px;cursor:pointer;transition:all .2s}
    .btn-outline:hover{background:${C.p50};transform:translateY(-1px)}
    ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:${C.n100}}::-webkit-scrollbar-thumb{background:${C.p300};border-radius:3px}
  `}</style>
);

/* ─── Scroll Reveal Hook ─── */
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add("visible"); obs.disconnect(); }
    }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── Animated Counter ─── */
function Counter({ end, suffix = "", duration = 2000 }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const start = Date.now();
        const tick = () => {
          const p = Math.min((Date.now() - start) / duration, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * end));
          if (p < 1) requestAnimationFrame(tick);
        };
        tick();
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ─── Network SVG Illustration ─── */
const NetworkIllustration = () => (
  <svg viewBox="0 0 400 340" fill="none" xmlns="http://www.w3.org/2000/svg"
    style={{ width: "100%", maxWidth: 440, opacity: .92 }}>
    {/* Connection lines */}
    {[
      [200,170, 80,80],  [200,170, 320,80], [200,170, 80,260],
      [200,170, 320,260],[200,170, 50,170], [200,170, 350,170],
      [80,80,  50,170],  [320,80, 350,170], [80,260, 50,170],
      [320,260,350,170],
    ].map(([x1,y1,x2,y2], i) => (
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={C.p200} strokeWidth="1.5" strokeDasharray="200" strokeDashoffset="200"
        style={{ animation: `drawLine 1.2s ease forwards ${i * 0.07}s` }} />
    ))}
    {/* Satellite nodes */}
    {[
      [80,80,"أ"],[320,80,"ب"],[50,170,"ج"],[350,170,"د"],
      [80,260,"هـ"],[320,260,"و"],
    ].map(([cx,cy,label], i) => (
      <g key={i} style={{ animation: `floatNode 3s ease-in-out ${i * 0.4}s infinite` }}>
        <circle cx={cx} cy={cy} r="22" fill={C.p100} stroke={C.p300} strokeWidth="1.5"
          style={{ animation: `fadeIn .8s ease forwards ${i * 0.1 + .5}s`, opacity: 0 }} />
        <circle cx={cx} cy={cy} r="14" fill={C.p200} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
          fill={C.p700} fontSize="12" fontWeight="600"
          fontFamily="'IBM Plex Sans Arabic',sans-serif">{label}</text>
      </g>
    ))}
    {/* Central node */}
    <circle cx="200" cy="170" r="48" fill={C.p100} stroke={C.p300} strokeWidth="2"
      style={{ animation: `fadeIn .5s ease forwards`, opacity: 0 }} />
    <circle cx="200" cy="170" r="36" fill={C.p500} />
    <circle cx="200" cy="170" r="36" fill="none" stroke={C.p300} strokeWidth="1"
      strokeDasharray="4 4" style={{ animation: `fadeIn 1s ease forwards 1s`, opacity: 0 }} />
    <g style={{ opacity: 0, animation: `fadeIn .6s ease forwards .4s` }}>
      <text x="200" y="163" textAnchor="middle" fill="white" fontSize="11"
        fontFamily="'IBM Plex Sans Arabic',sans-serif" fontWeight="600">شبكة</text>
      <text x="200" y="178" textAnchor="middle" fill="white" fontSize="11"
        fontFamily="'IBM Plex Sans Arabic',sans-serif" fontWeight="600">الرواد</text>
    </g>
    {/* Pulse ring */}
    <circle cx="200" cy="170" r="58" fill="none" stroke={C.p300} strokeWidth="1"
      style={{ animation: `pulse 2.5s ease-in-out infinite` }} />
  </svg>
);

/* ─── DASHBOARD DATA ─── */
const dashKPIs = [
  { icon: <Fingerprint size={20}/>, label:"ملفات موحدة (ID) نشطة", value:"10,450",
    badge:"0% تكرار", badgeC:C.p700, badgeBg:C.p100, accent:C.p500 },
  { icon: <ShieldCheck size={20}/>, label:"جودة البيانات (سهولة القوالب)", value:"96.5%",
    badge:"دقة عالية", badgeC:"#15803D", badgeBg:"#F0FDF4", accent:C.s500 },
  { icon: <TrendingUp size={20}/>, label:"مؤشرات الأداء المستخرجة", value:"1,204",
    badge:"+8%", badgeC:C.p700, badgeBg:C.p100, accent:C.p500 },
  { icon: <Layers size={20}/>, label:"عمليات الأرشفة التلقائية", value:"24/24",
    badge:"مكتمل", badgeC:C.s600, badgeBg:C.s100, accent:C.s500 },
];

const platformsList = [
  { name:"منصة الابتكار التقني",   focus:"التقنية والبرمجة",         members:145, weekly:"+12", activity:92, status:"نشط جداً",  hours:"1,250", programs:3 },
  { name:"منصة الريادة المجتمعية", focus:"التطوع والمجتمع",          members:320, weekly:"+8",  activity:85, status:"نشط",       hours:"3,400", programs:5 },
  { name:"منصة صناع المحتوى",      focus:"الإعلام الرقمي",           members:85,  weekly:"+2",  activity:78, status:"مستقر",     hours:"840",   programs:2 },
  { name:"منصة القادة الشباب",     focus:"تطوير المهارات القيادية",   members:210, weekly:"+15", activity:95, status:"نشط جداً",  hours:"2,100", programs:4 },
];

const impactIndicators = [
  { metric:"معدل الاحتفاظ بالأعضاء", value:"78%",    trend:"+5%",  pos:true },
  { metric:"رضا المستفيدين (NPS)",   value:"8.4/10", trend:"+0.2", pos:true },
  { metric:"معدل إكمال البرامج",     value:"65%",    trend:"-2%",  pos:false },
];

const memberLifecycle = [
  { stage:"تسجيل جديد",                  count:1200, pct:"100%" },
  { stage:"مشارك نشط (برنامج واحد+)",   count:850,  pct:"70%"  },
  { stage:"متطوع معتمد",                 count:400,  pct:"33%"  },
  { stage:"قائد مبادرة/منصة",           count:85,   pct:"7%"   },
];

const unifiedMembers = [
  { id:"RWD-26-001", name:"يوسف العبدالله", entities:["منصة الابتكار التقني","هاكاثون الذكاء الاصطناعي"], stage:"قائد مبادرة" },
  { id:"RWD-26-002", name:"مريم الصالح",   entities:["منصة القادة الشباب"],                               stage:"مشارك نشط"  },
  { id:"RWD-26-003", name:"خالد النواف",   entities:["منصة صناع المحتوى","منصة الريادة المجتمعية"],       stage:"متطوع معتمد"},
  { id:"RWD-26-004", name:"شهد طارق",     entities:["منصة التدريب الرقمي"],                               stage:"مسجل جديد"  },
];

const knowledgeLibrary = [
  { title:"سجلات حضور وتفاعل منصة القادة الشباب",       type:"بيانات تشغيلية", sync:"تحديث حي (مستمر)",   method:"استعلام مباشر (API)", live:true,  icon:<RefreshCw size={14} color={C.p500}/> },
  { title:"التقرير الختامي لهاكاثون الذكاء الاصطناعي",  type:"مخرجات مبادرة",  sync:"مؤرشف نهائياً",       method:"رابط تخزين سحابي",    live:false, icon:<Archive size={14} color={C.s500}/> },
  { title:"تحليل سلوك واهتمامات الأعضاء (الربع الأول)", type:"بيانات تحليلية", sync:"مؤرشف (للقراءة)",     method:"لوحة تفاعلية",        live:false, icon:<PieChart size={14} color={"#15803D"}/> },
  { title:"مستودع المناهج التدريبية - منصة التدريب",    type:"مكتبة معرفية",   sync:"مزامنة أسبوعية",      method:"نظام إدارة المحتوى",   live:false, icon:<Archive size={14} color={C.p500}/> },
];


/* ─── INSIGHTS DATA ─── */

// 1. سلوك واهتمامات الشباب
const youthInterests = [
  { cat:"التقنية والبرمجة", members:452, pct:37, sessions:1840, avgHrs:4.1, trend:"+12%" },
  { cat:"الريادة المجتمعية", members:368, pct:30, sessions:1420, avgHrs:3.6, trend:"+8%"  },
  { cat:"الإعلام الرقمي",   members:184, pct:15, sessions:690,  avgHrs:2.9, trend:"+3%"  },
  { cat:"القيادة والتطوير", members:147, pct:12, sessions:580,  avgHrs:5.2, trend:"+18%" },
  { cat:"البيئة والاستدامة", members:73,  pct:6,  sessions:260,  avgHrs:2.4, trend:"+5%"  },
];

const monthlyActivity = [
  { month:"يناير",  sessions:420, members:310, newJoins:45 },
  { month:"فبراير", sessions:510, members:338, newJoins:58 },
  { month:"مارس",  sessions:480, members:352, newJoins:41 },
  { month:"أبريل", sessions:620, members:390, newJoins:72 },
  { month:"مايو",  sessions:715, members:420, newJoins:88 },
  { month:"يونيو", sessions:680, members:445, newJoins:63 },
  { month:"يوليو", sessions:590, members:460, newJoins:51 },
  { month:"أغسطس",sessions:540, members:471, newJoins:38 },
  { month:"سبتمبر",sessions:730, members:510, newJoins:95 },
  { month:"أكتوبر",sessions:810, members:548, newJoins:102},
  { month:"نوفمبر",sessions:760, members:572, newJoins:79 },
  { month:"ديسمبر",sessions:690, members:585, newJoins:55 },
];

const topBehaviors = [
  { behavior:"حضور الجلسات التدريبية", score:88, icon:"📅" },
  { behavior:"المشاركة في المناقشات",   score:74, icon:"💬" },
  { behavior:"إتمام المهام المطلوبة",   score:67, icon:"✅" },
  { behavior:"تقديم محتوى وإسهامات",   score:52, icon:"🎨" },
  { behavior:"قيادة مجموعات العمل",     score:31, icon:"👥" },
];

// 2. دورة حياة الأعضاء
const cohortRetention = [
  { month:"الشهر 1", c1:100, c2:100, c3:100 },
  { month:"الشهر 2", c1:82,  c2:78,  c3:85  },
  { month:"الشهر 3", c1:71,  c2:65,  c3:74  },
  { month:"الشهر 4", c1:63,  c2:58,  c3:68  },
  { month:"الشهر 5", c1:57,  c2:52,  c3:62  },
  { month:"الشهر 6", c1:52,  c2:47,  c3:58  },
];

const journeyMilestones = [
  { stage:"التسجيل",          avg:0,  max:0,   members:1200, dropRate:0,  color:C.p200 },
  { stage:"أول جلسة",         avg:3,  max:7,   members:1020, dropRate:15, color:C.p300 },
  { stage:"برنامج كامل",      avg:21, max:45,  members:680,  dropRate:33, color:C.p400||C.p300 },
  { stage:"مشارك معتمد",      avg:60, max:120, members:400,  dropRate:41, color:C.p500 },
  { stage:"منسق/متطوع",       avg:180,max:365, members:185,  dropRate:54, color:C.p600 },
  { stage:"قائد مبادرة",      avg:365,max:730, members:85,   dropRate:54, color:C.p700 },
];

const ageGroups = [
  { group:"15-18", count:145, pct:12 },
  { group:"19-22", count:362, pct:30 },
  { group:"23-26", count:410, pct:34 },
  { group:"27-30", count:217, pct:18 },
  { group:"31+",   count:72,  pct:6  },
];

// 3. مؤشرات فاعلية المنصات
const platformEffectiveness = [
  { platform:"الابتكار التقني",    engagement:92, retention:79, completion:71, satisfaction:88, growth:85 },
  { platform:"الريادة المجتمعية", engagement:85, retention:74, completion:68, satisfaction:82, growth:78 },
  { platform:"صناع المحتوى",      engagement:78, retention:65, completion:60, satisfaction:75, growth:62 },
  { platform:"القادة الشباب",     engagement:95, retention:83, completion:77, satisfaction:91, growth:90 },
];

const platformKPIs = [
  { kpi:"معدل الحضور الأسبوعي",       values:[88,82,74,92], unit:"%" },
  { kpi:"متوسط ساعات المشاركة",        values:[4.1,3.6,2.9,5.2], unit:"ساعة" },
  { kpi:"نسبة إكمال البرامج",          values:[71,68,60,77], unit:"%"  },
  { kpi:"معدل التوصية (NPS)",           values:[8.4,7.9,7.2,9.1], unit:"/10" },
  { kpi:"نمو الأعضاء الشهري",          values:[8.3,2.5,2.4,7.1], unit:"%"  },
];

const radarData = [
  { subject:"التفاعل",    AT:92, RM:85, SM:78, QS:95 },
  { subject:"الاحتفاظ",   AT:79, RM:74, SM:65, QS:83 },
  { subject:"الإكمال",    AT:71, RM:68, SM:60, QS:77 },
  { subject:"الرضا",      AT:88, RM:82, SM:75, QS:91 },
  { subject:"النمو",      AT:85, RM:78, SM:62, QS:90 },
];

// 4. أثر البرامج
const programImpact = [
  { program:"هاكاثون الذكاء الاصطناعي", participants:180, before:42, after:81, retention:88, projects:14, rating:9.2 },
  { program:"مسار ريادة الأعمال",        participants:95,  before:38, after:74, retention:82, projects:8,  rating:8.7 },
  { program:"تدريب المحتوى الرقمي",      participants:130, before:45, after:71, retention:75, projects:22, rating:8.1 },
  { program:"برنامج القادة الشباب",      participants:60,  before:55, after:89, retention:91, projects:6,  rating:9.5 },
  { program:"ورش المهارات الحياتية",     participants:210, before:40, after:68, retention:70, projects:0,  rating:7.8 },
];

const impactTrend = [
  { quarter:"Q1 2024", avgGain:28, participants:240, satisfaction:7.8 },
  { quarter:"Q2 2024", avgGain:31, participants:295, satisfaction:8.1 },
  { quarter:"Q3 2024", avgGain:34, participants:320, satisfaction:8.4 },
  { quarter:"Q4 2024", avgGain:33, participants:380, satisfaction:8.6 },
  { quarter:"Q1 2025", avgGain:36, participants:410, satisfaction:8.7 },
  { quarter:"Q2 2025", avgGain:38, participants:460, satisfaction:8.9 },
];

// 5. تحليلات القرار
const strategicInsights = [
  { priority:"عالية", type:"فرصة", title:"توسع منصة القادة الشباب",
    detail:"تُسجل المنصة أعلى معدلات تفاعل (95%) ورضا (9.1/10). التوسع الجغرافي أو إطلاق برنامج موازٍ يُتوقع له عائد استثماري مرتفع.",
    metric:"ROI متوقع: +34%", icon:<ThumbsUp size={15}/>, color:"#15803D", bg:"#F0FDF4" },
  { priority:"عالية", type:"تحذير", title:"تراجع معدل إكمال المحتوى الرقمي",
    detail:"منصة صناع المحتوى تُسجل أدنى معدلات إكمال (60%) مع تراجع ملحوظ في الربع الثالث. يُنصح بمراجعة هيكل المناهج وتوفير دعم فردي.",
    metric:"تراجع: -8% خلال 3 أشهر", icon:<AlertTriangle size={15}/>, color:"#B45309", bg:"#FFFBEB" },
  { priority:"متوسطة", type:"توصية", title:"برامج الاحتفاظ للمشتركين الجدد",
    detail:"تُظهر بيانات الـ Cohort أن 28% يغادرون في أول 30 يوم. برنامج استقبال منظم (Onboarding) قد يرفع الاحتفاظ 15-20 نقطة.",
    metric:"تأثير محتمل: +15% احتفاظ", icon:<Users size={15}/>, color:C.p600, bg:C.p50 },
  { priority:"متوسطة", type:"فرصة", title:"الفئة العمرية 23-26 الأعلى مشاركة",
    detail:"تمثل هذه الفئة 34% من العضوية وتُسجل أعلى معدلات إكمال. تصميم مسارات متخصصة لهم يُعزز الأثر ويبني قاعدة قيادية قوية.",
    metric:"34% من إجمالي الأعضاء", icon:<Award size={15}/>, color:C.s600, bg:C.s50 },
  { priority:"منخفضة", type:"ملاحظة", title:"موسمية واضحة في الانضمام",
    detail:"أعلى معدلات تسجيل في سبتمبر/أكتوبر وأدناها في يوليو/أغسطس. التخطيط المسبق لحملات توعية في أوقات الذروة سيُعظّم العائد.",
    metric:"ذروة: سبتمبر-أكتوبر", icon:<Flame size={15}/>, color:C.n600, bg:C.n100 },
];

const decisionMatrix = [
  { action:"إطلاق برنامج قادة موسّع",    effort:3, impact:9, feasibility:8, timeframe:"3 أشهر" },
  { action:"تطوير مناهج المحتوى الرقمي", effort:5, impact:7, feasibility:7, timeframe:"2 أشهر" },
  { action:"نظام Onboarding تفاعلي",     effort:4, impact:8, feasibility:9, timeframe:"6 أسابيع" },
  { action:"توسع جغرافي لمنصة التقنية",  effort:8, impact:9, feasibility:6, timeframe:"6 أشهر" },
  { action:"برامج مخصصة لـ 23-26",        effort:3, impact:7, feasibility:9, timeframe:"4 أسابيع" },
];

const projects = [
  { id:1, title:"منصة التدريب الرقمي", cat:"تعليم وتطوير", status:"ACTIVE", statusLabel:"نشط",
    desc:"منصة تفاعلية لتقديم دورات تدريبية متخصصة للشباب العربي في مجالات تقنية متعددة.", emoji:"📚" },
  { id:2, title:"مبادرة رواد الأعمال", cat:"ريادة أعمال", status:"COMPLETED", statusLabel:"مكتمل",
    desc:"برنامج متكامل لدعم المشاريع الناشئة وتوفير التمويل والتوجيه الاستراتيجي.", emoji:"🚀" },
  { id:3, title:"شبكة المتطوعين", cat:"مجتمع وتطوع", status:"PLANNING", statusLabel:"قيد التخطيط",
    desc:"ربط المتطوعين بالفرص التنموية في مختلف الدول العربية لبناء مجتمع متماسك.", emoji:"🤝" },
];

const team = [
  { name:"أحمد الرشيد", role:"المدير التنفيذي", init:"أر", committee:"الإدارة التنفيذية" },
  { name:"سارة المحمود", role:"مديرة التطوير", init:"سم", committee:"اللجنة الاستراتيجية" },
  { name:"عمر خليل", role:"مدير التقنية",  init:"عخ", committee:"اللجنة التقنية" },
  { name:"ليلى حسين", role:"مسؤولة الشراكات", init:"لح", committee:"العلاقات العامة" },
];

const values = [
  { icon: <Target size={24}/>, title:"الهدفية", desc:"نعمل بمنهجية واضحة نحو أهداف محددة تُحدث أثراً حقيقياً في المجتمع." },
  { icon: <Lightbulb size={24}/>, title:"الابتكار", desc:"نؤمن بضرورة التجديد المستمر ونعمل على إيجاد حلول إبداعية للتحديات." },
  { icon: <Heart size={24}/>, title:"الانتماء", desc:"ننمي الشعور بالهوية المشتركة ونبني جيلاً يعتزّ بانتمائه ويتمسك بجذوره." },
];

const stats = [
  { value:45, suffix:"+", label:"مشروع ومبادرة" },
  { value:10, suffix:"آلاف", label:"شاب ومستفيد" },
  { value:25, suffix:"ألف", label:"ساعة نشاط" },
  { value:8, suffix:"+", label:"سنوات من العطاء" },
];

const partners = ["مؤسسة التعليم","برنامج الأمم المتحدة","بنك التنمية","وزارة الشباب","رائد الابتكار","مجلس الأعمال"];

/* ─── STATUS BADGE ─── */
const StatusBadge = ({ status, label }) => {
  const map = {
    ACTIVE:   { bg:"#F0FDF4", color:"#15803D", dot:"#22C55E" },
    COMPLETED:{ bg:C.p100,   color:C.p700,    dot:C.p500 },
    PLANNING: { bg:"#FFFBEB", color:"#B45309", dot:"#F59E0B" },
  };
  const s = map[status] || map.ACTIVE;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"4px 12px",
      background:s.bg, color:s.color, borderRadius:99, fontSize:12, fontWeight:600 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:s.dot, display:"inline-block" }}/>
      {label}
    </span>
  );
};

/* ─── NAVBAR ─── */
const Navbar = ({ page, onNav }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  const links = [
    { id:"home", label:"الرئيسية" }, { id:"about", label:"عن الشبكة" },
    { id:"projects", label:"المشاريع" }, { id:"team", label:"الفريق" },
    { id:"insights", label:"الرؤى التحليلية" },
    { id:"dashboard", label:"لوحة البيانات" }, { id:"contact", label:"تواصل معنا" },
  ];
  return (
    <header style={{
      position:"fixed", top:0, width:"100%", zIndex:100,
      background: scrolled ? "rgba(255,255,255,.97)" : "rgba(255,255,255,.85)",
      backdropFilter:"blur(12px)",
      borderBottom:`1px solid ${scrolled ? C.n200 : "transparent"}`,
      boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,.06)" : "none",
      transition:"all .3s ease",
    }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 24px",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        height: scrolled ? 64 : 72, transition:"height .3s" }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }}
          onClick={() => onNav("home")}>
          <div style={{ width:40, height:40, borderRadius:10,
            background:`linear-gradient(135deg, ${C.p500}, ${C.p700})`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 4px 12px ${C.p200}` }}>
            <Network size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:C.n900, lineHeight:1.2 }}>شبكة الرواد</div>
            <div style={{ fontSize:11, fontWeight:400, color:C.n500, lineHeight:1 }}>الإلكترونية</div>
          </div>
        </div>
        {/* Desktop Nav */}
        <nav style={{ display:"flex", gap:28, alignItems:"center" }}
          className="desktop-nav">
          {links.map(l => (
            <button key={l.id} className={`nav-link${page===l.id?" active":""}`}
              onClick={() => onNav(l.id)}>{l.label}</button>
          ))}
        </nav>
        {/* CTA */}
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button className="btn-primary" style={{ padding:"9px 20px", fontSize:14 }}
            onClick={() => onNav("contact")}>
            تواصل معنا <ArrowLeft size={14} style={{ transform:"rotate(180deg)" }} />
          </button>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:C.n700,
            display:"none" }} onClick={() => setOpen(!open)}
            className="mobile-menu-btn">
            {open ? <X size={22}/> : <Menu size={22}/>}
          </button>
        </div>
      </div>
      {open && (
        <div style={{ background:"#fff", borderTop:`1px solid ${C.n200}`,
          padding:"12px 24px 20px", display:"flex", flexDirection:"column", gap:4 }}>
          {links.map(l => (
            <button key={l.id} className={`nav-link${page===l.id?" active":""}`}
              style={{ textAlign:"right", padding:"10px 0" }}
              onClick={() => { onNav(l.id); setOpen(false); }}>{l.label}</button>
          ))}
        </div>
      )}
      <style>{`
        @media(max-width:768px){
          .desktop-nav{display:none!important}
          .mobile-menu-btn{display:block!important}
          .btn-primary{display:none}
        }
      `}</style>
    </header>
  );
};

/* ─── HERO ─── */
const HeroSection = ({ onNav }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);
  return (
    <section style={{
      minHeight:"100vh", display:"flex", alignItems:"center",
      background:`linear-gradient(145deg, ${C.p50} 0%, #fff 50%, ${C.s50} 100%)`,
      paddingTop:80, overflow:"hidden", position:"relative"
    }}>
      {/* Background pattern */}
      <div style={{ position:"absolute", inset:0, opacity:.04,
        backgroundImage:`radial-gradient(${C.p500} 1px, transparent 1px)`,
        backgroundSize:"32px 32px" }} />
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"60px 24px",
        display:"grid", gridTemplateColumns:"1fr 1fr", gap:60, alignItems:"center",
        width:"100%" }}>
        {/* Text */}
        <div style={{ animation: visible ? "fadeUp .8s ease forwards" : "none",
          opacity: visible ? undefined : 0 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:C.p100, color:C.p700, borderRadius:99,
            padding:"6px 16px", fontSize:13, fontWeight:600, marginBottom:24 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:C.p500,
              animation:"pulse 2s infinite", display:"inline-block" }}/>
            منصة رقمية للشباب العربي
          </div>
          <h1 style={{ fontSize:"clamp(2.2rem,5vw,3.5rem)", fontWeight:700, lineHeight:1.2,
            color:C.n900, marginBottom:20 }}>
            شبكة الرواد<br/>
            <span style={{ color:C.p500 }}>الإلكترونية</span>
          </h1>
          <p style={{ fontSize:18, lineHeight:1.8, color:C.n600, marginBottom:36, maxWidth:480 }}>
            منصة تجمع الشباب العربي وتربطهم بالفرص والمشاريع التنموية، لبناء مجتمع رقمي يقيس أثره ويصنع فارقاً حقيقياً.
          </p>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
            <button className="btn-primary" onClick={() => onNav("projects")}>
              استعرض مشاريعنا <ArrowLeft size={16} style={{ transform:"rotate(180deg)" }}/>
            </button>
            <button className="btn-outline" onClick={() => onNav("about")}>
              عن الشبكة
            </button>
          </div>
          {/* Mini stats */}
          <div style={{ display:"flex", gap:32, marginTop:48, paddingTop:32,
            borderTop:`1px solid ${C.n200}` }}>
            {[["45+","مشروع"],["10K+","مستفيد"],["8","سنوات"]].map(([n,l],i) => (
              <div key={i}>
                <div style={{ fontSize:22, fontWeight:700, color:C.p600 }}>{n}</div>
                <div style={{ fontSize:13, color:C.n500, marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Illustration */}
        <div style={{ display:"flex", justifyContent:"center", alignItems:"center",
          animation: visible ? "fadeIn 1.2s ease forwards .3s" : "none", opacity: visible ? undefined : 0 }}>
          <NetworkIllustration />
        </div>
      </div>
      {/* Scroll hint */}
      <div style={{ position:"absolute", bottom:32, left:"50%", transform:"translateX(-50%)",
        display:"flex", flexDirection:"column", alignItems:"center", gap:8,
        color:C.n400, fontSize:12, animation:"pulse 2s infinite" }}>
        <span>اكتشف المزيد</span>
        <ChevronDown size={16}/>
      </div>
      <style>{`@media(max-width:768px){section>div{grid-template-columns:1fr!important}svg{display:none}}`}</style>
    </section>
  );
};

/* ─── ABOUT ─── */
const AboutSection = () => {
  const ref = useReveal();
  return (
    <section style={{ background:C.n50, padding:"96px 24px" }}>
      <div ref={ref} className="reveal" style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <span style={{ color:C.p500, fontWeight:600, fontSize:14, letterSpacing:.5 }}>من نحن</span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.5rem)", fontWeight:700, color:C.n900,
            marginTop:10, marginBottom:16 }}>حول شبكة الرواد</h2>
          <p style={{ color:C.n600, fontSize:17, lineHeight:1.9, maxWidth:600, margin:"0 auto" }}>
            شبكة رواد إلكترونية رائدة تربط الشباب العربي المبدع بالمشاريع الرقمية التنموية، وتوفر البيئة الملائمة لبناء قدراتهم وتوسيع شبكة علاقاتهم.
          </p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
          {values.map((v,i) => (
            <div key={i} className="card-hover" style={{
              background:"#fff", borderRadius:16, padding:"32px 28px",
              border:`1px solid ${C.n200}`,
              animation:`fadeUp .6s ease forwards ${i*.12+.2}s`, opacity:0
            }}>
              <div style={{ width:52, height:52, borderRadius:14, background:C.p100,
                color:C.p600, display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:20 }}>{v.icon}</div>
              <h3 style={{ fontSize:18, fontWeight:700, color:C.n900, marginBottom:10 }}>{v.title}</h3>
              <p style={{ color:C.n600, fontSize:15, lineHeight:1.8 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── PROJECTS ─── */
const ProjectsSection = ({ onNav }) => {
  const ref = useReveal();
  return (
    <section style={{ background:"#fff", padding:"96px 24px" }}>
      <div ref={ref} className="reveal" style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end",
          marginBottom:56, flexWrap:"wrap", gap:16 }}>
          <div>
            <span style={{ color:C.s500, fontWeight:600, fontSize:14 }}>مشاريعنا</span>
            <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.5rem)", fontWeight:700, color:C.n900,
              marginTop:8 }}>أبرز المبادرات والمشاريع</h2>
          </div>
          <button className="btn-outline" style={{ fontSize:14, padding:"9px 20px" }}
            onClick={() => onNav("projects")}>
            عرض الكل <ArrowUpRight size={15}/>
          </button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:28 }}>
          {projects.map((p,i) => (
            <div key={p.id} className="card-hover" style={{
              background:"#fff", borderRadius:18, overflow:"hidden",
              border:`1px solid ${C.n200}`,
              animation:`fadeUp .65s ease forwards ${i*.13+.15}s`, opacity:0
            }}>
              {/* Card image area */}
              <div style={{ height:160, background:`linear-gradient(135deg,${C.p100},${C.s100})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:52, position:"relative" }}>
                {p.emoji}
                <div style={{ position:"absolute", top:14, right:14 }}>
                  <StatusBadge status={p.status} label={p.statusLabel}/>
                </div>
              </div>
              <div style={{ padding:"24px 22px 28px" }}>
                <div style={{ display:"inline-block", background:C.p50, color:C.p600,
                  fontSize:12, fontWeight:600, padding:"3px 10px",
                  borderRadius:99, marginBottom:12 }}>{p.cat}</div>
                <h3 style={{ fontSize:17, fontWeight:700, color:C.n900, marginBottom:10,
                  lineHeight:1.4 }}>{p.title}</h3>
                <p style={{ color:C.n600, fontSize:14, lineHeight:1.8, marginBottom:20 }}>
                  {p.desc}</p>
                <button style={{ background:"none", border:"none", color:C.p500,
                  fontFamily:"'IBM Plex Sans Arabic',sans-serif", fontSize:14,
                  fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center",
                  gap:6, padding:0 }}>
                  اقرأ المزيد <ArrowLeft size={14} style={{ transform:"rotate(180deg)" }}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}}`}</style>
    </section>
  );
};

/* ─── STATS ─── */
const StatsSection = () => {
  const ref = useReveal();
  return (
    <section style={{ background:`linear-gradient(135deg, ${C.p700} 0%, ${C.p900} 100%)`,
      padding:"80px 24px", position:"relative", overflow:"hidden" }}>
      {/* Decorative circles */}
      <div style={{ position:"absolute", top:-80, left:-80, width:320, height:320,
        borderRadius:"50%", border:`1px solid rgba(255,255,255,.06)` }}/>
      <div style={{ position:"absolute", bottom:-60, right:-60, width:240, height:240,
        borderRadius:"50%", border:`1px solid rgba(255,255,255,.06)` }}/>
      <div ref={ref} className="reveal" style={{ maxWidth:1200, margin:"0 auto",
        display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:40, position:"relative" }}>
        {stats.map((s,i) => (
          <div key={i} style={{ textAlign:"center" }}>
            <div style={{ fontSize:"clamp(2rem,5vw,3rem)", fontWeight:700,
              color:C.s300, marginBottom:8 }}>
              <Counter end={s.value} suffix={s.suffix}/>
            </div>
            <div style={{ color:"rgba(255,255,255,.75)", fontSize:16, fontWeight:500 }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </section>
  );
};

/* ─── TEAM ─── */
const TeamSection = () => {
  const ref = useReveal();
  const initColors = [C.p500, C.s500, "#15803D", "#7C3AED"];
  return (
    <section style={{ background:C.n50, padding:"96px 24px" }}>
      <div ref={ref} className="reveal" style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:64 }}>
          <span style={{ color:C.p500, fontWeight:600, fontSize:14 }}>من يقود</span>
          <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.5rem)", fontWeight:700, color:C.n900,
            marginTop:10 }}>فريق العمل</h2>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24 }}>
          {team.map((m,i) => (
            <div key={i} className="card-hover" style={{
              background:"#fff", borderRadius:16, padding:"28px 20px", textAlign:"center",
              border:`1px solid ${C.n200}`,
              animation:`fadeUp .6s ease forwards ${i*.1+.2}s`, opacity:0
            }}>
              <div style={{ width:72, height:72, borderRadius:"50%", margin:"0 auto 16px",
                background:`linear-gradient(135deg, ${initColors[i%4]}, ${initColors[(i+1)%4]})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:22, fontWeight:700, color:"#fff" }}>{m.init}</div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.n900, marginBottom:6 }}>{m.name}</h3>
              <p style={{ color:C.p600, fontSize:13, fontWeight:600, marginBottom:8 }}>{m.role}</p>
              <span style={{ background:C.n100, color:C.n600, fontSize:11, fontWeight:500,
                padding:"3px 10px", borderRadius:99 }}>{m.committee}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@media(max-width:768px){div[style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important}}`}</style>
    </section>
  );
};

/* ─── PARTNERS ─── */
const PartnersSection = () => {
  const ref = useReveal();
  const doubled = [...partners, ...partners];
  return (
    <section style={{ background:"#fff", padding:"72px 24px" }}>
      <div ref={ref} className="reveal" style={{ maxWidth:1200, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:40 }}>
          <span style={{ color:C.n500, fontSize:14, fontWeight:500 }}>شركاؤنا في المسيرة</span>
        </div>
        <div style={{ overflow:"hidden", maskImage:"linear-gradient(to right,transparent,black 10%,black 90%,transparent)" }}>
          <div style={{ display:"flex", gap:24, width:"max-content",
            animation:"scrollBand 18s linear infinite" }}>
            {doubled.map((p,i) => (
              <div key={i} style={{
                background:C.n50, border:`1px solid ${C.n200}`,
                borderRadius:12, padding:"14px 28px",
                fontSize:14, fontWeight:600, color:C.n600,
                whiteSpace:"nowrap", flexShrink:0 }}>{p}</div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* ─── CTA ─── */
const CTASection = ({ onNav }) => {
  const ref = useReveal();
  return (
    <section style={{ padding:"80px 24px",
      background:`linear-gradient(135deg, ${C.p600} 0%, ${C.p800||C.p700} 100%)`,
      position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0,
        backgroundImage:`radial-gradient(rgba(255,255,255,.04) 1px, transparent 1px)`,
        backgroundSize:"28px 28px" }}/>
      <div ref={ref} className="reveal" style={{ maxWidth:700, margin:"0 auto",
        textAlign:"center", position:"relative" }}>
        <h2 style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:700, color:"#fff",
          marginBottom:16, lineHeight:1.3 }}>
          انضم إلى مسيرة الرواد
        </h2>
        <p style={{ color:"rgba(255,255,255,.8)", fontSize:17, lineHeight:1.9,
          marginBottom:36 }}>
          كن جزءاً من شبكة تجمع المبدعين والمبادرين العرب. تواصل معنا وابدأ رحلتك نحو التغيير الحقيقي.
        </p>
        <div style={{ display:"flex", justifyContent:"center", gap:16, flexWrap:"wrap" }}>
          <button onClick={() => onNav("contact")} style={{
            background:C.s500, color:"#fff",
            fontFamily:"'IBM Plex Sans Arabic',sans-serif",
            fontSize:16, fontWeight:700, border:"none",
            borderRadius:12, padding:"14px 36px", cursor:"pointer",
            boxShadow:"0 6px 20px rgba(0,0,0,.25)", transition:"all .2s",
          }} onMouseEnter={e=>e.target.style.background=C.s600}
            onMouseLeave={e=>e.target.style.background=C.s500}>
            تواصل معنا الآن
          </button>
          <button onClick={() => onNav("projects")} style={{
            background:"transparent", color:"#fff",
            fontFamily:"'IBM Plex Sans Arabic',sans-serif",
            fontSize:15, fontWeight:600,
            border:"2px solid rgba(255,255,255,.45)",
            borderRadius:12, padding:"13px 28px", cursor:"pointer", transition:"all .2s",
          }} onMouseEnter={e=>e.target.style.borderColor="rgba(255,255,255,.8)"}
            onMouseLeave={e=>e.target.style.borderColor="rgba(255,255,255,.45)"}>
            استعرض مشاريعنا
          </button>
        </div>
      </div>
    </section>
  );
};

/* ─── FOOTER ─── */
const Footer = ({ onNav }) => (
  <footer style={{ background:C.n900, color:C.n400, padding:"56px 24px 32px" }}>
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:48, marginBottom:48 }}>
        {/* Brand */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:9, background:C.p500,
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Network size={18} color="white"/>
            </div>
            <span style={{ fontSize:17, fontWeight:700, color:"#fff" }}>شبكة الرواد الإلكترونية</span>
          </div>
          <p style={{ fontSize:14, lineHeight:1.9, color:C.n500, maxWidth:320 }}>
            منصة شبابية رقمية تجمع المبدعين العرب وتربطهم بالفرص التنموية لبناء مجتمع أكثر تأثيراً.
          </p>
        </div>
        {/* Links */}
        <div>
          <h4 style={{ color:"#fff", fontWeight:700, fontSize:15, marginBottom:20 }}>روابط سريعة</h4>
          {["home","about","projects","team"].map((id,i) => {
            const labels = ["الرئيسية","عن الشبكة","المشاريع","الفريق"];
            return (
              <button key={id} onClick={() => onNav(id)} style={{
                display:"block", background:"none", border:"none", color:C.n500,
                fontFamily:"'IBM Plex Sans Arabic',sans-serif", fontSize:14,
                cursor:"pointer", padding:"5px 0", transition:"color .2s",
                textAlign:"right",
              }} onMouseEnter={e=>e.target.style.color=C.p300}
                onMouseLeave={e=>e.target.style.color=C.n500}>{labels[i]}</button>
            );
          })}
        </div>
        {/* Contact */}
        <div>
          <h4 style={{ color:"#fff", fontWeight:700, fontSize:15, marginBottom:20 }}>تواصل</h4>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <a href="mailto:info@rowad.org" style={{ color:C.n500, fontSize:14,
              textDecoration:"none", display:"flex", alignItems:"center", gap:8,
              transition:"color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.color=C.p300}
              onMouseLeave={e=>e.currentTarget.style.color=C.n500}>
              <Mail size={14}/> info@rowad.org
            </a>
            <div style={{ display:"flex", gap:10, marginTop:4 }}>
              {["X","Ig","Li"].map((s,i) => (
                <div key={i} style={{ width:34, height:34, borderRadius:8,
                  background:"rgba(255,255,255,.08)", display:"flex",
                  alignItems:"center", justifyContent:"center",
                  color:C.n400, fontSize:12, fontWeight:700, cursor:"pointer",
                  transition:"background .2s" }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div style={{ borderTop:`1px solid rgba(255,255,255,.08)`, paddingTop:24,
        display:"flex", justifyContent:"space-between", alignItems:"center",
        fontSize:13, flexWrap:"wrap", gap:12 }}>
        <span>جميع الحقوق محفوظة © 2026 لشبكة الرواد الإلكترونية</span>
        <span style={{ color:C.n600 }}>بُني بـ ❤️ لخدمة الشباب العربي</span>
      </div>
    </div>
    <style>{`@media(max-width:768px){footer div[style*="grid-template-columns"]{grid-template-columns:1fr!important}}`}</style>
  </footer>
);

/* ─── CONTACT PAGE ─── */
const ContactPage = () => {
  const [form, setForm] = useState({ name:"", email:"", subject:"", message:"" });
  const [sent, setSent] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); setSent(true); };
  return (
    <div style={{ paddingTop:80, minHeight:"100vh", background:C.n50 }}>
      <section style={{ background:`linear-gradient(135deg,${C.p50},${C.s50})`,
        padding:"80px 24px 56px", textAlign:"center" }}>
        <h1 style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:700, color:C.n900,
          marginBottom:12 }}>تواصل معنا</h1>
        <p style={{ color:C.n600, fontSize:17, maxWidth:500, margin:"0 auto" }}>
          لديك سؤال أو فكرة أو تريد الانضمام؟ يسعدنا سماعك.
        </p>
      </section>
      <div style={{ maxWidth:680, margin:"0 auto", padding:"56px 24px" }}>
        {sent ? (
          <div style={{ background:"#fff", border:`1px solid ${C.p200}`,
            borderRadius:20, padding:"60px 40px", textAlign:"center" }}>
            <div style={{ fontSize:52, marginBottom:20 }}>✅</div>
            <h2 style={{ fontSize:22, fontWeight:700, color:C.n900, marginBottom:12 }}>
              تم إرسال رسالتك!</h2>
            <p style={{ color:C.n600, fontSize:16 }}>سنتواصل معك في أقرب وقت.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ background:"#fff", borderRadius:20,
            padding:"40px 36px", border:`1px solid ${C.n200}`,
            boxShadow:"0 8px 32px rgba(0,0,0,.06)" }}>
            {[
              { key:"name", label:"الاسم الكامل", type:"text", ph:"محمد العبدالله" },
              { key:"email", label:"البريد الإلكتروني", type:"email", ph:"name@domain.com" },
              { key:"subject", label:"الموضوع", type:"text", ph:"موضوع رسالتك" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:14, fontWeight:600,
                  color:C.n700, marginBottom:8 }}>{f.label}</label>
                <input type={f.type} placeholder={f.ph}
                  value={form[f.key]}
                  onChange={e => setForm({...form, [f.key]:e.target.value})}
                  required style={{
                    width:"100%", padding:"12px 16px",
                    fontFamily:"'IBM Plex Sans Arabic',sans-serif",
                    fontSize:15, color:C.n900,
                    background:C.n50, border:`1.5px solid ${C.n200}`,
                    borderRadius:10, outline:"none", direction:"rtl",
                    transition:"border .2s",
                  }}
                  onFocus={e=>e.target.style.borderColor=C.p400||C.p500}
                  onBlur={e=>e.target.style.borderColor=C.n200}/>
              </div>
            ))}
            <div style={{ marginBottom:28 }}>
              <label style={{ display:"block", fontSize:14, fontWeight:600,
                color:C.n700, marginBottom:8 }}>الرسالة</label>
              <textarea placeholder="اكتب رسالتك هنا..."
                value={form.message}
                onChange={e => setForm({...form, message:e.target.value})}
                required rows={5} style={{
                  width:"100%", padding:"12px 16px",
                  fontFamily:"'IBM Plex Sans Arabic',sans-serif",
                  fontSize:15, color:C.n900, resize:"vertical",
                  background:C.n50, border:`1.5px solid ${C.n200}`,
                  borderRadius:10, outline:"none", direction:"rtl",
                  transition:"border .2s",
                }}
                onFocus={e=>e.target.style.borderColor=C.p500}
                onBlur={e=>e.target.style.borderColor=C.n200}/>
            </div>
            <button type="submit" className="btn-primary" style={{ width:"100%",
              justifyContent:"center", padding:"14px", fontSize:16 }}>
              إرسال الرسالة
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ─── ADMIN DASHBOARD ─── */
const AdminDashboardPage = () => {
  const barColors = [C.p300, C.p300, C.p200, C.p500];
  return (
    <div style={{ paddingTop:80, minHeight:"100vh", background:C.n200 }}>
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"40px 24px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start",
          flexWrap:"wrap", gap:16, borderBottom:`1px solid ${C.n300}`,
          paddingBottom:24, marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:"clamp(1.4rem,3vw,1.9rem)", fontWeight:700, color:C.n900,
              display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
              <Database size={26} color={C.p500}/> لوحة قيادة منظومة البيانات
            </h1>
            <p style={{ color:C.n600, fontSize:14, maxWidth:560, lineHeight:1.7 }}>
              مراقبة شاملة للبيانات، التحليلات، والأداء الحي للمنصات والمبادرات لضمان جودة الأرشفة ودعم القرار.
            </p>
          </div>
          <span style={{ display:"inline-flex", alignItems:"center", gap:8,
            background:"#F0FDF4", color:"#15803D", border:"1px solid #BBF7D0",
            borderRadius:99, padding:"7px 16px", fontSize:13, fontWeight:600 }}>
            <span style={{ width:8, height:8, borderRadius:"50%", background:"#22C55E",
              animation:"pulse 1.8s infinite", display:"inline-block"}}/>
            النظام متصل ومحدث
          </span>
        </div>

        {/* KPI Cards */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20, marginBottom:28 }}>
          {dashKPIs.map((k,i) => (
            <div key={i} style={{ background:"#fff", borderRadius:16, padding:"22px 20px",
              border:`1px solid ${C.n300}`, transition:"box-shadow .2s" }}
              className="card-hover">
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:16 }}>
                <div style={{ width:40, height:40, borderRadius:10, display:"flex",
                  alignItems:"center", justifyContent:"center",
                  background: i%2===0 ? C.p100 : C.s100,
                  color: i%2===0 ? C.p600 : C.s600 }}>{k.icon}</div>
                <span style={{ background:k.badgeBg, color:k.badgeC, fontSize:11,
                  fontWeight:700, padding:"3px 10px", borderRadius:99 }}>{k.badge}</span>
              </div>
              <p style={{ fontSize:12, fontWeight:600, color:C.n600, marginBottom:6 }}>{k.label}</p>
              <p style={{ fontSize:26, fontWeight:700, color:C.n900 }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Middle row: live tracking + impact */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, marginBottom:24 }}>

          {/* Live Platforms */}
          <div style={{ background:"#fff", borderRadius:16, padding:"24px",
            border:`1px solid ${C.n300}` }}>
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", marginBottom:20 }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
                  display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <Activity size={18} color={C.p500}/> الديناميكية والتتبع الحي
                </h3>
                <p style={{ fontSize:12, color:C.n500 }}>
                  قياس التغيرات، حجم الأنشطة، وساعات العمل بين المنصات.
                </p>
              </div>
              <span style={{ background:C.p100, color:C.p700, fontSize:11, fontWeight:700,
                padding:"4px 10px", borderRadius:99 }}>تحديث مباشر</span>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:20 }}>
              {platformsList.map((p,i) => (
                <div key={i} style={{ background:C.n50, borderRadius:12,
                  border:`1px solid ${C.n200}`, padding:"14px 16px",
                  borderRight:`3px solid ${C.p500}`, position:"relative" }}>
                  <div style={{ display:"flex", justifyContent:"space-between",
                    alignItems:"flex-start", marginBottom:10 }}>
                    <div>
                      <p style={{ fontWeight:700, fontSize:14, color:C.n900 }}>{p.name}</p>
                      <p style={{ fontSize:12, color:C.n500, marginTop:2 }}>
                        {p.programs} مبادرات • {p.focus}
                      </p>
                    </div>
                    <div style={{ textAlign:"left" }}>
                      <span style={{ display:"block", fontSize:11, fontWeight:700, marginBottom:4,
                        padding:"2px 8px", borderRadius:99,
                        background: p.status==="نشط جداً" ? "#F0FDF4" : C.n100,
                        color: p.status==="نشط جداً" ? "#15803D" : C.n600 }}>{p.status}</span>
                      <span style={{ fontSize:12, fontWeight:700, color:C.p500 }}>{p.weekly} هذا الأسبوع</span>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                    gap:8, borderTop:`1px solid ${C.n200}`, paddingTop:10 }}>
                    {[
                      ["الأعضاء", p.members, C.s500],
                      ["ساعات العمل", p.hours, C.p500],
                      ["التفاعل", p.activity+"%", C.s500],
                    ].map(([lbl,val,col],j) => (
                      <div key={j} style={{ textAlign:"center" }}>
                        <p style={{ fontSize:10, color:C.n400, marginBottom:3 }}>{lbl}</p>
                        <p style={{ fontSize:13, fontWeight:700, color:C.n900 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Bar comparison */}
            <div style={{ borderTop:`1px solid ${C.n200}`, paddingTop:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:C.n900,
                display:"flex", alignItems:"center", gap:6, marginBottom:12 }}>
                <BarChart2 size={15} color={C.p500}/> مقارنة تفاعل المنصات
              </p>
              <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:64 }}>
                {platformsList.map((p,i) => (
                  <div key={i} style={{ flex:1, display:"flex", flexDirection:"column",
                    alignItems:"center", gap:4, height:"100%" }}>
                    <div title={`${p.name}: ${p.activity}%`}
                      style={{ width:"100%", borderRadius:"4px 4px 0 0", cursor:"pointer",
                        background: p.activity===95 ? C.p500 : C.p200,
                        height:`${p.activity}%`, transition:"background .2s",
                        alignSelf:"flex-end" }}/>
                    <span style={{ fontSize:10, color:C.n500, whiteSpace:"nowrap",
                      overflow:"hidden", textOverflow:"ellipsis", maxWidth:"100%",
                      textAlign:"center" }}>{p.activity}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Impact + Lifecycle */}
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

            {/* Impact indicators */}
            <div style={{ background:"#fff", borderRadius:16, padding:"24px",
              border:`1px solid ${C.n300}` }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
                display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Target size={18} color={C.s500}/> قياس الأثر والفاعلية
              </h3>
              <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>
                مؤشرات أداء رئيسية تقيس مدى تأثير البرامج لدعم اتخاذ القرار.
              </p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
                {impactIndicators.map((ind,i) => (
                  <div key={i} style={{ background:C.n50, borderRadius:12,
                    border:`1px solid ${C.n200}`, padding:"14px 12px", textAlign:"center" }}>
                    <p style={{ fontSize:11, fontWeight:600, color:C.n600,
                      marginBottom:8, lineHeight:1.4 }}>{ind.metric}</p>
                    <p style={{ fontSize:20, fontWeight:700, color:C.n900,
                      marginBottom:6 }}>{ind.value}</p>
                    <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px",
                      borderRadius:99,
                      background: ind.pos ? "#F0FDF4" : "#FFFBEB",
                      color: ind.pos ? "#15803D" : "#B45309" }}>{ind.trend}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Member lifecycle funnel */}
            <div style={{ background:"#fff", borderRadius:16, padding:"24px",
              border:`1px solid ${C.n300}`, flex:1 }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
                display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Route size={18} color={C.p500}/> مسار تطور الأعضاء
              </h3>
              <p style={{ fontSize:12, color:C.n500, marginBottom:18 }}>
                تحليل دورة حياة الشباب داخل الشبكة (Funnel).
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                {memberLifecycle.map((s,i) => (
                  <div key={i}>
                    <div style={{ display:"flex", justifyContent:"space-between",
                      marginBottom:5 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:C.n700 }}>{s.stage}</span>
                      <span style={{ fontSize:13, fontWeight:700, color:C.s500 }}>{s.count} مستفيد</span>
                    </div>
                    <div style={{ background:C.n100, borderRadius:99, height:10,
                      overflow:"hidden", border:`1px solid ${C.n200}` }}>
                      <div style={{ height:"100%", borderRadius:99,
                        width:s.pct, transition:"width 1s ease",
                        background: [C.p100, C.p200, C.p400||C.p300, C.p600][i] }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:16, paddingTop:16, borderTop:`1px solid ${C.n200}` }}>
                <p style={{ fontSize:13, fontWeight:700, color:C.n900, marginBottom:10 }}>
                  أبرز الاهتمامات
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {[["التقنية والبرمجة (45%)",C.p100,C.p700],
                    ["الريادة المجتمعية (30%)",C.s100,C.s700],
                    ["الإعلام الرقمي (15%)",C.n100,C.n700]].map(([t,bg,col],i) => (
                    <span key={i} style={{ background:bg, color:col, fontSize:12,
                      fontWeight:600, padding:"4px 12px", borderRadius:99,
                      border:`1px solid ${col}33` }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Unified DB Table */}
        <div style={{ background:"#fff", borderRadius:16, padding:"24px",
          border:`1px solid ${C.n300}`, marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
                display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Database size={18} color={C.p500}/> قاعدة البيانات الموحدة (Unified ID)
              </h3>
              <p style={{ fontSize:13, color:C.n500 }}>
                هيكل بيانات متكامل يربط المبادرات والمنصات ليتيح تتبع رحلة الفرد دون تكرار.
              </p>
            </div>
            <span style={{ display:"inline-flex", alignItems:"center", gap:6,
              background:"#F0FDF4", color:"#15803D", borderRadius:99,
              padding:"6px 14px", fontSize:12, fontWeight:700 }}>
              <ShieldCheck size={13}/> قاعدة خالية من التكرار
            </span>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:580 }}>
              <thead>
                <tr style={{ background:C.n50, borderBottom:`2px solid ${C.n200}` }}>
                  {["الرقم الموحد (ID)","اسم المستفيد","المنصات المرتبطة","تتبع الرحلة","حالة الملف"].map((h,i) => (
                    <th key={i} style={{ padding:"12px 14px", textAlign:"right",
                      fontSize:13, fontWeight:700, color:C.n600, whiteSpace:"nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {unifiedMembers.map((m,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.n200}`,
                    transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.n50}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"14px", fontFamily:"monospace",
                      fontWeight:700, color:C.p600, whiteSpace:"nowrap",
                      fontSize:13 }}>{m.id}</td>
                    <td style={{ padding:"14px", fontWeight:700,
                      color:C.n900, fontSize:14 }}>{m.name}</td>
                    <td style={{ padding:"14px" }}>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {m.entities.map((e,j) => (
                          <span key={j} style={{ background:C.n100, color:C.n700,
                            fontSize:11, fontWeight:600, padding:"3px 10px",
                            borderRadius:99, border:`1px solid ${C.n300}` }}>{e}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding:"14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <Route size={14} color={C.s500}/>
                        <span style={{ fontSize:13, fontWeight:600,
                          color:C.n600 }}>{m.stage}</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px" }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:5,
                        background:"#F0FDF4", color:"#15803D", fontSize:11,
                        fontWeight:700, padding:"4px 10px", borderRadius:99 }}>
                        <UserCheck size={12}/> بروفايل موحد
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Knowledge Library Table */}
        <div style={{ background:"#fff", borderRadius:16, padding:"24px",
          border:`1px solid ${C.n300}`, marginBottom:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between",
            alignItems:"flex-end", marginBottom:20, flexWrap:"wrap", gap:12,
            borderBottom:`1px solid ${C.n200}`, paddingBottom:20 }}>
            <div>
              <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
                display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <Archive size={18} color={C.s500}/> المكتبة المعرفية الحية والأرشيف
              </h3>
              <p style={{ fontSize:13, color:C.n500, maxWidth:500, lineHeight:1.6 }}>
                نظام يضمن استدامة البيانات التشغيلية والتحليلية، مع توحيد آليات الحفظ والاسترجاع للوصول السريع.
              </p>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8,
              background:C.n50, border:`1px solid ${C.n300}`, borderRadius:10,
              padding:"9px 14px", minWidth:220 }}>
              <Search size={15} color={C.n400}/>
              <input type="text" placeholder="استرجاع وبحث سريع..."
                disabled style={{ background:"transparent", border:"none",
                  outline:"none", fontSize:13, color:C.n600, width:"100%",
                  fontFamily:"'IBM Plex Sans Arabic',sans-serif", direction:"rtl" }}/>
            </div>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", minWidth:620 }}>
              <thead>
                <tr style={{ background:C.n50, borderBottom:`2px solid ${C.n200}` }}>
                  {["اسم الملف / مجموعة البيانات","التصنيف","حالة التحديث","آلية الاسترجاع","إجراء"].map((h,i) => (
                    <th key={i} style={{ padding:"12px 14px", textAlign:"right",
                      fontSize:13, fontWeight:700, color:C.n600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {knowledgeLibrary.map((item,i) => (
                  <tr key={i} style={{ borderBottom:`1px solid ${C.n200}`,
                    transition:"background .15s" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.n50}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"14px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:8,
                          background:"#fff", border:`1px solid ${C.n300}`,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          flexShrink:0 }}>{item.icon}</div>
                        <span style={{ fontSize:13, fontWeight:700, color:C.n900 }}>
                          {item.title}</span>
                      </div>
                    </td>
                    <td style={{ padding:"14px", whiteSpace:"nowrap" }}>
                      <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px",
                        borderRadius:99,
                        background: item.type==="بيانات تشغيلية" ? "#F0FDF4"
                          : item.type==="بيانات تحليلية" ? C.n100 : C.s100,
                        color: item.type==="بيانات تشغيلية" ? "#15803D"
                          : item.type==="بيانات تحليلية" ? C.n700 : C.s700
                      }}>{item.type}</span>
                    </td>
                    <td style={{ padding:"14px", whiteSpace:"nowrap" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:6,
                        fontSize:13, fontWeight:500,
                        color: item.live ? C.p500 : C.n600 }}>
                        {item.live && <span style={{ width:7, height:7, borderRadius:"50%",
                          background:C.p500, animation:"pulse 1.8s infinite",
                          display:"inline-block", flexShrink:0 }}/>}
                        {item.sync}
                      </span>
                    </td>
                    <td style={{ padding:"14px", fontSize:13, color:C.n600,
                      whiteSpace:"nowrap" }}>{item.method}</td>
                    <td style={{ padding:"14px", textAlign:"center" }}>
                      <button style={{ background:"none", border:"none", cursor:"pointer",
                        width:34, height:34, borderRadius:"50%", display:"inline-flex",
                        alignItems:"center", justifyContent:"center",
                        color:C.p600, transition:"background .2s" }}
                        onMouseEnter={e=>e.currentTarget.style.background=C.p100}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <Download size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom row: Decision Support + Coordination */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>

          <div style={{ background:"#fff", borderRadius:16, padding:"24px",
            border:`1px solid ${C.n300}` }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
              display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <Compass size={18} color={C.s500}/> دعم اتخاذ القرار والتطوير
            </h3>
            {[
              { title:"تقارير دورية وتوجيه الاستراتيجيات", icon:<FileText size={15} color={C.s500}/>,
                desc:"تقديم تقارير دورية للإدارة والمنسقين تمكن الفريق من استخدام البيانات بشكل فعّال. بناءً على البيانات الحالية، يُنصح بتعزيز تطوير المناهج في قطاع التكنولوجيا لدعم توجيه الاستراتيجيات المستقبلية." },
              { title:"آليات تقييم مستقلة", icon:<CheckSquare size={15} color={C.s500}/>,
                desc:"تطوير آليات تقييم مستقلة كطرف ثالث داعم للجودة، لضمان موضوعية النتائج ودعم تطوير البرامج بناءً على مقاييس دقيقة." },
            ].map((item,i) => (
              <div key={i} style={{ background:C.n50, borderRadius:12,
                border:`1px solid ${C.n200}`, padding:"16px",
                marginBottom: i===0 ? 14 : 0,
                transition:"border-color .2s" }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=C.s300}
                onMouseLeave={e=>e.currentTarget.style.borderColor=C.n200}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:C.n900 }}>{item.title}</span>
                  {item.icon}
                </div>
                <p style={{ fontSize:13, color:C.n600, lineHeight:1.8 }}>{item.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ background:"#fff", borderRadius:16, padding:"24px",
            border:`1px solid ${C.n300}` }}>
            <h3 style={{ fontSize:16, fontWeight:700, color:C.n900,
              display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
              <Network size={18} color={C.p500}/> التنسيق المؤسسي
            </h3>
            <div style={{ background:C.n50, borderRadius:12,
              border:`1px solid ${C.n200}`, padding:"16px",
              transition:"border-color .2s" }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.p300}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.n200}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:8 }}>
                <span style={{ fontSize:14, fontWeight:700, color:C.n900 }}>
                  التكامل وتحديد المعايير
                </span>
                <Handshake size={15} color={C.p500}/>
              </div>
              <p style={{ fontSize:13, color:C.n600, lineHeight:1.8 }}>
                العمل بشكل تكاملي مع بقية الأدوار والتنسيق المستمر مع منسقي المبادرات والمنصات لجمع البيانات. تم تحديد معايير واضحة للبيانات المطلوبة لضمان تكامل النظام مع بقية مكونات المشروع بسلاسة.
              </p>
            </div>
          </div>

        </div>
      </div>
      <style>{`@media(max-width:900px){
        div[style*="grid-template-columns: repeat(4"]{grid-template-columns:repeat(2,1fr)!important}
        div[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
      }`}</style>
    </div>
  );
};

/* ─── INSIGHTS PAGE ─── */
const TABS = [
  { id:"behavior", label:"سلوك الشباب",       icon:<Eye size={15}/> },
  { id:"lifecycle", label:"دورة الحياة",       icon:<Route size={15}/> },
  { id:"platforms", label:"فاعلية المنصات",    icon:<BarChart3 size={15}/> },
  { id:"impact",   label:"أثر البرامج",        icon:<Award size={15}/> },
  { id:"decision", label:"تحليلات القرار",     icon:<Brain size={15}/> },
];

const CHART_COLORS = [C.p500, C.s500, "#15803D", "#7C3AED", C.p300];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#fff", border:`1px solid ${C.n200}`, borderRadius:10,
      padding:"10px 14px", fontSize:12, boxShadow:"0 4px 16px rgba(0,0,0,.1)" }}>
      <p style={{ fontWeight:700, color:C.n900, marginBottom:6 }}>{label}</p>
      {payload.map((p,i) => (
        <p key={i} style={{ color:p.color, fontWeight:600 }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

/* Tab 1: Youth Behavior */
const BehaviorTab = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    {/* Interest bars */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:16, fontWeight:700, color:C.n900, marginBottom:6 }}>توزيع الاهتمامات حسب الفئة</h3>
      <p style={{ fontSize:13, color:C.n500, marginBottom:24 }}>نسبة مشاركة الأعضاء في كل مجال بناءً على بيانات الحضور والنشاط</p>
      <div style={{ height:220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={youthInterests} layout="vertical" margin={{ right:40, left:10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.n200} horizontal={false}/>
            <XAxis type="number" domain={[0,50]} tick={{ fontSize:11, fill:C.n500 }} tickFormatter={v=>v+"%"}/>
            <YAxis type="category" dataKey="cat" width={120} tick={{ fontSize:12, fill:C.n700, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Bar dataKey="pct" name="نسبة المشاركة" radius={[0,6,6,0]}>
              {youthInterests.map((_,i) => <Cell key={i} fill={CHART_COLORS[i%5]}/>)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Monthly activity line + interest table side by side */}
    <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:24 }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>النشاط الشهري طوال العام</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>إجمالي الجلسات والأعضاء النشطين شهرياً</p>
        <div style={{ height:180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyActivity} margin={{ right:10, left:-20 }}>
              <defs>
                <linearGradient id="gSessions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.p500} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={C.p500} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={C.s500} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={C.s500} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={C.n100}/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:C.n500 }} interval={1}/>
              <YAxis tick={{ fontSize:10, fill:C.n500 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Area type="monotone" dataKey="sessions" name="الجلسات" stroke={C.p500} strokeWidth={2} fill="url(#gSessions)"/>
              <Area type="monotone" dataKey="members" name="الأعضاء" stroke={C.s500} strokeWidth={2} fill="url(#gMembers)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>أبرز سلوكيات المشاركة</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>مقياس من 0-100 بناءً على تكرار السلوك</p>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {topBehaviors.map((b,i) => (
            <div key={i}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:13, color:C.n700 }}>{b.emoji} {b.behavior}</span>
                <span style={{ fontSize:13, fontWeight:700, color:C.p600 }}>{b.score}</span>
              </div>
              <div style={{ height:7, background:C.n100, borderRadius:99, overflow:"hidden" }}>
                <div style={{ height:"100%", borderRadius:99, width:`${b.score}%`,
                  background:`linear-gradient(90deg, ${C.p400||C.p300}, ${C.p500})` }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Detailed interests table */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:20 }}>تفاصيل الاهتمامات — جدول كامل</h3>
      <table style={{ width:"100%", borderCollapse:"collapse" }}>
        <thead>
          <tr style={{ background:C.n50, borderBottom:`2px solid ${C.n200}` }}>
            {["المجال","الأعضاء","النسبة","إجمالي الجلسات","متوسط الساعات/أسبوع","الاتجاه"].map((h,i) => (
              <th key={i} style={{ padding:"10px 14px", textAlign:"right", fontSize:12, fontWeight:700, color:C.n600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {youthInterests.map((row,i) => (
            <tr key={i} style={{ borderBottom:`1px solid ${C.n200}` }}
              onMouseEnter={e=>e.currentTarget.style.background=C.n50}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"12px 14px", fontWeight:700, color:C.n900, fontSize:14 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:CHART_COLORS[i%5], flexShrink:0 }}/>
                  {row.cat}
                </div>
              </td>
              <td style={{ padding:"12px 14px", fontWeight:600, color:C.n800||C.n700 }}>{row.members.toLocaleString()}</td>
              <td style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ height:6, width:60, background:C.n100, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${row.pct*2}%`, background:CHART_COLORS[i%5], borderRadius:99 }}/>
                  </div>
                  <span style={{ fontSize:13, fontWeight:700, color:CHART_COLORS[i%5] }}>{row.pct}%</span>
                </div>
              </td>
              <td style={{ padding:"12px 14px", fontSize:13, color:C.n600 }}>{row.sessions.toLocaleString()}</td>
              <td style={{ padding:"12px 14px", fontSize:13, fontWeight:600, color:C.n700 }}>{row.avgHrs} ساعة</td>
              <td style={{ padding:"12px 14px" }}>
                <span style={{ fontSize:12, fontWeight:700, padding:"3px 10px", borderRadius:99,
                  background:C.p50, color:C.p700 }}>{row.trend}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

/* Tab 2: Lifecycle */
const LifecycleTab = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    {/* Journey funnel */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:16, fontWeight:700, color:C.n900, marginBottom:4 }}>مسار تطور الأعضاء — Funnel كامل</h3>
      <p style={{ fontSize:13, color:C.n500, marginBottom:24 }}>عدد الأعضاء في كل مرحلة من رحلة الانتماء ونسبة التسرب بين المراحل</p>
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {journeyMilestones.map((s,i) => {
          const width = Math.round((s.members/1200)*100);
          return (
            <div key={i} style={{ display:"grid", gridTemplateColumns:"140px 1fr 100px 80px",
              alignItems:"center", gap:16 }}>
              <span style={{ fontSize:13, fontWeight:700, color:C.n800||C.n700, textAlign:"right" }}>{s.stage}</span>
              <div style={{ height:32, background:C.n100, borderRadius:8, overflow:"hidden",
                position:"relative" }}>
                <div style={{ height:"100%", width:`${width}%`, background:s.color,
                  borderRadius:8, transition:"width 1.2s ease",
                  display:"flex", alignItems:"center", paddingRight:10, minWidth:40 }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#fff", whiteSpace:"nowrap" }}>
                    {s.members.toLocaleString()}
                  </span>
                </div>
              </div>
              <span style={{ fontSize:12, color:C.n500, textAlign:"center" }}>
                {s.avg > 0 ? `~${s.avg} يوم` : "يوم 0"}
              </span>
              {i > 0 && (
                <span style={{ fontSize:11, fontWeight:700, padding:"3px 8px", borderRadius:99,
                  background:"#FEF2F2", color:"#B91C1C", textAlign:"center" }}>
                  -{s.dropRate}%
                </span>
              )}
              {i === 0 && <span/>}
            </div>
          );
        })}
      </div>
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"1.3fr 1fr", gap:24 }}>
      {/* Cohort retention */}
      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>الاحتفاظ بالأعضاء — تحليل Cohort</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>نسبة الاحتفاظ عبر الزمن لثلاثة مجموعات متتالية</p>
        <div style={{ height:200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cohortRetention} margin={{ right:10, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.n100}/>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:C.n500 }}/>
              <YAxis domain={[40,100]} tick={{ fontSize:10, fill:C.n500 }} tickFormatter={v=>v+"%"}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:11, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
              <Line type="monotone" dataKey="c1" name="دفعة Q1 2024" stroke={C.p500} strokeWidth={2.5} dot={{ r:3 }}/>
              <Line type="monotone" dataKey="c2" name="دفعة Q3 2024" stroke={C.s500} strokeWidth={2.5} dot={{ r:3 }} strokeDasharray="4 2"/>
              <Line type="monotone" dataKey="c3" name="دفعة Q1 2025" stroke="#7C3AED" strokeWidth={2.5} dot={{ r:3 }} strokeDasharray="2 2"/>
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Age groups */}
      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>التوزيع العمري للأعضاء</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>توزيع قاعدة المستفيدين حسب الفئات العمرية</p>
        <div style={{ height:180 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageGroups} margin={{ right:10, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.n100} vertical={false}/>
              <XAxis dataKey="group" tick={{ fontSize:11, fill:C.n600 }}/>
              <YAxis tick={{ fontSize:10, fill:C.n500 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Bar dataKey="count" name="عدد الأعضاء" radius={[6,6,0,0]}>
                {ageGroups.map((_,i) => <Cell key={i} fill={i===2 ? C.p500 : C.p200}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ marginTop:12, padding:"10px 12px", background:C.p50,
          borderRadius:10, border:`1px solid ${C.p100}` }}>
          <p style={{ fontSize:12, color:C.p700, fontWeight:600 }}>
            💡 الفئة الأكثر حضوراً: <strong>23-26 سنة</strong> (34% من إجمالي العضوية)
          </p>
        </div>
      </div>
    </div>
  </div>
);

/* Tab 3: Platform Effectiveness */
const PlatformsTab = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
      {/* Radar Chart */}
      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>مقارنة شاملة — Radar</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:16 }}>5 مؤشرات رئيسية لكل المنصات</p>
        <div style={{ height:240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top:10, right:20, left:20, bottom:10 }}>
              <PolarGrid stroke={C.n200}/>
              <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:C.n600, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
              <Radar name="الابتكار التقني" dataKey="AT" stroke={C.p500} fill={C.p500} fillOpacity={0.15} strokeWidth={2}/>
              <Radar name="الريادة المجتمعية" dataKey="RM" stroke={C.s500} fill={C.s500} fillOpacity={0.1} strokeWidth={2}/>
              <Radar name="القادة الشباب" dataKey="QS" stroke="#7C3AED" fill="#7C3AED" fillOpacity={0.1} strokeWidth={2}/>
              <Legend wrapperStyle={{ fontSize:11, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
              <Tooltip content={<CustomTooltip/>}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grouped bar */}
      <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
        <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>تفاصيل المؤشرات لكل منصة</h3>
        <p style={{ fontSize:12, color:C.n500, marginBottom:16 }}>نسب مئوية 0-100</p>
        <div style={{ height:240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={platformEffectiveness} margin={{ right:10, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.n100} vertical={false}/>
              <XAxis dataKey="platform" tick={{ fontSize:9, fill:C.n600, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
              <YAxis domain={[50,100]} tick={{ fontSize:10, fill:C.n500 }}/>
              <Tooltip content={<CustomTooltip/>}/>
              <Legend wrapperStyle={{ fontSize:10, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
              <Bar dataKey="engagement" name="التفاعل" fill={C.p500} radius={[3,3,0,0]}/>
              <Bar dataKey="retention" name="الاحتفاظ" fill={C.s500} radius={[3,3,0,0]}/>
              <Bar dataKey="satisfaction" name="الرضا" fill="#7C3AED" radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>

    {/* KPI matrix table */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:20 }}>مصفوفة المؤشرات الرئيسية — KPI Matrix</h3>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", minWidth:500 }}>
          <thead>
            <tr style={{ background:C.n50, borderBottom:`2px solid ${C.n200}` }}>
              <th style={{ padding:"10px 14px", textAlign:"right", fontSize:12, fontWeight:700, color:C.n600, minWidth:160 }}>المؤشر</th>
              {["الابتكار التقني","الريادة المجتمعية","صناع المحتوى","القادة الشباب"].map((p,i) => (
                <th key={i} style={{ padding:"10px 14px", textAlign:"center", fontSize:12, fontWeight:700, color:CHART_COLORS[i] }}>{p}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {platformKPIs.map((kpi,i) => {
              const best = Math.max(...kpi.values);
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${C.n200}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.n50}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"12px 14px", fontSize:13, fontWeight:700, color:C.n800||C.n700 }}>{kpi.kpi}</td>
                  {kpi.values.map((v,j) => (
                    <td key={j} style={{ padding:"12px 14px", textAlign:"center" }}>
                      <span style={{ fontSize:14, fontWeight:700,
                        color: v===best ? CHART_COLORS[j] : C.n600,
                        background: v===best ? (j===0?C.p50:j===1?C.s50:"#F5F3FF") : "transparent",
                        padding: v===best ? "3px 10px" : "3px 0",
                        borderRadius: v===best ? 99 : 0 }}>
                        {v}{kpi.unit}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

/* Tab 4: Program Impact */
const ImpactTab = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    {/* Trend line */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:16, fontWeight:700, color:C.n900, marginBottom:4 }}>اتجاه الأثر على مدار 6 أرباع</h3>
      <p style={{ fontSize:13, color:C.n500, marginBottom:24 }}>متوسط نسبة التحسن في الكفاءات، عدد المشاركين، ومعدل الرضا العام</p>
      <div style={{ height:200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={impactTrend} margin={{ right:20, left:-10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.n100}/>
            <XAxis dataKey="quarter" tick={{ fontSize:10, fill:C.n500 }}/>
            <YAxis yAxisId="left" tick={{ fontSize:10, fill:C.n500 }}/>
            <YAxis yAxisId="right" orientation="right" domain={[7,10]} tick={{ fontSize:10, fill:C.n500 }}/>
            <Tooltip content={<CustomTooltip/>}/>
            <Legend wrapperStyle={{ fontSize:11, fontFamily:"'IBM Plex Sans Arabic',sans-serif" }}/>
            <Bar yAxisId="left" dataKey="participants" name="المشاركون" fill={C.p100} radius={[4,4,0,0]}/>
            <Line yAxisId="left" type="monotone" dataKey="avgGain" name="متوسط التحسن %" stroke={C.p500} strokeWidth={2.5} dot={{ r:4 }}/>
            <Line yAxisId="right" type="monotone" dataKey="satisfaction" name="الرضا /10" stroke={C.s500} strokeWidth={2.5} dot={{ r:4 }} strokeDasharray="5 2"/>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    {/* Program impact cards */}
    <div>
      <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:16 }}>تقييم تأثير كل برنامج — Before vs After</h3>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:18 }}>
        {programImpact.map((prog,i) => {
          const gain = prog.after - prog.before;
          return (
            <div key={i} style={{ background:"#fff", borderRadius:16, padding:"20px",
              border:`1px solid ${C.n300}` }} className="card-hover">
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"flex-start", marginBottom:16 }}>
                <div>
                  <h4 style={{ fontSize:14, fontWeight:700, color:C.n900, marginBottom:4 }}>{prog.program}</h4>
                  <span style={{ fontSize:12, color:C.n500 }}>{prog.participants} مشارك</span>
                </div>
                <div style={{ textAlign:"left" }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"#15803D",
                    background:"#F0FDF4", padding:"4px 10px", borderRadius:99 }}>⭐ {prog.rating}</div>
                </div>
              </div>
              {/* Before/After bar */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", justifyContent:"space-between",
                  fontSize:11, color:C.n500, marginBottom:5 }}>
                  <span>قبل البرنامج</span>
                  <span>بعد البرنامج</span>
                </div>
                <div style={{ display:"flex", gap:4, alignItems:"center" }}>
                  <div style={{ flex:1, height:14, background:C.n100, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${prog.before}%`, background:C.n300, borderRadius:99 }}/>
                  </div>
                  <span style={{ fontSize:11, color:C.n500, width:28, textAlign:"center" }}>{prog.before}%</span>
                  <span style={{ fontSize:16 }}>→</span>
                  <div style={{ flex:1, height:14, background:C.n100, borderRadius:99, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${prog.after}%`, background:C.p500, borderRadius:99 }}/>
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:C.p600, width:28, textAlign:"center" }}>{prog.after}%</span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, paddingTop:12,
                borderTop:`1px solid ${C.n200}`, textAlign:"center" }}>
                <div>
                  <p style={{ fontSize:10, color:C.n400, marginBottom:3 }}>التحسن</p>
                  <p style={{ fontSize:15, fontWeight:700, color:C.p600 }}>+{gain}%</p>
                </div>
                <div style={{ borderInline:`1px solid ${C.n200}` }}>
                  <p style={{ fontSize:10, color:C.n400, marginBottom:3 }}>الاحتفاظ</p>
                  <p style={{ fontSize:15, fontWeight:700, color:C.n800||C.n700 }}>{prog.retention}%</p>
                </div>
                <div>
                  <p style={{ fontSize:10, color:C.n400, marginBottom:3 }}>مشاريع منجزة</p>
                  <p style={{ fontSize:15, fontWeight:700, color:C.s600 }}>{prog.projects>0?prog.projects:"—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

/* Tab 5: Decision Analytics */
const DecisionTab = () => (
  <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
    {/* Strategic insights */}
    <div>
      <h3 style={{ fontSize:16, fontWeight:700, color:C.n900, marginBottom:6 }}>رؤى استراتيجية — الأولويات والتوصيات</h3>
      <p style={{ fontSize:13, color:C.n500, marginBottom:20 }}>تحليل مُستخلص من البيانات المتاحة لدعم قرارات الفريق التنفيذي</p>
      <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
        {strategicInsights.map((ins,i) => (
          <div key={i} style={{ background:"#fff", borderRadius:14,
            border:`1px solid ${C.n300}`, padding:"18px 20px",
            borderRight:`4px solid ${ins.color}` }} className="card-hover">
            <div style={{ display:"flex", justifyContent:"space-between",
              alignItems:"flex-start", flexWrap:"wrap", gap:10 }}>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, flexWrap:"wrap" }}>
                  <span style={{ background:ins.bg, color:ins.color, fontSize:11, fontWeight:700,
                    padding:"3px 10px", borderRadius:99, display:"flex", alignItems:"center", gap:4 }}>
                    {ins.icon} {ins.type}
                  </span>
                  <span style={{ background:
                    ins.priority==="عالية" ? "#FEF2F2" : ins.priority==="متوسطة" ? "#FFFBEB" : C.n100,
                    color:
                    ins.priority==="عالية" ? "#B91C1C" : ins.priority==="متوسطة" ? "#B45309" : C.n600,
                    fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:99 }}>
                    أولوية {ins.priority}
                  </span>
                </div>
                <h4 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:6 }}>{ins.title}</h4>
                <p style={{ fontSize:13, color:C.n600, lineHeight:1.8 }}>{ins.detail}</p>
              </div>
              <div style={{ background:ins.bg, color:ins.color, fontSize:12, fontWeight:700,
                padding:"6px 14px", borderRadius:10, whiteSpace:"nowrap", flexShrink:0,
                border:`1px solid ${ins.color}22` }}>{ins.metric}</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Decision matrix */}
    <div style={{ background:"#fff", borderRadius:16, padding:"24px", border:`1px solid ${C.n300}` }}>
      <h3 style={{ fontSize:15, fontWeight:700, color:C.n900, marginBottom:4 }}>مصفوفة الأولويات — الجهد vs الأثر</h3>
      <p style={{ fontSize:12, color:C.n500, marginBottom:20 }}>تقييم كل مبادرة مقترحة (1=منخفض، 10=مرتفع)</p>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:C.n50, borderBottom:`2px solid ${C.n200}` }}>
              {["المبادرة المقترحة","الجهد المطلوب","الأثر المتوقع","قابلية التطبيق","الإطار الزمني","التوصية"].map((h,i) => (
                <th key={i} style={{ padding:"10px 14px", textAlign:"right", fontSize:12, fontWeight:700, color:C.n600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {decisionMatrix.map((row,i) => {
              const score = (row.impact * 0.5 + row.feasibility * 0.35 - row.effort * 0.15).toFixed(1);
              const rec = score >= 8 ? { label:"أولوية قصوى", c:"#15803D", bg:"#F0FDF4" }
                : score >= 7 ? { label:"مُنصح به", c:C.p600, bg:C.p50 }
                : { label:"للدراسة", c:C.n600, bg:C.n100 };
              return (
                <tr key={i} style={{ borderBottom:`1px solid ${C.n200}` }}
                  onMouseEnter={e=>e.currentTarget.style.background=C.n50}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"12px 14px", fontWeight:700, color:C.n900, fontSize:13 }}>{row.action}</td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700,
                      color: row.effort<=4 ? "#15803D" : row.effort<=6 ? C.s600 : "#B91C1C" }}>
                      {row.effort}/10
                    </span>
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:C.p600 }}>{row.impact}/10</span>
                  </td>
                  <td style={{ padding:"12px 14px", textAlign:"center" }}>
                    <span style={{ fontSize:13, fontWeight:700, color:"#15803D" }}>{row.feasibility}/10</span>
                  </td>
                  <td style={{ padding:"12px 14px", fontSize:12, color:C.n600 }}>{row.timeframe}</td>
                  <td style={{ padding:"12px 14px" }}>
                    <span style={{ background:rec.bg, color:rec.c, fontSize:11, fontWeight:700,
                      padding:"4px 12px", borderRadius:99 }}>{rec.label}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const InsightsPage = () => {
  const [active, setActive] = useState("behavior");
  const tabContent = { behavior:<BehaviorTab/>, lifecycle:<LifecycleTab/>, platforms:<PlatformsTab/>, impact:<ImpactTab/>, decision:<DecisionTab/> };
  return (
    <div style={{ paddingTop:80, minHeight:"100vh", background:C.n200 }}>
      {/* Page header */}
      <div style={{ background:`linear-gradient(135deg,${C.p50},${C.s50})`,
        borderBottom:`1px solid ${C.n300}`, padding:"40px 24px 0" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ marginBottom:28 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:C.p500,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <Brain size={18} color="white"/>
              </div>
              <h1 style={{ fontSize:"clamp(1.3rem,3vw,1.8rem)", fontWeight:700, color:C.n900 }}>
                تحويل البيانات إلى رؤى قابلة للاستخدام
              </h1>
            </div>
            <p style={{ color:C.n600, fontSize:14, maxWidth:600, lineHeight:1.7 }}>
              تحليلات عميقة مُستخلصة من بيانات الشبكة لفهم سلوك الشباب، قياس الأثر، وتوجيه القرارات الاستراتيجية بثقة.
            </p>
          </div>
          {/* Tabs */}
          <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:0 }}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => setActive(tab.id)}
                style={{ display:"flex", alignItems:"center", gap:7,
                  padding:"11px 18px", fontSize:13, fontWeight:600,
                  fontFamily:"'IBM Plex Sans Arabic',sans-serif",
                  border:"none", cursor:"pointer", whiteSpace:"nowrap",
                  borderRadius:"10px 10px 0 0",
                  background: active===tab.id ? "#fff" : "transparent",
                  color: active===tab.id ? C.p600 : C.n600,
                  borderBottom: active===tab.id ? `2px solid ${C.p500}` : "2px solid transparent",
                  transition:"all .2s",
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Tab content */}
      <div style={{ maxWidth:1200, margin:"0 auto", padding:"32px 24px 80px" }}>
        {tabContent[active]}
      </div>
    </div>
  );
};

/* ─── PLACEHOLDER PAGE ─── */
const PlaceholderPage = ({ title, subtitle }) => (
  <div style={{ paddingTop:80, minHeight:"100vh", background:C.n50,
    display:"flex", flexDirection:"column" }}>
    <div style={{ background:`linear-gradient(135deg,${C.p50},${C.s50})`,
      padding:"100px 24px 60px", textAlign:"center" }}>
      <h1 style={{ fontSize:"clamp(1.8rem,4vw,2.6rem)", fontWeight:700,
        color:C.n900, marginBottom:12 }}>{title}</h1>
      <p style={{ color:C.n600, fontSize:17 }}>{subtitle}</p>
    </div>
    <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center",
      padding:60 }}>
      <div style={{ textAlign:"center", color:C.n400 }}>
        <BookOpen size={48} style={{ margin:"0 auto 16px", opacity:.4 }}/>
        <p style={{ fontSize:16 }}>المحتوى قيد الإعداد</p>
      </div>
    </div>
  </div>
);

/* ─── ROOT APP ─── */
export default function App() {
  const [page, setPage] = useState("home");
  const onNav = useCallback((p) => {
    setPage(p);
    window.scrollTo({ top:0, behavior:"smooth" });
  }, []);

  const renderPage = () => {
    if (page === "home") return (
      <>
        <HeroSection onNav={onNav}/>
        <AboutSection/>
        <ProjectsSection onNav={onNav}/>
        <StatsSection/>
        <TeamSection/>
        <PartnersSection/>
        <CTASection onNav={onNav}/>
      </>
    );
    if (page === "contact") return <ContactPage/>;
    if (page === "insights") return <InsightsPage/>;
    if (page === "dashboard") return <AdminDashboardPage/>;
    if (page === "about") return <PlaceholderPage title="عن شبكة الرواد" subtitle="تعرف على قصتنا، رسالتنا وقيمنا"/>;
    if (page === "projects") return <PlaceholderPage title="مشاريعنا" subtitle="استعرض كل مبادراتنا وإنجازاتنا"/>;
    if (page === "team") return <PlaceholderPage title="فريق العمل" subtitle="تعرف على الأشخاص الذين يقودون المسيرة"/>;
    return null;
  };

  return (
    <>
      <GlobalStyles/>
      <Navbar page={page} onNav={onNav}/>
      <main>{renderPage()}</main>
      <Footer onNav={onNav}/>
    </>
  );
}
