import { MouseEvent, RefObject, memo, useEffect, useLayoutEffect, useRef, useState } from 'react';

type FloorplanDesk = {
  id: string;
  name: string;
  x: number;
  y: number;
  status: 'free' | 'booked';
  booking: { userDisplayName?: string; userEmail: string } | null;
};

type OverlayRect = { left: number; top: number; width: number; height: number };

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

const toNormalized = (raw: number, size: number): number => {
  if (!Number.isFinite(raw)) return 0;
  if (raw <= 1) return clamp01(raw);
  if (raw <= 100) return clamp01(raw / 100);
  return clamp01(raw / Math.max(size, 1));
};

type FloorplanCanvasProps = {
  imageUrl: string;
  imageAlt: string;
  desks: FloorplanDesk[];
  selectedDeskId: string;
  hoveredDeskId: string;
  onHoverDesk: (deskId: string) => void;
  onSelectDesk: (deskId: string) => void;
  onCanvasClick?: (coords: { xPct: number; yPct: number }) => void;
  onDeskDoubleClick?: (deskId: string) => void;
};

const FloorplanImage = memo(function FloorplanImage({ imageUrl, imageAlt, imgRef, onLoad }: { imageUrl: string; imageAlt: string; imgRef: RefObject<HTMLImageElement>; onLoad: () => void }) {
  return <img ref={imgRef} src={imageUrl} alt={imageAlt} className="floorplan-image" onLoad={onLoad} />;
});

const DeskOverlay = memo(function DeskOverlay({
  desks,
  selectedDeskId,
  hoveredDeskId,
  overlayRect,
  onHoverDesk,
  onSelectDesk,
  onDeskDoubleClick
}: {
  desks: FloorplanDesk[];
  selectedDeskId: string;
  hoveredDeskId: string;
  overlayRect: OverlayRect;
  onHoverDesk: (deskId: string) => void;
  onSelectDesk: (deskId: string) => void;
  onDeskDoubleClick?: (deskId: string) => void;
}) {
  return (
    <div className="desk-overlay" style={{ left: overlayRect.left, top: overlayRect.top, width: overlayRect.width, height: overlayRect.height }}>
      {desks.map((desk) => (
        <button
          key={desk.id}
          type="button"
          className={`desk-pin ${desk.status} ${selectedDeskId === desk.id ? 'selected' : ''} ${hoveredDeskId === desk.id ? 'hovered' : ''}`}
          style={{ left: `${toNormalized(desk.x, overlayRect.width) * overlayRect.width}px`, top: `${toNormalized(desk.y, overlayRect.height) * overlayRect.height}px` }}
          title={`${desk.name} · ${desk.status === 'free' ? 'Frei' : desk.booking?.userDisplayName ?? desk.booking?.userEmail}`}
          onMouseEnter={() => onHoverDesk(desk.id)}
          onMouseLeave={() => onHoverDesk('')}
          onClick={(event) => {
            event.stopPropagation();
            onSelectDesk(desk.id);
          }}
          onDoubleClick={(event) => {
            event.stopPropagation();
            onDeskDoubleClick?.(desk.id);
          }}
        />
      ))}
    </div>
  );
});

export function FloorplanCanvas({ imageUrl, imageAlt, desks, selectedDeskId, hoveredDeskId, onHoverDesk, onSelectDesk, onCanvasClick, onDeskDoubleClick }: FloorplanCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [overlayRect, setOverlayRect] = useState<OverlayRect>({ left: 0, top: 0, width: 1, height: 1 });

  const sync = () => {
    if (!containerRef.current || !imgRef.current) return;
    const c = containerRef.current.getBoundingClientRect();
    const i = imgRef.current.getBoundingClientRect();
    setOverlayRect({ left: i.left - c.left, top: i.top - c.top, width: i.width, height: i.height });
  };

  useLayoutEffect(sync, [imageUrl]);
  useEffect(() => {
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [imageUrl]);

  const handleCanvasClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!onCanvasClick || !imgRef.current) return;
    const clickedLayerRect = imgRef.current.getBoundingClientRect();
    const localX = event.clientX - clickedLayerRect.left;
    const localY = event.clientY - clickedLayerRect.top;
    const xNorm = clamp01(localX / clickedLayerRect.width);
    const yNorm = clamp01(localY / clickedLayerRect.height);

    if (import.meta.env.DEV) {
      console.log({
        clientX: event.clientX,
        clientY: event.clientY,
        rect: clickedLayerRect,
        localX,
        localY,
        xNorm,
        yNorm
      });
    }

    onCanvasClick({ xPct: xNorm, yPct: yNorm });
  };

  return (
    <div ref={containerRef} className="floorplan-canvas" role="presentation" onClick={handleCanvasClick}>
      <FloorplanImage imageUrl={imageUrl} imageAlt={imageAlt} imgRef={imgRef} onLoad={sync} />
      <DeskOverlay
        desks={desks}
        selectedDeskId={selectedDeskId}
        hoveredDeskId={hoveredDeskId}
        overlayRect={overlayRect}
        onHoverDesk={onHoverDesk}
        onSelectDesk={onSelectDesk}
        onDeskDoubleClick={onDeskDoubleClick}
      />
    </div>
  );
}
