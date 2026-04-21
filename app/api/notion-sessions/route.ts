import { NextResponse } from 'next/server'

export async function GET() {
  // Query without select filter — more permissive, works even if 服務層 isn't indexed
  const body: Record<string, unknown> = {
    sorts: [{ property: '諮詢日期', direction: 'descending' }],
    page_size: 50,
  }

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
    console.error('[notion-sessions] Notion API error:', res.status, err)
    return NextResponse.json(
      { error: '無法讀取 Notion', detail: err, status: res.status },
      { status: 500 }
    )
  }

  const data = await res.json()

  const sessions = (data.results ?? [])
    .map((page: Record<string, unknown>) => {
      const props = page.properties as Record<string, unknown>
      const titleArr = (props['諮詢名稱'] as { title: Array<{ text: { content: string } }> })?.title
      const fullTitle = titleArr?.[0]?.text?.content || ''
      const date = (props['諮詢日期'] as { date: { start: string } })?.date?.start || ''
      // title format: "姓名 · T1 香遇 · YYYY-MM-DD"
      const name = fullTitle.split(' · ')[0]?.trim() || fullTitle.trim()
      return { name, date }
    })
    .filter((s: { name: string; date: string }) => s.name && s.date)

  return NextResponse.json({ sessions })
}
