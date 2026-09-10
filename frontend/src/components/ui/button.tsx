import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 focus-visible:ring-offset-2 cursor-pointer disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 hover:-translate-y-px hover:shadow-md hover:shadow-emerald-600/25",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
        outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900",
        link: "text-emerald-700 underline-offset-4 hover:underline hover:text-emerald-800",
        dark: "bg-emerald-950 text-white hover:bg-emerald-900 shadow-sm",
        accent: "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8.5 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-7 text-base font-bold",
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