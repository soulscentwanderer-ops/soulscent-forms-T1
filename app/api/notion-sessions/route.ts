import { NextResponse } from 'next/server'

export async function GET() {
  const allResults: Record<string, unknown>[] = []
  let cursor: string | undefined = undefined
  let hasMore = true

  // Paginate through all records (Notion max 100 per page)
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
      console.error('[notion-sessions] error:', res.status, msg)
      return NextResponse.json(
        { error: `Notion API 錯誤 (${res.status}): ${msg}` },
        { status: 500 }
      )
    }

    const data = await res.json()
    allResults.push(...(data.results ?? []))
    hasMore = data.has_more ?? false
    cursor = data.next_cursor ?? undefined
  }

  const sessions = allResults
    .map((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, unknown>
      const titleArr = (props['諮詢名稱'] as { title: Array<{ text: { content: string } }> })?.title
      const fullTitle = titleArr?.[0]?.text?.content?.trim() || ''
      // Expected format: "姓名 · T1 香遇 · YYYY-MM-DD"
      const parts = fullTitle.split(' · ')
      const name = parts[0]?.trim() || ''
      const date = parts[2]?.trim() || ''
      return { name, date, fullTitle }
    })
    .filter((s: { name: string; date: string }) => s.name && s.date)

  return NextResponse.json({ sessions })
}
