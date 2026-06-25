import { Headphones } from 'lucide-react'
import SupportButton from '@/components/ui/SupportButton'

export default function SuportePage() {
  return (
    <div style={{ minHeight:'100vh', background:'#F8F3EA', paddingBottom:'env(safe-area-inset-bottom, 24px)' }}>

      {/* Header */}
      <div style={{ padding:'28px 24px 20px', borderBottom:'1px solid rgba(61,102,65,0.12)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
          <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center',
            background:'linear-gradient(140deg,#3D6641,#2C4A2E)', boxShadow:'0 4px 14px rgba(44,74,46,0.22)' }}>
            <Headphones size={19} color="#D4E8D5" />
          </div>
          <h1 style={{ fontFamily:'var(--font-lora)', fontSize:22, fontWeight:700, color:'#1A2B1C', margin:0 }}>
            Suporte
          </h1>
        </div>
        <p style={{ fontSize:13, color:'rgba(26,43,28,0.50)', margin:0 }}>
          Estamos aqui para ajudar você e sua família
        </p>
      </div>

      <div style={{ padding:'28px 24px', display:'flex', flexDirection:'column', gap:24 }}>

        {/* Card principal */}
        <div style={{ background:'#FFFFFF', borderRadius:18, padding:'28px 24px',
          border:'1px solid rgba(61,102,65,0.10)',
          boxShadow:'0 2px 16px rgba(44,74,46,0.07)',
          display:'flex', flexDirection:'column', alignItems:'center', gap:20, textAlign:'center' }}>

          <div>
            <p style={{ fontSize:15, fontWeight:600, color:'#1A2B1C', margin:'0 0 6px' }}>
              Fale diretamente com nossa equipe
            </p>
            <p style={{ fontSize:13, color:'rgba(26,43,28,0.50)', margin:0, lineHeight:1.6 }}>
              Clique no botão abaixo e abriremos o WhatsApp com<br />
              suas informações já preenchidas.
            </p>
          </div>

          <SupportButton />
        </div>

        {/* Card dicas */}
        <div style={{ background:'rgba(61,102,65,0.05)', borderRadius:14, padding:'18px 20px',
          border:'1px solid rgba(61,102,65,0.10)' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'rgba(26,43,28,0.45)', textTransform:'uppercase',
            letterSpacing:'0.10em', margin:'0 0 10px' }}>
            Antes de entrar em contato
          </p>
          <ul style={{ margin:0, padding:'0 0 0 16px', display:'flex', flexDirection:'column', gap:6 }}>
            {[
              'Confira se o app está atualizado',
              'Tente fechar e reabrir a página com o problema',
              'Verifique sua conexão com a internet',
            ].map(tip => (
              <li key={tip} style={{ fontSize:13, color:'rgba(26,43,28,0.60)', lineHeight:1.5 }}>{tip}</li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
