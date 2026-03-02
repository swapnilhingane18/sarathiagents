import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'

const Home = lazy(() => import('./pages/Home'))
const Chat = lazy(() => import('./pages/Chat'))

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        }
    }
})

function ErrorFallback() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-bg">
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
                <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Refresh
                </button>
            </div>
        </div>
    )
}

function LoadingFallback() {
    return <div className="flex items-center justify-center h-full w-full p-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
}

export default function App() {
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <Suspense fallback={<LoadingFallback />}>
                        <Routes>
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<Home />} />
                            </Route>

                            <Route element={<AppLayout />}>
                                <Route path="/chat" element={<Chat />} />
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </QueryClientProvider>
        </ErrorBoundary>
    )
}
