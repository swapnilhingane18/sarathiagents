import { useState, useCallback, useRef, useEffect } from 'react'
import type { ChatMessage } from '../types'

const INITIAL_MESSAGE: ChatMessage = {
    id: 'msg-0',
    role: 'agent',
    content: 'Hi! I am Saarthi, your AI personal loan assistant. How can I help you today?',
    timestamp: Date.now(),
    metadata: { agentRole: 'Customer Success' }
}

export function useChatController() {
    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE])
    const [isTyping, setIsTyping] = useState(false)
    const [activeAgentRole, setActiveAgentRole] = useState('Customer Success')
    const messageEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = useCallback(() => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => {
        scrollToBottom()
    }, [messages, isTyping, scrollToBottom])

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim()) return

        const newUserMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            content,
            timestamp: Date.now(),
        }

        setMessages(prev => [...prev, newUserMsg])
        setIsTyping(true)

        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message: content }),
            })

            if (!response.ok) {
                throw new Error('Network response was not ok')
            }

            const data = await response.json()

            const newAgentMsg: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'agent',
                content: data.reply || "I couldn't process that.",
                timestamp: Date.now() + 1,
                metadata: { agentRole: activeAgentRole }
            }

            setMessages(prev => [...prev, newAgentMsg])
        } catch (error) {
            console.error('Failed to send message:', error)
            const errorMsg: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'agent',
                content: "Sorry, I am having trouble connecting to the server.",
                timestamp: Date.now() + 1,
                metadata: { agentRole: 'System Error' }
            }
            setMessages(prev => [...prev, errorMsg])
        } finally {
            setIsTyping(false)
        }
    }, [activeAgentRole])

    return {
        messages,
        isTyping,
        activeAgentRole,
        sendMessage,
        messageEndRef
    }
}
