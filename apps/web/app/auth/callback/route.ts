import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code'), next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    if (!(await supabase.auth.exchangeCodeForSession(code)).error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email!,
          role: next.startsWith('/instructor') ? 'instructor' : 'student',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
        })
        const host = request.headers.get('x-forwarded-host')
        return NextResponse.redirect(`${host && process.env.NODE_ENV !== 'development' ? `https://${host}` : origin}${next}`)
      }
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
