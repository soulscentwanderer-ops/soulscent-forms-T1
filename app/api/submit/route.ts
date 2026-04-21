import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, date, before, after, oils, observation } = await req.json()

  const safe = (v: string) => v?.trim() || '—'

  const body = {
    parent: { database_id: process.env.NOTION_DATABASE_ID },
    properties: {
      '諮詢名稱': {
        title: [{ text: { content: `${safe(name)} · T1 香遇 · ${safe(date)}` } }],
      },
      '諮詢日期': {
        rich_text: [{ text: { content: date || new Date().toISOString().split('T')[0] } }],
      },
      '服務層': { select: { name: 'T1 香遇' } },
      '進來前狀態': { rich_text: [{ text: { content: safe(before) } }] },
      '結束後狀態': { rich_text: [{ text: { content: safe(after) } }] },
      '最終配方說明': { rich_text: [{ text: { content: safe(oils) } }] },
      '喚起的記憶或故事': { rich_text: [{ text: { content: safe(observation) } }] },
    },
  }

  const res = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json()
    console.error('Notion API error:', JSON.stringify(err, null, 2))
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
