import { cn } from '@/lib/utils'

function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        'rounded-md bg-gradient-to-r from-white/6 via-white/18 to-white/6 dark:from-white/5 dark:via-white/14 dark:to-white/5 border border-white/12 dark:border-white/8 [background-size:220%_100%] shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-sm animate-[skeleton-shimmer_1.8s_ease-in-out_infinite]',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
