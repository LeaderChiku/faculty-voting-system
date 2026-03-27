import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    
    const variants = {
      primary: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:from-yellow-500 hover:to-yellow-400 border border-yellow-400/50",
      secondary: "bg-gradient-to-r from-purple-700 to-indigo-800 text-white shadow-lg shadow-purple-900/40 hover:shadow-purple-700/60 border border-purple-500/30 hover:border-purple-400/50",
      outline: "border-2 border-white/10 bg-transparent text-white hover:bg-white/5 hover:border-white/20",
      ghost: "hover:bg-white/10 hover:text-white text-white/80",
      danger: "bg-destructive/20 text-red-400 hover:bg-destructive/30 hover:text-red-300 border border-destructive/30",
    };

    const sizes = {
      sm: "h-9 px-4 text-sm",
      md: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
      icon: "h-11 w-11",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
