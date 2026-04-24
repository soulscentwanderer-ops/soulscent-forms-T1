import { NextRequest, NextResponse } from 'next/server'

const NOTION_HEADERS = {
  Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
  'Content-Type': 'application/json',
  'Notion-Version': '2022-06-28',
}

export async function POST(req: NextRequest) {
  const { name, date, note, quote } = await req.json()

  if (!name || !date) {
    return NextResponse.json({ error: '缺少 name 或 date' }, { status: 400 })
  }

  // Step 1: Find the page by title
  const queryRes = await fetch(
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

  if (!queryRes.ok) {
    const err = await queryRes.json().catch(() => ({}))
    return NextResponse.json({ error: `查詢失敗 (${queryRes.status}): ${err?.message || JSON.stringify(err)}` }, { status: 500 })
  }

  const queryData = await queryRes.json()
  const page = (queryData.results ?? []).find((p: Record<string, unknown>) => {
    const props = p.properties as Record<string, unknown>
    const titleArr = (props['諮詢名稱'] as { title: Array<{ text: { content: string } }> })?.title
    const title = titleArr?.[0]?.text?.content || ''
    return title.includes(name) && title.includes(date)
  })

  if (!page) {
    return NextResponse.json({ error: `找不到 ${name} 在 ${date} 的紀錄` }, { status: 404 })
  }

  // Step 2: Build the combined text for 肖像摘要
  // Format: note\n---\nquote (so it can be parsed back)
  const combined = quote ? `${note}\n---\n${quote}` : note

  // Step 3: Update 肖像摘要 on the page
  const updateRes = await fetch(`https://api.notion.com/v1/pages/${page.id}`, {
    method: 'PATCH',
    headers: NOTION_HEADERS,
    body: JSON.stringify({
      properties: {
        '肖像摘要': {
          rich_text: [{ text: { content: combined.slice(0, 2000) } }],
        },
      },
    }),
  })

  if (!updateRes.ok) {
    const err = await updateRes.json().catch(() => ({}))
    const msg = err?.message || JSON.stringify(err)
    console.error('[save-curator-note] Notion PATCH error:', updateRes.status, msg)
    return NextResponse.json({ error: `Notion 更新失敗 (${updateRes.status}): ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
