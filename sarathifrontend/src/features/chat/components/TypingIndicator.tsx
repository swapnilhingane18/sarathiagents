import { motion } from 'framer-motion'
import { Bot } from 'lucide-react'

export function TypingIndicator({ role = 'Agent' }: { role?: string }) {
    const dotVariants = {
        animate: {
            y: [0, -4, 0],
            opacity: [0.4, 1, 0.4],
            transition: {
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex w-full mt-4 space-x-3 max-w-2xl"
        >
            <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
                    <Bot size={16} />
                </div>
            </div>
            <div>
                <div className="bg-surface-2 border border-border p-3 rounded-2xl rounded-tl-none inline-flex items-center gap-1 shadow-subtle min-h-[44px] min-w-[60px]">
                    <motion.span
                        className="w-1.5 h-1.5 bg-primary rounded-full"
                        variants={dotVariants} animate="animate"
                    />
                    <motion.span
                        className="w-1.5 h-1.5 bg-primary rounded-full"
                        variants={dotVariants} animate="animate" transition={{ delay: 0.2 }}
                    />
                    <motion.span
                        className="w-1.5 h-1.5 bg-primary rounded-full"
                        variants={dotVariants} animate="animate" transition={{ delay: 0.4 }}
                    />
                </div>
                <div className="text-[11px] text-text-muted mt-1 ml-1 font-medium select-none">
                    {role} is typing...
                </div>
            </div>
        </motion.div>
    )
}
