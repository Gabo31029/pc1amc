import { type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn('text-sm font-medium text-black/80', className)}
      {...props}
    />
  )
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-xl border border-black/10 bg-white/70 px-3 text-sm text-black shadow-sm backdrop-blur',
        'placeholder:text-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
        className,
      )}
      {...props}
    />
  )
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-[120px] w-full rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-sm text-black shadow-sm backdrop-blur',
        'placeholder:text-black/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
        className,
      )}
      {...props}
    />
  )
}

export function Select({
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'h-10 w-full appearance-none rounded-xl border border-black/10 bg-white/70 px-3 text-sm text-black shadow-sm backdrop-blur',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15',
        className,
      )}
      {...props}
    />
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-600">{message}</p>
}

