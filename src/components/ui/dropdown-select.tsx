"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface DropdownSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  label?: string;
  variant?: "input" | "pill" | "inline";
  align?: "left" | "right";
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  disabled?: boolean;
  actionItem?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export function DropdownSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  label,
  variant = "input",
  align = "left",
  icon,
  className = "",
  menuClassName = "",
  disabled = false,
  actionItem,
}: DropdownSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Fecha o dropdown quando clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fecha ao pressionar Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${variant === "pill" ? "inline-block" : "w-full"}`} ref={containerRef}>
      {label && (
        <label className="block text-[12px] font-semibold text-[#6E6E73] dark:text-[#a1a1aa] mb-1.5 select-none">
          {label}
        </label>
      )}

      {variant === "pill" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-2 rounded-full border border-[#1C1C1E] dark:border-white bg-white dark:bg-[#18181b] px-3.5 py-1.5 text-[13px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[#1C1C1E] dark:text-white shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : variant === "inline" ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] text-[12px] font-medium text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {icon && <span className="shrink-0">{icon}</span>}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown
            className={`w-3 h-3 text-[#6E6E73] dark:text-[#a1a1aa] shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      ) : (
        /* variant === "input" (padrão para formulários) */
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen((prev) => !prev)}
          className={`w-full px-4 py-2.5 rounded-[12px] border bg-white dark:bg-[#18181b] text-[13.5px] font-medium text-left flex items-center justify-between transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isOpen
              ? "border-[#1C1C1E] dark:border-white shadow-2xs"
              : "border-[#E5E5EA] dark:border-[#27272a] hover:border-[#D4D4D8] dark:hover:border-[#3F3F46]"
          } ${className}`}
        >
          <div className="flex items-center gap-2.5 truncate">
            {icon && <span className="shrink-0 text-[#6E6E73] dark:text-[#a1a1aa]">{icon}</span>}
            <span
              className={`truncate ${
                selectedOption
                  ? "text-[#1C1C1E] dark:text-white"
                  : "text-[#8E8E93] dark:text-[#71717a]"
              }`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-[#8E8E93] dark:text-[#71717a] shrink-0 transition-transform duration-200 ml-2 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Popover Flutuante - Padrão Editorial Luxury (Referência: Análises) */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } mt-1.5 w-full min-w-[210px] rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] py-1.5 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 max-h-[280px] overflow-y-auto no-scrollbar ${menuClassName}`}
        >
          {actionItem && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  actionItem.onClick();
                }}
                className="w-full px-3.5 py-2 text-left text-[13px] font-semibold text-[#6E56CF] dark:text-[#a78bfa] hover:bg-[#F5F3FF] dark:hover:bg-[#2e1065]/30 flex items-center gap-2 transition-colors rounded-[8px] mx-auto max-w-[calc(100%-8px)]"
              >
                {actionItem.icon}
                <span>{actionItem.label}</span>
              </button>
              <div className="my-1 border-t border-[#F2F2F7] dark:border-[#27272a]" />
            </>
          )}

          {options.length === 0 ? (
            <div className="px-3.5 py-2 text-[12px] text-[#8E8E93] dark:text-[#71717a] text-center">
              Nenhuma opção disponível
            </div>
          ) : (
            options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-left text-[13px] flex items-center justify-between transition-colors rounded-[8px] mx-auto max-w-[calc(100%-8px)] ${
                    active
                      ? "bg-[#F2F2F7] dark:bg-[#27272a] font-semibold text-[#1C1C1E] dark:text-white"
                      : "text-[#3A3A3C] dark:text-[#d4d4d8] hover:bg-[#F9F9FB] dark:hover:bg-[#27272a]/50"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    <div className="truncate">
                      <span className="block truncate">{option.label}</span>
                      {option.sublabel && (
                        <span className="block text-[11px] text-[#8E8E93] dark:text-[#71717a] truncate font-normal">
                          {option.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {active && (
                    <Check className="w-3.5 h-3.5 text-[#1C1C1E] dark:text-white shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
