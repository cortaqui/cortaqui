"use client";

import React, { createContext, useContext, useState, type ReactNode } from "react";
import { etiquettes } from "~/components/big-calendar";
import type { Agendamento } from "~/lib/types";

interface CalendarContextType {
  // Date management
  currentDate: Date;
  setCurrentDate: (date: Date) => void;

  // Legacy etiquette visibility management (for existing calendar components)
  visibleColors: string[];
  toggleColorVisibility: (color: string) => void;
  isColorVisible: (color: string | undefined) => boolean;

  // Agendamento-specific filtering
  visibleBarbeiros: string[];
  toggleBarbeiroVisibility: (barbeiroId: string) => void;
  isBarbeiroVisible: (barbeiroId: string | undefined) => boolean;

  visibleStatus: Agendamento["status"][];
  toggleStatusVisibility: (status: Agendamento["status"]) => void;
  isStatusVisible: (status: Agendamento["status"] | undefined) => boolean;

  // Barbeiro-specific context (for barbeiro pages)
  currentBarbeiro?: string;
  setCurrentBarbeiro?: (barbeiroId: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined,
);

export function useCalendarContext() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarContext must be used within a CalendarProvider",
    );
  }
  return context;
}

interface CalendarProviderProps {
  children: ReactNode;
  // Optional props for barbeiro-specific context
  initialBarbeiro?: string;
}

export function CalendarProvider({ children, initialBarbeiro }: CalendarProviderProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Legacy color visibility for existing calendar components
  const [visibleColors, setVisibleColors] = useState<string[]>(() => {
    return etiquettes
      .filter((etiquette) => etiquette.isActive)
      .map((etiquette) => etiquette.color);
  });

  // Agendamento-specific filtering states
  const [visibleBarbeiros, setVisibleBarbeiros] = useState<string[]>(() =>
    initialBarbeiro ? [initialBarbeiro] : []
  );
  const [visibleStatus, setVisibleStatus] = useState<Agendamento["status"][]>([
    "agendado", "confirmado", "em_andamento", "concluido"
  ]); // Default to showing all non-cancelled appointments

  // Barbeiro-specific state (for barbeiro pages)
  const [currentBarbeiro, setCurrentBarbeiro] = useState<string | undefined>(initialBarbeiro);

  // Legacy color visibility functions
  const toggleColorVisibility = (color: string) => {
    setVisibleColors((prev) => {
      if (prev.includes(color)) {
        return prev.filter((c) => c !== color);
      } else {
        return [...prev, color];
      }
    });
  };

  const isColorVisible = (color: string | undefined) => {
    if (!color) return true;
    return visibleColors.includes(color);
  };

  // Barbeiro visibility functions
  const toggleBarbeiroVisibility = (barbeiroId: string) => {
    setVisibleBarbeiros((prev) => {
      if (prev.includes(barbeiroId)) {
        return prev.filter((id) => id !== barbeiroId);
      } else {
        return [...prev, barbeiroId];
      }
    });
  };

  const isBarbeiroVisible = (barbeiroId: string | undefined) => {
    if (!barbeiroId) return true;
    // If no barbeiros are selected, show all
    if (visibleBarbeiros.length === 0) return true;
    return visibleBarbeiros.includes(barbeiroId);
  };

  // Status visibility functions
  const toggleStatusVisibility = (status: Agendamento["status"]) => {
    setVisibleStatus((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const isStatusVisible = (status: Agendamento["status"] | undefined) => {
    if (!status) return true;
    return visibleStatus.includes(status);
  };

  const value = {
    currentDate,
    setCurrentDate,
    // Legacy color management
    visibleColors,
    toggleColorVisibility,
    isColorVisible,
    // Agendamento-specific filtering
    visibleBarbeiros,
    toggleBarbeiroVisibility,
    isBarbeiroVisible,
    visibleStatus,
    toggleStatusVisibility,
    isStatusVisible,
    // Barbeiro-specific context
    currentBarbeiro,
    setCurrentBarbeiro,
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}
