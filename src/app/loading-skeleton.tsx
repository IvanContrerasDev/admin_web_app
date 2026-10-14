import type { ReactNode } from 'react'

type SkeletonVariant = 'table' | 'matrix' | 'metrics' | 'form' | 'detail' | 'map' | 'session' | 'inline'

function Bar({ className = '' }: { className?: string }) {
  return <div className={`h-4 rounded bg-foreground/10 motion-safe:animate-pulse ${className}`} />
}

function Fields({ form }: { form: boolean }) {
  return <div className="grid gap-6 sm:grid-cols-2">{Array.from({ length: 6 }, (_, index) => <div className="flex flex-col gap-3" key={index}><Bar className="w-28" /><Bar className={form ? 'h-11 w-full' : 'w-3/4'} /></div>)}</div>
}

function Rows({ matrix }: { matrix: boolean }) {
  return <div className="overflow-hidden rounded-lg border border-foreground/15">
    <div className="flex h-12 items-center gap-6 border-b border-foreground/15 bg-foreground/5 px-4"><Bar className="w-40 shrink-0" /><Bar className="w-24" /><Bar className="hidden w-32 sm:block" /></div>
    {Array.from({ length: 6 }, (_, index) => <div className="flex min-h-16 items-center gap-6 border-b border-foreground/10 px-4 last:border-0" key={index}>
      <div className="flex w-40 shrink-0 flex-col gap-2"><Bar className="w-32" /><Bar className="h-3 w-20" /></div>
      {matrix ? Array.from({ length: 12 }, (_, day) => <Bar className="h-8 w-10 shrink-0" key={day} />) : <><Bar className="w-24" /><Bar className="hidden w-32 sm:block" /><Bar className="hidden w-24 lg:block" /><Bar className="hidden h-9 w-20 lg:block" /></>}
    </div>)}
  </div>
}

export function LoadingSkeleton({ label, variant = 'detail' }: { label: string; variant?: SkeletonVariant }) {
  let content: ReactNode
  switch (variant) {
    case 'table':
    case 'matrix':
      content = <Rows matrix={variant === 'matrix'} />
      break
    case 'metrics':
      content = <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="flex min-h-40 flex-col justify-between gap-6 rounded-md border border-foreground/15 p-5" key={index}><div className="flex flex-col gap-3"><Bar className="w-3/4" /><Bar /><Bar className="w-2/3" /></div><Bar className="h-10 w-16" /></div>)}</div>
      break
    case 'form':
    case 'detail':
      content = <div className={`flex flex-col gap-6 ${variant === 'form' ? 'mx-auto max-w-4xl' : ''}`}><div className="flex flex-col gap-3 border-b border-foreground/15 pb-6"><Bar className="w-28" /><Bar className="h-9 w-2/3" /><Bar className="w-4/5" /></div><div className="rounded-lg border border-foreground/15 p-5 sm:p-6"><Fields form={variant === 'form'} /></div>{variant === 'form' ? <div className="flex justify-end gap-3"><Bar className="h-11 w-24" /><Bar className="h-11 w-36" /></div> : <div className="flex flex-col gap-3 rounded-lg border border-foreground/15 p-5"><Bar className="w-40" /><Bar /><Bar className="w-2/3" /></div>}</div>
      break
    case 'map':
      content = <div className="flex min-h-80 flex-col gap-4 rounded-lg border border-foreground/15 p-5"><Bar className="h-11 w-full" /><Bar className="min-h-64 w-full" /></div>
      break
    case 'session':
      content = <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-lg border border-foreground/15 p-6"><Bar className="h-9 w-2/3" /><Bar /><Bar className="h-11" /><Bar className="h-11" /><Bar className="h-11 w-2/3" /></div>
      break
    case 'inline':
      content = <div className="flex flex-col gap-2"><Bar className="w-48 max-w-full" /><Bar className="w-32 max-w-full" /></div>
      break
  }
  return <div role="status" aria-label={label} data-skeleton={variant} className="w-full text-foreground"><span className="sr-only">{label}</span><div aria-hidden="true">{content}</div></div>
}
