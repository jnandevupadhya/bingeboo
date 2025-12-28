import { forwardRef, ReactNode } from "react";

interface RemoteButtonProps {
  onClick: () => void;
  children: ReactNode;
  label: string;
  variant?: "default" | "close";
  className?: string;
}

const RemoteButton = forwardRef<HTMLButtonElement, RemoteButtonProps>(
  ({ onClick, children, label, variant = "default", className = "" }, ref) => {
    const baseStyles = `
      no-drag flex items-center justify-center
      transition-all duration-200 ease-out
      active:animate-bounce-soft
      focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50
    `;

    const variants = {
      default: `
        w-10 h-10 rounded-xl
        bg-muted/60 hover:bg-muted
        text-foreground hover:text-primary
        hover:shadow-button hover:scale-105
      `,
      close: `
        w-6 h-6 rounded-lg
        bg-transparent hover:bg-destructive/20
        text-muted-foreground hover:text-destructive
        hover:scale-110
      `,
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={`${baseStyles} ${variants[variant]} ${className}`}
      >
        {children}
      </button>
    );
  }
);

RemoteButton.displayName = "RemoteButton";

export default RemoteButton;
