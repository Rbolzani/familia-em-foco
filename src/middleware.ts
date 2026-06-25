import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: getUser() é obrigatório aqui para que o Supabase SSR
  // possa remontar e renovar os cookies de sessão fragmentados corretamente.
  // getSession() não funciona no contexto do middleware com cookies chunked.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isAuthRoute = pathname.startsWith('/auth')
  const isPublic = pathname === '/'
  // Rotas de API fazem a própria autenticação (sessão ou CRON_SECRET).
  // Nunca redirecionar API para a página de login — isso quebrava o cron
  // do resumo diário (Vercel Cron não tem sessão → levava 307 → não rodava).
  const isApi = pathname.startsWith('/api')

  // Captura do convite no PRIMEIRO toque. Um usuário novo que clica no link
  // de convite passa por signup → confirmação de e-mail → completar-cadastro
  // antes de conseguir aceitar; o token se perdia nesses saltos e a pessoa
  // caía numa família vazia. Gravamos o token num cookie aqui (antes de
  // qualquer layout/redirect) e o consumimos ao final do cadastro.
  const inviteMatch = pathname.match(/^\/convite\/([^/]+)\/?$/)

  // Rota pública de convite — não requer autenticação prévia (tem magic link próprio)
  const isConviteRoute = pathname.startsWith('/convite')

  if (!user && !isAuthRoute && !isPublic && !isApi && !isConviteRoute) {
    const loginUrl = new URL('/auth/login', request.url)
    // Preserva o destino (ex.: link de convite) para retornar após o login
    if (pathname !== '/dashboard') loginUrl.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(loginUrl)
    if (inviteMatch) {
      res.cookies.set('pending_invite', inviteMatch[1], { path: '/', maxAge: 3600, sameSite: 'lax' })
    }
    return res
  }

  if (user && isAuthRoute) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    const dest = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  if (inviteMatch) {
    supabaseResponse.cookies.set('pending_invite', inviteMatch[1], { path: '/', maxAge: 3600, sameSite: 'lax' })
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|txt|html|ico)$).*)'],
}
