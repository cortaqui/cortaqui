# Cortaqui - Project Documentation Summary

## Project Overview

**Cortaqui** is a comprehensive barbershop management system developed for "Barbearia Tradição do Boleiro". The application centralizes scheduling, client management, barber management, services, and reporting operations.

### Core Modules

1. **Client Module**
   - Registration and authentication
   - Profile management
   - Service browsing with pricing
   - Online appointment scheduling
   - Appointment history and future bookings
   - Appointment cancellation (with business rules)
   - Post-service online payments

2. **Barber Module**
   - Authentication and profile management
   - Daily/weekly schedule viewing
   - Service history tracking

3. **Administrator Module**
   - CRUD operations for barbers, clients, and services
   - Barber availability and schedule management
   - Financial and operational reporting
   - Complete appointment management

### Technical Stack (T3 Stack)

- **Frontend**: Next.js 15.3.3, React 19.1.0, TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.10, Radix UI Components
- **State Management**: TanStack React Query 5.83.0
- **Authentication**: Clerk (@clerk/nextjs 6.24.0), syncing with databse via webhook
- **Database**: PostgreSQL with Drizzle ORM 0.38.4
- **Payments**: PagSeguro API integration
- **Additional**: Framer Motion, Sonner toasts, Lucide/Tabler icons

### Database Schema

Core entities include:
- **Usuario** (UUID PK): Unified user table with role-based types (cliente/barbeiro/admin)
- **Servico** (UUID PK): Services with base pricing and duration
- **Servico_Barbeiro**: Junction table for barber-specific service pricing
- **Agendamento** (UUID PK): Appointments with status tracking
- **Pagamento** (UUID PK): Payment records linked to appointments
- **Disponibilidade** (UUID PK): Barber availability scheduling

## Data Flows Summary

### Client Appointment Flow
1. **Service Discovery**: Client accesses `/agendar` → `GET /api/servicos` → Display active services
2. **Availability Check**: Service selection → `GET /api/disponibilidade?servicoId=X` → Show available barbers and times
3. **Booking Creation**: Time/barber selection → `POST /api/agendamentos` → Validation and database insertion
4. **Confirmation**: Success response → User notification via Sonner

### Admin-Assisted Booking Flow
1. **Client Creation**: Admin creates new client → `POST /api/admin/clientes` → Client registration
2. **Service Selection**: Admin selects service → `GET /api/servicos` → Service listing
3. **Appointment Scheduling**: Service/barber/time selection → `POST /api/agendamentos` → Booking creation
4. **Confirmation**: Success confirmation to admin

### Payment Processing
- Post-service payment via `/agendar/pagamento/:idAgendamento`
- PagSeguro integration through `POST /api/pagamentos`
- Automatic invoice generation upon successful payment

### Reporting Data Flow
- Admin accesses `/admin/relatorios/faturamento`
- Backend executes aggregated queries on Agendamento and Pagamento tables
- Financial metrics and operational reports generation

## Architecture Context

### Component Refactoring Plan

The project follows a systematic approach to extract reusable components and optimize existing infrastructure:

#### High Priority Components to Extract
1. **AgendamentoCard**: Eliminate 70+ lines of duplicated appointment card logic across multiple pages
2. **StatusBadge**: Centralize status display logic currently duplicated in 3+ locations
3. **PageHeader**: Standardize page header patterns across 6+ admin and user pages

#### DataTable Integration Strategy
- Leverage existing comprehensive DataTable component with drag-drop, filtering, and pagination
- Create specialized implementations:
  - **AgendamentosDataTable**: Enhanced appointment management with status/date filtering
  - **ServicosDataTable**: Service management with drag-drop priority reordering
  - **BarbeirosDataTable**: Barber management with performance metrics
  - **ClientesDataTable**: Client management with search and metrics

#### Calendar System Integration
- Adapt existing big-calendar and event-calendar components for appointment visualization
- **AgendamentosCalendar**: Admin-focused calendar view with multi-barber support
- **AgendaBarbeiroCalendar**: Barber-specific calendar integration
- Color-coded system by barber for visual organization

### Implementation Phases

1. **Phase 1**: High-impact component extraction (AgendamentoCard, StatusBadge, PageHeader)
2. **Phase 2**: DataTable integration across admin pages
3. **Phase 3**: Calendar system integration for appointment visualization
4. **Phase 4**: Advanced calendar features (drag-drop rescheduling, availability display)
5. **Phase 5**: Performance optimization and testing

