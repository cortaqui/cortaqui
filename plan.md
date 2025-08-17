# Component Refactoring and UI Improvement Plan

## Executive Summary
This document outlines a comprehensive plan to extract reusable components from hard-coded UI elements across the Cortaqui barbershop management application, optimize the use of existing primitive components (especially the DataTable), and adapt the big-calendar system for the application's specific needs.

## 1. Component Extraction Plan

### 1.1 Priority Components to Extract

#### 1.1.1 High Priority - Repeated UI Patterns

**AgendamentoCard Component** (`src/components/AgendamentoCard.tsx`)
- **Current Usage**: Duplicated across multiple files:
  - `/barbeiro/agenda/page.tsx:58-96` (AgendamentoCard function)
  - `/meus-agendamentos/page.tsx:42-109` (AgendamentoCard function)
- **Recommended Props**: 
  ```typescript
  interface AgendamentoCardProps {
    agendamento: Agendamento
    showActions?: boolean
    onCancel?: (agendamento: Agendamento) => void
    onPay?: (agendamento: Agendamento) => void
    variant?: "compact" | "detailed"
  }
  ```
- **Benefits**: Eliminates 70+ lines of duplicated code, ensures consistent UI

**StatusBadge Component** (`src/components/StatusBadge.tsx`)
- **Current Usage**: Status badge logic duplicated in:
  - `/admin/agendamentos/page.tsx:17-39` (getStatusBadge function)
  - `/barbeiro/agenda/page.tsx:79-92` (inline status logic)
  - `/meus-agendamentos/page.tsx:72-80` (inline status logic)
- **Recommended Props**:
  ```typescript
  interface StatusBadgeProps {
    status: AgendamentoStatus
    variant?: "default" | "compact"
  }
  ```

**PageHeader Component** (`src/components/PageHeader.tsx`)
- **Current Usage**: Repeated header pattern in:
  - `/admin/agendamentos/page.tsx:43-52`
  - `/admin/servicos/page.tsx:34-43`
  - `/admin/barbeiros/page.tsx:25-34`
  - `/admin/clientes/page.tsx:16-21`
  - `/barbeiro/agenda/page.tsx:100-103`
  - `/meus-agendamentos/page.tsx:113-116`
- **Recommended Props**:
  ```typescript
  interface PageHeaderProps {
    title: string
    description?: string
    action?: React.ReactNode
  }
  ```

#### 1.1.2 Medium Priority - Service/Business Logic Components

**ServicoCard Component** (`src/components/ServicoCard.tsx`)
- **Current Usage**: Service display logic in `/agendar/page.tsx:63-92`
- **Recommended Props**:
  ```typescript
  interface ServicoCardProps {
    servico: Servico
    onSelect?: (servico: Servico) => void
    showPrice?: boolean
    variant?: "selectable" | "display"
  }
  ```

**HorarioSelector Component** (`src/components/HorarioSelector.tsx`)
- **Current Usage**: Time slot selection logic in `/agendar/page.tsx:177-190`
- **Recommended Props**:
  ```typescript
  interface HorarioSelectorProps {
    horarios: string[]
    selectedHorario?: string
    onSelect: (horario: string) => void
    disabled?: string[]
  }
  ```

#### 1.1.3 Low Priority - Simple UI Patterns

**EmptyState Component** (`src/components/EmptyState.tsx`)
- **Current Usage**: Empty state patterns in:
  - `/admin/clientes/page.tsx` (future use)
  - `/barbeiro/agenda/page.tsx:125-127, 161-163, 202-204, 232-234`
  - `/meus-agendamentos/page.tsx:130-137, 151-155`

### 1.2 Components NOT Recommended for Extraction

- **Agenda Semanal Logic** (`/barbeiro/agenda/page.tsx:30-50`): Complex, page-specific business logic
- **Modal Handlers**: Already properly implemented as separate modal components
- **API Integration Logic**: Should remain in pages/hooks

## 2. DataTable Integration Plan

### 2.1 Current State Analysis

The existing `DataTable` component (`src/components/data-table.tsx`) is a comprehensive, feature-rich table with:
- Drag & drop reordering
- Column visibility controls
- Pagination
- Filtering
- Sortable columns
- Responsive design
- Built-in drawer for detailed views

**Problem**: The DataTable is currently configured for a generic schema and not being used in admin pages that could benefit from it.

### 2.2 Recommended DataTable Implementations

