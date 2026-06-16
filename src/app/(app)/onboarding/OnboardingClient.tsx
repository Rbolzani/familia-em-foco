'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Camera, ArrowRight, Check, Users, Sparkles } from 'lucide-react'

const supabase = createClient()

const AVATAR_COLORS = [
  '#F4522D','#F5A623','#00C48C','#2563EB',
  '#7C3AED','#DB2777','#0891B2','#059669',
]

interface ChildForm {
  id: string
  name: string
  birth_date: string
  school_name: string
  avatar_color: string
  photoFile: File | null
  photoPreview: string | null
}

function newChildForm(): ChildForm {
  return {
    id: crypto.randomUUID(),
    name: '',
    birth_date: '',
    school_name: '',
    avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    photoFile: null,
    photoPreview: null,
  }
}

// ── Step indicator ─────────────────────────────────────────────────────────
function StepDot({ active, done }: { active: boolean; done: boolean }) {
  return (
    <div style={{
      width: 10, height: 10, borderRadius: '50%',
      background: done ? '#3D6641' : active ? '#5A8C5E' : 'rgba(61,102,65,0.18)',
      transition: 'all 0.3s',
      flexShrink: 0,
    }} />
  )
}

// ── Mini avatar preview ────────────────────────────────────────────────────
function MiniAvatar({ child }: { child: ChildForm }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12, flexShrink: 0,
      background: child.photoPreview ? 'transparent' : child.avatar_color,
      overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: 18, color: 'white',
      boxShadow: `0 4px 12px ${child.avatar_color}55`,
    }}>
      {child.photoPreview
        ? <img src={child.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : child.name.charAt(0).toUpperCase() || '?'
      }
    </div>
  )
}

