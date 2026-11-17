import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7DD3FC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050914] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-[#050914] hover:bg-[#7DD3FC] hover:shadow-[0_0_32px_-6px_rgba(125,211,252,0.7)]",
        outline:
          "border border-white/20 bg-white/[0.04] text-white backdrop-blur-md hover:border-[#7DD3FC]/60 hover:bg-white/[0.08]",
        ghost: "text-white/70 hover:text-white hover:bg-white/[0.06]",
      },
      size: {
        default: "h-11 px-6",
        lg: "h-12 px-7 text-base",
        sm: "h-9 px-4",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