#### 2.2.1 AgendamentosDataTable (`src/components/tables/AgendamentosDataTable.tsx`)
- **Replace**: `/admin/agendamentos/page.tsx:63-108` (basic Table usage)
- **Benefits**: Add filtering, sorting, pagination, column controls
- **Schema**: Adapt to Agendamento type
- **Features to Add**:
  - Status filtering
  - Date range filtering
  - Barbeiro/Cliente filtering
  - Export functionality

#### 2.2.2 ServicosDataTable (`src/components/tables/ServicosDataTable.tsx`)
- **Replace**: `/admin/servicos/page.tsx:51-92` (basic Table usage)
- **Benefits**: Add drag-and-drop reordering for service priority
- **Features to Add**:
  - Active/Inactive filtering
  - Price range filtering
  - Quick status toggle

#### 2.2.3 BarbeirosDataTable (`src/components/tables/BarbeirosDataTable.tsx`)
- **Replace**: `/admin/barbeiros/page.tsx:42-74` (basic Table usage)
- **Features to Add**:
  - Performance metrics integration
  - Availability status
  - Quick edit drawer

#### 2.2.4 ClientesDataTable (`src/components/tables/ClientesDataTable.tsx`)
- **Replace**: `/admin/clientes/page.tsx:29-54` (basic Table usage)
- **Features to Add**:
  - Search by name, phone, email
  - Registration date filtering
  - Customer metrics (total appointments, revenue)

### 2.3 DataTable Customization Strategy

**Create Base Configuration** (`src/lib/table-configs.ts`):
```typescript
export const createAgendamentoColumns = (actions?: TableActions<Agendamento>) => ColumnDef<Agendamento>[]
export const createServicoColumns = (actions?: TableActions<Servico>) => ColumnDef<Servico>[]
// ... etc
```

**Reusable Table Wrapper** (`src/components/tables/BaseDataTable.tsx`):
- Generic wrapper around DataTable
- Type-safe column definitions
- Consistent styling and behavior

## 3. Big-Calendar Integration Plan

### 3.1 Current State Analysis

**Existing Components**:
- `big-calendar.tsx`: Sample calendar with hardcoded events
- `event-calendar/`: Complete calendar system with multiple views
- Sample events and etiquettes system

### 3.2 Calendar Integration Strategy

#### 3.2.1 AgendamentosCalendar (`src/components/AgendamentosCalendar.tsx`)

**For**: `/admin/agendamentos/page.tsx`

**Implementation Plan**:
```typescript
interface AgendamentosCalendarProps {
  agendamentos: Agendamento[]
  onAgendamentoClick: (agendamento: Agendamento) => void
  onNewAgendamento: (date: Date, time?: Date) => void
  view?: 'month' | 'week' | 'day' | 'agenda'
}
```

**Data Transformation**:
```typescript
const transformAgendamentosToEvents = (agendamentos: Agendamento[]): CalendarEvent[] => {
  return agendamentos.map(agendamento => ({
    id: agendamento.id,
    title: `${agendamento.cliente?.nome} - ${agendamento.servico?.nome}`,
    start: agendamento.data_hora,
    end: addMinutes(agendamento.data_hora, agendamento.servico?.duracao_minutos || 30),
    color: getColorByBarbeiro(agendamento.barbeiro?.id),
    description: `Barbeiro: ${agendamento.barbeiro?.nome}`,
    location: "Barbearia Tradição do Boleiro",
    // Add custom data
    agendamento: agendamento
  }))
}
```

**Color Scheme by Barbeiro**:
```typescript
const barbeiroColors = {
  "1": "blue",    // João Silva  
  "2": "emerald", // Carlos Santos
  "3": "orange",  // Pedro Oliveira
} as const
```

#### 3.2.2 AgendaBarbeiroCalendar (`src/components/AgendaBarbeiroCalendar.tsx`)

**For**: `/barbeiro/agenda/page.tsx`

**Replace**: Current tabs-based view with calendar integration
**Implementation**:
- Single barbeiro filter (current logged barbeiro)
- Week/Day views optimized for barbeiro workflow
- Quick status updates on events
- Time slot availability display

**Integration Plan**:
1. Keep existing tabs but add "Calendar" tab
2. Use calendar as primary view, keep list views as alternative
3. Integrate with existing `AgendamentoCard` component

### 3.2.3 Calendar Context Adaptation

**Update CalendarContext** (`src/components/event-calendar/calendar-context.tsx`):
- Replace hardcoded `etiquettes` with dynamic barbeiro-based filters
- Add agendamento-specific filtering (status, service type)

