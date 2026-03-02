import { ChatWindow } from '../features/chat'

export default function Chat() {
    return (
        <div className="h-full w-full bg-bg p-4 md:p-6 pb-0 flex flex-col items-center">
            <div className="w-full max-w-4xl h-full flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-100px)]">
                <ChatWindow />
            </div>
        </div>
    )
}
