import { useState, useRef } from "react";

const SB_URL     = import.meta.env.VITE_SB_URL;
const SB_ANON    = import.meta.env.VITE_SB_ANON;
const CLAUDE_KEY = import.meta.env.VITE_CLAUDE_KEY;

const sb = {
  async insert(table, data) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": SB_ANON, "Authorization": `Bearer ${SB_ANON}`, "Prefer": "return=minimal" },
        body: JSON.stringify(data),
      });
      return r.ok;
    } catch { return false; }
  },
};

const sid = () => {
  if (!sessionStorage.getItem("eof_sid"))
    sessionStorage.setItem("eof_sid", Math.random().toString(36).slice(2));
  return sessionStorage.getItem("eof_sid");
};

// ─── QUIZ v3 ────────────────────────────────────────────────────────────────
const QUIZ = [
  {
    id: "state",
    question: "Where do you find yourself today?",
    sub: "The mountain will meet you there.",
    opts: [
      { v: "steady", label: "Steady Focus",  icon: "⛰️", s: { steady: 3 }, hint: "Stay sharp — without burning out." },
      { v: "calm",   label: "Calm Clarity",  icon: "☁️", s: { calm: 3 },   hint: "Quiet the noise. Not more push." },
      { v: "reset",  label: "Reset",         icon: "🌙", s: { reset: 3 },  hint: "Change the pace entirely." },
    ],
  },
  {
    id: "moment",
    question: "Your tea moment looks like…",
    sub: "When does tea find you?",
    opts: [
      { v: "morning",   label: "Morning ritual",     icon: "🌅", s: { steady: 2 } },
      { v: "afternoon", label: "Afternoon escape",   icon: "☁️", s: { reset: 1, calm: 1 } },
      { v: "evening",   label: "Evening stillness",  icon: "🌙", s: { calm: 2, reset: 1 } },
      { v: "anytime",   label: "Whenever I need it", icon: "∞",  s: { steady: 1, calm: 1 } },
    ],
  },
  {
    id: "flavor",
    question: "Your instinctive flavor?",
    sub: "Close your eyes. Which calls to you?",
    opts: [
      { v: "floral",  label: "Light & floral",   icon: "🌸", s: { steady: 2, calm: 1 } },
      { v: "sweet",   label: "Sweet & honeyed",  icon: "🍯", s: { reset: 2, calm: 1 } },
      { v: "earthy",  label: "Deep & earthy",    icon: "🪨", s: { steady: 1, calm: 1 } },
      { v: "roasted", label: "Warm & roasted",   icon: "🔥", s: { reset: 1, steady: 1 } },
    ],
  },
];