**New Context Interface**:
```typescript
interface CalendarContextType {
  // Existing
  currentDate: Date
  setCurrentDate: (date: Date) => void
  
  // Updated for agendamentos
  visibleBarbeiros: string[]
  toggleBarbeiroVisibility: (barbeiroId: string) => void
  visibleStatus: AgendamentoStatus[]
  toggleStatusVisibility: (status: AgendamentoStatus) => void
  
  // Barbeiro-specific (for barbeiro pages)
  currentBarbeiro?: string
  setCurrentBarbeiro?: (barbeiroId: string) => void
}
```

## 4. Implementation Roadmap

### Phase 1: High-Impact Components
1. **AgendamentoCard** - Extract and implement across all pages
2. **StatusBadge** - Centralize status display logic
3. **PageHeader** - Standardize page headers
4. **AgendamentosDataTable** - Replace basic table in admin agendamentos

### Phase 2: DataTable Integration
1. **ServicosDataTable** - Add advanced table features to services
2. **BarbeirosDataTable** - Enhance barbeiros management
3. **ClientesDataTable** - Improve clients overview
4. **Base table configurations** - Create reusable column definitions

### Phase 3: Calendar Integration
1. **AgendamentosCalendar** - Integrate calendar view in admin agendamentos
2. **Calendar Context updates** - Adapt for agendamento-specific needs
3. **Data transformation utilities** - Convert agendamentos to calendar events

### Phase 4: Advanced Calendar Features
1. **AgendaBarbeiroCalendar** - Replace tabs with calendar in barbeiro agenda
2. **Calendar-based scheduling** - Allow drag-drop rescheduling
3. **Availability display** - Show free time slots
4. **Mobile optimization** - Ensure calendar works well on mobile

### Phase 5: Polish and Optimization
1. **ServicoCard & HorarioSelector** - Extract remaining components
2. **EmptyState** - Standardize empty states
3. **Performance optimization** - Code splitting, lazy loading
4. **Testing** - Unit tests for new components

## 5. Data Flow Considerations

### 5.1 Current Data Flow Issues
- Mock data scattered across pages
- No centralized state management for calendar events
- Duplicated data transformation logic

### 5.2 Recommended Data Flow
```
API Layer (Future)
    ↓
React Query / SWR (Recommended)
    ↓
Custom Hooks (useAgendamentos, useBarbeiros, etc.)
    ↓
Components (AgendamentoCard, DataTables, Calendar)
```

### 5.3 Calendar-Specific Data Flow
```
Agendamentos (Database)
    ↓
transformAgendamentosToEvents()
    ↓
CalendarContext (Filtering & State)
    ↓
EventCalendar Components
```

## 6. Breaking Changes and Migration

### 6.1 Required Updates
- Update imports in all pages using extracted components
- Replace basic Tables with DataTable implementations
- Update calendar event handlers to work with agendamento data

### 6.2 Backward Compatibility
- Keep existing page functionality during migration
- Gradual replacement of components (feature flags if needed)
- Maintain existing API contracts

## 7. Testing Strategy

### 7.1 Component Testing
- Unit tests for all extracted components
- Storybook stories for component documentation
- Visual regression tests for complex components (DataTable, Calendar)

### 7.2 Integration Testing
- Test calendar event transformations
- Test DataTable filtering and sorting with real agendamento data
- Test component interactions

## 8. Success Metrics

### 8.1 Code Quality
- **Target**: Reduce duplicated code by 60%
- **Target**: Improve component reusability by 80%
- **Target**: Achieve 90%+ test coverage for new components

### 8.2 User Experience
- **Target**: Improve admin workflow efficiency (calendar view, advanced filtering)
- **Target**: Enhance mobile experience (responsive DataTable, mobile calendar)
- **Target**: Reduce page load times by 20% (code splitting)

### 8.3 Developer Experience
- **Target**: Reduce development time for new features by 40%
- **Target**: Standardize component API patterns
- **Target**: Improve type safety across the application

## 9. Conclusion

This plan provides a structured approach to modernizing the Cortaqui frontend by:

1. **Eliminating Code Duplication**: Extracting 6+ reusable components will reduce maintenance burden
2. **Leveraging Existing Infrastructure**: The DataTable component is underutilized - implementing it across admin pages will provide immediate UX improvements
3. **Integrating Advanced Calendar Features**: The big-calendar system can be adapted to provide powerful scheduling and visualization tools
4. **Maintaining Development Velocity**: Phased approach ensures continuous delivery while improving code quality

**Estimated Timeline**: 10 weeks with 1 developer
**Estimated Effort**: ~200-250 hours
**Risk Level**: Low-Medium (mostly refactoring existing functionality)

The plan prioritizes high-impact, low-risk changes first, ensuring quick wins while building toward more complex integrations.
