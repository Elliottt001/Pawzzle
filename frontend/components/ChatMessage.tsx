import * as React from "react";

export type ChatRole = "user" | "ai";

export type ChatMessageData = {
  id: string;
  role: ChatRole;
  content: string;
  isStreaming?: boolean;
  isTyping?: boolean;
};

type ChatMessageProps = {
  message: ChatMessageData;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const bubbleClasses = isUser
    ? "bg-emerald-600 text-white rounded-2xl rounded-br-md"
    : "bg-white/80 text-neutral-900 border border-neutral-200/80 shadow-sm rounded-2xl rounded-bl-md";

  return (
    <div className={`flex w-full items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser ? (
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
          <PawIcon className="h-5 w-5 text-emerald-600" />
        </div>
      ) : null}
      <div className={`max-w-[80%] px-4 py-2 text-sm leading-relaxed sm:text-base ${bubbleClasses}`}>
        {message.isTyping ? (
          <TypingIndicator />
        ) : (
          <p className="whitespace-pre-wrap">
            {message.content}
            {message.isStreaming ? (
              <span
                className={`ml-1 inline-block h-4 w-1 align-middle ${isUser ? "bg-white/80" : "bg-emerald-500"} animate-pulse`}
                aria-hidden="true"
              />
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1" role="status" aria-label="AI is typing">
      <span
        className="inline-block h-2 w-2 animate-bounce rounded-full bg-neutral-400"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="inline-block h-2 w-2 animate-bounce rounded-full bg-neutral-400"
        style={{ animationDelay: "120ms" }}
      />
      <span
        className="inline-block h-2 w-2 animate-bounce rounded-full bg-neutral-400"
        style={{ animationDelay: "240ms" }}
      />
    </div>
  );
}

type IconProps = {
  className?: string;
};

function PawIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" role="img" aria-label="Pet paw">
      <circle cx="7.5" cy="7.5" r="2.2" />
      <circle cx="16.5" cy="7.5" r="2.2" />
      <circle cx="5.8" cy="13" r="2" />
      <circle cx="18.2" cy="13" r="2" />
      <path d="M7.2 18.4c0-2.6 2.4-4.6 4.8-4.6s4.8 2 4.8 4.6c0 1.5-1.2 2.6-2.7 2.6h-4.1c-1.5 0-2.8-1.1-2.8-2.6z" />
    </svg>
  );
}
