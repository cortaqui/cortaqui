"use client";

import { useMemo } from "react";
import { useCalendarContext } from "~/components/event-calendar/calendar-context";
import { EventCalendar, type CalendarEvent, type CalendarView } from "~/components/event-calendar";
import { transformAgendamentosToEvents, transformEventToAgendamento } from "~/lib/agendamento-utils";
import type { Agendamento } from "~/lib/types";

interface AgendamentosCalendarProps {
  agendamentos: Agendamento[];
  onAgendamentoClick: (agendamento: Agendamento) => void;
  onNewAgendamento?: (date: Date, time?: Date) => void;
  onAgendamentoUpdate?: (agendamento: Agendamento) => void;
  onAgendamentoDelete?: (agendamentoId: string) => void;
  view?: CalendarView;
  className?: string;
  allowedViews?: CalendarView[];
}

export function AgendamentosCalendar({
  agendamentos,
  onAgendamentoClick,
  onNewAgendamento,
  onAgendamentoUpdate,
  onAgendamentoDelete,
  view = "month",
  className,
  allowedViews,
}: AgendamentosCalendarProps) {
  const {
    isBarbeiroVisible,
    isStatusVisible,
    isColorVisible,
  } = useCalendarContext();

  // Transform and filter agendamentos to calendar events
  const calendarEvents = useMemo(() => {
    // debug
    console.log("AgendamentosCalendar received agendamentos:", agendamentos)
    // Transform to calendar events first
    const allEvents = transformAgendamentosToEvents(agendamentos);

    // Then filter based on visibility settings
    const filteredEvents = allEvents.filter(event => {
      const agendamentoEvent = event as CalendarEvent & { agendamento: Agendamento };
      const agendamento = agendamentoEvent.agendamento;

      if (agendamento) {
        const barbeiroVisible = isBarbeiroVisible(agendamento.barbeiro_user_id);
        const statusVisible = isStatusVisible(agendamento.status);
        return barbeiroVisible && statusVisible;
      }

      // For legacy events, use color visibility
      return isColorVisible(event.color);
    });

    console.log("AgendamentosCalendar events after filter:", filteredEvents)
    return filteredEvents;
  }, [agendamentos, isBarbeiroVisible, isStatusVisible, isColorVisible]);

  // Handle event selection
  const handleEventSelect = (event: CalendarEvent) => {
    const agendamentoEvent = event as CalendarEvent & { agendamento: Agendamento };
    if (agendamentoEvent.agendamento) {
      onAgendamentoClick(agendamentoEvent.agendamento);
    }
  };

  // Handle event creation
  const handleEventCreate = (startTime: Date) => {
    if (onNewAgendamento) {
      onNewAgendamento(startTime);
    }
  };

  // Handle event update (for drag & drop)
  const handleEventUpdate = (updatedEvent: CalendarEvent) => {
    const agendamentoEvent = updatedEvent as CalendarEvent & { agendamento: Agendamento };
    if (agendamentoEvent.agendamento && onAgendamentoUpdate) {
      const updatedAgendamento = transformEventToAgendamento(agendamentoEvent);
      onAgendamentoUpdate(updatedAgendamento);
    }
  };

  // Handle event deletion
  const handleEventDelete = (eventId: string) => {
    if (onAgendamentoDelete) {
      onAgendamentoDelete(eventId);
    }
  };

  // Don't show "New Event" button since we handle agendamento creation differently
  const handleEventAdd = () => {
    // This is called when the "New Event" button is clicked
    // For agendamentos, we'll redirect to the agendamento creation flow
    if (onNewAgendamento) {
      onNewAgendamento(new Date());
    }
  };

  return (
    <EventCalendar
      events={calendarEvents}
      onEventAdd={handleEventAdd}
      onEventUpdate={handleEventUpdate}
      onEventDelete={handleEventDelete}
      initialView={view}
      allowedViews={allowedViews}
      className={className}
    />
  );
}
