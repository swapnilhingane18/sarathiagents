import { cn } from './Button'

function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('animate-pulse rounded-xl bg-surface-2', className)}
            {...props}
        />
    )
}

export { Skeleton }
