'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Undo, RotateCcw, Paintbrush, Grid, Save, ZoomIn, ZoomOut, Hand, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface PhotoEditorProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string;
  photoName?: string;
  onSave: (updatedUrl: string) => void;
}

const COLORS = [
  { name: 'Rojo', value: '#EF4444' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Amarillo', value: '#F59E0B' },
  { name: 'Verde', value: '#10B981' },
  { name: 'Negro', value: '#18181B' },
  { name: 'Blanco', value: '#FFFFFF' },
];

const BRUSH_SIZES = [
  { name: 'Fino', value: 8 },
  { name: 'Medio', value: 20 },
  { name: 'Grueso', value: 40 },
];

export const PhotoEditor: React.FC<PhotoEditorProps> = ({
  isOpen,
  onClose,
  photoUrl,
  photoName = 'Evidencia',
  onSave,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tool, setTool] = useState<'pen' | 'pixel' | 'pan'>('pixel');
  const [color, setColor] = useState('#EF4444');
  const [brushSize, setBrushSize] = useState(20);

  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);

  // Track drawing coordinate variables synchronously in Refs to prevent async batched stale state bugs at 60fps
  const isDrawingRef = useRef(false);
  const lastCoordRef = useRef<{ x: number; y: number } | null>(null);
  const lastMidPointRef = useRef<{ x: number; y: number } | null>(null);

  // Offscreen canvas refs
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pixelatedCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Zoom & Pan states
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const lastScreenXRef = useRef(0);
  const lastScreenYRef = useRef(0);

  // Undo history stack
  const [history, setHistory] = useState<ImageData[]>([]);

  // Load image on canvas initialisation
  useEffect(() => {
    if (!isOpen || !photoUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = photoUrl;

    img.onload = () => {
      setOriginalImage(img);
      initCanvas(img);
      setHistory([]);
      setZoom(1);
      setPan({ x: 0, y: 0 });
    };
    img.onerror = () => {
      toast.error('No se pudo cargar la imagen para editar.');
    };
  }, [isOpen, photoUrl]);

  // Mouse Wheel Zoom Listener registered on window to support lazy Dialog mounting lifecycles
  useEffect(() => {
    if (!isOpen) return;

    const handleWheelGlobal = (e: WheelEvent) => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas) return;

      // Only handle zoom if the scroll target is inside our canvas board or container
      if (canvas.contains(e.target as Node) || (container && container.contains(e.target as Node))) {
        e.preventDefault(); // prevent main page scroll
        
        const ZOOM_SPEED_FACTOR = e.deltaY < 0 ? 1.15 : 0.85;
        
        setZoom((z) => {
          const nextZ = Math.min(4, Math.max(1, z * ZOOM_SPEED_FACTOR));
          if (nextZ === 1) {
            setPan({ x: 0, y: 0 }); // reset pan when zoomed out
          }
          return nextZ;
        });
      }
    };

    window.addEventListener('wheel', handleWheelGlobal, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheelGlobal);
    };
  }, [isOpen]);

  // Pre-pixelate the entire loaded image once to allow a flicker-free, grid-aligned, performant reveal brush
  const initPixelatedSource = (source: HTMLCanvasElement | HTMLImageElement) => {
    const pixelCanvas = pixelatedCanvasRef.current || document.createElement('canvas');
    pixelatedCanvasRef.current = pixelCanvas;

    const sourceW = 'naturalWidth' in source ? source.naturalWidth || source.width : source.width;
    const sourceH = 'naturalHeight' in source ? source.naturalHeight || source.height : source.height;

    pixelCanvas.width = sourceW;
    pixelCanvas.height = sourceH;

    const pCtx = pixelCanvas.getContext('2d');
    if (!pCtx) return;

    // Scale factor: downscale by block size (20px looks highly secure and crisp)
    const BLOCK_SIZE = 20;
    const tempW = Math.max(1, Math.round(sourceW / BLOCK_SIZE));
    const tempH = Math.max(1, Math.round(sourceH / BLOCK_SIZE));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = tempW;
    tempCanvas.height = tempH;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    // Draw downsampled image
    tempCtx.drawImage(source, 0, 0, tempW, tempH);

    // Redraw upscaled image back to full resolution without smoothing
    pCtx.imageSmoothingEnabled = false;
    pCtx.drawImage(
      tempCanvas,
      0, 0, tempW, tempH,
      0, 0, sourceW, sourceH
    );
  };

  const initCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Use the natural dimensions of the image to preserve high quality resolution
    canvas.width = img.naturalWidth || img.width || 1200;
    canvas.height = img.naturalHeight || img.height || 900;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    initPixelatedSource(img);
  };

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      if (!touch) return null;
      clientX = touch.clientX;
      clientY = touch.clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale back to internal canvas coordinate space (handles any CSS scaling / Zoom sizes natively)
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: x * scaleX,
      y: y * scaleY,
    };
  };

  // Quadratic Bezier Interpolation Helper for perfectly smooth curves
  const getQuadraticBezierPoint = (
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number
  ) => {
    const oneMinusT = 1 - t;
    return {
      x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
      y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
    };
  };

  // Static grid-locked pixelation reveal brush (WhatsApp style)
  const drawPixelatedBrush = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number
  ) => {
    const pixelCanvas = pixelatedCanvasRef.current;
    if (!pixelCanvas) return;

    ctx.save();
    // Clip drawing path within circular brush
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.clip();

    // Copy directly from the pre-pixelated source locked to the image grid
    ctx.drawImage(pixelCanvas, 0, 0);

    ctx.restore();
  };

  const drawQuadraticStroke = (
    ctx: CanvasRenderingContext2D,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) => {
    if (tool === 'pen') {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(p0.x, p0.y);
      ctx.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
      ctx.stroke();
    } else if (tool === 'pixel') {
      // Calculate length of the Bezier segment approximately
      const dx = p2.x - p0.x;
      const dy = p2.y - p0.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Smooth step interpolation along the Bezier curve
      const stepSize = Math.max(2, brushSize / 4);
      const steps = Math.ceil(distance / stepSize);

      for (let i = 0; i <= steps; i++) {
        const t = steps === 0 ? 0 : i / steps;
        const pt = getQuadraticBezierPoint(p0, p1, p2, t);
        drawPixelatedBrush(ctx, pt.x, pt.y, brushSize);
      }
    }
  };

  const handleStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle Pan/Move tool activation
    if (tool === 'pan') {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX !== undefined && clientY !== undefined) {
        lastScreenXRef.current = clientX;
        lastScreenYRef.current = clientY;
        isDrawingRef.current = true;
      }
      return;
    }

    const coord = getCanvasCoords(e);
    if (!coord) return;

    // Save previous snapshot to Undo History stack
    const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-19), snapshot]); // Keep max 20 states in memory

    isDrawingRef.current = true;
    lastCoordRef.current = coord;
    lastMidPointRef.current = coord;

    // Render single point click instantly
    if (tool === 'pen') {
      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(coord.x, coord.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (tool === 'pixel') {
      drawPixelatedBrush(ctx, coord.x, coord.y, brushSize);
    }
  };

  const handleMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();

    if (!isDrawingRef.current) return;

    // Handle Panning update
    if (tool === 'pan') {
      const clientX = 'touches' in e ? e.touches[0]?.clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : e.clientY;
      if (clientX !== undefined && clientY !== undefined) {
        const dx = clientX - lastScreenXRef.current;
        const dy = clientY - lastScreenYRef.current;

        // Update pan offset relative to zoom level
        setPan((prev) => ({
          x: prev.x + dx / zoom,
          y: prev.y + dy / zoom,
        }));

        lastScreenXRef.current = clientX;
        lastScreenYRef.current = clientY;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coord = getCanvasCoords(e);
    if (!coord || !lastCoordRef.current || !lastMidPointRef.current) return;

    const lastCoord = lastCoordRef.current;
    const lastMidPoint = lastMidPointRef.current;

    // Apply exponential smoothing low-pass filter to raw pointer coordinates (filters out digitizer angular noise/hand tremor)
    const SMOOTHING_FACTOR = 0.45; // golden 45% ratio: ultra-responsive and calligraphically smooth
    const smoothedCoord = {
      x: lastCoord.x + (coord.x - lastCoord.x) * SMOOTHING_FACTOR,
      y: lastCoord.y + (coord.y - lastCoord.y) * SMOOTHING_FACTOR,
    };

    // Calculate midpoint between the previous smoothed position and the new smoothed coordinate
    const midPoint = {
      x: (lastCoord.x + smoothedCoord.x) / 2,
      y: (lastCoord.y + smoothedCoord.y) / 2,
    };

    // Draw smooth quadratic curve from lastMidPoint to current midPoint
    drawQuadraticStroke(ctx, lastMidPoint, lastCoord, midPoint);

    // Update coordinates tracking synchronously in Refs using the smoothed values
    lastCoordRef.current = smoothedCoord;
    lastMidPointRef.current = midPoint;
  };

  const handleEnd = () => {
    if (tool === 'pan') {
      isDrawingRef.current = false;
      return;
    }

    if (isDrawingRef.current && lastCoordRef.current && lastMidPointRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Connect to the final point smoothly
          drawQuadraticStroke(ctx, lastMidPointRef.current, lastCoordRef.current, lastCoordRef.current);
        }
      }
    }
    isDrawingRef.current = false;
    lastCoordRef.current = null;
    lastMidPointRef.current = null;
  };

  // Zoom Controls
  const handleZoomIn = () => {
    setZoom((z) => Math.min(4, z + 0.5));
  };

  const handleZoomOut = () => {
    setZoom((z) => {
      const nextZ = Math.max(1, z - 0.5);
      if (nextZ === 1) {
        setPan({ x: 0, y: 0 }); // reset panning when zoomed out fully
      }
      return nextZ;
    });
  };

  const handleZoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    if (!previousState) return;

    // Restore size if it differed
    if (canvas.width !== previousState.width || canvas.height !== previousState.height) {
      canvas.width = previousState.width;
      canvas.height = previousState.height;
      initPixelatedSource(canvas);
    }

    ctx.putImageData(previousState, 0, 0);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleReset = () => {
    if (!originalImage || history.length === 0) return;

    // Save state before reset
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory((prev) => [...prev.slice(-19), snapshot]);
      }
    }

    initCanvas(originalImage);
    handleZoomReset();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
      toast.success('Imagen editada guardada.');
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la imagen editada.');
    }
  };

  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      if (history.length > 0) {
        setShowConfirmDiscard(true);
      } else {
        onClose();
      }
    }
  };

  const handleCloseRequest = () => {
    if (history.length > 0) {
      setShowConfirmDiscard(true);
    } else {
      onClose();
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          className="max-w-[95vw] md:max-w-4xl p-0 border border-muted/20 bg-background/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[85vh]"
          onPointerDownOutside={(e) => {
            if (history.length > 0) {
              e.preventDefault();
              setShowConfirmDiscard(true);
            }
          }}
          onEscapeKeyDown={(e) => {
            if (history.length > 0) {
              e.preventDefault();
              setShowConfirmDiscard(true);
            }
          }}
        >

        {/* Editor Header */}
        <DialogHeader className="p-4 border-b border-muted/15 flex flex-row items-center justify-between shrink-0 bg-muted/5">
          <div>
            <DialogTitle className="text-sm font-semibold truncate max-w-[200px] sm:max-w-xs md:max-w-md">
              Editar Foto: {photoName}
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {tool === 'pixel' && 'Difumina rostros o textos arrastrando el pincel'}
              {tool === 'pen' && 'Dibuja libremente sobre la imagen con colores'}
              {tool === 'pan' && 'Arrastra la imagen ampliada para mover el visor (Pan)'}
            </p>
          </div>
        </DialogHeader>

        {/* Editor Main Canvas Board */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-hidden bg-zinc-950/60 relative flex items-center justify-center p-4 min-h-0 select-none"
        >
          {/* Hardware-Accelerated Canvas with strict max-height constraint for 100% visible fit at 1x */}
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            className="max-w-full max-h-[50vh] object-contain border border-white/10 rounded-lg shadow-2xl bg-zinc-900 touch-none"
            style={{
              cursor: tool === 'pan' ? 'grab' : 'crosshair',
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`, 
              transition: isDrawingRef.current && tool === 'pan' ? 'none' : 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              transformOrigin: 'center'
            }}
          />

          {/* Floating Zoom & Pan Controls Inside the Frame Viewport */}
          <div className="absolute bottom-4 right-4 z-30 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            {zoom > 1 && (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-7 px-2 text-[9px] rounded-lg font-bold"
                  onClick={handleZoomReset}
                >
                  Reset
                </Button>
                <div className="h-5 w-[1px] bg-white/10 mx-1" />
              </>
            )}

            {/* Pan/Hand toggle */}
            <Button
              type="button"
              variant={tool === 'pan' ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 rounded-xl ${tool === 'pan' ? 'bg-primary text-primary-foreground' : 'text-white hover:bg-white/10'}`}
              onClick={() => setTool(tool === 'pan' ? 'pixel' : 'pan')}
              title={tool === 'pan' ? 'Volver a Dibujar' : 'Mover Imagen (Pan)'}
            >
              <Hand className="h-4 w-4" />
            </Button>
            
            <div className="h-5 w-[1px] bg-white/10 mx-1" />

            {/* Zoom Controls */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-white hover:bg-white/10 disabled:opacity-40"
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              title="Alejar (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <span className="text-[10px] px-1 font-bold text-white select-none min-w-[32px] text-center">
              {zoom.toFixed(1)}x
            </span>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-white hover:bg-white/10 disabled:opacity-40"
              onClick={handleZoomIn}
              disabled={zoom >= 4}
              title="Acercar (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Elegant Interactive Controls Panel */}
        <div className="p-4 border-t border-muted/15 bg-background flex flex-col gap-4 shrink-0 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-4">

            {/* Tool Selection Buttons */}
            <div className="flex flex-wrap items-center gap-1 bg-muted/40 p-1 rounded-xl">
              <Button
                type="button"
                variant={tool === 'pixel' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-lg h-8 gap-2 font-medium px-3 text-xs"
                onClick={() => setTool('pixel')}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>Difuminar / Pixelear</span>
              </Button>
              <Button
                type="button"
                variant={tool === 'pen' ? 'default' : 'ghost'}
                size="sm"
                className="rounded-lg h-8 gap-2 font-medium px-3 text-xs"
                onClick={() => setTool('pen')}
              >
                <Paintbrush className="h-3.5 w-3.5" />
                <span>Lápiz de Dibujo</span>
              </Button>
            </div>

            {/* Sub-toolbar details (Brush Sizes) */}
            <div className="flex items-center gap-4">

              {/* Conditional size selection for draw/pixel tools */}
              {(tool === 'pen' || tool === 'pixel') && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground font-medium">Brocha:</span>
                  <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl">
                    {BRUSH_SIZES.map((size) => (
                      <Button
                        key={size.value}
                        type="button"
                        variant={brushSize === size.value ? 'secondary' : 'ghost'}
                        size="sm"
                        className="h-7 px-2 text-[10px] rounded-lg font-medium"
                        onClick={() => setBrushSize(size.value)}
                      >
                        {size.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Undo & Reset actions (Reset is disabled when no change history exists) */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={history.length === 0}
                className="h-8 w-8 p-0 rounded-lg"
                title="Deshacer"
                onClick={handleUndo}
              >
                <Undo className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={history.length === 0}
                className="h-8 w-8 p-0 rounded-lg"
                title="Revertir todo"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>

          </div>

          {/* Subpanel: Color Palette for Pen Drawing */}
          {tool === 'pen' && (
            <div className="flex items-center gap-3 border-t border-muted/10 pt-3 animate-in slide-in-from-bottom-2 duration-200">
              <span className="text-[11px] text-muted-foreground font-medium">Color:</span>
              <div className="flex items-center gap-2">
                {COLORS.map((col) => (
                  <button
                    key={col.value}
                    type="button"
                    style={{ backgroundColor: col.value }}
                    onClick={() => setColor(col.value)}
                    className={`h-6 w-6 rounded-full border border-black/10 flex items-center justify-center transition-all ${color === col.value
                        ? 'ring-2 ring-primary ring-offset-2 scale-110 shadow-md'
                        : 'hover:scale-105'
                      }`}
                    title={col.name}
                  >
                    {color === col.value && (
                      <Check className={`h-3 w-3 ${col.value === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-muted/10 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseRequest}
              className="rounded-xl h-9 px-4 text-xs font-semibold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              className="rounded-xl h-9 px-4 gap-1.5 text-xs font-semibold shadow-md shadow-primary/10"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>

    {/* Confirmation Discard Modal */}
    <Dialog open={showConfirmDiscard} onOpenChange={setShowConfirmDiscard}>
      <DialogContent className="max-w-[340px] p-6 border border-muted/20 bg-background/95 backdrop-blur-md rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 z-[100]">
        <div className="space-y-4 text-center">
          <h3 className="text-sm font-semibold text-foreground">
            ¿Descartar cambios?
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tienes cambios sin guardar en esta imagen. Si sales ahora, perderás todas tus modificaciones.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              className="w-full rounded-xl h-9 text-xs font-bold shadow-md shadow-destructive/10"
              onClick={() => {
                setShowConfirmDiscard(false);
                onClose(); // Exit editor!
              }}
            >
              Descartar cambios
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl h-9 text-xs font-semibold"
              onClick={() => setShowConfirmDiscard(false)}
            >
              Seguir editando
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
};