// ── Child form card ────────────────────────────────────────────────────────
function ChildCard({
  child, index, onChange, onRemove, canRemove,
}: {
  child: ChildForm
  index: number
  onChange: (id: string, patch: Partial<ChildForm>) => void
  onRemove: (id: string) => void
  canRemove: boolean
}) {
  const inputId = `photo-${child.id}`
  const blobRef = useRef<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (blobRef.current) URL.revokeObjectURL(blobRef.current)
    const url = URL.createObjectURL(f)
    blobRef.current = url
    onChange(child.id, { photoFile: f, photoPreview: url })
    e.target.value = ''
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '17px 11px 15px 13px',
      border: '1px solid rgba(61,102,65,0.12)',
      padding: '20px',
      boxShadow: '0 2px 12px rgba(44,74,46,0.06)',
      display: 'flex', flexDirection: 'column', gap: 16,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(26,43,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Filho {index + 1}
        </span>
        {canRemove && (
          <button type="button" onClick={() => onRemove(child.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(220,38,38,0.6)', padding: 4 }}>
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Photo + color */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <label htmlFor={inputId} style={{
          width: 72, height: 72, borderRadius: 18, flexShrink: 0,
          background: child.photoPreview ? 'transparent' : child.avatar_color,
          overflow: 'hidden', cursor: 'pointer', position: 'relative',
          border: '2px dashed rgba(61,102,65,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 4px 14px ${child.avatar_color}44`,
        }}>
          {child.photoPreview
            ? <img src={child.photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <>{child.name
                ? <span style={{ fontFamily: 'var(--font-lora)', fontWeight: 700, fontSize: 28, color: 'white' }}>{child.name.charAt(0).toUpperCase()}</span>
                : <Camera size={24} color="rgba(61,102,65,0.4)" />
              }</>
          }
          <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 3 }}>
            <Camera size={10} color="white" />
          </div>
        </label>
        <input id={inputId} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

        {/* Color picker */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
          {AVATAR_COLORS.map(c => (
            <button key={c} type="button" onClick={() => onChange(child.id, { avatar_color: c })}
              style={{
                width: 24, height: 24, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                outline: child.avatar_color === c ? `3px solid ${c}` : 'none',
                outlineOffset: 2, transition: 'all 0.15s',
              }} />
          ))}
        </div>
      </div>

      {/* Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(26,43,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Nome *
          </label>
          <input
            type="text" required placeholder="Ex: Maria"
            value={child.name}
            onChange={e => onChange(child.id, { name: e.target.value })}
            className="input-field"
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(26,43,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Nascimento
            </label>
            <input
              type="date"
              value={child.birth_date}
              onChange={e => onChange(child.id, { birth_date: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'rgba(26,43,28,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Escola
            </label>
            <input
              type="text" placeholder="Nome da escola"
              value={child.school_name}
              onChange={e => onChange(child.id, { school_name: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main onboarding component ──────────────────────────────────────────────
export default function OnboardingClient({ firstName }: { firstName: string }) {
  const router = useRouter()
  const [step, setStep] = useState<'welcome' | 'children' | 'invite' | 'done'>('welcome')
  const [children, setChildren] = useState<ChildForm[]>([newChildForm()])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function updateChild(id: string, patch: Partial<ChildForm>) {
    setChildren(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c))
  }

  function addChild() {
    setChildren(prev => [...prev, newChildForm()])
  }

  function removeChild(id: string) {
    setChildren(prev => prev.filter(c => c.id !== id))
  }

  async function uploadPhoto(userId: string, childId: string, file: File): Promise<string | null> {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
    const path = `${userId}/${childId}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (error) return null
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
    return publicUrl
  }

  async function saveChildren() {
    const valid = children.filter(c => c.name.trim())
    if (valid.length === 0) { setError('Adicione pelo menos um filho para continuar.'); return }

    setSaving(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sessão expirada.')

      for (let i = 0; i < valid.length; i++) {
        const child = valid[i]
        const { data: inserted, error: insertErr } = await supabase
          .from('children')
          .insert({
            user_id: user.id,
            name: child.name.trim(),
            birth_date: child.birth_date || null,
            school_name: child.school_name.trim() || null,
            avatar_color: child.avatar_color,
            sort_order: i,
          })
          .select()
          .single()

        if (insertErr || !inserted) throw new Error(`Erro ao salvar ${child.name}.`)

        if (child.photoFile) {
          const url = await uploadPhoto(user.id, inserted.id, child.photoFile)
          if (url) await supabase.from('children').update({ avatar_url: url }).eq('id', inserted.id)
        }
      }

      // Gerar link de convite (acesso completo, sem email)
      const origin = window.location.origin
      const { data: invite } = await supabase.rpc('create_invite', {
        p_email: null,
        p_access_role: 'full_editor',
      })
      if (invite) setInviteLink(`${origin}/convite/${invite}`)

      setStep('invite')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido.')
    } finally {
      setSaving(false)
    }
  }

  function copyLink() {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendWhatsApp() {
    if (!inviteLink) return
    const msg = encodeURIComponent(`Olá! Estou usando o Família em Foco para organizar a rotina dos nossos filhos. Clique no link para ter acesso: ${inviteLink}`)
    window.open(`https://wa.me/?text=${msg}`, '_blank')
  }

  function finish() {
    router.push('/dashboard')
  }

  // ── Styles base ────────────────────────────────────────────────────────
  const container: React.CSSProperties = {
    minHeight: '100dvh',
    background: 'linear-gradient(160deg, #F8F3EA 0%, #EEF5EF 100%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px',
    fontFamily: 'var(--font-dm-sans)',
  }

  const card: React.CSSProperties = {
    background: 'white',
    borderRadius: '24px 18px 22px 20px',
    boxShadow: '0 8px 40px rgba(44,74,46,0.10)',
    width: '100%', maxWidth: 480,
    padding: '32px 28px',
    display: 'flex', flexDirection: 'column', gap: 24,
  }

  const btn: React.CSSProperties = {
    width: '100%', padding: '14px', borderRadius: 13, border: 'none',
    background: 'linear-gradient(140deg,#3D6641,#2C4A2E)',
    color: '#D4E8D5', fontWeight: 700, fontSize: 15, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    boxShadow: '0 6px 20px rgba(44,74,46,0.28)',
    transition: 'opacity 0.15s',
    opacity: saving ? 0.7 : 1,
  }

  // ── Step: Welcome ──────────────────────────────────────────────────────
  if (step === 'welcome') return (
    <div style={container}>
      {/* Logo */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🌿</div>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', margin: 0 }}>
          Família em Foco
        </h1>
      </div>

      <div style={card}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <StepDot active={true} done={false} />
          <StepDot active={false} done={false} />
          <StepDot active={false} done={false} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👋</div>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', margin: '0 0 10px' }}>
            Olá, {firstName}!
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(26,43,28,0.60)', lineHeight: 1.6, margin: 0 }}>
            Bem-vindo ao seu espaço familiar. Em poucos passos, vamos organizar a rotina dos seus filhos — escola, saúde, atividades e muito mais.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { icon: '📅', text: 'Agenda escolar e atividades centralizadas' },
            { icon: '🤖', text: 'IA que organiza por foto ou texto' },
            { icon: '👫', text: 'Compartilhe com o seu parceiro(a)' },
          ].map(({ icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(61,102,65,0.05)', borderRadius: 12 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 14, color: '#2C4A2E', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        <button style={btn} onClick={() => setStep('children')}>
          Vamos começar <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )

  // ── Step: Children ─────────────────────────────────────────────────────
  if (step === 'children') return (
    <div style={container}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌿</div>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 18, fontWeight: 700, color: '#1A2B1C', margin: 0 }}>
          Família em Foco
        </h1>
      </div>

      <div style={{ ...card, maxHeight: 'calc(100dvh - 140px)', overflowY: 'auto' }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <StepDot active={false} done={true} />
          <StepDot active={true} done={false} />
          <StepDot active={false} done={false} />
        </div>

        <div>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 20, fontWeight: 700, color: '#1A2B1C', margin: '0 0 6px' }}>
            Quem são seus filhos?
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(26,43,28,0.55)', margin: 0 }}>
            Adicione um ou mais filhos para começar. Você pode editar depois.
          </p>
        </div>

        {/* Child cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {children.map((child, i) => (
            <ChildCard
              key={child.id}
              child={child}
              index={i}
              onChange={updateChild}
              onRemove={removeChild}
              canRemove={children.length > 1}
            />
          ))}
        </div>

        {/* Add child button */}
        <button
          type="button"
          onClick={addChild}
          style={{
            width: '100%', padding: '12px', borderRadius: 13,
            border: '1.5px dashed rgba(61,102,65,0.35)',
            background: 'rgba(61,102,65,0.04)', color: '#3D6641',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
          <Plus size={16} /> Adicionar outro filho
        </button>

        {error && (
          <p style={{ color: '#DC2626', fontSize: 13, textAlign: 'center', margin: 0 }}>{error}</p>
        )}

        <button style={btn} onClick={saveChildren} disabled={saving}>
          {saving ? 'Salvando...' : <><Check size={16} /> Confirmar filhos <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  )

  // ── Step: Invite ───────────────────────────────────────────────────────
  if (step === 'invite') return (
    <div style={container}>
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌿</div>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 18, fontWeight: 700, color: '#1A2B1C', margin: 0 }}>
          Família em Foco
        </h1>
      </div>

      <div style={card}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <StepDot active={false} done={true} />
          <StepDot active={false} done={true} />
          <StepDot active={true} done={false} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👫</div>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 20, fontWeight: 700, color: '#1A2B1C', margin: '0 0 8px' }}>
            Convide seu parceiro(a)
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(26,43,28,0.55)', lineHeight: 1.6, margin: 0 }}>
            Compartilhe a rotina dos filhos em tempo real. Você pode convidar depois também.
          </p>
        </div>

        {inviteLink && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Link box */}
            <div style={{
              background: 'rgba(61,102,65,0.06)', borderRadius: 12,
              padding: '12px 14px', border: '1px solid rgba(61,102,65,0.15)',
              fontSize: 12, color: '#2C4A2E', wordBreak: 'break-all', lineHeight: 1.5,
            }}>
              {inviteLink}
            </div>

            <button onClick={copyLink} style={{
              ...btn,
              background: copied ? 'linear-gradient(140deg,#059669,#047857)' : 'linear-gradient(140deg,#3D6641,#2C4A2E)',
            }}>
              {copied ? <><Check size={16} /> Copiado!</> : 'Copiar link de convite'}
            </button>

            <button onClick={sendWhatsApp} style={{
              ...btn,
              background: 'linear-gradient(140deg,#25D366,#128C7E)',
            }}>
              <span style={{ fontSize: 16 }}>💬</span> Enviar pelo WhatsApp
            </button>
          </div>
        )}

        <button
          onClick={finish}
          style={{
            width: '100%', padding: '13px', borderRadius: 13,
            border: '1.5px solid rgba(61,102,65,0.25)',
            background: 'transparent', color: '#3D6641',
            fontWeight: 600, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
          <Users size={15} /> Convidar depois
        </button>
      </div>
    </div>
  )

  // ── Step: Done ─────────────────────────────────────────────────────────
  return (
    <div style={container}>
      <div style={card}>
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 22, fontWeight: 700, color: '#1A2B1C', margin: '0 0 10px' }}>
            Tudo pronto!
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(26,43,28,0.60)', margin: 0 }}>
            Seu espaço familiar está configurado. Comece adicionando atividades ou usando a IA para organizar a agenda.
          </p>
        </div>
        <button style={btn} onClick={finish}>
          <Sparkles size={16} /> Ir para o dashboard
        </button>
      </div>
    </div>
  )
}
