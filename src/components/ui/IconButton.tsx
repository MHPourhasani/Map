import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    /** Accessible name, also used as the tooltip */
    label: string;
    active?: boolean;
    children: ReactNode;
}

export function IconButton({ label, active = false, className, children, type = "button", ...rest }: IconButtonProps) {
    return (
        <button type={type} aria-label={label} title={label} className={cn("pm-icon-btn", active && "is-active", className)} {...rest}>
            {children}
        </button>
    );
}
