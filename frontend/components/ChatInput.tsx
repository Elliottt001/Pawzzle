import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "Tell the agent about your home, schedule, and energy level...",
}: ChatInputProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) {
      return;
    }
    onSend();
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Chat message"
        className="h-11 flex-1 rounded-full border-neutral-200 bg-white/90 text-sm shadow-sm placeholder:text-neutral-400 focus-visible:ring-emerald-500"
      />
      <Button
        type="submit"
        size="icon"
        disabled={disabled}
        aria-label="Send message"
        className="h-11 w-11 rounded-full bg-emerald-600 text-white shadow-sm transition hover:bg-emerald-700"
      >
        <SendIcon className="h-5 w-5" />
      </Button>
    </form>
  );
}

type IconProps = {
  className?: string;
};

function SendIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M22 2L11 13" />
      <path d="M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
