import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const raw = searchParams.get('next') ?? searchParams.get('redirect') ?? '/dashboard'
  const next = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: families } = await supabase.rpc('get_my_families')
        if (!families || families.length === 0) {
          const { data: membership } = await supabase
            .from('family_members')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
          if (!membership) {
            const familyName: string =
              (user.user_metadata?.family_name as string | undefined)?.trim() || 'Minha Família'
            await supabase.rpc('create_my_family', { p_name: familyName })
          }
        }

        // Redireciona novos usuários (sem filhos) para o onboarding
        const { data: children } = await supabase.from('children').select('id').limit(1)
        const isNewUser = !children || children.length === 0
        const destination = isNewUser && next === '/dashboard' ? '/onboarding' : next
        return NextResponse.redirect(`${origin}${destination}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_error`)
}
