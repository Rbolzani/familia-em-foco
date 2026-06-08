import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPad?: boolean
  lift?: boolean
  accent?: string
}

export default function Card({ noPad, lift, accent, className = '', children, style, ...props }: CardProps) {
  return (
    <div
      className={`card ${lift ? 'card-lift' : ''} ${noPad ? '' : 'p-5'} ${className}`}
      style={{
        ...(accent ? { borderTop: `3px solid ${accent}` } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
