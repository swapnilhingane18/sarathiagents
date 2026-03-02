import { motion } from 'framer-motion'
import { ChatMessageComponent } from './ChatMessage'
import type { ChatMessage } from '../types'
import { Zap } from 'lucide-react'

export function MessageRenderer({ message }: { message: ChatMessage }) {
    // Handle System / Handoff Events
    if (message.role === 'system') {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center w-full my-6 select-none"
            >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-2 border border-border text-xs font-medium text-text-muted">
                    <Zap size={14} className="text-orange-500" />
                    {message.content}
                </div>
            </motion.div>
        )
    }

    // Handle Standard Messages (can be extended for specialized forms/widgets)
    return <ChatMessageComponent message={message} />
}
