import * as React from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost'
    size?: 'sm' | 'md' | 'lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
                    {
                        'bg-primary text-primary-foreground hover:bg-primary-hover shadow-subtle hover:shadow-floating': variant === 'primary',
                        'bg-surface-2 text-text hover:bg-border': variant === 'secondary',
                        'hover:bg-surface-2 text-text-muted hover:text-text': variant === 'ghost',
                        'h-9 px-4 py-2': size === 'sm',
                        'h-11 px-6 py-2': size === 'md',
                        'h-14 px-8 py-3 text-base': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'
