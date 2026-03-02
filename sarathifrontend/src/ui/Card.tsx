import * as React from 'react'
import { cn } from './Button'

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div
            ref={ref}
            className={cn('rounded-2xl border bg-surface-1 text-text shadow-subtle', className)}
            {...props}
        />
    )
)
Card.displayName = 'Card'

export { Card }
