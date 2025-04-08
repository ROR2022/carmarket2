'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/utils/translation-context';
import { PaginationInfo } from '@/types/car';

interface CarPaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function CarPagination({ pagination, onPageChange }: CarPaginationProps) {
  const { t } = useTranslation();
  const { currentPage, totalPages } = pagination;

  // Mostrar solo algunos botones de página alrededor de la página actual
  const displayPageButtons = () => {
    const pages = [];
    
    // Siempre mostrar la primera página
    if (totalPages > 0) {
      pages.push(1);
    }
    
    // Calcular rango de páginas a mostrar alrededor de la página actual
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Agregar puntos suspensivos antes del rango si es necesario
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Agregar páginas del rango calculado
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Agregar puntos suspensivos después del rango si es necesario
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Siempre mostrar la última página si hay más de una página
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">{t('cars.pagination.previous')}</span>
      </Button>
      
      {displayPageButtons().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="px-3 py-2">...</span>
        ) : (
          <Button
            key={`page-${page}`}
            variant={currentPage === page ? 'default' : 'outline'}
            className="w-10 h-10"
            onClick={() => goToPage(Number(page))}
          >
            {page}
          </Button>
        )
      ))}
      
      <Button
        variant="outline"
        size="icon"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">{t('cars.pagination.next')}</span>
      </Button>
    </div>
  );
} 