"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showLabel?: string;
  hideLabel?: string;
};

export const PasswordInput = forwardRef<HTMLInputElement, Props>(function PasswordInput(
  { className = "", showLabel = "Prikaži", hideLabel = "Sakrij", ...props },
  ref
) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={`w-full rounded-lg border border-border px-3 py-2 pr-16 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary ${className}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-foreground"
      >
        {visible ? hideLabel : showLabel}
      </button>
    </div>
  );
});
