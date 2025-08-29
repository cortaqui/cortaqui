/**
 * Base table configurations and utilities for reusable DataTable components
 */

// Common pagination configuration
export const DEFAULT_TABLE_CONFIG = {
  itemsPerPage: 10,
  maxVisiblePages: 5,
} as const

// Common search configuration  
export const DEFAULT_SEARCH_CONFIG = {
  placeholder: "Buscar...",
  debounceMs: 300,
} as const

// Status filter configurations
export const AGENDAMENTO_STATUS_FILTERS = [
  { value: "todos", label: "Todos os Status" },
  { value: "agendado", label: "Agendado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" }
] as const

export const SERVICO_STATUS_FILTERS = [
  { value: "todos", label: "Todos os Status" },
  { value: "ativo", label: "Ativos" },
  { value: "inativo", label: "Inativos" }
] as const

// Pagination utilities
export interface PaginationConfig {
  currentPage: number
  itemsPerPage: number
  totalItems: number
}

export const calculatePagination = (config: PaginationConfig) => {
  const { currentPage, itemsPerPage, totalItems } = config
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  }
}

// Pagination page numbers utility
export const getPaginationPages = (currentPage: number, totalPages: number, maxVisible: number = 5) => {
  const pages: number[] = []
  
  if (totalPages <= maxVisible) {
    // Show all pages if total is less than max visible
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    // Calculate range around current page
    const start = Math.max(2, currentPage - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages - 1, start + maxVisible - 3)
    
    // Add ellipsis if needed
    if (start > 2) {
      pages.push(-1) // -1 represents ellipsis
    }
    
    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i)
      }
    }
    
    // Add ellipsis if needed
    if (end < totalPages - 1) {
      pages.push(-2) // -2 represents ellipsis  
    }
    
    // Always show last page if more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages)
    }
  }
  
  return pages
}

// Search utilities
export const createSearchFilter = <T>(
  items: T[],
  searchTerm: string,
  searchFields: ((item: T) => string)[]
): T[] => {
  if (!searchTerm) return items
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  return items.filter(item =>
    searchFields.some(getField => 
      getField(item)?.toLowerCase().includes(lowerSearchTerm)
    )
  )
}

// Generic status filter
export const createStatusFilter = <T>(
  items: T[],
  statusValue: string,
  getStatus: (item: T) => string | boolean,
  allStatusValue: string = "todos"
): T[] => {
  if (statusValue === allStatusValue) return items
  
  return items.filter(item => {
    const itemStatus = getStatus(item)
    
    // Handle boolean status (like ativo/inativo)
    if (typeof itemStatus === 'boolean') {
      return (statusValue === "ativo" && itemStatus) || 
             (statusValue === "inativo" && !itemStatus)
    }
    
    // Handle string status
    return itemStatus === statusValue
  })
}

// Table empty state messages
export const getEmptyStateMessage = (
  hasFilters: boolean,
  entityName: string = "item"
): string => {
  return hasFilters
    ? `Nenhum ${entityName} encontrado com os filtros aplicados.`
    : `Nenhum ${entityName} encontrado.`
}

// Format currency utility for tables
export const formatCurrency = (value: number): string => {
  return value.toLocaleString("pt-BR", { 
    style: "currency", 
    currency: "BRL",
    minimumFractionDigits: 2 
  })
}

// Format date utility for tables
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("pt-BR")
}

// Format time utility for tables  
export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  })
}

// Format datetime utility for tables
export const formatDateTime = (date: Date): { date: string; time: string } => {
  return {
    date: formatDate(date),
    time: formatTime(date)
  }
}