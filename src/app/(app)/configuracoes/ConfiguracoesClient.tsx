'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Link2, Copy, Check, Trash2, Crown, UserPlus, RefreshCw, Settings } from 'lucide-react'

interface Member {
  id: string
  user_id: string
  display_name: string | null
  role: string
  joined_at: string
}

interface Props {
  userId: string
  userEmail: string
  familyId: string | null
  isOwner: boolean
  members: Member[]
  pendingInvite: { token: string; url: string; expires_at: string } | null
}

export default function ConfiguracoesClient({ userId, userEmail, familyId, isOwner, members: initialMembers, pendingInvite: initialInvite }: Props) {
  const supabase = createClient()
  const [members, setMembers]       = useState<Member[]>(initialMembers)
  const [invite, setInvite]         = useState(initialInvite)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [revoking, setRevoking]     = useState<string | null>(null)

  async function generateInvite() {
    setGenerating(true)

    // Ensure family exists
    let fid = familyId
    if (!fid) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: fam } = await supabase
        .from('families')
        .insert({ created_by: user!.id })
        .select('id')
        .single()
      fid = fam?.id ?? null
      if (fid) {
        await supabase.from('family_members').insert({ family_id: fid, user_id: user!.id, role: 'owner' })
      }
    }

    if (!fid) { setGenerating(false); return }

    // Expire existing
    await supabase.from('family_invites').update({ status: 'expired' }).eq('family_id', fid).eq('status', 'pending')

    // Create new
    const { data } = await supabase.from('family_invites').insert({ family_id: fid, invited_by: userId }).select('token, expires_at').single()
    if (data) {
      const baseUrl = window.location.origin
      setInvite({ token: data.token, url: `${baseUrl}/convite/${data.token}`, expires_at: data.expires_at })
    }
    setGenerating(false)
  }

  async function copyLink() {
    if (!invite?.url) return
    await navigator.clipboard.writeText(invite.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function revokePartner(memberId: string, memberUserId: string) {
    if (!confirm('Revogar acesso deste parceiro?')) return
    setRevoking(memberId)
    await supabase.from('family_members').delete().eq('id', memberId)
    setMembers(prev => prev.filter(m => m.id !== memberId))
    setRevoking(null)
  }

  const partners = members.filter(m => m.role === 'partner')
  const me = members.find(m => m.user_id === userId)

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F8F3EA 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
    padding: '20px 20px',
  }

  const sectionHeader = (icon: React.ReactNode, title: string) => (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(61,102,65,0.10)' }}>
        {icon}
      </div>
      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1A2B1C' }}>{title}</h2>
    </div>
  )

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#2D6A35' }}>
          ⚙️ Sistema
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 24, fontWeight: 700, color: '#1A2B1C' }}>
          Configurações
        </h1>
        <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.45)', marginTop: 2 }}>
          {userEmail}
        </p>
      </div>

      {/* Compartilhamento */}
      <div style={cardStyle} className="animate-fade-up">
        {sectionHeader(<Users size={14} color="#2D6A35" />, 'Compartilhar acesso')}

        {/* Current members */}
        <div className="space-y-2 mb-5">
          {/* Owner row */}
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(61,102,65,0.06)', border: '1px solid rgba(61,102,65,0.12)' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-none"
              style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)' }}>
              {(me?.display_name ?? userEmail).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C' }}>
                {me?.display_name ?? 'Você'} <span style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)', fontWeight: 400 }}>({userEmail})</span>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>Proprietário(a)</div>
            </div>
            <Crown size={15} style={{ color: '#C49A6C', flexShrink: 0 }} />
          </div>

          {/* Partner rows */}
          {partners.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-none"
                style={{ background: 'linear-gradient(140deg,#6366f1,#4338CA)' }}>
                {(p.display_name ?? 'P').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2B1C' }}>
                  {p.display_name ?? 'Parceiro(a)'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.45)' }}>
                  Parceiro · desde {new Date(p.joined_at).toLocaleDateString('pt-BR')}
                </div>
              </div>
              {isOwner && (
                <button
                  onClick={() => revokePartner(p.id, p.user_id)}
                  disabled={revoking === p.id}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
                  style={{ background: '#FFF0EB', color: '#F4522D', flexShrink: 0 }}
                  title="Revogar acesso">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}

          {partners.length === 0 && (
            <div style={{ fontSize: 13, color: 'rgba(26,43,28,0.40)', textAlign: 'center', padding: '12px 0', fontStyle: 'italic' }}>
              Nenhum parceiro com acesso ainda
            </div>
          )}
        </div>

        {/* Generate invite — only for owner */}
        {isOwner && (
          <div>
            <div style={{ height: 1, background: 'rgba(61,102,65,0.12)', marginBottom: 16 }} />

            {invite ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2D6A35', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Link2 size={13} /> Link de convite ativo
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'rgba(61,102,65,0.06)', border: '1px solid rgba(61,102,65,0.18)' }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'rgba(26,43,28,0.60)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {invite.url}
                  </span>
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-white transition-all hover:brightness-105 flex-shrink-0"
                    style={{ background: copied ? '#2D6A35' : 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 12 }}>
                    {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(26,43,28,0.40)', marginTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>Expira em: {new Date(invite.expires_at).toLocaleDateString('pt-BR')}</span>
                  <button onClick={generateInvite} disabled={generating}
                    className="flex items-center gap-1 hover:text-green-800 transition-colors"
                    style={{ color: 'rgba(26,43,28,0.45)', fontSize: 11, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <RefreshCw size={11} /> Gerar novo
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={generateInvite}
                disabled={generating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60"
                style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 14, boxShadow: '0 4px 14px rgba(44,74,46,0.22)' }}>
                <UserPlus size={16} />
                {generating ? 'Gerando link...' : 'Convidar parceiro(a)'}
              </button>
            )}
          </div>
        )}

        {!isOwner && (
          <div style={{ fontSize: 13, color: 'rgba(26,43,28,0.50)', padding: '8px 12px', background: 'rgba(61,102,65,0.05)', borderRadius: 10, fontStyle: 'italic' }}>
            Você está no ambiente de outro usuário. Apenas o proprietário pode convidar novos parceiros.
          </div>
        )}
      </div>
    </div>
  )
}
