import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TourStep {
  selector: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  mobileSelector?: string;
  mobilePosition?: 'top' | 'bottom' | 'center';
}

const TOUR_STEPS: TourStep[] = [
  {
    selector: '#novedades-sidebar',
    mobileSelector: '[href="/"]',
    title: 'Lista de Novedades',
    description: 'Aquí aparecerán todos los reportes que tú y tu equipo registren durante la guardia.',
    position: 'right',
    mobilePosition: 'top'
  },
  {
    selector: '#btn-nueva-guardia',
    title: 'Nueva Guardia',
    description: 'Este es el corazón de la app. Antes de empezar a trabajar, debes abrir una guardia completando la Orden del Día.',
    position: 'bottom',
    mobilePosition: 'bottom'
  },
  {
    selector: '[href="/personal"]',
    title: 'Gestión de Personal',
    description: 'Añade a tus compañeros, asigna rangos y organiza los grupos de guardia desde aquí.',
    position: 'right',
    mobilePosition: 'top'
  },
  {
    selector: '[href="/estadisticas"]',
    title: 'Estadísticas',
    description: 'Visualiza el rendimiento y los datos históricos acumulados de tus reportes.',
    position: 'right',
    mobilePosition: 'top'
  },
  {
    selector: '[href="/settings"]',
    title: 'Configuración',
    description: 'Personaliza módulos, plantillas y sincronización desde el panel de ajustes.',
    position: 'right',
    mobilePosition: 'top'
  }
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => {
      window.removeEventListener('resize', checkMobile);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const updateRect = () => {
      const step = TOUR_STEPS[currentStep];
      if (!step) return;

      const selector = (isMobile && step.mobileSelector) || step.selector;
      const el = document.querySelector(selector);
      
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll only if the element is not already well visible
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [currentStep, isVisible, isMobile]);

  const step = TOUR_STEPS[currentStep];

  const tooltipStyles = useMemo(() => {
    if (!step || !targetRect) return { 
      top: '50%', 
      left: '50%', 
      transform: 'translate(-50%, -50%)',
      position: 'fixed' as const
    };

    const padding = 12;
    const { top, left, width, height } = targetRect;
    
    if (isMobile) {
      // On mobile, if target is at the bottom (like bottom nav), show tooltip at top
      // If target is at the top, show tooltip at bottom
      const isTargetAtBottom = top > window.innerHeight / 2;
      return {
        top: isTargetAtBottom ? padding + 60 : top + height + padding,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100vw - 32px)',
        maxWidth: '360px'
      };
    }

    switch (step.position) {
      case 'bottom':
        return { 
          top: Math.min(top + height + padding, window.innerHeight - 240), 
          left: Math.max(20, Math.min(left + width / 2, window.innerWidth - 340)), 
          transform: 'translateX(-50%)' 
        };
      case 'top':
        return { 
          top: Math.max(20, top - padding), 
          left: Math.max(20, Math.min(left + width / 2, window.innerWidth - 340)), 
          transform: 'translate(-50%, -100%)' 
        };
      case 'left':
        return { 
          top: Math.max(20, Math.min(top + height / 2, window.innerHeight - 200)), 
          left: left - padding, 
          transform: 'translate(-100%, -50%)' 
        };
      case 'right':
        return { 
          top: Math.max(20, Math.min(top + height / 2, window.innerHeight - 200)), 
          left: left + width + padding, 
          transform: 'translateY(-50%)' 
        };
      default:
        return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
  }, [targetRect, step, isMobile]);

  if (!isVisible || !step) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden">
      {/* Dimmed Background with Hole */}
      <div 
        className="absolute inset-0 bg-black/60 transition-opacity duration-500 pointer-events-auto"
        style={{
          clipPath: targetRect 
            ? `polygon(0% 0%, 0% 100%, ${targetRect.left}px 100%, ${targetRect.left}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.top}px, ${targetRect.right}px ${targetRect.bottom}px, ${targetRect.left}px ${targetRect.bottom}px, ${targetRect.left}px 100%, 100% 100%, 100% 0%)`
            : 'none'
        }}
      />

      {/* Tooltip */}
      <div 
        className="absolute bg-card border rounded-3xl p-5 shadow-2xl w-[calc(100vw-40px)] sm:w-[320px] pointer-events-auto animate-in zoom-in-95 fade-in duration-300 z-50"
        style={tooltipStyles}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={onComplete}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5 mb-6">
          <h3 className="text-lg font-bold tracking-tight">{step.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === currentStep ? "bg-primary w-4" : "bg-muted w-1"
                )}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCurrentStep(prev => prev - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <Button 
              size="sm" 
              className="px-4 font-bold"
              onClick={() => {
                if (currentStep < TOUR_STEPS.length - 1) {
                  setCurrentStep(prev => prev + 1);
                } else {
                  onComplete();
                }
              }}
            >
              {currentStep === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}
              {currentStep < TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Highlight ring */}
      {targetRect && (
        <div 
          className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_4px_rgba(var(--primary),0.2)] transition-all duration-300 animate-pulse"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
    </div>,
    document.body
  );
}
