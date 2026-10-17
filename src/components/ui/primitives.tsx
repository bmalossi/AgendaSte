import * as React from "react";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/lib/mock-data";

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "confirm" | "warning" | "danger" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const ActionButton = React.forwardRef<
  HTMLButtonElement,
  ActionButtonProps
>(({ className, variant = "primary", size = "md", children, ...props }, ref) => {
  const variantClasses: Record<NonNullable<ActionButtonProps["variant"]>, string> = {
    primary:
      "bg-ink text-ink-inverted hover:bg-[#262926] active:translate-y-[1px] border border-ink",
    confirm:
      "bg-[#15803d] text-[#ffffff] hover:bg-[#14532d] active:translate-y-[1px] border border-[#14532d]",
    warning:
      "bg-canvas-elevated text-ink border border-ink hover:bg-canvas-subtle active:translate-y-[1px]",
    danger:
      "bg-[#b91c1c] text-[#ffffff] border border-[#7f1d1d] hover:bg-[#991b1b] active:translate-y-[1px]",
    secondary:
      "bg-canvas-elevated text-ink border border-line hover:border-ink hover:bg-canvas-subtle active:translate-y-[1px]",
    ghost:
      "bg-transparent text-ink-secondary hover:bg-canvas-subtle hover:text-ink border border-transparent",
  };

  const sizeClasses: Record<NonNullable<ActionButtonProps["size"]>, string> = {
    sm: "min-h-[36px] px-3 py-1.5 text-xs font-mono font-semibold tracking-tight rounded-sm gap-1.5",
    md: "min-h-[40px] px-3.5 py-2 text-xs font-mono font-semibold tracking-tight rounded-sm gap-2",
    lg: "min-h-[46px] px-4 py-2.5 text-sm font-mono font-semibold tracking-tight rounded-sm gap-2",
  };

  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex items-center justify-center transition-colors duration-100 select-none disabled:opacity-40 disabled:pointer-events-none",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
ActionButton.displayName = "ActionButton";

/**
 * Indicador técnico de status (Zero pastel pill, zero ícones decorativos).
 * Usa ponto luminoso sólido de 6px + código tipográfico tabular em caixa alta.
 */
export function StatusIndicator({
  status,
  paymentStatus,
}: {
  status: AppointmentStatus;
  paymentStatus: "paid" | "deposit_paid" | "pending" | "overdue";
}) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-tight text-ink">
        <span className="h-2 w-2 bg-[#15803d] shrink-0" aria-hidden="true" />
        <span>CONCLUÍDO · PAGO</span>
      </span>
    );
  }

  if (status === "confirmed") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-tight text-ink">
        <span className="h-2 w-2 bg-[#15803d] shrink-0" aria-hidden="true" />
        <span>
          {paymentStatus === "deposit_paid"
            ? "CONFIRMADO · SINAL PIX PAGO"
            : "CONFIRMADO · INTEGRAL"}
        </span>
      </span>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-tight text-[#b45309]">
        <span className="h-2 w-2 bg-[#d97706] shrink-0" aria-hidden="true" />
        <span>
          {paymentStatus === "deposit_paid"
            ? "SINAL PAGO · AGUARDANDO 2H"
            : "PENDENTE · AGUARDANDO SINAL"}
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-tight text-[#b91c1c]">
      <span className="h-2 w-2 bg-[#dc2626] shrink-0" aria-hidden="true" />
      <span>FALTA / SINAL EXPIRADO</span>
    </span>
  );
}
