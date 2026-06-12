'use client'
import React from 'react'
import Link from 'next/link'
import { HeartPulse, BadgeCheck, FileText, CreditCard, Shield, ChevronRight, Sparkles } from 'lucide-react'
import { Child, DocumentCategory } from '@/lib/types'
import { useAccess } from '@/components/access/AccessContext'

interface DocSummary {
  id: string
  category: string
  child_id: string | null
  expires_at: string | null
}

interface Props {
  children: Child[]
  documents: DocSummary[]
}

const CATEGORIES: { key: DocumentCategory; label: string; desc: string; icon: React.ElementType; accent: string; iconBg: string; iconColor: string }[] = [
  { key: 'saude',        label: 'Saúde',         desc: 'Exames, receitas, histórico',    icon: HeartPulse,  accent: '#10B981', iconBg: 'rgba(16,185,129,0.12)',  iconColor: '#065F46' },
  { key: 'identidade',   label: 'Identidade',    desc: 'RG, certidão, passaporte',       icon: BadgeCheck,  accent: '#3B82F6', iconBg: 'rgba(59,130,246,0.12)',  iconColor: '#1E40AF' },
  { key: 'contratos',    label: 'Contratos',     desc: 'Matrículas, planos de saúde',    icon: FileText,    accent: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)',  iconColor: '#92400E' },
  { key: 'carteirinhas', label: 'Carteirinhas',  desc: 'Plano de saúde, estudante',      icon: CreditCard,  accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.12)',  iconColor: '#5B21B6' },
]

function isExpired(date: string | null) {
  if (!date) return false
  return new Date(date) < new Date()
}
function isExpiringSoon(date: string | null) {
  if (!date) return false
  const d = new Date(date)
  const now = new Date()
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= 30
}

export default function VaultClient({ children, documents }: Props) {
  const { canEdit } = useAccess()
  const countByCategory = (cat: DocumentCategory) =>
    documents.filter(d => d.category === cat).length

  const alertCount = documents.filter(d => isExpired(d.expires_at) || isExpiringSoon(d.expires_at)).length

  const CARD: React.CSSProperties = {
    background: 'linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)',
    border: '1px solid rgba(61,102,65,0.18)',
    boxShadow: '0 4px 16px rgba(44,74,46,0.08),0 1px 4px rgba(44,74,46,0.05)',
    borderRadius: 16,
  }

  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2"
          style={{ color: '#5A8C5E' }}>
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
            <Sparkles size={14} />
            Captura com IA
          </Link>
        )}
      </div>

      {/* Alerta de vencimento */}
      {alertCount > 0 && (
        <div className="animate-fade-up flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)' }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <p style={{ fontSize: 13, color: '#92400E', fontWeight: 600 }}>
            {alertCount} documento{alertCount > 1 ? 's' : ''} vencido{alertCount > 1 ? 's' : ''} ou próximo{alertCount > 1 ? 's' : ''} do vencimento
          </p>
        </div>
      )}

      {/* Gavetas */}
      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat, i) => {
          const count = countByCategory(cat.key)
          return (
            <Link key={cat.key} href={`/vault/${cat.key}`}
              className="animate-fade-up block transition-all hover:-translate-y-[2px] group"
              style={{ animationDelay: `${i * 0.06}s`, textDecoration: 'none' }}>
              <div style={{ ...CARD, padding: '18px 16px', borderLeft: `4px solid ${cat.accent}` }}
                className="group-hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-shrink-0"
                    style={{ background: cat.iconBg }}>
                    <cat.icon size={18} color={cat.iconColor} strokeWidth={2} />
                  </div>
                  <ChevronRight size={14} color="rgba(26,43,28,0.30)" />
                </div>
                <div className="font-bold text-sm" style={{ color: '#1A2B1C' }}>{cat.label}</div>
                <div className="text-xs mt-0.5 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>{cat.desc}</div>
                <div className="mt-3 text-xs font-bold" style={{ color: cat.accent }}>
                  {count} documento{count !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Segurança */}
      <div className="animate-fade-up flex items-center gap-3 p-4"
        style={{ ...CARD, background: 'linear-gradient(140deg,#EBF3EB 0%,#D4E8D5 100%)', border: '1px solid rgba(61,102,65,0.28)' }}>
        <div className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-none"
          style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 14px rgba(44,74,46,0.25)' }}>
          <Shield size={18} color="#D4E8D5" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#2C4A2E' }}>Segurança garantida</div>
          <div className="text-xs mt-0.5 italic" style={{ color: 'rgba(44,74,46,0.65)' }}>
            Documentos armazenados com segurança de nível bancário no Supabase.
          </div>
        </div>
      </div>

    </div>
  )
}
