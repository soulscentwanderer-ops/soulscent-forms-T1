'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

interface SessionData {
  name: string
  date: string
  before: string
  after: string
  oils: string
  observation: string
  curatorNote?: string
  curatorQuote?: string
}

interface OilItem {
  name: string
  conc: string
  body: string
  emotion: string
}

interface CuratorNote {
  note: string
  quote: string
}

function parseOils(text: string): OilItem[] {
  if (!text || text === '—') return []
  return text
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const segments = line.split(' | ')
      const namePart = segments[0] || ''
      const body = segments.find(s => s.startsWith('身體：'))?.slice(3) || ''
      const emotion = segments.find(s => s.startsWith('情緒：'))?.slice(3) || ''
      const concMatch = namePart.match(/\s+(\d+\.?\d*)[滴%]$/)
      const name = concMatch ? namePart.slice(0, concMatch.index).trim() : namePart.trim()
      const conc = concMatch ? concMatch[1] : ''
      return { name, conc, body, emotion }
    })
}

function parseObservation(text: string) {
  if (!text || text === '—') return { standoutOil: '', imagery: '', clientWord: '' }
  const lines = text.split('\n')
  return {
    standoutOil: lines.find(l => l.startsWith('最有感覺的精油：'))?.slice(8) || '',
    imagery: lines.find(l => l.startsWith('畫面／記憶：'))?.slice(6) || '',
    clientWord: lines.find(l => l.startsWith('一句話：'))?.slice(4) || '',
  }
}

const RITUAL_STEPS = [
  { badge: '早', title: '起床後，噴灑你的空間', desc: '告訴自己：今天，這一刻是屬於我的。' },
  { badge: '中', title: '午間需要轉換的時候', desc: '放在包包或桌上。當你覺得快被淹沒，噴一下，深呼吸，回到自己。' },
  { badge: '晚', title: '睡前，為今天畫上一個句點', desc: '讓今天有一個只屬於你的結尾，不是任何人的期待，是你自己的。' },
  { badge: '隨', title: '任何你想回到自己的時刻', desc: '這個氣味記得你今天的狀態。隨時都可以用它找回這一刻。' },
]

function SectionLabel({ part, label }: { part: string; label: string }) {
  return (
    <div style={{ marginBottom: '5px' }}>
      <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)' }}>
        {part}
      </div>
      <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  )
}

