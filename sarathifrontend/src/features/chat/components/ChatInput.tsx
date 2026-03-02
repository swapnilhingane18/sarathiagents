import { useState, useRef, KeyboardEvent } from 'react'
import { SendHorizontal } from 'lucide-react'
import { Button } from '@/ui'

interface ChatInputProps {
    onSendMessage: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [inputValue, setInputValue] = useState('')
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (inputValue.trim() && !disabled) {
            onSendMessage(inputValue.trim())
            setInputValue('')
            // Reset height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'inherit'
            }
        }
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value)
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
        }
    }

    return (
        <div className="flex items-end gap-2 p-4 bg-surface-1 border-t border-border mt-auto shrink-0 rounded-b-2xl">
            <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                disabled={disabled}
                rows={1}
                className="flex-1 max-h-[120px] min-h-[44px] rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50"
            />
            <Button
                onClick={handleSend}
                disabled={disabled || !inputValue.trim()}
                className="h-11 w-11 shrink-0 rounded-xl p-0"
            >
                <SendHorizontal className="h-5 w-5" />
            </Button>
        </div>
    )
}
