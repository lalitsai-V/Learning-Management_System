import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Auth logic depends on roles. If they go through the Student door they get Student by default.
    // If they go through the Instructor door they get Instructor.
    // We can infer this from 'next'. E.g. next=/dashboard for student, next=/instructor for instructor.
    if (!error) {
      // Create/Update profile in our own profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
         const role = next.startsWith('/instructor') ? 'instructor' : 'student'
         
         const { error: profileErr } = await supabase
           .from('profiles')
           .upsert({
              id: user.id,
              email: user.email!,
              role: role,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture
           }, { onConflict: 'id' });
           
           if(profileErr) {
               console.error("Profile Upsert Error", profileErr)
           }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`)
}
