'use client'

import { useState, useRef } from 'react'

interface OilRow {
  name: string
  conc: string
  body: string
  emotion: string
}

const BEFORE_OPTIONS = [
  '飄，很難定下來',
  '悶，胸背有壓縮感',
  '空，提不起勁沒有動力',
  '燥，思緒躁動煩亂',
  '緊，肩頸緊張',
  '焦慮，胃部悶脹',
  '還好，今天感覺輕鬆',
]

const AFTER_OPTIONS = [
  '有一點落地',
  '呼吸變深了',
  '某個地方鬆開了',
  '想起了什麼',
  '思緒變得明朗',
  '說不清楚，只是不一樣',
]

const RITUAL_STEPS = [
  {
    badge: '早',
    title: '起床後，噴灑你的空間',
    desc: '告訴自己：今天，這一刻是屬於我的。',
  },
  {
    badge: '中',
    title: '午間需要轉換的時候',
    desc: '放在包包或桌上。當你覺得快被淹沒，噴一下，深呼吸，回到自己。',
  },
  {
    badge: '晚',
    title: '睡前，為今天畫上一個句點',
    desc: '讓今天有一個只屬於你的結尾，不是任何人的期待，是你自己的。',
  },
  {
    badge: '隨',
    title: '任何你想回到自己的時刻',
    desc: '這個氣味記得你今天的狀態。隨時都可以用它找回這一刻。',
  },
]

const EMPTY_OIL: OilRow = { name: '', conc: '', body: '', emotion: '' }

