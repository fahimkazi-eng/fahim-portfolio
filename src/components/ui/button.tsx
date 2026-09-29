import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2.5 whitespace-nowrap",
    "font-sans font-medium select-none",
    "rounded-pill border border-transparent",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-fg text-canvas hover:bg-accent hover:text-accent-fg shadow-[0_1px_0_0_rgba(255,255,255,0.08)_inset]",
        accent:
          "bg-accent text-accent-fg hover:brightness-110 shadow-glow",
        outline:
          "border-line-strong text-fg hover:border-accent hover:text-accent",
        ghost: "text-fg-muted hover:text-fg hover:bg-fg/5",
        link: "rounded-none p-0 text-fg underline decoration-line-strong underline-offset-[6px] hover:decoration-accent",
      },
      size: {
        sm: "h-9 px-4 text-[0.8125rem]",
        md: "h-11 px-6 text-[0.9rem]",
        lg: "h-[3.25rem] px-8 text-[0.95rem]",
        icon: "size-11 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
