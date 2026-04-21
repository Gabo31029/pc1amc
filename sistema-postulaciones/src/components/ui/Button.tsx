import { type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'sm'

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl border text-sm font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'md' ? 'h-10 px-4' : 'h-9 px-3',
        variant === 'primary' &&
          'border-black/10 bg-black text-white shadow-sm hover:bg-black/90',
        variant === 'secondary' &&
          'border-black/10 bg-white/60 text-black shadow-sm backdrop-blur hover:bg-white/80',
        variant === 'ghost' && 'border-transparent bg-transparent text-black hover:bg-black/5',
        variant === 'danger' &&
          'border-red-200 bg-red-600 text-white shadow-sm hover:bg-red-600/90',
        className,
      )}
      {...props}
    />
  )
}

