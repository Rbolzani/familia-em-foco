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

  if (!user && !isAuthRoute && !isPublic) {
    const loginUrl = new URL('/auth/login', request.url)
    // Preserva o destino (ex.: link de convite) para retornar após o login
    if (pathname !== '/dashboard') loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && isAuthRoute) {
    const redirect = request.nextUrl.searchParams.get('redirect')
    const dest = redirect && redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
