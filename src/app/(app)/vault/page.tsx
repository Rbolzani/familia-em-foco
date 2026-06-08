import { ExternalLink, Shield, HeartPulse, BadgeCheck, FileText, CreditCard, Lock } from 'lucide-react'

// ── Musgo noise texture ──────────────────────────────────────────────────
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`

const CARD: React.CSSProperties = {
  borderRadius: '17px 11px 15px 13px',
  background: `${NOISE}, linear-gradient(160deg,#FFFFFF 0%,#F5F0E8 100%)`,
  backgroundSize: '200px 200px, 100% 100%',
  border: '1px solid rgba(61,102,65,0.22)',
  boxShadow: '0 4px 16px rgba(44,74,46,0.10),0 1px 4px rgba(44,74,46,0.07),0 -1px 0 rgba(255,255,255,0.85) inset',
}

const categories = [
  {
    icon: HeartPulse,
    label: 'Saúde',
    desc: 'Exames, receitas, histórico',
    ibg: 'linear-gradient(140deg,#D1FAE5,#A7F3D0)',
    icolor: '#065F46',
  },
  {
    icon: BadgeCheck,
    label: 'Identidade',
    desc: 'RG, certidão, passaporte',
    ibg: 'linear-gradient(140deg,#DBEAFE,#BFDBFE)',
    icolor: '#2563EB',
  },
  {
    icon: FileText,
    label: 'Contratos',
    desc: 'Matrículas, planos',
    ibg: 'linear-gradient(140deg,#FEF3C7,#FDE68A)',
    icolor: '#92400E',
  },
  {
    icon: CreditCard,
    label: 'Carteirinhas',
    desc: 'Plano de saúde, estudante',
    ibg: 'linear-gradient(140deg,#EDE9FE,#DDD6FE)',
    icolor: '#6D28D9',
  },
]

export default function VaultPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="animate-fade-up">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] mb-2 flex items-center gap-2"
          style={{ color: '#5A8C5E' }}>
          <span className="inline-block w-4 h-[2px] rounded"
            style={{ background: 'linear-gradient(90deg,#5A8C5E,#C49A6C)' }} />
          Repositório Seguro
        </p>
        <h1 style={{ fontFamily: 'var(--font-lora)', fontSize: 34, fontWeight: 700, color: '#1A2B1C', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
          Documentos
        </h1>
        <p className="text-sm mt-1 italic" style={{ color: 'rgba(26,43,28,0.50)' }}>
          Cofre digital para documentos importantes dos seus filhos.
        </p>
      </div>

      {/* ── Hero card — dark green (Musgo) ── */}
      <div className="animate-fade-up overflow-hidden relative"
        style={{
          borderRadius: '20px 13px 18px 15px',
          background: 'linear-gradient(140deg,#2C4A2E 0%,#1E3320 100%)',
          border: '1px solid rgba(44,74,46,0.35)',
          boxShadow: '0 8px 28px rgba(44,74,46,0.30),0 -1px 0 rgba(255,255,255,0.12) inset,0 1px 0 rgba(0,0,0,0.20) inset',
        }}>

        {/* Decorative orbs */}
        <div className="absolute pointer-events-none"
          style={{ top: -32, right: -24, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div className="absolute pointer-events-none"
          style={{ bottom: -28, left: 40, width: 90, height: 90, borderRadius: '50%', background: 'rgba(196,154,108,0.10)' }} />

        <div className="relative p-8 text-center">
          <div className="w-20 h-20 rounded-[24px] flex items-center justify-center mx-auto mb-5"
            style={{
              background: 'linear-gradient(140deg,#C49A6C,#8B6B4A)',
              boxShadow: '0 10px 32px rgba(0,0,0,0.25),0 -1px 0 rgba(255,255,255,0.18) inset',
            }}>
            <Lock size={36} color="#FAF3E8" />
          </div>

          <h2 style={{ fontFamily: 'var(--font-lora)', fontSize: 26, fontWeight: 700, color: '#D4E8D5', marginBottom: 8 }}>
            DocVault
          </h2>
          <p className="text-sm mb-6 max-w-sm mx-auto italic"
            style={{ color: 'rgba(212,232,213,0.65)' }}>
            Seus documentos estão no DocVault — o cofre digital para organizar saúde, identidade, contratos e carteirinhas dos filhos.
          </p>

          <a href="https://rbolzani.github.io/app-vault" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all hover:-translate-y-[2px]"
            style={{
              background: 'linear-gradient(140deg,#3D6641,#2C4A2E)',
              color: '#D4E8D5',
              border: '1px solid rgba(255,255,255,0.20)',
              boxShadow: '0 6px 20px rgba(0,0,0,0.25),0 -1px 0 rgba(255,255,255,0.12) inset',
            }}>
            Abrir DocVault <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* ── Category cards ── */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat, i) => (
          <div key={i} className="animate-fade-up transition-all cursor-pointer"
            style={{ ...CARD, padding: '18px 16px', animationDelay: `${i * 0.06}s` }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = 'translateY(-3px) rotate(-0.35deg)'
              el.style.boxShadow = '0 10px 32px rgba(44,74,46,0.13),0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.85) inset'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = ''
              el.style.boxShadow = ''
            }}>
            <div className="w-10 h-10 rounded-[13px] flex items-center justify-center mb-3"
              style={{ backgroundImage: cat.ibg, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 4px rgba(44,74,46,0.09),0 -1px 0 rgba(255,255,255,0.60) inset' }}>
              <cat.icon size={18} color={cat.icolor} strokeWidth={2} />
            </div>
            <div className="font-bold text-sm" style={{ color: '#1A2B1C' }}>{cat.label}</div>
            <div className="text-xs mt-0.5 italic" style={{ color: 'rgba(26,43,28,0.45)' }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      {/* ── Security note ── */}
      <div className="animate-fade-up flex items-center gap-3 p-4"
        style={{ ...CARD, background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"), linear-gradient(140deg,#EBF3EB 0%,#D4E8D5 100%)`, backgroundSize: '200px 200px, 100% 100%', border: '1px solid rgba(61,102,65,0.28)' }}>
        <div className="w-10 h-10 rounded-[13px] flex items-center justify-center flex-none"
          style={{ background: 'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow: '0 4px 14px rgba(44,74,46,0.25)' }}>
          <Shield size={18} color="#D4E8D5" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#2C4A2E' }}>Segurança garantida</div>
          <div className="text-xs mt-0.5 italic" style={{ color: 'rgba(44,74,46,0.65)' }}>
            Documentos criptografados e armazenados com segurança de nível bancário.
          </div>
        </div>
      </div>

    </div>
  )
}
