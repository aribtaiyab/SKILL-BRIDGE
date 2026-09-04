import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-[var(--color-accent)] text-white shadow-sm hover:bg-[var(--color-accent-hover)] hover:-translate-y-px hover:shadow-md",
        destructive: "bg-[var(--color-critical)] text-white hover:opacity-90",
        outline: "border border-[var(--color-border-primary)] bg-[var(--color-surface-card)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-light)]",
        secondary: "bg-[var(--color-surface-secondary)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)] hover:-translate-y-px",
        ghost: "hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)]",
        link: "text-[var(--color-accent)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? React.Fragment : "button"
    // Handle specific fragment rendering issue with props if needed
    // Assuming standard button for most uses
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }