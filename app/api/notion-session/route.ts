import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim()
  const date = searchParams.get('date')?.trim()

  if (!name || !date) {
    return NextResponse.json({ error: '缺少 name 或 date 參數' }, { status: 400 })
  }

  // Paginate through all records to find a match (no property filter to avoid type errors)
  let cursor: string | undefined = undefined
  let hasMore = true

  while (hasMore) {
    const body: Record<string, unknown> = {
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 100,
    }
    if (cursor) body.start_cursor = cursor

    const res = await fetch(
      `https://api.notion.com/v1/databases/${process.env.NOTION_DATABASE_ID}/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.NOTION_TOKEN}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.message || err?.code || JSON.stringify(err)
      console.error('[notion-session] Notion error:', res.status, msg)
      return NextResponse.json({ error: `Notion API 錯誤 (${res.status}): ${msg}` }, { status: 500 })
    }

    const data = await res.json()

    const record = (data.results ?? []).find((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, unknown>
      const titleArr = (props['諮詢名稱'] as { title: Array<{ text: { content: string } }> })?.title
      const title = titleArr?.[0]?.text?.content || ''
      const nameMatch = title.startsWith(name + ' ·') || title.startsWith(name + '·') || title.includes(name)
      const dateMatch = title.includes(date)
      return nameMatch && dateMatch
    })

    if (record) {
      const props = record.properties as Record<string, unknown>

      const getText = (key: string): string => {
        const rt = (props[key] as { rich_text: Array<{ text: { content: string } }> })?.rich_text
        return rt?.[0]?.text?.content || ''
      }

      return NextResponse.json({
        name,
        date,
        before: getText('進來前狀態'),
        after: getText('結束後狀態'),
        oils: getText('最終配方說明'),
        observation: getText('喚起的記憶或故事'),
      })
    }

    hasMore = data.has_more ?? false
    cursor = data.next_cursor ?? undefined
  }

  return NextResponse.json({ error: `找不到 ${name} 在 ${date} 的紀錄` }, { status: 404 })
}
