"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(function PasswordInput({ className = "", ...props }, ref) {
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
        {visible ? "Sakrij" : "Prikaži"}
      </button>
    </div>
  );
});
