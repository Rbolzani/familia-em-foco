'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Leaf, CheckCircle, XCircle, Users, ArrowRight, Loader2 } from 'lucide-react'

interface Props {
  token: string
  isValid: boolean
  alreadyMember: boolean
  familyName: string
  inviterName: string
  inviteId: string | null
  familyId: string | null
  userId: string
}

export default function ConviteClient({
  token, isValid, alreadyMember, familyName, inviterName, inviteId, familyId, userId
}: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(alreadyMember)
  const [error, setError] = useState('')

  async function handleAccept() {
    if (!inviteId || !familyId) return
    setLoading(true)
    setError('')

    const { error: memberErr } = await supabase
      .from('family_members')
      .upsert({ family_id: familyId, user_id: userId, role: 'partner' }, { onConflict: 'family_id,user_id' })

    if (memberErr) { setError('Erro ao entrar na família. Tente novamente.'); setLoading(false); return }

    await supabase
      .from('family_invites')
      .update({ status: 'accepted' })
      .eq('id', inviteId)

    setDone(true)
    setLoading(false)
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
              Este link de convite expirou ou já foi utilizado. Peça um novo link para o familiar que te convidou.
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
              {alreadyMember && !loading ? 'Você já faz parte desta família!' : 'Bem-vindo(a) à família!'}
            </h1>
            <p style={{ color: 'rgba(26,43,28,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Você agora tem acesso ao ambiente da <strong>{familyName}</strong>. Todas as atividades, calendário e logística estão compartilhados.
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

            <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', marginBottom: 8, textAlign: 'center' }}>
              Convite recebido 🤝
            </h1>
            <p style={{ color: 'rgba(26,43,28,0.55)', fontSize: 14, lineHeight: 1.6, marginBottom: 4, textAlign: 'center' }}>
              <strong>{inviterName}</strong> te convidou para acessar o ambiente familiar de
            </p>
            <p style={{ color: '#2D6A35', fontSize: 17, fontWeight: 700, textAlign: 'center', marginBottom: 24 }}>
              {familyName}
            </p>

            <div style={{ background: 'rgba(61,102,65,0.06)', border: '1px solid rgba(61,102,65,0.14)', borderRadius: 12, padding: '12px 14px', marginBottom: 24 }}>
              <p style={{ fontSize: 12, color: 'rgba(26,43,28,0.55)', lineHeight: 1.6 }}>
                ✅ Você verá todas as atividades, calendário e lembretes<br />
                ✅ Poderá adicionar e editar qualquer atividade<br />
                ✅ Poderá definir quem leva e busca em cada atividade<br />
                🔒 Acesso pode ser revogado a qualquer momento
              </p>
            </div>

            {error && (
              <p style={{ color: '#DC2626', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</p>
            )}

            <button
              onClick={handleAccept}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 15, boxShadow: '0 4px 16px rgba(44,74,46,0.28)' }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <>Aceitar e entrar <ArrowRight size={16} /></>}
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
