'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// ─── Types ───────────────────────────────────────────────────────────────────
interface OilRow { name: string; conc: string; body: string; emotion: string }
interface TagItem { label: string; active: boolean }
interface ObsData { standoutOil: string; imagery: string; clientWord: string }
interface RitualStep { badge: string; label: string; text: string }

// ─── Constants ────────────────────────────────────────────────────────────────
const BEFORE_OPTIONS = [
  '飄，很難定下來', '悶，胸背有壓縮感', '空，提不起勁沒有動力',
  '燥，思緒躁動煩亂', '緊，肩頸緊張', '焦慮，胃部悶脹', '還好，今天感覺輕鬆',
]
const AFTER_OPTIONS = [
  '有一點落地', '呼吸變深了', '某個地方鬆開了',
  '想起了什麼', '思緒變得明朗', '說不清楚，只是不一樣',
]
const DEFAULT_RITUALS: RitualStep[] = [
  { badge: '早', label: 'Morning · 起床後', text: '取一滴於掌心，搓熱，深吸三口。告訴自己：今天我在。' },
  { badge: '中', label: 'Noon · 午後', text: '當你感到渙散時，讓氣味把你拉回當下。' },
  { badge: '晚', label: 'Evening · 入睡前', text: '滴在腳底湧泉穴，輕輕按壓，讓一天真正落地。' },
  { badge: '隨', label: 'Anytime · 隨時', text: '任何需要支撐的時刻，讓它陪你。' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseOils(text: string): OilRow[] {
  if (!text || text === '—') return []
  return text.split('\n').filter(Boolean).map(line => {
    const parts = line.split(' | ')
    const namePart = parts[0] || ''
    const body = parts.find(s => s.startsWith('身體：'))?.slice(3) || ''
    const emotion = parts.find(s => s.startsWith('情緒：'))?.slice(3) || ''
    const concMatch = namePart.match(/\s+(\d+\.?\d*)%$/)
    const name = concMatch ? namePart.slice(0, concMatch.index).trim() : namePart.trim()
    const conc = concMatch ? concMatch[1] : ''
    return { name, conc, body, emotion }
  })
}
function parseObsText(text: string): ObsData {
  if (!text || text === '—') return { standoutOil: '', imagery: '', clientWord: '' }
  const lines = text.split('\n')
  return {
    standoutOil: lines.find(l => l.startsWith('最有感覺的精油：'))?.slice(8) || '',
    imagery: lines.find(l => l.startsWith('畫面／記憶：'))?.slice(6) || '',
    clientWord: lines.find(l => l.startsWith('一句話：'))?.slice(4) || '',
  }
}
function buildTags(options: string[], notionStr: string): TagItem[] {
  const active = new Set((notionStr || '').split('、').map(s => s.trim()).filter(Boolean))
  return options.map(label => ({ label, active: active.has(label) }))
}

// ─── AutoTextarea ─────────────────────────────────────────────────────────────
function AutoTextarea({
  value, onChange, style, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  placeholder?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      style={{
        resize: 'none', overflow: 'hidden', border: 'none', outline: 'none',
        background: 'transparent', width: '100%', display: 'block',
        fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit',
        lineHeight: 'inherit', fontWeight: 'inherit', letterSpacing: 'inherit',
        padding: 0, margin: 0, ...style,
      }}
    />
  )
}

// ─── DotPulse ─────────────────────────────────────────────────────────────────
function DotPulse() {
  return (
    <>
      <div style={{ display: 'flex', gap: '4px' }}>
        {[0, 1, 2].map(i => (
          <span key={i} className={`dot-${i}`} style={{
            width: '4px', height: '4px', borderRadius: '50%',
            background: '#bfb792', display: 'inline-block', opacity: 0.5,
          }} />
        ))}
      </div>
      <style jsx global>{`
        @keyframes dpulse {
          0%,100%{opacity:.3;transform:scale(.8)}
          50%{opacity:1;transform:scale(1)}
        }
        .dot-0{animation:dpulse 1.2s ease-in-out 0s infinite}
        .dot-1{animation:dpulse 1.2s ease-in-out .2s infinite}
        .dot-2{animation:dpulse 1.2s ease-in-out .4s infinite}
      `}</style>
    </>
  )
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const V = {
  darkUmber: '#473618',
  darkMoss: '#484e2e',
  sandGold: '#bfb792',
  warmKhaki: '#84805b',
  mistSage: '#a9b3a8',
  sageHaze: '#9fa38a',
  creamFog: '#ede8e2',
  pureMist: '#f5f0eb',
  fontDisplay: '"Playfair Display", Georgia, serif',
  fontUi: '"DM Sans", sans-serif',
  fontZh: '"SweiSpring", "Noto Serif TC", serif',
} as const

const eyebrow: React.CSSProperties = {
  fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.35em',
  textTransform: 'uppercase', color: V.sandGold, marginBottom: '8px',
}
const sectionTitle: React.CSSProperties = {
  fontFamily: V.fontDisplay, fontStyle: 'italic', fontWeight: 400,
  fontSize: '18px', color: V.darkUmber, marginBottom: '22px', lineHeight: 1.4,
}
const sectionPad: React.CSSProperties = { padding: '32px 40px' }
const divider: React.CSSProperties = { height: '0.5px', background: 'rgba(191,183,146,0.35)' }
const bodyGrad = 'radial-gradient(ellipse 70% 55% at 20% 30%,rgba(159,163,138,.40) 0%,transparent 65%),radial-gradient(ellipse 55% 65% at 78% 68%,rgba(148,76,66,.22) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 55% 15%,rgba(191,183,146,.30) 0%,transparent 55%)'

// ─── Types (session list) ─────────────────────────────────────────────────────
interface SessionItem { name: string; date: string; label: string }

// ─── Main ─────────────────────────────────────────────────────────────────────
function CuratorContent() {
  const searchParams = useSearchParams()
  const urlName = searchParams.get('name') || ''
  const urlDate = searchParams.get('date') || ''

  // Session list (picker)
  const [sessions, setSessions] = useState<SessionItem[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState(
    urlName && urlDate ? `${urlName}__${urlDate}` : ''
  )

  // Session data
  const [sessionLoading, setSessionLoading] = useState(false)
  const [sessionLoaded, setSessionLoaded] = useState(false)
  const [error, setError] = useState('')
  const [clientName, setClientName] = useState(urlName)
  const [clientDate, setClientDate] = useState(urlDate)
  const [oils, setOils] = useState<OilRow[]>([])
  const [beforeTags, setBeforeTags] = useState<TagItem[]>(buildTags(BEFORE_OPTIONS, ''))
  const [afterTags, setAfterTags] = useState<TagItem[]>(buildTags(AFTER_OPTIONS, ''))
  const [obs, setObs] = useState<ObsData>({ standoutOil: '', imagery: '', clientWord: '' })
  const [rituals, setRituals] = useState<RitualStep[]>(DEFAULT_RITUALS)
  const [curatorObs, setCuratorObs] = useState('')
  const [curatorNote, setCuratorNote] = useState('')
  const [curatorQuote, setCuratorQuote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Fetch session list on mount
  useEffect(() => {
    fetch('/api/notion-sessions')
      .then(r => r.json())
      .then(d => {
        if (d.error) {
          console.error('[notion-sessions]', d.error, d.detail)
          setError(`讀取紀錄清單失敗：${d.error}${d.status ? ` (${d.status})` : ''}`)
        } else {
          setSessions(d.sessions ?? [])
        }
      })
      .catch(e => {
        console.error('[notion-sessions] fetch error:', e)
        setError('無法連線，請確認網路後重整頁面')
      })
      .finally(() => setSessionsLoading(false))
  }, [])

  // Load session data when selectedKey changes
  async function loadSession(name: string, date: string) {
    if (!name || !date) return
    setSessionLoading(true)
    setError('')
    setGenerated(false)
    setCuratorObs('')
    setCuratorNote('')
    setCuratorQuote('')
    setRituals(DEFAULT_RITUALS)
    try {
      const r = await fetch(`/api/notion-session?name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}`)
      if (!r.ok) {
        const e = await r.json().catch(() => ({}))
        const msg = typeof e.error === 'string' ? e.error : JSON.stringify(e)
        throw new Error(msg)
      }
      const session = await r.json()
      setClientName(session.name)
      setClientDate(session.date)
      setOils(parseOils(session.oils))
      setBeforeTags(buildTags(BEFORE_OPTIONS, session.before))
      setAfterTags(buildTags(AFTER_OPTIONS, session.after))
      setObs(parseObsText(session.observation))
      setSessionLoaded(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '載入失敗')
    } finally {
      setSessionLoading(false)
    }
  }

  // Auto-load if URL params present
  useEffect(() => {
    if (urlName && urlDate) loadSession(urlName, urlDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlName, urlDate])

  function handlePickerChange(key: string) {
    setSelectedKey(key)
    if (!key) return
    const [name, date] = key.split('__')
    loadSession(name, date)
  }

  const toggleTag = (list: TagItem[], setList: React.Dispatch<React.SetStateAction<TagItem[]>>, i: number) =>
    setList(list.map((t, idx) => idx === i ? { ...t, active: !t.active } : t))

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const obsText = [
        obs.standoutOil ? `最有感覺的精油：${obs.standoutOil}` : '',
        obs.imagery ? `畫面／記憶：${obs.imagery}` : '',
        obs.clientWord ? `一句話：${obs.clientWord}` : '',
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/generate-curator-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          before: beforeTags.filter(t => t.active).map(t => t.label).join('、'),
          after: afterTags.filter(t => t.active).map(t => t.label).join('、'),
          oils: oils.map(o => `${o.name}${o.conc ? ` ${o.conc}%` : ''}${o.body ? ` | 身體：${o.body}` : ''}${o.emotion ? ` | 情緒：${o.emotion}` : ''}`).join('\n'),
          observation: obsText,
          curatorObs,
        }),
      })

      const note = await res.json()

      if (!res.ok || note.error) {
        const msg = typeof note.error === 'string' ? note.error : JSON.stringify(note)
        throw new Error(`生成失敗：${msg}`)
      }
      if (!note.note && !note.quote) {
        throw new Error('AI 回傳內容為空，請再試一次')
      }

      setCuratorNote(note.note || '')
      setCuratorQuote(note.quote || '')
      setGenerated(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '生成策展筆記時發生錯誤，請再試一次')
    } finally {
      setGenerating(false)
    }
  }

  if (sessionLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: V.fontUi, fontSize: '11px', letterSpacing: '0.2em', color: V.warmKhaki, background: V.creamFog }}>
      正在讀取資料…
    </div>
  )

  const tagStyle = (active: boolean): React.CSSProperties => ({
    fontFamily: V.fontZh, fontSize: '11px', letterSpacing: '0.05em',
    color: active ? V.darkUmber : V.darkMoss,
    background: active ? 'rgba(159,163,138,0.25)' : 'rgba(159,163,138,0.14)',
    border: `0.5px solid ${active ? V.sageHaze : 'rgba(159,163,138,0.35)'}`,
    padding: '4px 10px', borderRadius: '2px', cursor: 'pointer', userSelect: 'none',
  })

  return (
    <div style={{ background: V.creamFog, backgroundImage: bodyGrad, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', fontFamily: V.fontZh }}>

      {/* ── Toolbar ── */}
      <div className="no-print" style={{ width: '794px', maxWidth: '100%', marginBottom: '16px', padding: '0 2px' }}>
        {/* Top row: label + actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontFamily: V.fontUi, fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.warmKhaki }}>
            T1 · 香遇報告 · 策展師工作台
          </span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button onClick={() => window.print()} disabled={!sessionLoaded} style={{ fontFamily: V.fontUi, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: V.darkUmber, background: 'transparent', border: `0.5px solid ${V.sandGold}`, padding: '7px 18px', cursor: sessionLoaded ? 'pointer' : 'not-allowed', opacity: sessionLoaded ? 1 : 0.4 }}>
              列印 / PDF
            </button>
            <button onClick={handleGenerate} disabled={generating || !sessionLoaded} style={{ fontFamily: V.fontUi, fontSize: '10px', letterSpacing: '0.25em', textTransform: 'uppercase', color: V.pureMist, background: V.darkUmber, border: 'none', padding: '7px 18px', cursor: (generating || !sessionLoaded) ? 'not-allowed' : 'pointer', opacity: (generating || !sessionLoaded) ? 0.5 : 1, transition: 'opacity .2s' }}>
              {generating ? '生成中…' : '✦ 生成策展筆記'}
            </button>
          </div>
        </div>

        {/* Session picker row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: V.mistSage, whiteSpace: 'nowrap' }}>
            選擇諮詢
          </span>
          <select
            value={selectedKey}
            onChange={e => handlePickerChange(e.target.value)}
            style={{ flex: 1, fontFamily: V.fontZh, fontSize: '12px', color: V.darkUmber, background: 'rgba(255,255,255,0.7)', border: `0.5px solid rgba(191,183,146,0.6)`, padding: '7px 10px', outline: 'none', cursor: 'pointer', appearance: 'auto' }}
          >
            <option value="">
              {sessionsLoading ? '讀取中…' : sessions.length === 0 ? '（尚無紀錄）' : '請選擇一筆諮詢紀錄'}
            </option>
            {sessions.map(s => (
              <option key={`${s.name}__${s.date}`} value={`${s.name}__${s.date}`}>
                {s.date}　{s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Curator Obs Input (no-print) ── */}
      {sessionLoaded && (
        <div className="no-print" style={{ width: '794px', maxWidth: '100%', marginBottom: '12px', padding: '14px 16px', background: 'rgba(71,54,24,0.05)', border: `0.5px solid rgba(191,183,146,0.4)` }}>
          <div style={{ fontFamily: V.fontUi, fontSize: '8px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.warmKhaki, marginBottom: '6px' }}>策展師私人觀察（生成策展筆記時參考，不印出）</div>
          <AutoTextarea
            value={curatorObs}
            onChange={setCuratorObs}
            placeholder="在這裡記下你對這次諮詢的觀察、直覺、或任何想法…"
            style={{ fontFamily: V.fontZh, fontSize: '12px', color: V.darkUmber, lineHeight: '1.7' }}
          />
        </div>
      )}

      {error && (
        <div className="no-print" style={{ width: '794px', maxWidth: '100%', marginBottom: '12px', padding: '10px 16px', background: '#f8eded', border: '0.5px solid #c8a0a0', fontFamily: V.fontUi, fontSize: '11px', color: '#5a2d2d' }}>
          {error} — 請確認 Notion 中有該筆紀錄
        </div>
      )}

      {/* ── Empty state ── */}
      {!sessionLoaded && !sessionLoading && (
        <div className="no-print" style={{ width: '794px', maxWidth: '100%', padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,0.4)', border: `0.5px solid rgba(191,183,146,0.4)` }}>
          <div style={{ fontFamily: V.fontDisplay, fontStyle: 'italic', fontSize: '20px', color: V.darkUmber, marginBottom: '10px' }}>選擇一筆諮詢紀錄開始</div>
          <div style={{ fontFamily: V.fontUi, fontSize: '10px', letterSpacing: '0.2em', color: V.mistSage }}>從上方選單選擇日期與客戶，資料將自動載入</div>
        </div>
      )}

      {/* ── Report Card ── */}
      {sessionLoaded && <div style={{ width: '794px', maxWidth: '100%', background: V.pureMist, position: 'relative', boxShadow: '0 4px 40px rgba(71,54,24,0.10)' }}>

        {/* Accent bar */}
        <div style={{ height: '3px', background: 'linear-gradient(to right,#9fa38a,#bfb792,transparent)' }} />

        {/* ── Header ── */}
        <div style={{ background: V.creamFog, backgroundImage: bodyGrad, minHeight: '180px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '32px 40px 24px', gap: '20px' }}>
          <div>
            <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase', color: V.sageHaze, marginBottom: '10px' }}>
              T1 · 香遇 · Scent Encounter Report
            </div>
            <div style={{ fontFamily: V.fontZh, fontWeight: 400, fontSize: '28px', color: V.darkUmber, lineHeight: 1.2, marginBottom: '6px' }}>
              你的嗅覺第一印記
            </div>
            <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase', color: V.sandGold }}>
              Your First Scent Portrait
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/uploads/Logo_black.png" alt="SOULSCENT" style={{ height: '48px', width: 'auto', opacity: 0.75, mixBlendMode: 'multiply', display: 'block', marginLeft: 'auto', marginBottom: '4px' }} />
            <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.mistSage }}>Scent Curation</div>
          </div>
        </div>

        {/* Client row */}
        <div style={{ borderTop: '0.5px solid rgba(191,183,146,0.4)', padding: '10px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: V.fontUi, fontSize: '11px', letterSpacing: '0.2em', color: V.sandGold, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>客戶姓名 ／</span>
            <AutoTextarea value={clientName} onChange={setClientName} style={{ fontFamily: V.fontUi, fontSize: '11px', letterSpacing: '0.2em', color: V.sandGold, width: 'auto', minWidth: '80px' }} />
          </div>
          <div style={{ fontFamily: V.fontUi, fontSize: '11px', letterSpacing: '0.2em', color: V.sandGold, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>諮詢日期 ／</span>
            <AutoTextarea value={clientDate} onChange={setClientDate} style={{ fontFamily: V.fontUi, fontSize: '11px', letterSpacing: '0.2em', color: V.sandGold, width: 'auto', minWidth: '100px' }} />
          </div>
        </div>

        <div style={divider} />

        {/* ── Part 01 ── */}
        <div style={sectionPad}>
          <div style={eyebrow}>Part 01 · 今日配方</div>
          <div style={sectionTitle}>你選擇的，都不是偶然</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: `0.5px solid ${V.mistSage}`, background: 'white' }}>
            <thead>
              <tr>
                {['精油名稱', '濃度', '身體感受', '情緒感受'].map(h => (
                  <th key={h} style={{ fontFamily: V.fontUi, fontSize: '8.5px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.warmKhaki, padding: '10px 14px', textAlign: 'left', borderBottom: `0.5px solid ${V.mistSage}`, background: 'rgba(169,179,168,0.08)', fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {oils.length > 0 ? oils.map((oil, i) => (
                <tr key={i} style={i > 0 ? { borderTop: '0.5px dashed rgba(169,179,168,0.5)' } : {}}>
                  <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                    <span style={{ fontFamily: V.fontDisplay, fontStyle: 'italic', fontSize: '13px', color: V.darkUmber }}>{oil.name}</span>
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                    {oil.conc && <span style={{ display: 'inline-block', fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.1em', color: V.sageHaze, background: 'rgba(159,163,138,0.12)', padding: '2px 7px', borderRadius: '1px' }}>{oil.conc}%</span>}
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                    <AutoTextarea value={oil.body} onChange={v => setOils(p => p.map((r, ri) => ri === i ? { ...r, body: v } : r))} style={{ fontFamily: V.fontZh, fontSize: '12px', color: V.darkUmber, lineHeight: '1.6' }} />
                  </td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                    <AutoTextarea value={oil.emotion} onChange={v => setOils(p => p.map((r, ri) => ri === i ? { ...r, emotion: v } : r))} style={{ fontFamily: V.fontZh, fontSize: '12px', color: V.darkUmber, lineHeight: '1.6' }} />
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={4} style={{ padding: '16px 14px', fontFamily: V.fontUi, fontSize: '11px', color: V.mistSage, fontStyle: 'italic' }}>尚無配方資料</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={divider} />

        {/* ── Part 02 ── */}
        <div style={sectionPad}>
          <div style={eyebrow}>Part 02 · 身體的快照</div>
          <div style={sectionTitle}>今天，你帶著什麼進來，又帶著什麼離開</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }} className="body-grid">
            {[
              { label: '進來之前 · Before', tags: beforeTags, toggle: (i: number) => toggleTag(beforeTags, setBeforeTags, i) },
              { label: '結束之後 · After', tags: afterTags, toggle: (i: number) => toggleTag(afterTags, setAfterTags, i) },
            ].map(({ label, tags, toggle }) => (
              <div key={label}>
                <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.warmKhaki, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {label}
                  <span style={{ flex: 1, height: '0.5px', background: 'rgba(191,183,146,0.3)', display: 'block' }} />
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {tags.map((t, i) => (
                    <span key={t.label} onClick={() => toggle(i)} style={tagStyle(t.active)}>{t.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* ── Part 03 ── */}
        <div style={sectionPad}>
          <div style={eyebrow}>Part 03 · 你的觀察</div>
          <div style={sectionTitle}>你對這次體驗說的話</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {([
              { q: 'Q · 最讓你有感覺的是哪支精油？', key: 'standoutOil' as const },
              { q: 'Q · 這個氣味，讓你想到了什麼？', key: 'imagery' as const },
              { q: 'Q · 如果用一句話，說說今天的感受？', key: 'clientWord' as const },
            ]).map(({ q, key }) => (
              <div key={key} style={{ borderLeft: `2.5px solid ${V.sandGold}`, padding: '12px 16px', background: 'rgba(191,183,146,0.07)' }}>
                <div style={{ fontFamily: V.fontUi, fontSize: '8.5px', letterSpacing: '0.3em', textTransform: 'uppercase', color: V.sandGold, marginBottom: '6px' }}>{q}</div>
                <AutoTextarea
                  value={obs[key]}
                  onChange={v => setObs(p => ({ ...p, [key]: v }))}
                  placeholder="（點擊編輯）"
                  style={{ fontFamily: V.fontZh, fontSize: '13px', color: V.darkUmber, lineHeight: '1.8', fontWeight: 300 }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={divider} />

        {/* ── Part 04 ── */}
        <div style={sectionPad}>
          <div style={eyebrow}>Part 04 · 帶回家的氣味儀式</div>
          <div style={sectionTitle}>讓這個氣味繼續陪著你</div>
          <div>
            {rituals.map((step, i) => (
              <div key={step.badge} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 0', borderTop: i > 0 ? '0.5px dashed rgba(169,179,168,0.45)' : 'none' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: V.sageHaze, color: 'white', fontFamily: V.fontZh, fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                  {step.badge}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.25em', textTransform: 'uppercase', color: V.warmKhaki, marginBottom: '3px' }}>{step.label}</div>
                  <AutoTextarea
                    value={step.text}
                    onChange={v => setRituals(p => p.map((r, ri) => ri === i ? { ...r, text: v } : r))}
                    style={{ fontFamily: V.fontZh, fontSize: '12.5px', color: V.darkUmber, lineHeight: '1.7', fontWeight: 300 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Part 05 Curator Note ── */}
        <div style={{ backgroundColor: '#473618', backgroundImage: 'radial-gradient(ellipse 80% 60% at 10% 20%,rgba(72,78,46,.70) 0%,transparent 70%),radial-gradient(ellipse 60% 70% at 85% 80%,rgba(72,78,46,.50) 0%,transparent 65%)', padding: '40px', position: 'relative' }}>
          <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.35em', textTransform: 'uppercase', color: V.sandGold, marginBottom: '20px', opacity: 0.9 }}>
            氣味策展筆記 · Scent Curator&apos;s Note
          </div>
          {!generated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: V.fontUi, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(191,183,146,0.6)' }}>
              <DotPulse />
              {generating ? '正在為這位客戶生成專屬策展筆記…' : '點擊上方「生成策展筆記」，為這位客戶生成專屬內容'}
            </div>
          ) : (
            <>
              <AutoTextarea
                value={curatorNote}
                onChange={setCuratorNote}
                style={{ fontFamily: V.fontDisplay, fontSize: '15px', color: '#e8e0d4', lineHeight: '2.0', marginBottom: '28px' }}
              />
              <div style={{ borderLeft: `2px solid ${V.sandGold}`, padding: '10px 20px' }}>
                <AutoTextarea
                  value={`「${curatorQuote}」`}
                  onChange={v => setCuratorQuote(v.replace(/^「|」$/g, ''))}
                  style={{ fontFamily: V.fontDisplay, fontStyle: 'italic', fontSize: '19px', color: '#f0e8d8', lineHeight: '1.6' }}
                />
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid rgba(191,183,146,0.35)' }}>
          <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.2em', color: V.warmKhaki, textTransform: 'uppercase' }}>
            SOULSCENT 嗅嗅 · Scent Curation · 香氣策展人
          </div>
          <div style={{ fontFamily: V.fontUi, fontSize: '9px', letterSpacing: '0.15em', color: V.mistSage }}>
            @soulscent.xiuxiu
          </div>
        </div>
      </div>}

      <style jsx global>{`
        @media print {
          body { background: none !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
        @media (max-width: 640px) {
          .body-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function CuratorPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'DM Sans,sans-serif', fontSize: '11px', letterSpacing: '0.2em', color: '#84805b', background: '#ede8e2' }}>
        載入中…
      </div>
    }>
      <CuratorContent />
    </Suspense>
  )
}
