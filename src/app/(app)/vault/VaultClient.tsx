'use client'
import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Sparkles, Search, Users, Home, X } from 'lucide-react'
import { Child } from '@/lib/types'
import { useAccess } from '@/components/access/AccessContext'
import { VAULT_CATEGORIES, getVaultCategory, expiryStatus, EXPIRY_META, expiryLabel } from '@/lib/vault'

interface DocSummary {
  id: string
  category: string
  child_id: string | null
  title: string
  expires_at: string | null
}

interface Props {
  children: Child[]
  documents: DocSummary[]
}

type StatusFilter = 'todos' | 'a_vencer' | 'vencido'

export default function VaultClient({ children, documents }: Props) {
  const { canEdit } = useAccess()
  const [status, setStatus]     = useState<StatusFilter>('todos')
  const [childId, setChildId]   = useState<string | 'fam' | null>(null) // null = todos
  const [showChild, setShowChild] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery]       = useState('')

  const childName = (id: string | null) => children.find(c => c.id === id)?.name ?? null

  const counts = useMemo(() => {
    let ok = 0, soon = 0, late = 0
    for (const d of documents) {
      const s = expiryStatus(d.expires_at)
      if (s === 'vencido') late++
      else if (s === 'a_vencer') soon++
      else ok++ // valido + sem_data contam como "em dia"
    }
    return { ok, soon, late }
  }, [documents])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return documents.filter(d => {
      if (status === 'a_vencer' && expiryStatus(d.expires_at) !== 'a_vencer') return false
      if (status === 'vencido' && expiryStatus(d.expires_at) !== 'vencido') return false
      if (childId === 'fam' && d.child_id !== null) return false
      if (childId && childId !== 'fam' && d.child_id !== childId) return false
      if (q && !d.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [documents, status, childId, query])

  const countByCategory = (cat: string) => documents.filter(d => d.category === cat).length

  const CARD: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }
  const pill = (active: boolean): React.CSSProperties => ({
    fontSize: 12.5, fontWeight: 600, padding: '6px 13px', borderRadius: 999, cursor: 'pointer',
    border: active ? '1px solid transparent' : '1px solid rgba(61,102,65,0.22)',
    background: active ? 'linear-gradient(140deg,#3D6641,#2C4A2E)' : '#fff',
    color: active ? '#fff' : 'rgba(26,43,28,0.65)',
    display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  })

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2" style={{ color: '#5A8C5E' }}>
          <span className="inline-block w-4 h-[2px] rounded" style={{ background: 'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
          Repositório Seguro
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 34, fontWeight: 700, color: '#1A2B1C', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Documentos
        </h1>
        <p className="text-sm mt-1 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
          Cofre digital para documentos importantes dos seus filhos.
        </p>
        {canEdit && (
          <Link href="/ia" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-2xl font-bold text-sm transition-all hover:brightness-105 active:scale-95"
            style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', color: '#D4E8D5', boxShadow: '0 4px 14px rgba(44,74,46,0.25)', textDecoration: 'none' }}>
            <Sparkles size={14} /> Captura com IA
          </Link>
        )}
      </div>

      {/* Farol de status */}
      <div className="grid grid-cols-3 gap-3 animate-fade-up">
        {[
          { n: counts.ok,   label: 'Em dia',   emoji: '🟢', bg: 'rgba(59,109,17,0.10)',  color: '#27500A' },
          { n: counts.soon, label: 'A vencer',  emoji: '🟡', bg: 'rgba(245,158,11,0.12)', color: '#854F0B' },
          { n: counts.late, label: 'Vencidos',  emoji: '🔴', bg: 'rgba(220,38,38,0.09)',  color: '#A32D2D' },
        ].map(c => (
          <div key={c.label} style={{ background: c.bg, borderRadius: 14, padding: '12px 14px' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: c.color }}>{c.n}</div>
            <div style={{ fontSize: 12, color: c.color, fontWeight: 600 }}>{c.emoji} {c.label}</div>
          </div>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button style={pill(status === 'todos')} onClick={() => setStatus('todos')}>Todos</button>
          <button style={pill(status === 'a_vencer')} onClick={() => setStatus('a_vencer')}>A vencer</button>
          <button style={pill(status === 'vencido')} onClick={() => setStatus('vencido')}>Vencidos</button>
          <button style={pill(childId !== null)} onClick={() => setShowChild(v => !v)}>
            <Users size={13} /> {childId && childId !== 'fam' ? childName(childId) : childId === 'fam' ? 'Família' : 'Por filho'}
          </button>
          <button style={pill(showSearch || !!query)} onClick={() => setShowSearch(v => !v)}>
            <Search size={13} /> Buscar
          </button>
        </div>

        {showChild && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button style={pill(childId === null)} onClick={() => { setChildId(null); setShowChild(false) }}>Todos</button>
            {children.map(c => (
              <button key={c.id} style={pill(childId === c.id)} onClick={() => { setChildId(c.id); setShowChild(false) }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: c.avatar_color, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                  {c.name.charAt(0).toUpperCase()}
                </span>
                {c.name}
              </button>
            ))}
            <button style={pill(childId === 'fam')} onClick={() => { setChildId('fam'); setShowChild(false) }}>
              <Home size={12} /> Família
            </button>
          </div>
        )}

        {showSearch && (
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,43,28,0.40)' }} />
            <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por título…"
              style={{ width: '100%', padding: '10px 34px', borderRadius: 12, border: '1px solid rgba(61,102,65,0.22)', fontSize: 14, outline: 'none', background: '#fff', color: '#1A2B1C' }} />
            {query && <X size={15} onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(26,43,28,0.40)', cursor: 'pointer' }} />}
          </div>
        )}
      </div>

      {/* Gavetas */}
      <div className="grid grid-cols-2 gap-3">
        {VAULT_CATEGORIES.map((cat, i) => {
          const count = countByCategory(cat.key)
          return (
            <Link key={cat.key} href={`/vault/${cat.key}`}
              className="animate-fade-up block transition-all hover:-translate-y-[2px] group"
              style={{ animationDelay: `${i * 0.04}s`, textDecoration: 'none' }}>
              <div style={{ ...CARD, padding: '16px 14px', borderLeft: `4px solid ${cat.accent}` }}>
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: cat.iconBg }}>
                    <cat.icon size={17} color={cat.iconColor} strokeWidth={2} />
                  </div>
                  <ChevronRight size={14} color="rgba(26,43,28,0.30)" />
                </div>
                <div className="font-bold text-sm" style={{ color: '#1A2B1C' }}>{cat.label}</div>
                <div className="text-[11px] mt-0.5 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>{cat.desc}</div>
                <div className="mt-2 text-xs font-bold" style={{ color: cat.accent }}>
                  {count} {count === 1 ? 'documento' : 'documentos'}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Lista filtrada */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(26,43,28,0.40)' }}>
          {status === 'todos' && childId === null && !query ? 'Próximos vencimentos' : `Resultados · ${filtered.length}`}
        </p>
        {filtered.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'rgba(26,43,28,0.40)' }}>Nenhum documento encontrado com esses filtros.</p>
        ) : (
          <div className="space-y-2">
            {filtered
              .slice()
              .sort((a, b) => (a.expires_at ?? '9999').localeCompare(b.expires_at ?? '9999'))
              .slice(0, 12)
              .map(d => {
                const cat = getVaultCategory(d.category)
                const st = expiryStatus(d.expires_at)
                const meta = EXPIRY_META[st]
                const cn = childName(d.child_id)
                const Icon = cat?.icon
                return (
                  <Link key={d.id} href={`/vault/${d.category}/${d.id}`}
                    className="flex items-center gap-3 transition-all hover:-translate-y-[1px]"
                    style={{ ...CARD, padding: '10px 12px', textDecoration: 'none' }}>
                    <div className="w-9 h-9 rounded-[11px] flex items-center justify-center flex-shrink-0" style={{ background: cat?.iconBg }}>
                      {Icon && <Icon size={16} color={cat?.iconColor} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1A2B1C', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.title}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(26,43,28,0.45)' }}>
                        {cat?.label}{cn ? ` · ${cn}` : d.child_id === null ? ' · família' : ''}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: meta.bg, color: meta.color, whiteSpace: 'nowrap' }}>
                      {st === 'sem_data' ? 'sem validade' : expiryLabel(d.expires_at)}
                    </span>
                  </Link>
                )
              })}
          </div>
        )}
      </div>

    </div>
  )
}
