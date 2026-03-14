import { useState, useRef } from 'react';

// ═══════════════════════════════════════════
// 在这里填入你的 key（申请完 Supabase 后填）
// ═══════════════════════════════════════════
const SB_URL = 'https://你的PROJECT.supabase.co';
const SB_ANON = '你的anon_key';
const CLAUDE_KEY = '你的claude_api_key';
// ═══════════════════════════════════════════

const sb = {
  async insert(table, data) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SB_ANON,
          Authorization: `Bearer ${SB_ANON}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(data),
      });
      return r.ok;
    } catch {
      return false;
    }
  },
  async select(table) {
    try {
      const r = await fetch(
        `${SB_URL}/rest/v1/${table}?select=*&order=created_at.desc`,
        {
          headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}` },
        }
      );
      return r.ok ? r.json() : [];
    } catch {
      return [];
    }
  },
};

const sid = () => {
  if (!sessionStorage.getItem('eof_sid'))
    sessionStorage.setItem('eof_sid', Math.random().toString(36).slice(2));
  return sessionStorage.getItem('eof_sid');
};

const QUIZ = [
  {
    id: 'intent',
    question: 'What draws you to tea?',
    sub: "There's no wrong answer — just your truth.",
    opts: [
      {
        v: 'calm',
        label: 'A moment of calm',
        icon: '🌿',
        s: { ritual: 2, wellness: 1 },
      },
      {
        v: 'focus',
        label: 'Clarity & focus',
        icon: '🧘',
        s: { ritual: 1, connoisseur: 1 },
      },
      {
        v: 'health',
        label: 'Nourishing my body',
        icon: '✨',
        s: { wellness: 3 },
      },
      { v: 'explore', label: 'Pure curiosity', icon: '🗺️', s: { explorer: 3 } },
      {
        v: 'flavor',
        label: 'The taste itself',
        icon: '⛰️',
        s: { connoisseur: 3 },
      },
    ],
  },
  {
    id: 'flavor',
    question: 'Your instinctive flavor?',
    sub: 'Close your eyes. Which calls to you?',
    opts: [
      {
        v: 'floral',
        label: 'Light & floral',
        icon: '🌸',
        s: { explorer: 2, wellness: 1 },
      },
      {
        v: 'earthy',
        label: 'Deep & earthy',
        icon: '🪨',
        s: { connoisseur: 2, ritual: 1 },
      },
      {
        v: 'fresh',
        label: 'Crisp & green',
        icon: '🍃',
        s: { wellness: 2, explorer: 1 },
      },
      {
        v: 'roasted',
        label: 'Warm & roasted',
        icon: '🔥',
        s: { ritual: 2, connoisseur: 1 },
      },
    ],
  },
  {
    id: 'moment',
    question: 'Your tea moment looks like…',
    sub: 'When does tea find you?',
    opts: [
      { v: 'morning', label: 'Morning ritual', icon: '🌅', s: { ritual: 2 } },
      {
        v: 'afternoon',
        label: 'Afternoon escape',
        icon: '☁️',
        s: { explorer: 1, wellness: 1 },
      },
      {
        v: 'evening',
        label: 'Evening stillness',
        icon: '🌙',
        s: { wellness: 2, ritual: 1 },
      },
      {
        v: 'anytime',
        label: 'Whenever I need it',
        icon: '∞',
        s: { explorer: 2, connoisseur: 1 },
      },
    ],
  },
];

