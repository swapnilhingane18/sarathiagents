import * as React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Menu, X, MessageSquare, Home } from 'lucide-react'
import { useUIStore } from '../store/useUIStore'

export default function AppLayout() {
    const { isSidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
    const location = useLocation()

    // Close sidebar on route change on mobile
    React.useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname, setSidebarOpen])

    return (
        <div className="flex h-screen w-full overflow-hidden bg-bg">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface-1 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <span className="text-xl font-bold tracking-tight text-primary">Saarthi</span>
                    <button
                        className="md:hidden text-text-muted hover:text-text"
                        onClick={toggleSidebar}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <Link
                        to="/"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-2 text-text-muted hover:text-text"
                    >
                        <Home className="h-4 w-4" />
                        Home
                    </Link>
                    <Link
                        to="/chat"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-primary/10 text-primary hover:bg-primary/20"
                    >
                        <MessageSquare className="h-4 w-4" />
                        AI Chat
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 shrink-0 items-center border-b border-border bg-surface-1 px-4 md:px-6">
                    <button
                        className="mr-4 text-text-muted hover:text-text md:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="ml-auto flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                            U
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto w-full">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
