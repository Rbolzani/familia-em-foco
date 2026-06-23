import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { LEGAL_EFFECTIVE_DATE, LEGAL_VERSION } from '@/lib/legal'

export default function LegalLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F8F3EA' }}>
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold mb-6"
          style={{ color: '#3D6641' }}>
          <ArrowLeft size={15} /> Voltar
        </Link>

        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 32, fontWeight: 700, color: '#1A2B1C', lineHeight: 1.15 }}>
          {title}
        </h1>
        <p className="text-xs mt-2 mb-8" style={{ color: 'rgba(26,43,28,0.45)' }}>
          Versão {LEGAL_VERSION} · Vigente a partir de {LEGAL_EFFECTIVE_DATE}
        </p>

        <div className="legal-body" style={{ color: 'rgba(26,43,28,0.82)', fontSize: 15, lineHeight: 1.7 }}>
          {children}
        </div>

        <div className="mt-10 pt-6 flex gap-4 text-sm" style={{ borderTop: '1px solid rgba(61,102,65,0.15)' }}>
          <Link href="/termos" className="font-semibold" style={{ color: '#3D6641' }}>Termos de Uso</Link>
          <Link href="/privacidade" className="font-semibold" style={{ color: '#3D6641' }}>Política de Privacidade</Link>
        </div>
      </div>
    </div>
  )
}
