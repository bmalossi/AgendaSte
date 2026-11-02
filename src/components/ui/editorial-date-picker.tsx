"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import { formatDateBR, getTodayDateISO } from "@/lib/agendaste-store";

export interface EditorialDatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDateISO?: string;
  lockPastDates?: boolean;
  disabled?: boolean;
  className?: string;
  align?: "left" | "right";
  allowClear?: boolean;
}

const MONTH_NAMES_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

export function EditorialDatePicker({
  value,
  onChange,
  label,
  placeholder = "Selecione a data...",
  minDateISO,
  lockPastDates = true,
  disabled = false,
  className = "",
  align = "left",
  allowClear = false,
}: EditorialDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const todayISO = getTodayDateISO();
  const effectiveMinDate = minDateISO ?? (lockPastDates ? todayISO : undefined);

  // Determina ano e mês inicial de exibição no calendário
  const initialYear = value
    ? parseInt(value.split("-")[0], 10)
    : parseInt(todayISO.split("-")[0], 10);
  const initialMonth = value
    ? parseInt(value.split("-")[1], 10)
    : parseInt(todayISO.split("-")[1], 10);

  const [viewYear, setViewYear] = useState<number>(initialYear);
  const [viewMonth, setViewMonth] = useState<number>(initialMonth);

  // Sincroniza visão se o valor externo mudar
  useEffect(() => {
    if (value && value.includes("-")) {
      const [y, m] = value.split("-").map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m);
      }
    }
  }, [value]);

  // Click outside para fechar
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

  // Fechar com Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Cálculos de dias do mês
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth - 1, 1).getDay();

  // Verifica se o mês anterior está totalmente bloqueado por minDateISO
  const isPrevMonthDisabled = (() => {
    if (!effectiveMinDate) return false;
    const [minY, minM] = effectiveMinDate.split("-").map(Number);
    if (viewYear < minY) return true;
    if (viewYear === minY && viewMonth <= minM) return true;
    return false;
  })();

  const handlePrevMonth = () => {
    if (isPrevMonthDisabled) return;
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const iso = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (effectiveMinDate && iso < effectiveMinDate) {
      return; // Bloqueado: data passada
    }
    onChange(iso);
    setIsOpen(false);
  };

  const handleSelectToday = () => {
    onChange(todayISO);
    const [y, m] = todayISO.split("-").map(Number);
    setViewYear(y);
    setViewMonth(m);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  return (
    <div className={`relative w-full ${className}`} ref={containerRef}>
      {/* Campo Trigger */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        className={`rounded-[14px] border border-[#E5E5EA] dark:border-[#27272a] bg-white dark:bg-[#18181b] p-2.5 transition flex items-center justify-between cursor-pointer select-none ${
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-[#1C1C1E] dark:hover:border-white focus-within:border-[#1C1C1E] dark:focus-within:border-white"
        } ${isOpen ? "ring-2 ring-[#1C1C1E]/10 dark:ring-white/20 border-[#1C1C1E] dark:border-white" : ""}`}
      >
        <div className="min-w-0 flex-1">
          {label && (
            <label className="block text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] mb-0.5 pointer-events-none">
              {label}
            </label>
          )}
          <span
            className={`block text-[13px] font-medium truncate ${
              value
                ? "text-[#1C1C1E] dark:text-white"
                : "text-[#8E8E93] dark:text-[#71717a]"
            }`}
          >
            {value ? formatDateBR(value) : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {allowClear && value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-full text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <CalendarIcon className="w-4 h-4 text-[#8E8E93] dark:text-[#71717a]" />
        </div>
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div
          className={`absolute ${
            align === "right" ? "right-0" : "left-0"
          } top-full mt-2 w-[min(320px,calc(100vw-2.5rem))] bg-white dark:bg-[#18181b] rounded-[20px] border border-[#E5E5EA] dark:border-[#27272a] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header: Mês / Ano e Controles */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[14px] font-bold text-[#1C1C1E] dark:text-white capitalize">
              {MONTH_NAMES_PT[viewMonth - 1]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={isPrevMonthDisabled}
                title="Mês anterior"
                className={`p-1.5 rounded-full transition ${
                  isPrevMonthDisabled
                    ? "opacity-25 cursor-not-allowed text-[#8E8E93]"
                    : "text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] hover:text-[#1C1C1E] dark:hover:text-white"
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="Próximo mês"
                className="p-1.5 rounded-full text-[#6E6E73] dark:text-[#a1a1aa] hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] hover:text-[#1C1C1E] dark:hover:text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dias da Semana (D S T Q Q S S) */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-[#8E8E93] dark:text-[#71717a] mb-1.5">
            <span>D</span>
            <span>S</span>
            <span>T</span>
            <span>Q</span>
            <span>Q</span>
            <span>S</span>
            <span>S</span>
          </div>

          {/* Grid de Dias */}
          <div className="grid grid-cols-7 gap-1 text-center text-[12.5px] mb-3">
            {Array.from({ length: firstDayIndex }, (_, i) => (
              <span key={`empty-${i}`} className="h-8 w-8 mx-auto" />
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const iso = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isPast = Boolean(effectiveMinDate && iso < effectiveMinDate);
              const isSelected = value === iso;
              const isToday = iso === todayISO;

              if (isPast) {
                return (
                  <button
                    key={day}
                    type="button"
                    disabled
                    title="Data passada indisponível para agendamento"
                    className="h-8 w-8 mx-auto flex items-center justify-center text-[12px] text-[#A1A1AA] dark:text-[#52525b] opacity-35 cursor-not-allowed select-none line-through decoration-[#8E8E93]/50"
                  >
                    {day}
                  </button>
                );
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`h-8 w-8 mx-auto flex items-center justify-center text-[12.5px] rounded-full transition ${
                    isSelected
                      ? "bg-[#1C1C1E] dark:bg-white text-white dark:text-[#18181b] font-bold shadow-xs"
                      : isToday
                      ? "border border-[#1C1C1E] dark:border-white text-[#1C1C1E] dark:text-white font-semibold hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                      : "text-[#1C1C1E] dark:text-white font-medium hover:bg-[#F5F5F7] dark:hover:bg-[#27272a]"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Rodapé com Atalhos Rápidos */}
          <div className="pt-2.5 border-t border-[#E5E5EA] dark:border-[#27272a] flex items-center justify-between text-[11.5px]">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-2.5 py-1 rounded-full font-semibold text-[#1C1C1E] dark:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
            >
              Hoje
            </button>
            {allowClear && (
              <button
                type="button"
                onClick={handleClear}
                className="px-2.5 py-1 rounded-full font-medium text-[#8E8E93] hover:text-[#1C1C1E] dark:hover:text-white hover:bg-[#F5F5F7] dark:hover:bg-[#27272a] transition"
              >
                Limpar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
