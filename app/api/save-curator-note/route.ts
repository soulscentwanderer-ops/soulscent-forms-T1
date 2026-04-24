import { NextRequest, NextResponse } from 'next/server'

const NOTION_HEADERS = {
  Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
}

async function findPageId(name: string, date: string): Promise<string | null> {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
    {
      method: 'POST',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 100,
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json()
  const page = data.results?.find((p: Record<string, unknown>) => {
    const props = p.properties as Record<string, unknown>
    const titleArr = (props['諮詢名稱'] as { title: Array<{ text: { content: string } }> })?.title
    const title = titleArr?.[0]?.text?.content || ''
    return title.includes(name) && title.includes(date)
  })
  return (page?.id as string) || null
}

async function ensureDbProperties() {
  await fetch(
    `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}`,
    {
      method: 'PATCH',
      headers: NOTION_HEADERS,
      body: JSON.stringify({
        properties: {
          '氣味策展筆記': { rich_text: {} },
          '策展引言': { rich_text: {} },
        },
      }),
    }
  )
  // Ignore errors — properties may already exist
}

export async function POST(req: NextRequest) {
  const { name, date, note, quote } = await req.json()

  if (!name || !date) {
    return NextResponse.json({ error: '缺少 name 或 date' }, { status: 400 })
  }

  // Ensure the DB has the required properties
  await ensureDbProperties()

  // Find the page
  const pageId = await findPageId(name, date)
  if (!pageId) {
    return NextResponse.json({ error: `找不到 ${name} 在 ${date} 的紀錄` }, { status: 404 })
  }

  // Update the page
  const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      properties: {
        '氣味策展筆記': { rich_text: [{ text: { content: note || '' } }] },
        '策展引言': { rich_text: [{ text: { content: quote || '' } }] },
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.message || JSON.stringify(err)
    console.error('[save-curator-note] Notion error:', res.status, msg)
    return NextResponse.json({ error: `Notion 錯誤 (${res.status}): ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
