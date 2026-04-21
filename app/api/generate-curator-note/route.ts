import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, before, after, oils, observation, curatorObs } = await req.json()

  // observation may be raw Notion text or already-parsed strings passed from curator page
  const prompt = `你是 SOULSCENT 嗅嗅的氣味策展師，正在撰寫一份 T1 香遇報告的「氣味策展筆記」。

風格要求：
- 溫柔、詩意、有質感，不使用任何醫療或療癒診斷語言
- 以第二人稱「你」直接對她說話
- 一段話（4–6 句），說明她今天的氣味選擇揭示了什麼
- 最後提煉一句精煉的 quote（20 字以內，中文）
- 繁體中文，台灣慣用語

客戶資料：
- 姓名：${name || '（未填）'}
- 進來前的狀態：${before || '（未填）'}
- 結束後的狀態：${after || '（未填）'}
- 今日精油配方：${oils || '（未填）'}
- 客戶的觀察與一句話：${observation || '（未填）'}${curatorObs ? `\n\n策展師的私人觀察（請優先參考）：\n${curatorObs}` : ''}

請用 JSON 回覆，不要加任何說明：
{"note":"正文（4–6句）","quote":"一句話（≤20字）"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    const errMsg = errData?.error?.message || errData?.error || JSON.stringify(errData)
    console.error('[generate-curator-note] Claude API error:', res.status, errMsg)
    return NextResponse.json({ error: `Claude API 錯誤 (${res.status}): ${errMsg}` }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.content?.[0]?.text || ''

  try {
    const match = raw.match(/\{[\s\S]*\}/)
    const parsed = JSON.parse(match?.[0] || raw)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ note: raw, quote: '' })
  }
}
