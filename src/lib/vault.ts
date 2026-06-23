import {
  HeartPulse, BadgeCheck, FileText, CreditCard,
  GraduationCap, Syringe, FileSignature, Wallet, FolderClosed,
} from 'lucide-react'
import type { DocumentCategory } from './types'

export interface VaultCategory {
  key: DocumentCategory
  label: string
  desc: string
  icon: React.ElementType
  accent: string
  iconBg: string
  iconColor: string
}

export const VAULT_CATEGORIES: VaultCategory[] = [
  { key: 'saude',        label: 'Saúde',        desc: 'Exames, receitas, histórico', icon: HeartPulse,     accent: '#10B981', iconBg: 'rgba(16,185,129,0.12)', iconColor: '#065F46' },
  { key: 'identidade',   label: 'Identidade',   desc: 'RG, certidão, passaporte',    icon: BadgeCheck,     accent: '#3B82F6', iconBg: 'rgba(59,130,246,0.12)', iconColor: '#1E40AF' },
  { key: 'contratos',    label: 'Contratos',    desc: 'Matrículas, planos',          icon: FileText,       accent: '#F59E0B', iconBg: 'rgba(245,158,11,0.12)', iconColor: '#92400E' },
  { key: 'carteirinhas', label: 'Carteirinhas', desc: 'Plano de saúde, estudante',   icon: CreditCard,     accent: '#8B5CF6', iconBg: 'rgba(139,92,246,0.12)', iconColor: '#5B21B6' },
  { key: 'escolar',      label: 'Escolar',      desc: 'Boletins, declarações',       icon: GraduationCap,  accent: '#0891B2', iconBg: 'rgba(8,145,178,0.12)',  iconColor: '#0E7490' },
  { key: 'vacinacao',    label: 'Vacinação',    desc: 'Carteira e comprovantes',     icon: Syringe,        accent: '#DB2777', iconBg: 'rgba(219,39,119,0.12)', iconColor: '#9D174D' },
  { key: 'autorizacoes', label: 'Autorizações', desc: 'Viagem, terceiros, escola',   icon: FileSignature,  accent: '#059669', iconBg: 'rgba(5,150,105,0.12)',  iconColor: '#065F46' },
  { key: 'financeiro',   label: 'Financeiro',   desc: 'Recibos, comprovantes',       icon: Wallet,         accent: '#CA8A04', iconBg: 'rgba(202,138,4,0.12)',  iconColor: '#854D0E' },
  { key: 'outros',       label: 'Outros',       desc: 'Demais documentos',           icon: FolderClosed,   accent: '#6B7280', iconBg: 'rgba(107,114,128,0.12)', iconColor: '#374151' },
]

export const VAULT_CATEGORY_KEYS = VAULT_CATEGORIES.map(c => c.key)

export function getVaultCategory(key: string): VaultCategory | undefined {
  return VAULT_CATEGORIES.find(c => c.key === key)
}

// ── Status de vencimento (farol) ─────────────────────────────────────────────
export type ExpiryStatus = 'valido' | 'a_vencer' | 'vencido' | 'sem_data'

const SOON_DAYS = 30

export function expiryStatus(expires_at: string | null | undefined): ExpiryStatus {
  if (!expires_at) return 'sem_data'
  const d = new Date(expires_at + 'T23:59:59')
  const diffDays = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
  if (diffDays < 0) return 'vencido'
  if (diffDays <= SOON_DAYS) return 'a_vencer'
  return 'valido'
}

/** Dias até vencer (negativo = vencido). null se sem data. */
export function daysToExpiry(expires_at: string | null | undefined): number | null {
  if (!expires_at) return null
  const d = new Date(expires_at + 'T23:59:59')
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000)
}

export const EXPIRY_META: Record<ExpiryStatus, { label: string; bg: string; color: string }> = {
  valido:   { label: 'Em dia',        bg: 'rgba(59,109,17,0.12)',  color: '#27500A' },
  a_vencer: { label: 'Vence em breve', bg: 'rgba(245,158,11,0.14)', color: '#854F0B' },
  vencido:  { label: 'Vencido',        bg: 'rgba(220,38,38,0.10)',  color: '#A32D2D' },
  sem_data: { label: 'Sem validade',   bg: 'rgba(107,114,128,0.10)', color: '#4B5563' },
}

/** Rótulo curto e humano do prazo (ex.: "vence em 5 dias", "vencido há 2 dias"). */
export function expiryLabel(expires_at: string | null | undefined): string {
  const n = daysToExpiry(expires_at)
  if (n === null) return 'Sem validade'
  if (n < 0)  return `vencido há ${Math.abs(n)} ${Math.abs(n) === 1 ? 'dia' : 'dias'}`
  if (n === 0) return 'vence hoje'
  if (n === 1) return 'vence amanhã'
  return `vence em ${n} dias`
}
