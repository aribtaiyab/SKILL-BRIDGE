import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]",
        secondary:
          "border-transparent bg-[var(--color-surface-secondary)] text-[var(--color-foreground)] hover:bg-[var(--color-border-subtle)]",
        destructive:
          "border-transparent bg-[var(--color-critical)] text-white hover:opacity-90",
        critical:
          "border-transparent bg-[var(--color-critical)] text-white hover:opacity-90",
        outline: "text-[var(--color-foreground)] border-[var(--color-border-primary)]",
        success: "border-transparent bg-[var(--color-success)] text-white",
        warning: "border-transparent bg-[var(--color-warning)] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }