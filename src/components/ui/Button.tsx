'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, style, ...props }, ref) => {

    const base = `
      inline-flex items-center justify-center gap-2 font-semibold
      transition-all duration-150 select-none active:scale-95
    `

    const sizes = {
      sm: 'px-3.5 py-2 text-sm rounded-[12px]',
      md: 'px-5 py-2.5 text-sm rounded-[13px]',
      lg: 'px-6 py-3.5 text-base rounded-[14px]',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: disabled
          ? 'rgba(61,102,65,0.35)'
          : 'linear-gradient(140deg, #3D6641 0%, #2C4A2E 100%)',
        color: disabled ? 'rgba(212,232,213,0.55)' : '#D4E8D5',
        boxShadow: disabled ? 'none'
          : '0 4px 14px rgba(44,74,46,0.30),0 -1px 0 rgba(255,255,255,0.12) inset',
        border: 'none',
      },
      secondary: {
        background: 'rgba(255,255,255,0.75)',
        color: '#3D6641',
        border: '1px solid rgba(61,102,65,0.22)',
        boxShadow: '0 2px 8px rgba(44,74,46,0.08),0 -1px 0 rgba(255,255,255,0.80) inset',
      },
      ghost: {
        background: 'transparent',
        color: 'rgba(26,43,28,0.58)',
        border: '1px solid rgba(61,102,65,0.18)',
        boxShadow: 'none',
      },
      danger: {
        background: 'linear-gradient(140deg, #DC2626, #991B1B)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(220,38,38,0.28),0 -1px 0 rgba(255,255,255,0.10) inset',
      },
      soft: {
        background: 'rgba(61,102,65,0.08)',
        color: '#3D6641',
        border: '1px solid rgba(61,102,65,0.14)',
        boxShadow: '0 1px 4px rgba(44,74,46,0.06)',
      },
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={{ ...variantStyles[variant], ...style }}
        className={`${base} ${sizes[size]} ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-105'} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
