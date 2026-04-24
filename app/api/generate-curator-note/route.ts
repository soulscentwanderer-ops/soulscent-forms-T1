import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `你是 SOULSCENT 嗅嗅的香氣策展助理，負責將芳療師的諮詢原始筆記，
轉化為完整的「嗅覺肖像策展紀錄」。

## 輸入格式
芳療師會提供以下原始資訊（不一定每項都有）：
- 客戶姓名
- 諮詢中的關鍵反應（排拒或共鳴的氣味）
- 氣味連結到的記憶、人物或情緒
- 觀察到的核心議題
- 使用的精油配方（品名）
- 使用方式（部位、路徑）

## 輸出結構（固定，依序呈現）

**[客戶名字]的香氣觀察紀錄**

[段落一：諮詢現場]
描述諮詢中最關鍵的身體反應，1-3句。
不說「她感覺到」，說「身體先說了」。
結尾留白，讓下一段接「這不是偶然」或同等分量的句子。

[段落二：這代表什麼]
命名浮現中的議題，但不診斷、不判斷。
使用「觀察到」「往往意味著」「正在」等觀察語氣。
加入轉化框架：被看見是第一步，不需要強迫面對，但已經開始鬆動。
結尾用一句隱喻收束（冰山／光／門）。

[過渡句]
「香氣偏好顯示……」開頭，一句話摘要這位客戶的身體模式。

**配方**
每支精油一行：
精油名：神經科學或經絡邏輯（一句），＋情感層次的意義（一句）

[段落三：身體在說什麼]
把香氣偏好翻譯成身體的語言。
找出核心的「慣性」（例：把一口氣吞下去／把喜悅收起來再說）。
以「她的身體，在等一個……的出口」作結。

**使用時刻的建議**
寫出觸發時機（「當……的時候」）。
描述具體身體路徑（從哪到哪）。
加入呼吸引導（吸氣時……呼氣時……）。
結尾：「」內一句詩意金句，是整篇的情感收束。

## 品牌語氣規則
語氣：溫柔、有深度、科學×詩意並存
視角：觀察者，不替客戶做結論
節奏：短句與長句交替，保留呼吸感的空白

✅ 使用：「身體先知道」「觀察到」「往往意味著」「有機會」「正在練習」
❌ 禁止：治療、改善、緩解、消除、幫助睡眠、減輕焦慮、任何診斷性語言

## 精油科學語言規則
- 神經科學：「研究者觀察到」「文獻顯示與……通路相關」
- 中醫經絡：「在中醫經絡的視角，走……經」
- 禁止：任何醫療聲稱

## 長度與格式
- 約 350-450 字
- 分段清晰，段落之間保留一行空白
- 配方區塊用條列呈現
- 全篇繁體中文`

export async function POST(req: NextRequest) {
  const { name, before, after, oils, observation, curatorObs } = await req.json()

  const userMessage = `以下是芳療師提供的諮詢原始筆記，請依照系統指示的結構產出完整的嗅覺肖像策展紀錄。

客戶資料：
- 姓名：${name || '（未填）'}
- 進來前的狀態：${before || '（未填）'}
- 結束後的狀態：${after || '（未填）'}
- 今日精油配方：${oils || '（未填）'}
- 客戶的觀察與一句話：${observation || '（未填）'}${curatorObs ? `\n\n芳療師的私人觀察（請優先參考）：\n${curatorObs}` : ''}

輸出規則：
1. 先依照系統指示的完整結構，產出全篇 350–450 字的繁體中文策展紀錄（含所有段落標題與配方條列）
2. 從最後一段結尾「」中的詩意金句，抽出作為 quote（不含引號）
3. 以下列 JSON 格式回覆，不要加任何額外說明或 code fence：
{"note":"<完整策展紀錄全文>","quote":"<最後的詩意金句，不含「」>"}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process.env.ANTHROPIC_API_KEY || process.env.Anthropic_token)!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
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
