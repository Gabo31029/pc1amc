import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { cn } from '../../lib/cn'

type ToastItem = {
  id: string
  title: string
  message?: string
  variant?: 'default' | 'success' | 'danger'
}

type ToastContextValue = {
  toast: (t: Omit<ToastItem, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function genId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])

  const toast = useCallback((t: Omit<ToastItem, 'id'>) => {
    const id = genId()
    const item: ToastItem = { id, variant: 'default', ...t }
    setItems((prev) => [item, ...prev].slice(0, 4))
    window.setTimeout(() => {
      setItems((prev) => prev.filter((x) => x.id !== id))
    }, 3500)
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              'rounded-2xl border bg-white/70 p-3 shadow-lg backdrop-blur',
              t.variant === 'success' && 'border-emerald-200',
              t.variant === 'danger' && 'border-red-200',
              t.variant === 'default' && 'border-black/10',
            )}
          >
            <div className="text-sm font-semibold tracking-[-0.02em]">{t.title}</div>
            {t.message ? (
              <div className="mt-0.5 text-xs text-black/60">{t.message}</div>
            ) : null}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

