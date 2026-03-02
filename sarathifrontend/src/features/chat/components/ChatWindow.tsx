import { Card } from '@/ui'
import { useChatController } from '../hooks/useChatController'
import { ChatInput } from './ChatInput'
import { MessageRenderer } from './MessageRenderer'
import { TypingIndicator } from './TypingIndicator'
import { ShieldAlert } from 'lucide-react'

export function ChatWindow() {
    const { messages, isTyping, sendMessage, messageEndRef, activeAgentRole } = useChatController()

    return (
        <Card className="flex flex-col h-full w-full overflow-hidden shadow-floating bg-surface-2 border-border/50">

            {/* Chat Header */}
            <div className="px-6 py-4 bg-surface-1 border-b border-border flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-text">Saarthi AI</h2>
                    <p className="text-xs text-text-muted flex items-center gap-1 font-medium mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Active Session
                    </p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-500/10 text-green-600 rounded-full border border-green-500/20">
                    <ShieldAlert size={14} /> End-to-End Encrypted
                </div>
            </div>

            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-2">
                {messages.map((message) => (
                    <MessageRenderer key={message.id} message={message} />
                ))}
                {isTyping && <TypingIndicator role={activeAgentRole} />}
                <div ref={messageEndRef} />
            </div>

            {/* Input Area */}
            <ChatInput onSendMessage={sendMessage} disabled={isTyping} />
        </Card>
    )
}
