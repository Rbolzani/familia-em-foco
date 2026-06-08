import { FileText, ExternalLink, Shield, Lock, FolderOpen } from 'lucide-react'

export default function VaultPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Header */}
      <div className="animate-fade-up">
        <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#8B7A68' }}>
          🗄️ Repositório
        </p>
        <h1 className="font-fraunces text-3xl font-bold" style={{ color: '#0F1F3D' }}>
          Documentos
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8B7A68' }}>
          Cofre digital para documentos importantes dos seus filhos.
        </p>
      </div>

      {/* Hero card */}
      <div
        className="card animate-fade-up overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#0F1F3D,#1D3461)', border: 'none', padding: 0 }}
      >
        {/* Decorative */}
        <div className="relative p-8 text-center">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#F5A623,transparent)' }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle,#00C48C,transparent)' }} />

          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 relative"
            style={{ background: 'linear-gradient(135deg,#F5A623,#E09014)', boxShadow: '0 10px 32px rgba(245,166,35,.35)' }}>
            <Lock size={36} color="white" />
          </div>

          <h2 className="font-fraunces text-2xl font-bold text-white mb-2">
            DocVault
          </h2>
          <p className="text-sm mb-6 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,.55)' }}>
            Seus documentos estão no DocVault — o cofre digital para organizar saúde, identidade, contratos e carteirinhas dos filhos.
          </p>

          <a
            href="https://rbolzani.github.io/app-vault"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#F4522D,#D93D1A)', boxShadow: '0 6px 20px rgba(244,82,45,.4)' }}
          >
            Abrir DocVault <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-2 gap-3 stagger animate-fade-up">
        {[
          { icon: '🩺', label: 'Saúde',       desc: 'Exames, receitas, histórico',  color: '#00C48C', bg: '#E6FBF4' },
          { icon: '🪪', label: 'Identidade',  desc: 'RG, certidão, passaporte',     color: '#2563EB', bg: '#EEF4FF' },
          { icon: '📄', label: 'Contratos',   desc: 'Matrículas, planos',           color: '#F5A623', bg: '#FFF8E6' },
          { icon: '💳', label: 'Carteirinhas',desc: 'Plano de saúde, estudante',    color: '#7C3AED', bg: '#F3EEFF' },
        ].map((cat, i) => (
          <div
            key={i}
            className="card card-lift p-4 animate-fade-up"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <span className="text-2xl w-10 h-10 rounded-xl flex items-center justify-center mb-2"
              style={{ background: cat.bg }}>
              {cat.icon}
            </span>
            <div className="font-bold text-sm" style={{ color: '#0F1F3D' }}>{cat.label}</div>
            <div className="text-xs mt-0.5" style={{ color: '#8B7A68' }}>{cat.desc}</div>
          </div>
        ))}
      </div>

      {/* Security note */}
      <div className="card animate-fade-up p-4 flex items-center gap-3"
        style={{ background: '#F3EEFF', border: '1px solid #DDD6FE' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
          style={{ background: '#7C3AED' }}>
          <Shield size={18} color="white" />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#7C3AED' }}>Segurança garantida</div>
          <div className="text-xs mt-0.5" style={{ color: '#6D28D9' }}>
            Documentos criptografados e armazenados com segurança de nível bancário.
          </div>
        </div>
      </div>

    </div>
  )
}
