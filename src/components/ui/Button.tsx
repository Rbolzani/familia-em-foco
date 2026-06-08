'use client'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'navy'
  size?: 'sm' | 'md' | 'lg'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className = '', children, disabled, style, ...props }, ref) => {

    const base = `
      inline-flex items-center justify-center gap-2 font-semibold
      transition-all duration-150 select-none
      active:scale-95
    `

    const sizes = {
      sm: 'px-3.5 py-2 text-sm rounded-xl',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3.5 text-base rounded-2xl',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: disabled ? '#D4C9BC' : 'linear-gradient(135deg, #F4522D 0%, #D93D1A 100%)',
        color: '#ffffff',
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(244,82,45,.3)',
        border: 'none',
      },
      secondary: {
        background: '#FFF0EB',
        color: '#F4522D',
        border: '1.5px solid #FDD5C9',
        boxShadow: 'none',
      },
      ghost: {
        background: 'transparent',
        color: '#8B7A68',
        border: '1.5px solid #EDE4D6',
        boxShadow: 'none',
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(239,68,68,.25)',
      },
      navy: {
        background: 'linear-gradient(135deg, #1D3461, #0F1F3D)',
        color: '#ffffff',
        border: 'none',
        boxShadow: '0 4px 14px rgba(15,31,61,.3)',
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