const PERSONAS = {
  explorer: {
    key: 'explorer',
    title: 'The Curious Explorer',
    tagline: 'Every cup is a new discovery',
    desc: "You approach tea with the spirit of an adventurer — open, curious, and ready to be surprised. Taiwan's highlands hold stories you haven't heard yet.",
    accent: '#6b8f5e',
    grad: 'linear-gradient(135deg,#1a2e1a,#2d4a2d)',
    knowledge: [
      {
        title: 'Why Taiwan Tea?',
        body: "Nestled in subtropical mountains at 1,000–2,600m, Taiwan's gardens experience dramatic day-night temperature swings that slow leaf growth — concentrating flavor into something remarkable.",
      },
      {
        title: 'The Terroir of Alishan',
        body: "Much like wine's terroir, Alishan's morning mists and mineral-rich soils leave a fingerprint on every leaf. What you taste isn't just a plant — it's a place.",
      },
    ],
    products: [
      {
        name: 'Ali Shan High Mountain Oolong',
        price: '£28',
        desc: "Your gateway to Taiwan's peaks",
        tag: 'Best Start',
      },
      {
        name: 'Oriental Beauty',
        price: '£35',
        desc: 'Tea kissed by leafhoppers — utterly unique',
        tag: 'Most Unique',
      },
    ],
  },
  ritual: {
    key: 'ritual',
    title: 'The Ritual Keeper',
    tagline: 'Tea as ceremony, every day',
    desc: "You understand that a cup of tea is never just a cup of tea. It's the pause. The breath. The sacred five minutes that belong entirely to you.",
    accent: '#b8732a',
    grad: 'linear-gradient(135deg,#1a1208,#2d1e0f)',
    knowledge: [
      {
        title: 'Gongfu Cha: Doing Tea Slowly',
        body: 'Multiple small infusions from the same leaves — a conversation with the leaf. Watch it unfurl and evolve over 6–8 steepings.',
      },
      {
        title: 'Why Oolong for Ritual?',
        body: 'Between green and black, oolong rewards patience. Each steep reveals new dimensions — floral, then fruity, then deep and roasted.',
      },
    ],
    products: [
      {
        name: 'Dong Ding Oolong',
        price: '£24',
        desc: 'Traditional roasted — built for daily ritual',
        tag: 'Daily Ritual',
      },
      {
        name: 'Li Shan Reserve',
        price: '£42',
        desc: 'Reserve grade, for your most sacred mornings',
        tag: 'Premium',
      },
    ],
  },
  wellness: {
    key: 'wellness',
    title: 'The Wellness Seeker',
    tagline: 'Tea as medicine, joy as practice',
    desc: "You see tea as nature's gift — healing, balancing, and nourishing. Taiwan's small farmers cultivate with this exact intention: clean land, clean leaves, clean energy.",
    accent: '#4a7c4a',
    grad: 'linear-gradient(135deg,#0d1f0d,#1a3020)',
    knowledge: [
      {
        title: "GABA Tea: Taiwan's Secret",
        body: 'Developed in Taiwan, GABA oolong is processed in nitrogen-rich environments, boosting gamma-aminobutyric acid — known to promote calm and reduce anxiety.',
      },
      {
        title: 'Clean Farming Matters',
        body: 'Our partner farms in Nantou County use minimal intervention and natural compost. The result: healthier tea and a cleaner nervous system response.',
      },
    ],
    products: [
      {
        name: 'GABA Oolong',
        price: '£30',
        desc: "Taiwan's natural stress response",
        tag: 'Wellness Hero',
      },
      {
        name: 'Green Emerald',
        price: '£22',
        desc: 'High antioxidant, light and pure',
        tag: 'Most Clean',
      },
    ],
  },
  connoisseur: {
    key: 'connoisseur',
    title: 'The Highland Connoisseur',
    tagline: 'Terroir. Craft. The infinite cup.',
    desc: "Flavor isn't just taste to you — it's information. You read a cup the way others read a room. Taiwan's best teas were grown for people exactly like you.",
    accent: '#9c6b3c',
    grad: 'linear-gradient(135deg,#1a1208,#251b10)',
    knowledge: [
      {
        title: 'Elevation & Complexity',
        body: 'Every 100m gain in altitude adds ~10 days to the growing season. This slow development creates phenolic complexity — the hallmark of high mountain oolongs.',
      },
      {
        title: 'Single-Origin Only',
        body: 'All Echo of Formosa teas are single-garden, single-season. We reject blending because it erases the story. One farmer, one hillside, one harvest.',
      },
    ],
    products: [
      {
        name: 'Da Yu Ling Reserve',
        price: '£55',
        desc: "Taiwan's highest elevation — the apex",
        tag: "Collector's Pick",
      },
      {
        name: 'Honey Oolong Vintage',
        price: '£45',
        desc: '2024 award-winning harvest',
        tag: 'Award Winner',
      },
    ],
  },
};

const C = {
  forest: '#0a1a0a',
  deep: '#0d1f0d',
  cream: '#f7f2e8',
  warm: '#faf7f1',
  amber: '#b8732a',
  amberL: '#d4924a',
  mist: '#c8d4c0',
  textD: '#1a1208',
  textM: '#4a3f2f',
};

function Dot({ d }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: '#8a7a6a',
        animation: `dot 1.2s ease-in-out ${d}s infinite`,
      }}
    />
  );
}