// ─── PERSONAS v4 ─────────────────────────────────────────────────────────────
const PERSONAS = {
  steady: {
    key: "steady", title: "STEADY",
    tagline: "Focus that lasts — without the drop.",
    line1: "Not another push.", line2: "Something that holds you steady.",
    desc: "Grown in Taiwan's high mountains, made for this kind of clarity.",
    accent: "#6b8f5e", grad: "linear-gradient(135deg,#1a2e1a,#2d4a2d)",
    copyAfternoon: "Stay steady through the afternoon — without another cup.",
    knowledge: [
      { title: "Why High Mountain Oolong?", body: "At 1,800m, slow-growing leaves develop a natural balance of caffeine and L-theanine — releasing energy gradually, without the sudden drop that follows coffee." },
      { title: "The Alishan Difference", body: "Morning cloud cover and dramatic temperature swings between day and night create a leaf with extraordinary complexity. One farmer, one hillside, one harvest." },
    ],
    products: [
      { name: "Lishan High Mountain Oolong", price: "£38", desc: "Steady, cloud-covered mornings in every cup", tag: "Morning Ritual" },
      { name: "Alishan High Mountain Oolong", price: "£32", desc: "A balanced place to begin — smooth, steady, and easy to return to.", tag: "Best Start" },
    ],
  },
  calm: {
    key: "calm", title: "CALM",
    tagline: "Clear mind. Quiet body. A different kind of alert.",
    line1: "Not more noise.", line2: "Something that lets things settle.",
    desc: "Lightly oxidised in Taiwan's mountains, made for quiet clarity.",
    accent: "#4a7c8a", grad: "linear-gradient(135deg,#0d1f2a,#1a3040)",
    copyAfternoon: "Let the afternoon soften — without pushing it further.",
    copyEvening: "Warm, quiet, and low in stimulation.",
    knowledge: [
      { title: "Pouchong: The Quietest Oolong", body: "Wenshan Pouchong is the lightest of Taiwan's oolongs — barely oxidised, delicate as morning air. A cup that asks nothing of you except to be present." },
      { title: "Evening & the Roasted Path", body: "Deep-roasted oolongs go through a long, slow heat process. The result: a warmer, softer profile — grounding without stimulating." },
    ],
    products: [
      { name: "Wenshan Pouchong", price: "£26", desc: "Light, clear, and gently grounding", tag: "Morning Calm" },
      { name: "Honey Fragrance Black Tea", price: "£30", desc: "Warm, quiet, and low in stimulation.", tag: "Evening Stillness" },
    ],
  },
  reset: {
    key: "reset", title: "RESET",
    tagline: "Choose a different rhythm.",
    line1: "Not another push through.", line2: "Something that shifts your pace.",
    desc: "Naturally shaped by Taiwan's unique terroir, made for a gentler reset.",
    accent: "#b8732a", grad: "linear-gradient(135deg,#1a1208,#2d1e0f)",
    copyAfternoon: "When coffee stops working, choose a different rhythm.",
    copyEvening: "Deep roast. Softer profile. Less stimulation.",
    knowledge: [
      { title: "Oriental Beauty: Nature's Intervention", body: "The only tea that requires an insect to complete it. Tiny leafhoppers bite the leaves, triggering a natural oxidation that creates an unrepeatable honey fragrance. Not made — allowed." },
      { title: "The Evening Choice", body: "Charcoal-roasted oolongs undergo long, slow heat. The result is a warmer, mellower profile — a quieter signal at the end of the day." },
    ],
    products: [
      { name: "Oriental Beauty", price: "£38", desc: "Taiwan's most unique tea — honey, stone fruit, and calm", tag: "Afternoon Reset" },
      { name: "Charcoal Roasted Oolong", price: "£30", desc: "Deep roast. Softer profile. Less stimulation.", tag: "Evening Stillness" },
    ],
  },
};

function computePersona(ans) {
  const sc = { steady: 0, calm: 0, reset: 0 };
  QUIZ.forEach(q => {
    const o = q.opts.find(o => o.v === ans[q.id]);
    if (o) Object.entries(o.s).forEach(([k, v]) => { if (sc[k] !== undefined) sc[k] += v; });
  });
  if (ans.state === "steady" && ans.moment === "afternoon") sc.steady += 2;
  if (ans.state === "reset"  && ans.moment === "afternoon") sc.reset  += 2;
  if (ans.moment === "evening") sc.calm += 1;
  return Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
}

function Dot({ d }) {
  return <span style={{ display:"inline-block", width:7, height:7, borderRadius:"50%", background:"#8a7a6a", animation:`dot 1.2s ease-in-out ${d}s infinite` }} />;
}

