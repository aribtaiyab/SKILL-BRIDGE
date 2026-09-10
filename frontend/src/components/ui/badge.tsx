import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-600 text-white shadow-2xs",
        secondary:
          "border-slate-200 bg-slate-100 text-slate-700",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        critical:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline:
          "border-slate-200 text-slate-700 bg-white",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200 bg-amber-50 text-amber-700",
        forest:
          "border-emerald-900 bg-emerald-950 text-emerald-300",
        slate:
          "border-slate-200 bg-slate-100 text-slate-700",
        emerald:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        amber:
          "border-amber-200 bg-amber-50 text-amber-700",
        rose:
          "border-rose-200 bg-rose-50 text-rose-700",
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