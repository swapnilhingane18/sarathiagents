import { motion } from 'framer-motion'
import { User, ShieldCheck, HeadphonesIcon } from 'lucide-react'
import type { ChatMessage } from '../types'
import { cn } from '@/ui'

export function ChatMessageComponent({ message }: { message: ChatMessage }) {
    const isUser = message.role === 'user'

    // Determine avatar icon and color based on role
    let AvatarIcon = HeadphonesIcon
    let avatarBg = 'bg-primary/20 text-primary'

    if (isUser) {
        AvatarIcon = User
        avatarBg = 'bg-surface-2 text-text-muted'
    } else if (message.metadata?.agentRole === 'Risk Analyst') {
        AvatarIcon = ShieldCheck
        avatarBg = 'bg-orange-500/10 text-orange-600'
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={cn("flex w-full mt-4 space-x-3 max-w-2xl", {
                "ml-auto justify-end space-x-reverse": isUser,
            })}
        >
            <div className={cn("flex-shrink-0", isUser && "ml-3")}>
                <div className={cn("flex items-center justify-center w-8 h-8 rounded-full", avatarBg)}>
                    <AvatarIcon size={16} />
                </div>
            </div>
            <div className={cn("flex flex-col", isUser ? "items-end" : "items-start")}>
                <div
                    className={cn("p-3 md:p-4 text-[15px] leading-relaxed shadow-subtle", {
                        "bg-primary text-primary-foreground rounded-2xl rounded-tr-none": isUser,
                        "bg-surface-1 border border-border text-text rounded-2xl rounded-tl-none": !isUser
                    })}
                >
                    {message.content}
                </div>
                {!isUser && message.metadata?.agentRole && (
                    <div className="text-[11px] text-text-muted mt-1 ml-1 font-medium select-none">
                        {message.metadata.agentRole}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
