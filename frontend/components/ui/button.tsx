import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "ghost";
  size?: "default" | "icon";
};

const baseClasses =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", type = "button", ...props }, ref) => {
    const variantClasses =
      variant === "ghost"
        ? "bg-transparent text-neutral-900 hover:bg-neutral-100"
        : "bg-emerald-600 text-white hover:bg-emerald-700";
    const sizeClasses = size === "icon" ? "h-10 w-10 p-0" : "h-10 px-4 py-2";
    const combined = `${baseClasses} ${variantClasses} ${sizeClasses}${className ? ` ${className}` : ""}`;

    return <button ref={ref} type={type} className={combined} {...props} />;
  }
);

Button.displayName = "Button";