function ChatPanel({ persona, onClose }) {
  const [msgs, setMsgs] = useState([
    {
      role: 'assistant',
      text: `Welcome, ${persona.title}. I'm your personal tea guide from Taiwan's highlands. Ask me anything about brewing, flavors, or which tea to try next.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    setInput('');
    setMsgs((p) => [...p, { role: 'user', text: txt }]);
    setLoading(true);
    sb.insert('chat_logs', {
      session_id: sid(),
      persona: persona.key,
      role: 'user',
      message: txt,
    });
    try {
      const history = msgs.map((m) => ({ role: m.role, content: m.text }));
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: `You are a warm and knowledgeable tea guide for Echo of Formosa, a premium Taiwan artisan tea brand. User persona: ${persona.title} — ${persona.desc} Reply in 2-3 sentences with sensory language. Mention specific teas: Alishan, Da Yu Ling, Li Shan, Dong Ding, GABA oolong, Oriental Beauty.`,
          messages: [...history, { role: 'user', content: txt }],
        }),
      });
      const d = await r.json();
      const reply =
        d.content?.find((b) => b.type === 'text')?.text ||
        'The mountain connection was lost. Please try again.';
      setMsgs((p) => [...p, { role: 'assistant', text: reply }]);
      sb.insert('chat_logs', {
        session_id: sid(),
        persona: persona.key,
        role: 'assistant',
        message: reply,
      });
    } catch {
      setMsgs((p) => [
        ...p,
        { role: 'assistant', text: 'Connection lost. Please try again.' },
      ]);
    }
    setLoading(false);
    setTimeout(
      () => endRef.current?.scrollIntoView({ behavior: 'smooth' }),
      100
    );
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.78)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 24,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          height: '70vh',
          background: C.warm,
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 40px 80px rgba(0,0,0,.5)',
        }}
      >
        <div
          style={{
            background: C.forest,
            padding: '16px 22px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'Georgia,serif',
                fontSize: 17,
                color: C.cream,
              }}
            >
              Tea Guide
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.mist,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                opacity: 0.55,
              }}
            >
              Echo of Formosa · AI
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: C.mist,
              fontSize: 22,
              cursor: 'pointer',
              opacity: 0.65,
            }}
          >
            ×
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '82%',
                  padding: '10px 14px',
                  borderRadius:
                    m.role === 'user'
                      ? '16px 16px 4px 16px'
                      : '16px 16px 16px 4px',
                  background: m.role === 'user' ? C.forest : '#f0ece4',
                  color: m.role === 'user' ? C.cream : C.textD,
                  fontSize: 14,
                  lineHeight: 1.65,
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div
              style={{
                display: 'flex',
                gap: 5,
                padding: '10px 14px',
                background: '#f0ece4',
                borderRadius: '16px 16px 16px 4px',
                width: 'fit-content',
              }}
            >
              <Dot d={0} />
              <Dot d={0.2} />
              <Dot d={0.4} />
            </div>
          )}
          <div ref={endRef} />
        </div>
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #e5dfd5',
            display: 'flex',
            gap: 10,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask about Taiwan teas…"
            style={{
              flex: 1,
              border: '1px solid #d5cfc5',
              borderRadius: 22,
              padding: '10px 16px',
              fontSize: 14,
              outline: 'none',
              background: '#faf8f4',
              color: C.textD,
            }}
          />
          <button
            onClick={send}
            disabled={loading}
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: C.forest,
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: C.cream,
              opacity: loading ? 0.5 : 1,
            }}
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [stage, setStage] = useState('hero');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [persona, setPersona] = useState(null);
  const [picked, setPicked] = useState(null);
  const [chat, setChat] = useState(false);
  const [qkey, setQkey] = useState(0);
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const saved = useRef(false);

  const computePersona = (ans) => {
    const sc = { explorer: 0, ritual: 0, wellness: 0, connoisseur: 0 };
    QUIZ.forEach((q) => {
      const o = q.opts.find((o) => o.v === ans[q.id]);
      if (o) Object.entries(o.s).forEach(([k, v]) => (sc[k] += v));
    });
    return Object.entries(sc).sort((a, b) => b[1] - a[1])[0][0];
  };

  const choose = (qId, v) => {
    setPicked(v);
    setTimeout(() => {
      const next = { ...answers, [qId]: v };
      setAnswers(next);
      setPicked(null);
      if (step < QUIZ.length - 1) {
        setStep(step + 1);
        setQkey((k) => k + 1);
      } else {
        const pk = computePersona(next);
        setPersona(PERSONAS[pk]);
        setStage('result');
        if (!saved.current) {
          sb.insert('visitors', {
            session_id: sid(),
            persona: pk,
            answers: next,
          });
          saved.current = true;
        }
      }
    }, 350);
  };

  const handleProduct = (pr) => {
    sb.insert('product_clicks', {
      session_id: sid(),
      persona: persona?.key,
      product_name: pr.name,
      price: pr.price,
    });
  };

  const handleJoin = async () => {
    if (!email || joined) return;
    await sb.insert('waitlist', {
      session_id: sid(),
      email,
      persona: persona?.key,
    });
    setJoined(true);
  };

  const restart = () => {
    setStage('hero');
    setStep(0);
    setAnswers({});
    setPersona(null);
    setPicked(null);
    setQkey(0);
    setEmail('');
    setJoined(false);
    saved.current = false;
  };

  const q = QUIZ[step];
  const p = persona;
  const pct = ((step + 1) / QUIZ.length) * 100;

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

      <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
        {/* ── HERO ── */}
        {stage === 'hero' && (
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 24px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'radial-gradient(ellipse at 30% 20%, rgba(107,143,94,.13) 0%, transparent 55%), radial-gradient(ellipse at 70% 80%, rgba(184,115,42,.09) 0%, transparent 48%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                textAlign: 'center',
                maxWidth: 560,
                position: 'relative',
                zIndex: 1,
              }}
            >
              <div className="fu">
                <div
                  style={{
                    width: 58,
                    height: 58,
                    margin: '0 auto 14px',
                    borderRadius: '50%',
                    border: '1px solid rgba(184,115,42,.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    animation: 'float 4s ease-in-out infinite',
                  }}
                >
                  🍃
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.3em',
                    textTransform: 'uppercase',
                    color: '#b8732a',
                    fontWeight: 500,
                  }}
                >
                  Echo of Formosa
                </div>
              </div>
              <h1
                className="fu"
                style={{
                  animationDelay: '.12s',
                  fontFamily: "'Cormorant Garamond',serif",
                  fontSize: 'clamp(48px,9vw,80px)',
                  fontWeight: 300,
                  lineHeight: 1.08,
                  marginBottom: 24,
                  marginTop: 24,
                }}
              >
                Where does
                <br />
                <em style={{ fontStyle: 'italic', color: '#c8d4c0' }}>
                  your journey
                </em>
                <br />
                begin?
              </h1>
              <p
                className="fu"
                style={{
                  animationDelay: '.24s',
                  fontSize: 15,
                  color: '#c8d4c0',
                  lineHeight: 1.85,
                  fontWeight: 300,
                  maxWidth: 380,
                  margin: '0 auto 48px',
                  opacity: 0.8,
                }}
              >
                Taiwan's highland teas carry stories of mist, stone, and craft.
                <br />
                In three questions, we find yours.
              </p>
              <div className="fu" style={{ animationDelay: '.36s' }}>
                <button
                  onClick={() => setStage('quiz')}
                  style={{
                    background: 'none',
                    border: '1px solid #b8732a',
                    color: '#b8732a',
                    padding: '14px 48px',
                    fontSize: 12,
                    letterSpacing: '.18em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    borderRadius: 40,
                    transition: 'all .25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#b8732a';
                    e.currentTarget.style.color = '#f7f2e8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = '#b8732a';
                  }}
                >
                  Begin the Journey
                </button>
              </div>
              <p
                className="fu"
                style={{
                  animationDelay: '.48s',
                  marginTop: 20,
                  fontSize: 11,
                  color: 'rgba(200,212,192,.35)',
                  letterSpacing: '.06em',
                }}
              >
                3 questions · 60 seconds
              </p>
            </div>
          </div>
        )}

        {/* ── QUIZ ── */}
        {stage === 'quiz' && (
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px 40px',
            }}
          >
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'rgba(200,212,192,.08)',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: '#b8732a',
                  width: `${pct}%`,
                  transition: 'width .5s ease',
                  borderRadius: '0 2px 2px 0',
                }}
              />
            </div>
            <div
              key={qkey}
              className="fu"
              style={{ maxWidth: 520, width: '100%' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 40 }}>
                <div
                  style={{
                    fontSize: 11,
                    letterSpacing: '.2em',
                    textTransform: 'uppercase',
                    color: '#b8732a',
                    marginBottom: 12,
                  }}
                >
                  {step + 1} of {QUIZ.length}
                </div>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 'clamp(32px,5vw,50px)',
                    fontWeight: 300,
                    marginBottom: 8,
                    lineHeight: 1.15,
                  }}
                >
                  {q.question}
                </h2>
                <p
                  style={{
                    color: '#c8d4c0',
                    fontSize: 14,
                    fontWeight: 300,
                    opacity: 0.6,
                  }}
                >
                  {q.sub}
                </p>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {q.opts.map((opt, i) => (
                  <button
                    key={opt.v}
                    className={`opt${picked === opt.v ? ' sel' : ''}`}
                    onClick={() => choose(q.id, opt.v)}
                    style={{
                      background: 'rgba(255,255,255,.04)',
                      border: '1px solid rgba(200,212,192,.12)',
                      borderRadius: 12,
                      padding: '16px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      color: '#f7f2e8',
                      textAlign: 'left',
                      animation: `fadeUp .5s ease ${i * 0.06}s both`,
                      fontSize: 15,
                    }}
                  >
                    <span style={{ fontSize: 20, flexShrink: 0 }}>
                      {opt.icon}
                    </span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {stage === 'result' && p && (
          <div className="fi">
            {/* Persona banner */}
            <div
              style={{
                background: p.grad,
                padding: 'clamp(60px,10vw,100px) 24px clamp(48px,8vw,80px)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'radial-gradient(ellipse at center, rgba(255,255,255,.04) 0%, transparent 65%)',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  maxWidth: 600,
                  margin: '0 auto',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: '.28em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,212,192,.5)',
                    marginBottom: 16,
                  }}
                >
                  Your Tea Identity
                </div>
                <h2
                  style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: 'clamp(38px,7vw,64px)',
                    fontWeight: 300,
                    lineHeight: 1.08,
                    marginBottom: 10,
                  }}
                >
                  {p.title}
                </h2>
                <div
                  style={{
                    fontSize: 14,
                    color: p.accent,
                    fontWeight: 500,
                    marginBottom: 24,
                    letterSpacing: '.06em',
                  }}
                >
                  {p.tagline}
                </div>
                <p
                  style={{
                    fontSize: 16,
                    color: '#c8d4c0',
                    fontWeight: 300,
                    lineHeight: 1.85,
                    maxWidth: 460,
                    margin: '0 auto',
                    opacity: 0.85,
                  }}
                >
                  {p.desc}
                </p>
              </div>
            </div>

            {/* Knowledge */}
            <div
              style={{
                background: '#faf7f1',
                padding: 'clamp(48px,8vw,80px) 24px',
              }}
            >
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '.28em',
                      textTransform: 'uppercase',
                      color: '#b8732a',
                      marginBottom: 10,
                    }}
                  >
                    Curated for You
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 'clamp(28px,4vw,42px)',
                      fontWeight: 400,
                      color: '#1a1208',
                    }}
                  >
                    Your Tea Knowledge
                  </h3>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(270px,1fr))',
                    gap: 24,
                  }}
                >
                  {p.knowledge.map((k, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '28px 26px',
                        background: '#faf7f0',
                        borderRadius: 14,
                        borderLeft: `3px solid ${p.accent}`,
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: 22,
                          fontWeight: 500,
                          color: '#1a1208',
                          marginBottom: 12,
                          lineHeight: 1.3,
                        }}
                      >
                        {k.title}
                      </h4>
                      <p
                        style={{
                          color: '#4a3f2f',
                          fontSize: 14,
                          lineHeight: 1.8,
                          fontWeight: 300,
                        }}
                      >
                        {k.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Products */}
            <div
              style={{
                background: '#0d1f0d',
                padding: 'clamp(48px,8vw,80px) 24px',
              }}
            >
              <div style={{ maxWidth: 760, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: '.28em',
                      textTransform: 'uppercase',
                      color: '#b8732a',
                      marginBottom: 10,
                    }}
                  >
                    Selected for Your Journey
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond',serif",
                      fontSize: 'clamp(28px,4vw,42px)',
                      fontWeight: 300,
                      color: '#f7f2e8',
                    }}
                  >
                    Your Teas
                  </h3>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))',
                    gap: 20,
                    marginBottom: 40,
                  }}
                >
                  {p.products.map((pr, i) => (
                    <div
                      key={i}
                      className="pcard"
                      onClick={() => handleProduct(pr)}
                      style={{
                        background: 'rgba(255,255,255,.05)',
                        borderRadius: 14,
                        padding: 26,
                        border: '1px solid rgba(200,212,192,.1)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 16,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            color: p.accent,
                            background: `${p.accent}1a`,
                            padding: '4px 10px',
                            borderRadius: 18,
                          }}
                        >
                          {pr.tag}
                        </span>
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond',serif",
                            fontSize: 20,
                            color: '#f7f2e8',
                          }}
                        >
                          {pr.price}
                        </span>
                      </div>
                      <h4
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: 22,
                          fontWeight: 400,
                          color: '#f7f2e8',
                          marginBottom: 8,
                          lineHeight: 1.25,
                        }}
                      >
                        {pr.name}
                      </h4>
                      <p
                        style={{
                          color: '#c8d4c0',
                          fontSize: 13,
                          fontWeight: 300,
                          marginBottom: 20,
                          opacity: 0.6,
                        }}
                      >
                        {pr.desc}
                      </p>
                      <button
                        style={{
                          width: '100%',
                          background: 'none',
                          border: `1px solid ${p.accent}55`,
                          color: p.accent,
                          padding: '10px',
                          borderRadius: 8,
                          fontSize: 11,
                          letterSpacing: '.12em',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          transition: 'all .2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = p.accent;
                          e.currentTarget.style.color = '#f7f2e8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none';
                          e.currentTarget.style.color = p.accent;
                        }}
                      >
                        Explore This Tea
                      </button>
                    </div>
                  ))}
                </div>

                {/* Email Waitlist */}
                <div
                  style={{
                    background: 'rgba(255,255,255,.04)',
                    borderRadius: 18,
                    padding: '32px 28px',
                    border: '1px solid rgba(200,212,192,.1)',
                    textAlign: 'center',
                    marginBottom: 24,
                  }}
                >
                  {!joined ? (
                    <>
                      <h4
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: 26,
                          color: '#f7f2e8',
                          marginBottom: 8,
                          fontWeight: 400,
                        }}
                      >
                        Stay close to the mountain
                      </h4>
                      <p
                        style={{
                          color: 'rgba(200,212,192,.55)',
                          fontSize: 14,
                          fontWeight: 300,
                          marginBottom: 20,
                        }}
                      >
                        Early access, harvest updates, and tea wisdom for{' '}
                        {p.title}s.
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          maxWidth: 380,
                          margin: '0 auto',
                        }}
                      >
                        <input
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                          placeholder="Your email address"
                          style={{
                            flex: 1,
                            background: 'rgba(255,255,255,.07)',
                            border: '1px solid rgba(200,212,192,.15)',
                            color: '#f7f2e8',
                            padding: '11px 16px',
                            borderRadius: 10,
                            fontSize: 14,
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleJoin}
                          style={{
                            background: p.accent,
                            border: 'none',
                            color: '#f7f2e8',
                            padding: '11px 20px',
                            borderRadius: 10,
                            fontSize: 11,
                            letterSpacing: '.12em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.opacity = '.8')
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.opacity = '1')
                          }
                        >
                          Join
                        </button>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div style={{ fontSize: 30, marginBottom: 10 }}>🍃</div>
                      <h4
                        style={{
                          fontFamily: "'Cormorant Garamond',serif",
                          fontSize: 24,
                          color: p.accent,
                          marginBottom: 6,
                        }}
                      >
                        You're on the list.
                      </h4>
                      <p
                        style={{
                          color: 'rgba(200,212,192,.5)',
                          fontSize: 14,
                          fontWeight: 300,
                        }}
                      >
                        We'll reach out when the next harvest arrives.
                      </p>
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  <button
                    onClick={() => setChat(true)}
                    style={{
                      background: '#b8732a',
                      border: 'none',
                      color: '#f7f2e8',
                      padding: '13px 30px',
                      borderRadius: 36,
                      fontSize: 12,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background .2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = '#d4924a')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = '#b8732a')
                    }
                  >
                    🍃 Ask Your Tea Guide
                  </button>
                  <button
                    onClick={restart}
                    style={{
                      background: 'rgba(255,255,255,.06)',
                      border: '1px solid rgba(200,212,192,.18)',
                      color: '#c8d4c0',
                      padding: '13px 30px',
                      borderRadius: 36,
                      fontSize: 12,
                      letterSpacing: '.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'background .2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,.1)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,.06)')
                    }
                  >
                    Restart Journey
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {chat && persona && (
          <ChatPanel persona={persona} onClose={() => setChat(false)} />
        )}
      </div>
    </>
  );
}
