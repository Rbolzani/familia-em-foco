'use client'
import { Mic, Loader2 } from 'lucide-react'
import { useVoiceInput } from '@/hooks/useVoiceInput'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  onError?: (message: string) => void
  disabled?: boolean
}

export function VoiceInputButton({ onTranscript, onError, disabled }: VoiceInputButtonProps) {
  const { state, start, stop } = useVoiceInput({ onTranscript, onError })

  const isRecording    = state === 'recording'
  const isTranscribing = state === 'transcribing'

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault()
    if (!disabled && !isTranscribing) start()
  }

  function handlePointerUp() {
    if (isRecording) stop()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <button
        type="button"
        aria-label={isRecording ? 'Gravando — solte para transcrever' : isTranscribing ? 'Transcrevendo…' : 'Segure para gravar'}
        disabled={disabled || isTranscribing}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          border: 'none',
          cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          userSelect: 'none',
          touchAction: 'none',
          transition: 'transform .12s, box-shadow .12s, background .18s',
          background: isRecording
            ? 'linear-gradient(140deg,#EF4444,#DC2626)'
            : 'linear-gradient(140deg,#4A7C4E,#3D6641)',
          boxShadow: isRecording
            ? '0 0 0 8px rgba(220,38,38,0.18), 0 8px 24px rgba(220,38,38,0.35)'
            : '0 0 0 6px rgba(61,102,65,0.12), 0 8px 24px rgba(44,74,46,0.30)',
          transform: isRecording ? 'scale(1.08)' : 'scale(1)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {isTranscribing
          ? <Loader2 size={32} color="white" className="animate-spin" />
          : <Mic size={32} color="white" strokeWidth={1.8} />
        }
      </button>

      <span style={{
        fontSize: 12,
        fontWeight: 600,
        color: isRecording ? '#DC2626' : isTranscribing ? '#3D6641' : 'rgba(26,43,28,0.45)',
        letterSpacing: '0.02em',
        transition: 'color .18s',
      }}>
        {isRecording
          ? '● Gravando… solte para enviar'
          : isTranscribing
          ? 'Transcrevendo com IA…'
          : 'Segure para gravar'}
      </span>
    </div>
  )
}
