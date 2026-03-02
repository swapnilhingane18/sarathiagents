import { Link } from 'react-router-dom'
import { Button } from '../ui'
import { ArrowRight, Bot, Shield, Zap } from 'lucide-react'

export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center w-full">
            {/* Hero Section */}
            <section className="w-full py-24 md:py-32 lg:py-40 text-center px-4">
                <div className="mx-auto max-w-[800px] space-y-6">
                    <div className="inline-flex items-center rounded-full border border-border bg-surface-2 px-3 py-1 text-sm font-medium text-text-muted">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                        AI-Powered Personal Loan Assistant
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                        Smarter Loans. <br className="hidden sm:inline" />
                        <span className="text-primary">Instant Approvals.</span>
                    </h1>
                    <p className="mx-auto max-w-[600px] text-lg text-text-muted md:text-xl">
                        Meet Saarthi, your premium AI agent that analyzes, guides, and accelerates your financial journey with bank-grade security.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link to="/chat">
                            <Button size="lg" className="w-full sm:w-auto group gap-2">
                                Start Chatting <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                            View Eligibility
                        </Button>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="w-full max-w-6xl mx-auto py-20 px-6 grid gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-surface-1 border border-border shadow-subtle hover:shadow-floating transition-shadow">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Bot className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">Multi-Agent Intelligence</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                        Seamlessly switch between general assistance, loan underwriting logic, and risk analysis bots.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-surface-1 border border-border shadow-subtle hover:shadow-floating transition-shadow">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">Lightning Fast</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                        Built on a cutting-edge React tech stack, ensuring highly responsive and fluid interactions.
                    </p>
                </div>
                <div className="flex flex-col items-center text-center p-6 space-y-4 rounded-2xl bg-surface-1 border border-border shadow-subtle hover:shadow-floating transition-shadow">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Shield className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">Bank-Grade Security</h3>
                    <p className="text-text-muted text-sm leading-relaxed">
                        Your financial data is protected via enterprise-grade encryption and secure architecture.
                    </p>
                </div>
            </section>
        </div>
    )
}