### Current Development Status
- Database schema and authentication setup completed
- UI scaffolding and mock data integration in progress
- Component extraction and DataTable integration pending
- Calendar system adaptation planned for enhanced scheduling workflow

### Success Metrics
- **Code Quality**: 60% reduction in duplicated code, 80% improvement in component reusability
- **User Experience**: Enhanced admin workflow efficiency through calendar views and advanced filtering
- **Developer Experience**: 40% reduction in development time for new features through standardized component patterns

## Database Tasks

### Critical Schema & Type Mismatches

#### 1. Schema vs Types Inconsistency
- **Schema** uses camelCase field names (`servicoId`, `dataHoraInicio`, etc.)
- **Types** uses snake_case field names (`id`, `data_hora`, etc.)
- **Action Required**: Align TypeScript types with actual database schema naming

#### 2. Missing Schema Timestamps
- **Schema Issue**: Missing `updatedAt` timestamps in all tables (referenced in queries but undefined)
- **Queries Issue**: Lines 39, 43, 61, 66, 76, 83 reference non-existent `updatedAt` fields
- **Action Required**: Add timestamp fields to schema or remove from queries

#### 3. Status Enum Mismatches
- **Agendamento Status**:
  - Schema: `["CONFIRMADO", "PENDENTE", "CANCELADO", "CONCLUIDO"]`
  - Types: `["agendado", "confirmado", "em_andamento", "concluido", "cancelado"]`
- **Action Required**: Standardize status values across schema and types

### Missing Query Implementations

#### 1. CRUD Operations Missing
- **Usuarios**: Update, delete, list operations
- **Servicos**: Update, delete operations (only create/list exist)
- **Agendamentos**: Update, get by ID operations
- **Pagamentos**: Update, get by ID operations
- **Disponibilidade**: Create, update, delete operations (only list exists)

#### 2. Business Logic Queries Missing
- **Availability Checking**: No query to check barbeiro availability for specific time slots
- **Servico-Barbeiro Relations**: No queries for managing barber-specific service pricing
- **Conflict Prevention**: No duplicate appointment validation queries
- **Reporting Queries**: No aggregation queries for admin dashboard metrics

#### 3. Relationship Queries Missing
- **Agendamentos with Relations**: Queries don't include related data (cliente, barbeiro, servico)
- **User Role Filtering**: No queries filtering users by role type
- **Service-Barbeiro Associations**: Missing queries to manage which barbeiros offer which services

### Required Database Fixes

#### High Priority
1. **Fix Schema Timestamps**: Add `createdAt`/`updatedAt` to all tables or remove from queries
2. **Standardize Field Names**: Align TypeScript interfaces with actual database schema
3. **Fix Status Enums**: Ensure consistency between schema enums and type definitions
4. **Add Missing Foreign Key Constraints**: Some relationships missing proper cascade rules

#### Medium Priority
1. **Implement Missing CRUD**: Complete all basic CRUD operations for each entity
2. **Add Business Logic Queries**: Availability checking, conflict detection
3. **Implement Relationship Queries**: Queries that include related data
4. **Add Validation Queries**: Duplicate prevention, business rule enforcement

#### Low Priority
1. **Add Reporting Queries**: Dashboard metrics and aggregation functions
2. **Optimize Query Performance**: Add indexes, optimize complex queries
3. **Add Audit Logging**: Track changes for important entities
4. **Implement Soft Deletes**: For entities that shouldn't be hard deleted

### Specific Implementation Tasks

#### 1. Schema Updates Required
```typescript
// Add to all tables:
createdAt: timestamp("created_at").defaultNow(),
updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
```

#### 2. Missing Query Functions
- `updateUsuario()`, `deleteUsuario()`, `listUsuariosByRole()`
- `updateServico()`, `deleteServico()`, `getServicoById()`
- `updateAgendamento()`, `getAgendamentoById()`, `getAgendamentosWithRelations()`
- `createDisponibilidade()`, `updateDisponibilidade()`, `deleteDisponibilidade()`
- `checkBarbeiroAvailability()`, `getConflictingAgendamentos()`
- `getServicosBarbeiro()`, `assignServicoToBarbeiro()`

#### 3. Type Definitions Update
- Update all interfaces in `types.ts` to match schema field names
- Add proper status type unions matching schema enums
- Include relationship types for joined queries

