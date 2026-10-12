const LOADERIO_TOKEN = 'loaderio-86a1a7739cf250758c82ddf0982a1eb5'

export const dynamic = 'force-static'

export function GET() {
  return new Response(LOADERIO_TOKEN, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