export default function T1Page() {
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [oils, setOils] = useState<OilRow[]>(Array(5).fill(null).map(() => ({ ...EMPTY_OIL })))
  const [before, setBefore] = useState<string[]>([])
  const [after, setAfter] = useState<string[]>([])
  const [standoutOil, setStandoutOil] = useState('')
  const [imagery, setImagery] = useState('')
  const [clientWord, setClientWord] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'network-error'>('idle')
  const btnRef = useRef<HTMLButtonElement>(null)

  const toggleCheck = (
    value: string,
    checked: boolean,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setter(prev => checked ? [...prev, value] : prev.filter(v => v !== value))
  }

  const updateOil = (idx: number, field: keyof OilRow, value: string) => {
    setOils(prev => prev.map((row, i) => i === idx ? { ...row, [field]: value } : row))
  }

  const addOilRow = () => {
    setOils(prev => [...prev, { ...EMPTY_OIL }])
  }

  const handleSubmit = async () => {
    if (!name.trim()) { alert('請填寫你的名字或暱稱'); return }
    if (!date) { alert('請填寫日期'); return }

    setStatus('loading')

    const oilsText = oils
      .filter(r => r.name.trim())
      .map(r => {
        let s = r.name.trim()
        if (r.conc.trim()) s += ' ' + r.conc.trim() + '滴'
        if (r.body.trim()) s += ' | 身體：' + r.body.trim()
        if (r.emotion.trim()) s += ' | 情緒：' + r.emotion.trim()
        return s
      })
      .join('\n')

    const observation = [
      standoutOil.trim() ? '最有感覺的精油：' + standoutOil.trim() : '',
      imagery.trim() ? '畫面／記憶：' + imagery.trim() : '',
      clientWord.trim() ? '一句話：' + clientWord.trim() : '',
    ].filter(Boolean).join('\n')

    const payload = {
      name: name.trim() || '—',
      date,
      before: before.join('、') || '—',
      after: after.join('、') || '—',
      oils: oilsText || '—',
      observation: observation || '—',
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('network-error')
    }
  }

  const submitted = status === 'success'

  return (
    <div style={{ padding: '1.5rem', minHeight: '100vh' }}>
      <div className="page-card" style={{
        width: '100%',
        maxWidth: '820px',
        background: 'var(--page-bg)',
        margin: '0 auto',
      }}>
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
              今天，你遇見了哪一個自己？
            </div>
            <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '10px', letterSpacing: '0.14em', color: 'var(--sand)', textTransform: 'uppercase' }}>
              Your Scent Encounter Record
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <img src="/Logo.png" alt="SOULSCENT 嗅嗅" style={{ height: '56px', width: 'auto', opacity: 0.85 }} />
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
          <div>
            <label style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', display: 'block', marginBottom: '4px' }}>
              日期 Date
            </label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', display: 'block', marginBottom: '4px' }}>
              你的名字 / 暱稱
            </label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="怎麼稱呼你？" />
          </div>
          <div />
        </div>

        {/* PART 01 */}
        <div style={{ padding: '18px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '5px' }}>
            PART 01 · 今日選擇的精油
          </div>
          <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginBottom: '12px' }}>
            你的嗅覺今天說了什麼
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 56px 2fr 2fr', gap: '8px', paddingBottom: '6px', borderBottom: '0.5px solid var(--khaki)' }}>
            {['精油名稱', '滴數', '身體的感受', '情緒的感受'].map(label => (
              <span key={label} style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '8px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--sage)' }}>{label}</span>
            ))}
          </div>

          {oils.map((row, idx) => (
            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 56px 2fr 2fr', gap: '8px', padding: '6px 0', borderBottom: '0.5px dashed rgba(168,179,168,.35)', alignItems: 'center' }}>
              <input type="text" value={row.name} onChange={e => updateOil(idx, 'name', e.target.value)} placeholder={idx === 0 ? '精油名稱' : ''} />
              <input type="text" value={row.conc} onChange={e => updateOil(idx, 'conc', e.target.value)} placeholder={idx === 0 ? '滴' : ''} />
              <input type="text" value={row.body} onChange={e => updateOil(idx, 'body', e.target.value)} placeholder={idx === 0 ? '身體感受' : ''} />
              <input type="text" value={row.emotion} onChange={e => updateOil(idx, 'emotion', e.target.value)} placeholder={idx === 0 ? '情緒感受' : ''} />
            </div>
          ))}

          <button
            onClick={addOilRow}
            style={{
              marginTop: '8px',
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-dm-sans), var(--font-ui)',
              fontSize: '9px',
              letterSpacing: '0.13em',
              textTransform: 'uppercase',
              color: 'var(--t1)',
              cursor: 'pointer',
              padding: '4px 0',
            }}
          >
            + 新增一行
          </button>
        </div>

        {/* PART 02 */}
        <div style={{ padding: '18px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '5px' }}>
            PART 02 · 身體的快照
          </div>
          <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginBottom: '12px' }}>
            進來之前 vs 結束之後
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="body-grid">
            <div style={{ border: '0.5px solid rgba(168,179,168,.45)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '10px' }}>
                進來之前 · Before
              </div>
              {BEFORE_OPTIONS.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={before.includes(opt)}
                    onChange={e => toggleCheck(opt, e.target.checked, setBefore)}
                    style={{ width: '13px', height: '13px', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--khaki)', fontWeight: 300 }}>{opt}</span>
                </label>
              ))}
            </div>
            <div style={{ border: '0.5px solid rgba(168,179,168,.45)', padding: '12px 14px' }}>
              <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '10px' }}>
                結束之後 · After
              </div>
              {AFTER_OPTIONS.map(opt => (
                <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={after.includes(opt)}
                    onChange={e => toggleCheck(opt, e.target.checked, setAfter)}
                    style={{ width: '13px', height: '13px', flexShrink: 0, cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--khaki)', fontWeight: 300 }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* PART 03 */}
        <div style={{ padding: '18px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '5px' }}>
            PART 03 · 你的觀察
          </div>
          <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginBottom: '12px' }}>
            今天，有哪個瞬間讓你停了下來？
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', display: 'block', marginBottom: '4px' }}>
              最讓你有感覺的是哪支精油？為什麼？
            </label>
            <textarea
              value={standoutOil}
              onChange={e => setStandoutOil(e.target.value)}
              placeholder="可以是氣味本身，可以是一個感覺，可以是什麼都說不清楚……"
              style={{ minHeight: '52px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', display: 'block', marginBottom: '4px' }}>
              這個氣味，讓你想到了什麼畫面、顏色，或很久以前的一個記憶？
            </label>
            <textarea
              value={imagery}
              onChange={e => setImagery(e.target.value)}
              placeholder="不需要解釋，只要說出腦海裡浮現的……"
              style={{ minHeight: '52px' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.13em', textTransform: 'uppercase', color: 'var(--sand)', display: 'block', marginBottom: '4px' }}>
              如果用一句話，說說今天的感受？
            </label>
            <textarea
              value={clientWord}
              onChange={e => setClientWord(e.target.value)}
              placeholder="任何語言都可以，是你的就好。"
              style={{ minHeight: '44px' }}
            />
          </div>

          <div style={{ marginTop: '14px', borderLeft: '2.5px solid var(--sand)', padding: '10px 14px', background: 'rgba(191,183,146,.06)' }}>
            <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '12px', fontStyle: 'italic', color: 'var(--umber)', lineHeight: 1.8 }}>
              今天調製的配方，是你的嗅覺指紋留下的第一個印記。它沒有標準答案，只有屬於你的答案。
            </div>
          </div>
        </div>

        {/* PART 04 */}
        <div style={{ padding: '18px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '5px' }}>
            PART 04 · 帶回家的氣味儀式
          </div>
          <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginBottom: '12px' }}>
            讓這個氣味繼續陪著你
          </div>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', color: 'var(--khaki)', lineHeight: 1.7, marginBottom: '14px' }}>
            你的精油噴霧是為<strong>空間擴香</strong>設計的。在你身邊的空間輕輕噴灑，讓氣味在空氣中展開——再慢慢吸三口氣，讓身體先感受到，然後是你的心。
          </div>

          {RITUAL_STEPS.map((step, idx) => (
            <div key={idx} style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
              padding: '8px 0',
              borderBottom: idx < RITUAL_STEPS.length - 1 ? '0.5px dashed rgba(168,179,168,.3)' : 'none',
            }}>
              <div style={{
                width: '22px',
                height: '22px',
                background: 'var(--t1)',
                color: '#fff',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-dm-sans), var(--font-ui)',
                fontSize: '10px',
                flexShrink: 0,
              }}>
                {step.badge}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', color: 'var(--moss)', marginBottom: '3px' }}>{step.title}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', color: 'var(--sage)', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '14px', padding: '12px 14px', border: '0.5px solid var(--t1)', background: 'rgba(159,163,138,.06)' }}>
            <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '6px' }}>使用提醒</div>
            <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', color: 'var(--khaki)', lineHeight: 1.8 }}>
              建議用量：每次 2–3 下，距離空間約 30–40 公分。精油噴霧為空間擴香用途，<strong>請勿直接噴在皮膚、眼睛周圍或口鼻上。</strong>
            </div>
          </div>
        </div>

        {/* PART 05 */}
        <div style={{ padding: '18px 32px', borderBottom: '0.5px solid rgba(191,183,146,.25)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--sand)', marginBottom: '5px' }}>
            PART 05 · 如果你願意
          </div>
          <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '15px', fontWeight: 400, color: 'var(--moss)', marginBottom: '12px' }}>
            把這份體驗帶給一個你在乎的人
          </div>
          <div style={{ border: '0.5px solid var(--t1)', padding: '14px 16px' }}>
            <div style={{ fontFamily: 'var(--font-playfair), var(--font-display)', fontSize: '12px', fontStyle: 'italic', color: 'var(--umber)', lineHeight: 1.8, marginBottom: '6px' }}>
              如果你身邊有一個人，你希望她也被這樣看見——把這個連結分享給她。她的第一次，享有 NT$100 折扣。
            </div>
          </div>
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

        {/* SUBMIT SECTION */}
        <div style={{ padding: '20px 32px', background: 'var(--t1-light)', borderTop: '0.5px solid var(--t1)' }}>
          <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '12px' }}>
            送出你的記錄
          </div>

          <div style={{ marginBottom: '16px', fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', color: 'var(--khaki)', lineHeight: 1.8 }}>
            你填寫的內容將作為你的<strong>私人氣味紀錄</strong>保存，僅供 SOULSCENT 嗅嗅香氣策展人參考，不會公開或分享給第三方。
            <br /><br />
            本次調製的精油配方為<strong>空間噴霧（環境擴香）</strong>用途，請勿直接接觸皮膚、眼睛或口服。如有過敏體質、孕婦、嬰幼兒或特殊健康狀況，使用前請諮詢醫療專業人員。本記錄不具任何醫療診斷或治療效果。
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              ref={btnRef}
              onClick={handleSubmit}
              disabled={submitted || status === 'loading'}
              style={{
                background: submitted ? 'var(--sage)' : 'var(--moss)',
                color: '#fff',
                border: 'none',
                padding: '10px 24px',
                fontFamily: 'var(--font-dm-sans), var(--font-ui)',
                fontSize: '11px',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: submitted || status === 'loading' ? 'not-allowed' : 'pointer',
                transition: 'background .2s',
              }}
            >
              {submitted ? '已送出' : status === 'loading' ? '送出中…' : '送出 →'}
            </button>

            {status === 'success' && (
              <span style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', padding: '8px 14px', background: '#e8f0e8', color: '#2d5a2d', border: '0.5px solid #6a9f6a', borderRadius: '2px' }}>
                ✓ 已送出！感謝你今天的到來，策展師將在 24 小時內回應你的紀錄。
              </span>
            )}
          </div>

          {status === 'success' && (() => {
            const reportUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/curator?name=${encodeURIComponent(name.trim())}&date=${encodeURIComponent(date)}`
            return (
              <div style={{ marginTop: '20px', padding: '16px', border: '0.5px solid var(--t1)', background: 'rgba(159,163,138,.06)' }}>
                <div style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--t1)', marginBottom: '8px' }}>
                  開啟策展師工作台 · 生成報告後輸出 PDF
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <code style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--umber)', background: 'rgba(191,183,146,.15)', padding: '5px 8px', flex: 1, wordBreak: 'break-all' }}>
                    {reportUrl}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(reportUrl)
                        .then(() => alert('✓ 已複製連結'))
                        .catch(() => alert('請手動複製上方連結'))
                    }}
                    style={{
                      background: 'var(--t1)',
                      color: '#fff',
                      border: 'none',
                      padding: '7px 14px',
                      fontFamily: 'var(--font-dm-sans), var(--font-ui)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    複製連結
                  </button>
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      border: '0.5px solid var(--khaki)',
                      color: 'var(--khaki)',
                      padding: '6px 14px',
                      fontFamily: 'var(--font-dm-sans), var(--font-ui)',
                      fontSize: '9px',
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    預覽 →
                  </a>
                </div>
              </div>
            )
          })()}

          {status === 'error' && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', padding: '8px 14px', background: '#f0e8e8', color: '#5a2d2d', border: '0.5px solid #9f6a6a', borderRadius: '2px' }}>
                送出失敗，請再試一次。
              </span>
            </div>
          )}
          {status === 'network-error' && (
            <div style={{ marginTop: '12px' }}>
              <span style={{ fontFamily: 'var(--font-dm-sans), var(--font-ui)', fontSize: '11px', padding: '8px 14px', background: '#f0e8e8', color: '#5a2d2d', border: '0.5px solid #9f6a6a', borderRadius: '2px' }}>
                連線失敗，請確認網路後重試。
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @media (max-width: 600px) {
          .page-card { padding: 0 !important; }
          .body-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
