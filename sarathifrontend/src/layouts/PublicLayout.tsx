import { Outlet, Link } from 'react-router-dom'
import { Button } from '../ui'

export default function PublicLayout() {
    return (
        <div className="flex min-h-screen flex-col bg-bg">
            <header className="flex h-20 items-center justify-between border-b border-border px-6 lg:px-12 bg-surface-1/80 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold">S</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-text">Saarthi</span>
                </div>
                <nav className="flex items-center gap-6">
                    <Link to="/chat">
                        <Button variant="ghost" className="hidden sm:inline-flex">Login</Button>
                    </Link>
                    <Link to="/chat">
                        <Button variant="primary">Launch App</Button>
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                <Outlet />
            </main>

            <footer className="border-t border-border bg-surface-1 py-8 text-center text-sm text-text-muted">
                <p>© {new Date().getFullYear()} Saarthi. All rights reserved.</p>
            </footer>
        </div>
    )
}
