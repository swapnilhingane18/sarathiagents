import * as React from 'react'
import { cn } from './Button'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'outline'
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-primary',
                {
                    'bg-primary text-primary-foreground': variant === 'default',
                    'bg-surface-2 text-text': variant === 'secondary',
                    'text-text border border-border': variant === 'outline',
                },
                className
            )}
            {...props}
        />
    )
}

export { Badge }
