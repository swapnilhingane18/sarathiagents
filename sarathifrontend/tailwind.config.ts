import type { Config } from 'tailwindcss'

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bg: {
                    DEFAULT: "hsl(var(--color-bg) / <alpha-value>)",
                    secondary: "hsl(var(--color-bg-secondary) / <alpha-value>)",
                },
                surface: {
                    1: "hsl(var(--color-surface-1) / <alpha-value>)",
                    2: "hsl(var(--color-surface-2) / <alpha-value>)",
                },
                primary: {
                    DEFAULT: "hsl(var(--color-primary) / <alpha-value>)",
                    hover: "hsl(var(--color-primary-hover) / <alpha-value>)",
                    foreground: "hsl(var(--color-primary-foreground) / <alpha-value>)",
                },
                text: {
                    DEFAULT: "hsl(var(--color-text) / <alpha-value>)",
                    muted: "hsl(var(--color-text-muted) / <alpha-value>)",
                },
                border: {
                    DEFAULT: "hsl(var(--color-border) / <alpha-value>)",
                }
            },
            borderRadius: {
                xl: "1rem",
                "2xl": "1.5rem",
            },
            boxShadow: {
                subtle: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
                floating: "0 8px 30px -4px rgba(0, 0, 0, 0.1)",
            }
        },
    },
    plugins: [],
} satisfies Config
