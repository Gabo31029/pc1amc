import { cn } from '../../lib/cn'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  const styles =
    variant === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : variant === 'warning'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : variant === 'danger'
          ? 'border-red-200 bg-red-50 text-red-900'
          : variant === 'info'
            ? 'border-blue-200 bg-blue-50 text-blue-900'
            : 'border-black/10 bg-white/70 text-black/70'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium shadow-sm backdrop-blur',
        styles,
        className,
      )}
      {...props}
    />
  )
}

