export interface ChatMessage {
    id: string
    role: 'user' | 'agent' | 'system'
    content: string
    timestamp: number
    metadata?: {
        agentRole?: string
        handoff?: boolean
    }
}
