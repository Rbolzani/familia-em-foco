'use client'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceInput, VoiceInputState } from '@/hooks/useVoiceInput'

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void
  onError?: (message: string) => void
  disabled?: boolean
}

const LABEL: Record<VoiceInputState, string> = {
  idle:         'Falar',
  recording:    'Ouvindo…',
  transcribing: 'Transcrevendo…',
  error:        'Erro',
}

export function VoiceInputButton({ onTranscript, onError, disabled }: VoiceInputButtonProps) {
  const { state, start } = useVoiceInput({ onTranscript, onError })

  const isRecording    = state === 'recording'
  const isTranscribing = state === 'transcribing'
  const isBusy         = isRecording || isTranscribing

  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled || isTranscribing}
      title={LABEL[state]}
      aria-label={LABEL[state]}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px 4px 7px',
        borderRadius: 10,
        fontSize: 12,
        fontWeight: 700,
        cursor: disabled || isTranscribing ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all .18s',
        border: isRecording
          ? '1.5px solid rgba(220,38,38,0.40)'
          : '1.5px solid rgba(61,102,65,0.28)',
        background: isRecording
          ? 'rgba(220,38,38,0.08)'
          : 'rgba(61,102,65,0.07)',
        color: isRecording ? '#DC2626' : '#3D6641',
        boxShadow: isRecording
          ? '0 0 0 3px rgba(220,38,38,0.12)'
          : undefined,
      }}
    >
      {isTranscribing ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isRecording ? (
        <MicOff size={13} />
      ) : (
        <Mic size={13} />
      )}
      <span style={{ lineHeight: 1 }}>
        {isBusy ? LABEL[state] : 'Voz'}
      </span>
      {isRecording && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#DC2626',
          animation: 'pulse 1s ease-in-out infinite',
        }} />
      )}
    </button>
  )
}
