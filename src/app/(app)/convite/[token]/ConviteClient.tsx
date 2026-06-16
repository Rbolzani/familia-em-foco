'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Leaf, CheckCircle, XCircle, Users, ArrowRight, Loader2, Eye, Truck, Pencil } from 'lucide-react'

type AccessRole = 'read_only' | 'logistics_editor' | 'full_editor'

interface Props {
  token: string
  isValid: boolean
  alreadyMember: boolean
  familyId: string | null
  familyName: string
  inviterName: string
  accessRole: AccessRole
  childrenNames: string[]
}

const ACCESS: Record<AccessRole, { label: string; icon: React.ElementType; bullets: string[] }> = {
  read_only: {
    label: 'Apenas leitura',
    icon: Eye,
    bullets: [
      'Ver todas as atividades, calendário e documentos',
      'Acompanhar a rotina sem fazer alterações',
    ],
  },
  logistics_editor: {
    label: 'Leitura + logística',
    icon: Truck,
    bullets: [
      'Ver todas as atividades, calendário e documentos',
      'Marcar quem leva e quem busca em cada atividade',
      'Cadastrar seu WhatsApp para o resumo diário',
    ],
  },
  full_editor: {
    label: 'Acesso completo',
    icon: Pencil,
    bullets: [
      'Ver e editar todas as atividades e documentos',
      'Adicionar filhos, atividades e capturar por IA',
      'Marcar quem leva e quem busca; resumo no WhatsApp',
    ],
  },
}

function formatNames(names: string[]): string {
  if (names.length === 0) return 'seus filhos'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} e ${names[1]}`
  return `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}`
}

export default function ConviteClient({
  token, isValid, alreadyMember, familyId, familyName, inviterName, accessRole, childrenNames,
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyMember)
  const [error, setError] = useState('')

  const access = ACCESS[accessRole]
  const namesLabel = formatNames(childrenNames)

  async function handleAccept() {
    setLoading(true)
    setError('')

    const { data, error: rpcErr } = await supabase.rpc('accept_invite', { p_token: token })

    if (rpcErr || data !== true) {
      setError('Não foi possível aceitar o convite. O link pode ter expirado.')
      setLoading(false)
      return
    }

    // Mudar automaticamente para o ambiente da família compartilhada e redirecionar
    if (familyId) {
      await supabase.rpc('switch_active_family', { p_family_id: familyId })
    }

    router.push('/dashboard')
  }

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 8px 32px rgba(44,74,46,0.12),0 2px 8px rgba(44,74,46,0.08)',
    borderRadius: 20,
    padding: '36px 32px',
    maxWidth: 420,
    width: '100%',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 musgo-bg">
      <div style={cardStyle}>
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center"
            style={{ background: 'linear-gradient(140deg,#2C4A2E,#1E3320)', boxShadow: '0 4px 14px rgba(44,74,46,0.28)' }}>
            <Leaf size={18} color="#D4E8D5" />
          </div>
          <div style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, color: '#1A2B1C', fontSize: 17 }}>
            Família em Foco
          </div>
        </div>

        {/* Invalid invite */}
        {!isValid && !alreadyMember && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle size={48} style={{ color: '#DC2626' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', marginBottom: 8 }}>
              Convite inválido
            </h1>
            <p style={{ color: 'rgba(26,43,28,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Este link de convite expirou ou já foi utilizado. Peça um novo link para quem te convidou.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 15 }}>
              Ir para o início
            </button>
          </div>
        )}

        {/* Success / already member */}
        {done && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} style={{ color: '#2D6A35' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', marginBottom: 8 }}>
              {alreadyMember && !loading ? 'Você já faz parte desta família!' : 'Tudo certo!'}
            </h1>
            <p style={{ color: 'rgba(26,43,28,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Você agora acompanha a rotina de <strong>{namesLabel}</strong> no ambiente da <strong>{familyName}</strong>.
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 15 }}>
              Ir para o dashboard <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Pending invite */}
        {isValid && !done && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(61,102,65,0.10)', border: '1.5px solid rgba(61,102,65,0.18)' }}>
                <Users size={28} style={{ color: '#2D6A35' }} />
              </div>
            </div>

            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', marginBottom: 12, textAlign: 'center' }}>
              Você foi convidado
            </h1>
            <p style={{ color: 'rgba(26,43,28,0.62)', fontSize: 14, lineHeight: 1.6, marginBottom: 20, textAlign: 'center' }}>
              <strong style={{ color: '#1A2B1C' }}>{inviterName}</strong> convidou você para acessar o ambiente de organização de rotina de <strong style={{ color: '#2D6A35' }}>{namesLabel}</strong> no app Família em Foco.
            </p>

            {/* Access role badge + bullets */}
            <div style={{ background: 'rgba(61,102,65,0.06)', border: '1px solid rgba(61,102,65,0.14)', borderRadius: 12, padding: '14px 16px', marginBottom: 24 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
                <access.icon size={15} style={{ color: '#2D6A35' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#2D6A35', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {access.label}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {access.bullets.map((b, i) => (
                  <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'flex-start' }}>
                    <CheckCircle size={13} style={{ color: '#2D6A35', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 12.5, color: 'rgba(26,43,28,0.62)', lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 15, boxShadow: '0 4px 16px rgba(44,74,46,0.28)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <>Aceitar acesso <ArrowRight size={16} /></>}
            </button>

            <button
              onClick={() => router.push('/dashboard')}
              style={{ width: '100%', marginTop: 10, padding: '10px 0', background: 'transparent', border: 'none', color: 'rgba(26,43,28,0.40)', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
              Recusar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