function ChatPanel({ persona, onClose }) {
  const [msgs, setMsgs] = useState([{ role:"assistant", text:`Welcome, ${persona.title}. I'm your personal tea guide from Taiwan's highlands. Ask me anything about brewing, flavors, or which tea to try next.` }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput("");
    setMsgs(p => [...p, { role:"user", text:txt }]);
    setLoading(true);
    sb.insert("chat_logs", { session_id:sid(), persona:persona.key, role:"user", message:txt });
    try {
      const history = msgs.map(m => ({ role:m.role, content:m.text }));
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type":"application/json", "x-api-key":CLAUDE_KEY, "anthropic-version":"2023-06-01", "anthropic-dangerous-direct-browser-access":"true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `You are a warm and knowledgeable tea guide for Echo of Formosa, a premium Taiwan artisan tea brand. User persona: ${persona.title} — ${persona.desc} Reply in 2-3 sentences with sensory language. Mention specific teas: Lishan, Alishan, Dong Ding, Charcoal Roasted Oolong, Oriental Beauty, Wenshan Pouchong, Honey Black Tea. Never make medical or health claims. Use experience and sensory language only.`,
          messages: [...history, { role:"user", content:txt }],
        }),
      });
      const d = await r.json();
      const reply = d.content?.find(b => b.type === "text")?.text || "The mountain connection was lost. Please try again.";
      setMsgs(p => [...p, { role:"assistant", text:reply }]);
      sb.insert("chat_logs", { session_id:sid(), persona:persona.key, role:"assistant", message:reply });
    } catch {
      setMsgs(p => [...p, { role:"assistant", text:"Connection lost. Please try again." }]);
    }
    setLoading(false);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.78)", zIndex:200, display:"flex", alignItems:"flex-end", justifyContent:"flex-end", padding:24 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width:"100%", maxWidth:420, height:"70vh", background:"#faf7f1", borderRadius:20, display:"flex", flexDirection:"column", overflow:"hidden", boxShadow:"0 40px 80px rgba(0,0,0,.5)" }}>
        <div style={{ background:"#0a1a0a", padding:"16px 22px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontFamily:"Georgia,serif", fontSize:17, color:"#f7f2e8" }}>Tea Guide</div>
            <div style={{ fontSize:10, color:"#c8d4c0", letterSpacing:".1em", textTransform:"uppercase", opacity:.55 }}>Echo of Formosa · AI</div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#c8d4c0", fontSize:22, cursor:"pointer", opacity:.65 }}>×</button>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"16px 18px", display:"flex", flexDirection:"column", gap:12 }}>
          {msgs.map((m, i) => (
            <div key={i} style={{ display:"flex", justifyContent:m.role==="user"?"flex-end":"flex-start" }}>
              <div style={{ maxWidth:"82%", padding:"10px 14px", borderRadius:m.role==="user"?"16px 16px 4px 16px":"16px 16px 16px 4px", background:m.role==="user"?"#0a1a0a":"#f0ece4", color:m.role==="user"?"#f7f2e8":"#1a1208", fontSize:14, lineHeight:1.65 }}>{m.text}</div>
            </div>
          ))}
          {loading && <div style={{ display:"flex", gap:5, padding:"10px 14px", background:"#f0ece4", borderRadius:"16px 16px 16px 4px", width:"fit-content" }}><Dot d={0}/><Dot d={.2}/><Dot d={.4}/></div>}
          <div ref={endRef}/>
        </div>
        <div style={{ padding:"12px 16px", borderTop:"1px solid #e5dfd5", display:"flex", gap:10 }}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask about Taiwan teas…"
            style={{ flex:1, border:"1px solid #d5cfc5", borderRadius:22, padding:"10px 16px", fontSize:14, outline:"none", background:"#faf8f4", color:"#1a1208" }} />
          <button onClick={send} disabled={loading} style={{ width:42, height:42, borderRadius:"50%", background:"#0a1a0a", border:"none", cursor:"pointer", fontSize:18, color:"#f7f2e8", opacity:loading?.5:1 }}>→</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage]     = useState("hero");
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState({});
  const [persona, setPersona] = useState(null);
  const [picked, setPicked]   = useState(null);
  const [chat, setChat]       = useState(false);
  const [qkey, setQkey]       = useState(0);
  const [email, setEmail]     = useState("");
  const [joined, setJoined]   = useState(false);
  const saved = useRef(false);

  const choose = (qId, v) => {
    setPicked(v);
    setTimeout(() => {
      const next = { ...answers, [qId]:v };
      setAnswers(next); setPicked(null);
      if (step < QUIZ.length-1) { setStep(step+1); setQkey(k=>k+1); }
      else {
        const pk = computePersona(next);
        setPersona(PERSONAS[pk]); setStage("result");
        if (!saved.current) {
          sb.insert("visitors", { session_id:sid(), persona:pk, answers:next });
          saved.current = true;
        }
      }
    }, 350);
  };

  const handleProduct = pr => sb.insert("product_clicks", { session_id:sid(), persona:persona?.key, product_name:pr.name, price:pr.price });
  const handleJoin = async () => {
    if (!email || joined) return;
    await sb.insert("waitlist", { session_id:sid(), email, persona:persona?.key });
    setJoined(true);
  };
  const restart = () => {
    setStage("hero"); setStep(0); setAnswers({}); setPersona(null);
    setPicked(null); setQkey(0); setEmail(""); setJoined(false); saved.current=false;
  };

  const q = QUIZ[step];
  const p = persona;
  const pct = ((step+1)/QUIZ.length)*100;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Jost:wght@300;400;500&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Jost',sans-serif; background:#0d1f0d; color:#f7f2e8; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes float  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes dot    { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        .fu { animation: fadeUp .6s ease both; }
        .fi { animation: fadeIn .5s ease both; }
        .opt { transition:all .2s ease; cursor:pointer; width:100%; outline:none; }
        .opt:hover { transform:translateX(6px)!important; border-color:#b8732a!important; background:rgba(255,255,255,.07)!important; }
        .opt.sel { background:rgba(184,115,42,.15)!important; border-color:#b8732a!important; }
        .pcard { transition:all .3s ease; cursor:pointer; }
        .pcard:hover { transform:translateY(-4px)!important; box-shadow:0 18px 44px rgba(0,0,0,.3)!important; }
        ::-webkit-scrollbar { width:3px }
        ::-webkit-scrollbar-thumb { background:#4a3f2f; border-radius:2px }
      `}</style>

      <div style={{ minHeight:"100vh", overflowX:"hidden" }}>

        {/* ── HERO ── */}
        {stage === "hero" && (
          <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 24px", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 30% 20%, rgba(107,143,94,.13) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(184,115,42,.09) 0%, transparent 48%)", pointerEvents:"none" }} />
            <div style={{ textAlign:"center", maxWidth:560, position:"relative", zIndex:1 }}>
              <div className="fu">
                <div style={{ width:58, height:58, margin:"0 auto 14px", borderRadius:"50%", border:"1px solid rgba(184,115,42,.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, animation:"float 4s ease-in-out infinite" }}>🍃</div>
                <div style={{ fontSize:10, letterSpacing:".3em", textTransform:"uppercase", color:"#b8732a", fontWeight:500 }}>Echo of Formosa</div>
              </div>
              <h1 className="fu" style={{ animationDelay:".12s", fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(40px,7vw,68px)", fontWeight:300, lineHeight:1.12, marginBottom:24, marginTop:24 }}>
                A gentler way to focus,
                <br />
                <em style={{ fontStyle:"italic", color:"#c8d4c0" }}>from Taiwan's high mountains.</em>
              </h1>
              <p className="fu" style={{ animationDelay:".24s", fontSize:15, color:"#c8d4c0", lineHeight:1.85, fontWeight:300, maxWidth:380, margin:"0 auto 40px", opacity:.7 }}>
                A gentler rhythm for your day.
              </p>
              <div className="fu" style={{ animationDelay:".36s" }}>
                <button onClick={() => setStage("quiz")}
                  style={{ background:"none", border:"1px solid #b8732a", color:"#b8732a", padding:"14px 48px", fontSize:12, letterSpacing:".18em", textTransform:"uppercase", cursor:"pointer", borderRadius:40, transition:"all .25s ease" }}
                  onMouseEnter={e => { e.currentTarget.style.background="#b8732a"; e.currentTarget.style.color="#f7f2e8"; }}
                  onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color="#b8732a"; }}>
                  Find my tea →
                </button>
              </div>
              <p className="fu" style={{ animationDelay:".48s", marginTop:20, fontSize:11, color:"rgba(200,212,192,.35)", letterSpacing:".06em" }}>
                3 questions · 60 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {stage === "quiz" && (
          <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"60px 24px 40px" }}>
            <div style={{ position:"fixed", top:0, left:0, right:0, height:3, background:"rgba(200,212,192,.08)", zIndex:10 }}>
              <div style={{ height:"100%", background:"#b8732a", width:`${pct}%`, transition:"width .5s ease", borderRadius:"0 2px 2px 0" }} />
            </div>
            <div key={qkey} className="fu" style={{ maxWidth:520, width:"100%" }}>
              <div style={{ textAlign:"center", marginBottom:40 }}>
                <div style={{ fontSize:11, letterSpacing:".2em", textTransform:"uppercase", color:"#b8732a", marginBottom:12 }}>{step+1} of {QUIZ.length}</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(32px,5vw,50px)", fontWeight:300, marginBottom:8, lineHeight:1.15 }}>{q.question}</h2>
                <p style={{ color:"#c8d4c0", fontSize:14, fontWeight:300, opacity:.6 }}>{q.sub}</p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {q.opts.map((opt, i) => (
                  <button key={opt.v} className={`opt${picked === opt.v ? " sel" : ""}`}
                    onClick={() => choose(q.id, opt.v)}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(200,212,192,.12)", borderRadius:12, padding:"16px 20px", display:"flex", alignItems:"center", gap:14, color:"#f7f2e8", textAlign:"left", animation:`fadeUp .5s ease ${i*.06}s both`, fontSize:15 }}>
                    <span style={{ fontSize:20, flexShrink:0 }}>{opt.icon}</span>
                    <span style={{ flex:1 }}>{opt.label}</span>
                    {opt.hint && <span style={{ fontSize:11, color:"rgba(200,212,192,.4)", fontWeight:300 }}>{opt.hint}</span>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {stage === "result" && p && (
          <div className="fi">
            <div style={{ background:p.grad, padding:"clamp(60px,10vw,100px) 24px clamp(48px,8vw,80px)", textAlign:"center", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at center, rgba(255,255,255,.04) 0%, transparent 65%)" }} />
              <div style={{ position:"relative", zIndex:1, maxWidth:600, margin:"0 auto" }}>
                <div style={{ fontSize:10, letterSpacing:".28em", textTransform:"uppercase", color:"rgba(200,212,192,.5)", marginBottom:20 }}>Today, you need</div>
                <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(48px,8vw,72px)", fontWeight:300, lineHeight:1.05, marginBottom:20, letterSpacing:".04em" }}>{p.title}</h2>
                <p style={{ fontSize:20, color:"#c8d4c0", fontWeight:300, lineHeight:1.6, maxWidth:420, margin:"0 auto 6px", opacity:.9 }}>{p.line1}</p>
                <p style={{ fontSize:20, color:"#c8d4c0", fontWeight:300, lineHeight:1.6, maxWidth:420, margin:"0 auto 24px", opacity:.9 }}>{p.line2}</p>
                <div style={{ width:40, height:1, background:p.accent, margin:"0 auto 24px", opacity:.6 }} />
                <p style={{ fontSize:15, color:p.accent, fontWeight:400, marginBottom:8, letterSpacing:".04em" }}>{p.tagline}</p>
                {answers.moment === "afternoon" && p.copyAfternoon && (
                  <p style={{ fontSize:14, color:"rgba(200,212,192,.6)", fontWeight:300, fontStyle:"italic", marginTop:6 }}>{p.copyAfternoon}</p>
                )}
                {answers.moment === "evening" && p.copyEvening && (
                  <p style={{ fontSize:14, color:"rgba(200,212,192,.6)", fontWeight:300, fontStyle:"italic", marginTop:6 }}>{p.copyEvening}</p>
                )}
                <p style={{ fontSize:13, color:"rgba(200,212,192,.45)", fontWeight:300, marginTop:20, lineHeight:1.7 }}>{p.desc}</p>
              </div>
            </div>

            <div style={{ background:"#0d1f0d", padding:"clamp(48px,8vw,80px) 24px" }}>
              <div style={{ maxWidth:760, margin:"0 auto" }}>
                <div style={{ textAlign:"center", marginBottom:40 }}>
                  <div style={{ fontSize:10, letterSpacing:".28em", textTransform:"uppercase", color:"#b8732a", marginBottom:10 }}>Selected for Your Journey</div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:300, color:"#f7f2e8" }}>Your Teas</h3>
                  <p style={{ color:"rgba(200,212,192,.5)", fontSize:14, marginTop:10, fontWeight:300 }}>Start with one. See how it feels.</p>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))", gap:20 }}>
                  {p.products.map((pr, i) => (
                    <div key={i} className="pcard" onClick={() => handleProduct(pr)}
                      style={{ background:"rgba(255,255,255,.05)", borderRadius:14, padding:26, border:"1px solid rgba(200,212,192,.1)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                        <span style={{ fontSize:10, letterSpacing:".12em", textTransform:"uppercase", color:p.accent, background:`${p.accent}1a`, padding:"4px 10px", borderRadius:18 }}>{pr.tag}</span>
                        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:20, color:"#f7f2e8" }}>{pr.price}</span>
                      </div>
                      <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:400, color:"#f7f2e8", marginBottom:8, lineHeight:1.25 }}>{pr.name}</h4>
                      <p style={{ color:"#c8d4c0", fontSize:13, fontWeight:300, marginBottom:20, opacity:.6 }}>{pr.desc}</p>
                      <button style={{ width:"100%", background:"none", border:`1px solid ${p.accent}55`, color:p.accent, padding:"10px", borderRadius:8, fontSize:11, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", transition:"all .2s" }}
                        onMouseEnter={e => { e.currentTarget.style.background=p.accent; e.currentTarget.style.color="#f7f2e8"; }}
                        onMouseLeave={e => { e.currentTarget.style.background="none"; e.currentTarget.style.color=p.accent; }}>
                        Start with this tea →
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ textAlign:"center", padding:"32px 0 0", borderTop:"1px solid rgba(200,212,192,.08)", marginTop:32 }}>
                  <p style={{ fontSize:14, color:"rgba(200,212,192,.7)", marginBottom:8, fontWeight:300 }}>No tools. No rules.</p>
                  <p style={{ fontSize:13, color:"rgba(200,212,192,.4)", fontWeight:300 }}>Just hot water and a moment to reset.</p>
                </div>
              </div>
            </div>

            <div style={{ background:"#faf7f1", padding:"clamp(48px,8vw,80px) 24px" }}>
              <div style={{ maxWidth:760, margin:"0 auto" }}>
                <div style={{ textAlign:"center", marginBottom:40 }}>
                  <div style={{ fontSize:10, letterSpacing:".28em", textTransform:"uppercase", color:"#b8732a", marginBottom:10 }}>For the curious</div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,42px)", fontWeight:400, color:"#1a1208" }}>Why this works</h3>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))", gap:24 }}>
                  {p.knowledge.map((k, i) => (
                    <div key={i} style={{ padding:"28px 26px", background:"#faf7f0", borderRadius:14, borderLeft:`3px solid ${p.accent}` }}>
                      <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:22, fontWeight:500, color:"#1a1208", marginBottom:12, lineHeight:1.3 }}>{k.title}</h4>
                      <p style={{ color:"#4a3f2f", fontSize:14, lineHeight:1.8, fontWeight:300 }}>{k.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background:"#0d1f0d", padding:"clamp(32px,6vw,60px) 24px" }}>
              <div style={{ maxWidth:760, margin:"0 auto" }}>
                <div style={{ background:"rgba(255,255,255,.04)", borderRadius:18, padding:"32px 28px", border:"1px solid rgba(200,212,192,.1)", textAlign:"center", marginBottom:24 }}>
                  {!joined ? (
                    <>
                      <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, color:"#f7f2e8", marginBottom:8, fontWeight:400 }}>Stay close to the mountain</h4>
                      <p style={{ color:"rgba(200,212,192,.55)", fontSize:14, fontWeight:300, marginBottom:20 }}>Early access, harvest updates, and tea wisdom for {p.title}s.</p>
                      <div style={{ display:"flex", gap:10, maxWidth:380, margin:"0 auto" }}>
                        <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleJoin()} placeholder="Your email address"
                          style={{ flex:1, background:"rgba(255,255,255,.07)", border:"1px solid rgba(200,212,192,.15)", color:"#f7f2e8", padding:"11px 16px", borderRadius:10, fontSize:14, outline:"none" }} />
                        <button onClick={handleJoin}
                          style={{ background:p.accent, border:"none", color:"#f7f2e8", padding:"11px 20px", borderRadius:10, fontSize:11, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", whiteSpace:"nowrap" }}
                          onMouseEnter={e => e.currentTarget.style.opacity=".8"}
                          onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                          Send my tea profile →
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize:30, marginBottom:10 }}>🍃</div>
                      <h4 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, color:p.accent, marginBottom:6 }}>You're on the list.</h4>
                      <p style={{ color:"rgba(200,212,192,.5)", fontSize:14, fontWeight:300 }}>We'll reach out when the next harvest arrives.</p>
                    </div>
                  )}
                </div>
                <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", marginTop:24 }}>
                  <button onClick={() => setChat(true)}
                    style={{ background:"rgba(255,255,255,.06)", border:"1px solid rgba(200,212,192,.18)", color:"#c8d4c0", padding:"13px 30px", borderRadius:36, fontSize:12, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", transition:"background .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.1)"}
                    onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.06)"}>
                    🍃 Ask Your Tea Guide
                  </button>
                  <button onClick={restart}
                    style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(200,212,192,.12)", color:"rgba(200,212,192,.5)", padding:"13px 30px", borderRadius:36, fontSize:12, letterSpacing:".12em", textTransform:"uppercase", cursor:"pointer", transition:"background .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background="rgba(255,255,255,.08)"}
                    onMouseLeave={e => e.currentTarget.style.background="rgba(255,255,255,.04)"}>
                    Restart Journey
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chat && persona && <ChatPanel persona={persona} onClose={() => setChat(false)} />}
      </div>
    </>
  );
}

