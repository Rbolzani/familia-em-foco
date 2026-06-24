'use client'
import React from 'react'
import { Plus, X } from 'lucide-react'
import { getDocType, type DocType, type DocField, type VacinaItem } from '@/lib/docTypes'

interface Props {
  docType: DocType
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

const LABEL = 'block text-[11px] font-bold uppercase tracking-wider mb-1.5'
const LABEL_STYLE: React.CSSProperties = { color: 'rgba(26,43,28,0.50)' }

// Renderiza dinamicamente os campos específicos da natureza do documento.
// Usado nos formulários de upload (overview/gaveta) e na edição do detalhe.
export default function DocFormFields({ docType, values, onChange }: Props) {
  const def = getDocType(docType)
  return (
    <>
      {def.fields.map(f => (
        <Field key={f.key} f={f} value={values[f.key]} onChange={v => onChange(f.key, v)} />
      ))}
    </>
  )
}

function Field({ f, value, onChange }: { f: DocField; value: unknown; onChange: (v: unknown) => void }) {
  if (f.format === 'vacinas') {
    return <VacinasEditor label={f.label} items={(value as VacinaItem[]) ?? []} onChange={onChange} />
  }
  if (f.format === 'sim_nao') {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
        <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)}
          style={{ accentColor: '#3D6641', width: 16, height: 16 }} />
        <span className="text-sm font-medium" style={{ color: '#1A2B1C' }}>{f.label}</span>
      </label>
    )
  }
  if (f.format === 'textarea') {
    return (
      <div>
        <label className={LABEL} style={LABEL_STYLE}>{f.label}</label>
        <textarea className="input-field w-full resize-none" rows={2}
          value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} />
      </div>
    )
  }
  const type = f.format === 'data' ? 'date' : 'text'
  const placeholder =
    f.format === 'valor' ? 'R$ 0,00' :
    f.format === 'cpf_cnpj' ? '000.000.000-00' :
    f.format === 'crm' ? 'CRM/UF 000000' : undefined
  return (
    <div>
      <label className={LABEL} style={LABEL_STYLE}>{f.label}</label>
      <input type={type} inputMode={f.format === 'valor' ? 'decimal' : undefined}
        className="input-field w-full" placeholder={placeholder}
        value={(value as string) ?? ''} onChange={e => onChange(e.target.value)} />
    </div>
  )
}

function VacinasEditor({ label, items, onChange }: { label: string; items: VacinaItem[]; onChange: (v: VacinaItem[]) => void }) {
  function update(i: number, patch: Partial<VacinaItem>) {
    onChange(items.map((it, j) => j === i ? { ...it, ...patch } : it))
  }
  function add() {
    onChange([...items, { nome: '', data_aplicacao: null, dose: null, proxima_dose: null }])
  }
  function remove(i: number) {
    onChange(items.filter((_, j) => j !== i))
  }
  return (
    <div>
      <label className={LABEL} style={LABEL_STYLE}>{label}</label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-xl p-2.5 space-y-2" style={{ background: 'rgba(61,102,65,0.06)', border: '1px solid rgba(61,102,65,0.14)' }}>
            <div className="flex items-center gap-2">
              <input className="input-field w-full" placeholder="Vacina (ex: Tríplice viral)"
                value={it.nome ?? ''} onChange={e => update(i, { nome: e.target.value })} />
              <button type="button" onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-black/10 flex-shrink-0" title="Remover">
                <X size={15} color="rgba(26,43,28,0.50)" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="block text-[10px] font-semibold mb-1" style={{ color: 'rgba(26,43,28,0.45)' }}>Aplicada em</span>
                <input type="date" className="input-field w-full" value={it.data_aplicacao ?? ''} onChange={e => update(i, { data_aplicacao: e.target.value || null })} />
              </div>
              <div>
                <span className="block text-[10px] font-semibold mb-1" style={{ color: 'rgba(26,43,28,0.45)' }}>Dose</span>
                <input className="input-field w-full" placeholder="1ª / reforço" value={it.dose ?? ''} onChange={e => update(i, { dose: e.target.value || null })} />
              </div>
              <div>
                <span className="block text-[10px] font-semibold mb-1" style={{ color: 'rgba(26,43,28,0.45)' }}>Próxima dose</span>
                <input type="date" className="input-field w-full" value={it.proxima_dose ?? ''} onChange={e => update(i, { proxima_dose: e.target.value || null })} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={add}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed text-xs font-bold transition-colors hover:bg-black/5"
          style={{ borderColor: 'rgba(61,102,65,0.30)', color: '#3D6641' }}>
          <Plus size={13} /> Adicionar vacina
        </button>
      </div>
    </div>
  )
}
