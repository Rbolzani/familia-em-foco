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
      sm: 'px-3.5 py-2 text-sm rounded-2xl',
      md: 'px-5 py-2.5 text-sm rounded-2xl',
      lg: 'px-6 py-3.5 text-base rounded-2xl',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: disabled ? '#C8C3FF' : 'linear-gradient(135deg, #7B6FE8 0%, #C084FC 100%)',
        color: '#ffffff',
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(123,111,232,0.30)',
        border: 'none',
      },
      secondary: {
        background: '#E8E4FF',
        color: '#7B6FE8',
        border: '1.5px solid rgba(123,111,232,0.20)',
        boxShadow: 'none',
      },
      ghost: {
        background: 'transparent',
        color: '#8585A8',
        border: '1.5px solid rgba(123,111,232,0.15)',
        boxShadow: 'none',
      },
      danger: {
        background: 'linear-gradient(135deg, #f87171, #ef4444)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(239,68,68,0.25)',
      },
      soft: {
        background: '#F7F5FF',
        color: '#7B6FE8',
        border: 'none',
        boxShadow: 'none',
      },
    }

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={{ ...variantStyles[variant], ...style }}
        className={`${base} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-105'} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
export default Button
