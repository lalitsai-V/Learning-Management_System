export async function loginWithDiscord() {
  const { createClient } = await import('@/utils/supabase/client')
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function loginWithGithub() {
  const { createClient } = await import('@/utils/supabase/client')
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function loginWithGoogle() {
  const { createClient } = await import('@/utils/supabase/client')
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}

export async function logout() {
  const { createClient } = await import('@/utils/supabase/client')
  const supabase = createClient()
  await supabase.auth.signOut()
  window.location.href = '/'
}