function ReportContent() {
  const searchParams = useSearchParams()
  const name = searchParams.get('name') || ''
  const date = searchParams.get('date') || ''

  const [session, setSession] = useState<SessionData | null>(null)
  const [curatorNote, setCuratorNote] = useState<CuratorNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!name || !date) {
      setError('缺少必要參數（name, date）')
      setLoading(false)
      return
    }

    async function load() {
      try {
        const sessionRes = await fetch(
          `/api/notion-session?name=${encodeURIComponent(name)}&date=${encodeURIComponent(date)}`
        )
        if (!sessionRes.ok) {
          const err = await sessionRes.json()
          throw new Error(err.error || '找不到對應的紀錄')
        }
        const sessionData: SessionData = await sessionRes.json()
        setSession(sessionData)
        setLoading(false)

        // Use saved curator note from Notion — do not regenerate
        if (sessionData.curatorNote) {
          setCuratorNote({ note: sessionData.curatorNote, quote: sessionData.curatorQuote || '' })
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '讀取失敗')
        setLoading(false)
      }
    }

    load()
  }, [name, date])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', letterSpacing: '0.12em', color: 'var(--sage)' }}>
        正在讀取你的香遇紀錄…
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '10px' }}>
        <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '15px', color: 'var(--umber)' }}>找不到紀錄</div>
        <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)' }}>{error}</div>
      </div>
    )
  }

  if (!session) return null

  const oils = parseOils(session.oils)
  const obs = parseObservation(session.observation)
  const beforeList = session.before && session.before !== '—' ? session.before.split('、') : []
  const afterList = session.after && session.after !== '—' ? session.after.split('、') : []

  const chipStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '3px 10px',
    border: `0.5px solid ${color}`,
    fontFamily: 'var(--font-dm-sans), var(--font-ui)',
    fontSize: '11px',
    color: 'var(--umber)',
    letterSpacing: '0.03em',
    marginRight: '6px',
    marginBottom: '6px',
  })

  return (
    <div style={{ background: 'var(--body-bg)', padding: '1.5rem', minHeight: '100vh' }}>
      <div className="page-card" style={{ width: '100%', maxWidth: '820px', background: 'var(--page-bg)', margin: '0 auto' }}>

        {/* Top gradient bar */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--t1), var(--sand) 60%, transparent)' }} />

        {/* HEADER */}
        <div style={{
          padding: '24px 32px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '0.5px solid var(--sand)',
        }}>
          <div>
            <div style={{
              display: 'inline-block',
              background: 'var(--t1)',
              color: '#fff',
              fontFamily: 'var(--font-dm-sans), var(--font-ui)',
              fontSize: '9px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              padding: '4px 12px',
              marginBottom: '12px',
            }}>T1 · 香遇</div>
            <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '20px', fontWeight: 400, marginBottom: '4px' }}>
              你的香遇報告
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '10px', letterSpacing: '0.14em', color: 'var(--sand)', textTransform: 'uppercase' }}>
              Your Scent Encounter Report
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '13px', letterSpacing: '0.1em', color: 'var(--moss)' }}>SOULSCENT 嗅嗅</div>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.1em', color: 'var(--khaki)', textTransform: 'uppercase', marginTop: '3px' }}>Scent Curation</div>
            </div>
            <button
              className="no-print"
              onClick={() => window.print()}
              style={{
                background: 'none',
                border: '0.5px solid var(--sand)',
                padding: '5px 12px',
                fontFamily: 'var(--font-dm-sans), var(--font-ui)',
                fontSize: '9px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--khaki)',
                cursor: 'pointer',
              }}
            >
              列印 PDF
            </button>
          </div>
        </div>

        {/* META ROW */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '16px',
          padding: '14px 32px',
          borderBottom: '0.5px solid rgba(191,183,146,.3)',
        }}>
          {[
            { label: '姓名 Name', value: session.name },
            { label: '日期 Date', value: session.date },
            { label: '服務 Service', value: 'T1 · 香遇' },
          ].map(({ label, value }) => (
            <div key={label}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '4px' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '13px', color: 'var(--umber)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* PART 01 */}
        <div style={{ padding: '20px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <SectionLabel part="PART 01 · 今日選擇的精油" label="你的嗅覺今天說了什麼" />
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 50px 2fr 2fr', gap: '8px', paddingBottom: '6px', borderBottom: '0.5px solid var(--khaki)' }}>
              {['精油名稱', '濃度', '身體的感受', '情緒的感受'].map(h => (
                <span key={h} style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage)' }}>{h}</span>
              ))}
            </div>
            {oils.length > 0 ? oils.map((oil, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 50px 2fr 2fr', gap: '8px', padding: '7px 0', borderBottom: '0.5px dashed rgba(168,179,168,.3)', alignItems: 'baseline' }}>
                <span style={{ fontSize: '13px', color: 'var(--umber)' }}>{oil.name}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--khaki)' }}>{oil.conc ? `${oil.conc} 滴` : '—'}</span>
                <span style={{ fontSize: '12px', color: 'var(--khaki)', fontWeight: 300 }}>{oil.body || '—'}</span>
                <span style={{ fontSize: '12px', color: 'var(--khaki)', fontWeight: 300 }}>{oil.emotion || '—'}</span>
              </div>
            )) : (
              <div style={{ padding: '12px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)' }}>（未填寫）</div>
            )}
          </div>
        </div>

        {/* PART 02 */}
        <div style={{ padding: '20px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <SectionLabel part="PART 02 · 身體的快照" label="進來之前 vs 結束之後" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }} className="body-grid">
            <div style={{ border: '0.5px solid rgba(168,179,168,.45)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '10px' }}>
                進來之前 · Before
              </div>
              <div>
                {beforeList.length > 0 ? beforeList.map(s => (
                  <span key={s} style={chipStyle('rgba(168,179,168,.5)')}>{s}</span>
                )) : <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)' }}>（未填寫）</span>}
              </div>
            </div>
            <div style={{ border: '0.5px solid rgba(168,179,168,.45)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '10px' }}>
                結束之後 · After
              </div>
              <div>
                {afterList.length > 0 ? afterList.map(s => (
                  <span key={s} style={chipStyle('rgba(159,163,138,.6)')}>{s}</span>
                )) : <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)' }}>（未填寫）</span>}
              </div>
            </div>
          </div>
        </div>

        {/* PART 03 */}
        <div style={{ padding: '20px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <SectionLabel part="PART 03 · 你的觀察" label="今天，有哪個瞬間讓你停了下來？" />
          <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: '最讓你有感覺的是哪支精油？', value: obs.standoutOil },
              { label: '這個氣味，讓你想到了什麼？', value: obs.imagery },
              { label: '用一句話，說說今天的感受', value: obs.clientWord },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: 'var(--umber)', lineHeight: 1.8, padding: '8px 10px', background: 'rgba(191,183,146,.06)', borderLeft: '2px solid rgba(191,183,146,.4)', fontStyle: value ? 'normal' : 'italic' }}>
                  {value || <span style={{ color: 'var(--sage)' }}>（未填寫）</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* PART 04 */}
        <div style={{ padding: '20px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <SectionLabel part="PART 04 · 帶回家的氣味儀式" label="讓這個氣味繼續陪著你" />
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', color: 'var(--khaki)', lineHeight: 1.7, margin: '12px 0 14px' }}>
            你的精油噴霧是為<strong>空間擴香</strong>設計的。在你身邊的空間輕輕噴灑，讓氣味在空氣中展開——再慢慢吸三口氣，讓身體先感受到，然後是你的心。
          </div>
          {RITUAL_STEPS.map((step, i) => (
            <div key={i} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '8px 0',
              borderBottom: i < RITUAL_STEPS.length - 1 ? '0.5px dashed rgba(168,179,168,.3)' : 'none',
            }}>
              <div style={{
                width: '22px', height: '22px', background: 'var(--t1)', color: '#fff',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-dm-sans)', fontSize: '10px', flexShrink: 0,
              }}>
                {step.badge}
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--moss)', marginBottom: '3px' }}>{step.title}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: '14px', padding: '12px 14px', border: '0.5px solid var(--t1)', background: 'rgba(159,163,138,.06)' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '6px' }}>使用提醒</div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--khaki)', lineHeight: 1.8 }}>
              建議用量：每次 2–3 下，距離空間約 30–40 公分。精油噴霧為空間擴香用途，<strong>請勿直接噴在皮膚、眼睛周圍或口鼻上。</strong>
            </div>
          </div>
        </div>

        {/* PART 05 — 氣味策展筆記 */}
        <div style={{ padding: '20px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)', background: 'var(--t1-light)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '14px' }}>
            <SectionLabel part="PART 05 · 氣味策展筆記" label="策展師寫給你的話" />
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--t1)', whiteSpace: 'nowrap', marginLeft: '12px' }}>
              AI · Curator Note
            </div>
          </div>

          {curatorNote ? (
            <div>
              <div style={{
                borderLeft: '2.5px solid var(--t1)',
                padding: '14px 18px',
                background: 'rgba(159,163,138,.08)',
                marginBottom: '14px',
              }}>
                <div style={{
                  fontFamily: 'var(--font-playfair), var(--font-display)',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  color: 'var(--umber)',
                  lineHeight: 2,
                }}>
                  {curatorNote.note}
                </div>
              </div>
              {curatorNote.quote && (
                <div style={{
                  textAlign: 'center',
                  padding: '14px 20px',
                  border: '0.5px solid rgba(159,163,138,.5)',
                }}>
                  <div style={{
                    fontFamily: 'var(--font-playfair), var(--font-display)',
                    fontSize: '14px',
                    fontStyle: 'italic',
                    color: 'var(--moss)',
                    lineHeight: 1.9,
                    letterSpacing: '0.02em',
                  }}>
                    「{curatorNote.quote}」
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: '20px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'var(--sage)', fontStyle: 'italic' }}>
              策展筆記尚未發布，請稍候。
            </div>
          )}
        </div>

        {/* CTA FOOTER */}
        <div style={{
          background: 'var(--moss)',
          padding: '18px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--cream)', lineHeight: 1.7, flex: 1 }}>
            今天是起點。如果你想更深地認識自己的嗅覺——讓我們用 75 分鐘，為你的氣味立一張肖像。
          </div>
          <a
            href="https://www.instagram.com/soulscent.xiuxiu"
            target="_blank"
            rel="noopener noreferrer"
            className="no-print"
            style={{
              border: '0.5px solid var(--sand)',
              color: 'var(--sand)',
              padding: '9px 18px',
              fontFamily: 'var(--font-dm-sans), var(--font-ui)',
              fontSize: '9px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
            }}
          >
            了解 75 分鐘嗅覺肖像 →
          </a>
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 600px) {
          .page-card { padding: 0 !important; }
          .body-grid { grid-template-columns: 1fr !important; }
        }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-card { box-shadow: none !important; }
        }
      `}</style>
    </div>
  )
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif', fontSize: '12px', letterSpacing: '0.12em', color: '#a9b3a8', background: '#f0ebe4' }}>
        載入中…
      </div>
    }>
      <ReportContent />
    </Suspense>
  )
}
