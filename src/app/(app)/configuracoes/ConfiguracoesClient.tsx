'use client'
import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Link2, Copy, Check, Trash2, Crown, UserPlus, RefreshCw, MessageCircle, Send } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

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
  whatsapp: { number: string; enabled: boolean }
  members: Member[]
  pendingInvite: { token: string; url: string; expires_at: string } | null
}

export default function ConfiguracoesClient({ userId, userEmail, familyId, isOwner, whatsapp, members: initialMembers, pendingInvite: initialInvite }: Props) {
  const supabase = createClient()
  const [members, setMembers]       = useState<Member[]>(initialMembers)
  const [invite, setInvite]         = useState(initialInvite)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [revoking, setRevoking]     = useState<string | null>(null)

  // WhatsApp — resumo matinal
  const [waNumber, setWaNumber]   = useState(whatsapp.number)
  const [waEnabled, setWaEnabled] = useState(whatsapp.enabled)
  const [waSaving, setWaSaving]   = useState(false)
  const [waTesting, setWaTesting] = useState(false)

  function normalizePhone(raw: string): string {
    return raw.replace(/\D/g, '')
  }

  async function saveWhatsApp(enabledOverride?: boolean) {
    const digits = normalizePhone(waNumber)
    const enabled = enabledOverride ?? waEnabled
    if (enabled && (digits.length < 12 || digits.length > 14)) {
      toast('Número inválido. Use DDI+DDD+número, ex.: 5511999998888', 'error')
      return false
    }
    setWaSaving(true)
    const { error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: userId,
        whatsapp_number: digits || null,
        daily_summary_enabled: enabled,
        updated_at: new Date().toISOString(),
      })
    setWaSaving(false)
    if (error) { toast('Não foi possível salvar. Tente novamente.', 'error'); return false }
    toast('Preferências salvas ✓')
    return true
  }

  async function toggleWa() {
    const next = !waEnabled
    if (next) {
      const digits = normalizePhone(waNumber)
      if (digits.length < 12 || digits.length > 14) {
        toast('Informe seu número antes de ativar. Ex.: 5511999998888', 'error')
        return
      }
    }
    setWaEnabled(next)
    await saveWhatsApp(next)
  }

  async function sendTest() {
    const saved = await saveWhatsApp()
    if (!saved) return
    setWaTesting(true)
    try {
      const res = await fetch('/api/whatsapp-test', { method: 'POST' })
      const json = await res.json()
      if (res.ok) toast('Mensagem de teste enviada! Confira seu WhatsApp 📱')
      else toast(json.error ?? 'Falha no envio do teste.', 'error')
    } catch {
      toast('Falha de conexão ao enviar o teste.', 'error')
    }
    setWaTesting(false)
  }

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

      {/* Resumo matinal no WhatsApp */}
      <div style={cardStyle} className="animate-fade-up">
        {sectionHeader(<MessageCircle size={14} color="#2D6A35" />, 'Resumo matinal no WhatsApp')}

        <p style={{ fontSize: 13, color: 'rgba(26,43,28,0.55)', lineHeight: 1.5, marginBottom: 16 }}>
          Todo dia às <strong style={{ color: '#1A2B1C' }}>7h da manhã</strong>, receba no WhatsApp o resumo
          das atividades do dia e da semana — provas, consultas, quem leva e quem busca.
        </p>

        {/* Número */}
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(26,43,28,0.50)', marginBottom: 6 }}>
          Seu WhatsApp (DDI + DDD + número)
        </label>
        <div className="flex gap-2 mb-4">
          <input
            type="tel"
            inputMode="numeric"
            value={waNumber}
            onChange={e => setWaNumber(e.target.value)}
            placeholder="5511999998888"
            className="input-field"
            style={{ flex: 1 }}
          />
          <button
            onClick={() => saveWhatsApp()}
            disabled={waSaving}
            className="px-4 rounded-[13px] font-bold text-white transition-all hover:brightness-105 active:scale-95 disabled:opacity-60 flex-shrink-0"
            style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', fontSize: 13 }}>
            {waSaving ? '...' : 'Salvar'}
          </button>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ background: waEnabled ? 'rgba(61,102,65,0.07)' : 'rgba(26,43,28,0.03)', border: `1px solid ${waEnabled ? 'rgba(61,102,65,0.22)' : 'rgba(26,43,28,0.08)'}` }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1A2B1C' }}>Resumo diário ativo</div>
            <div style={{ fontSize: 11.5, color: 'rgba(26,43,28,0.45)' }}>
              {waEnabled ? 'Você receberá a mensagem todas as manhãs às 7h' : 'Ative para começar a receber'}
            </div>
          </div>
          <button onClick={toggleWa}
            aria-label="Ativar/desativar resumo diário"
            style={{ position: 'relative', width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer', flexShrink: 0,
              background: waEnabled ? 'linear-gradient(135deg,#3D6641,#2C4A2E)' : 'rgba(61,102,65,0.22)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.15)', transition: 'background .25s' }}>
            <span style={{ position: 'absolute', top: 3, width: 20, height: 20, borderRadius: '50%', background: 'white',
              boxShadow: '0 2px 5px rgba(0,0,0,0.25)', left: waEnabled ? 25 : 3, transition: 'left .3s cubic-bezier(.4,0,.2,1)' }} />
          </button>
        </div>

        {/* Teste */}
        <button
          onClick={sendTest}
          disabled={waTesting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold transition-all hover:bg-black/[0.04] active:scale-95 disabled:opacity-60"
          style={{ color: '#3D6641', border: '1.5px solid rgba(61,102,65,0.30)', background: 'none', fontSize: 13.5 }}>
          <Send size={14} />
          {waTesting ? 'Enviando teste...' : 'Enviar resumo de teste agora'}
        </button>
      </div>
    </div>
  )
}
