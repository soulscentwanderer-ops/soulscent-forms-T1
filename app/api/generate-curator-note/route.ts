import { NextRequest, NextResponse } from 'next/server'

function parseObservation(text: string) {
  if (!text || text === '—') return { standoutOil: '', imagery: '', clientWord: '' }
  const lines = text.split('\n')
  return {
    standoutOil: lines.find(l => l.startsWith('最有感覺的精油：'))?.slice(8) || '',
    imagery: lines.find(l => l.startsWith('畫面／記憶：'))?.slice(6) || '',
    clientWord: lines.find(l => l.startsWith('一句話：'))?.slice(4) || '',
  }
}

export async function POST(req: NextRequest) {
  const { name, before, after, oils, observation } = await req.json()

  const obs = parseObservation(observation)

  const prompt = `你是 SOULSCENT 嗅嗅的氣味策展師。根據以下這位訪客今天的香遇體驗，請寫一段「氣味策展筆記」。

風格要求：
- 溫柔、詩意、有質感，不使用任何醫療或療癒診斷語言
- 以第二人稱「你」直接對她說話
- 一段話（3–4 句），加上一句 quote（可以是重新框架她說的話，也可以是一句帶著她今天狀態的詩意句子）
- 繁體中文，台灣慣用語

訪客資料：
- 姓名：${name || '（未填）'}
- 進來前的狀態：${before || '（未填）'}
- 結束後的狀態：${after || '（未填）'}
- 今日精油配方：${oils || '（未填）'}
- 最讓她有感覺的精油：${obs.standoutOil || '（未填）'}
- 她說這個氣味讓她想到：${obs.imagery || '（未填）'}
- 她今天的一句話：${obs.clientWord || '（未填）'}

請以 JSON 格式回應，不要加任何說明：
{"note":"策展師的觀察（3–4句話）","quote":"一句引言式的文字"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: '生成失敗' }, { status: 500 })
  }

  const data = await res.json()
  const raw = data.content?.[0]?.text || ''

  try {
    const parsed = JSON.parse(raw)
    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ note: raw, quote: '' })
  }
}
