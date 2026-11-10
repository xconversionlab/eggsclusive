import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Crosshair, Minus, Plus } from "lucide-react";

type Coordinates = { lat: number; lng: number };
type Tile = { key: string; x: number; y: number; left: number; top: number; src: string };

const TILE_SIZE = 256;
const TILE_URL = "https://tile.openstreetmap.org";

function latLngToWorld({ lat, lng }: Coordinates, zoom: number) {
  const scale = TILE_SIZE * 2 ** zoom;
  const safeLat = Math.max(-85.05112878, Math.min(85.05112878, lat));
  const sin = Math.sin((safeLat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

function worldToLatLng(x: number, y: number, zoom: number): Coordinates {
  const scale = TILE_SIZE * 2 ** zoom;
  const lng = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const lat = (180 / Math.PI) * Math.atan(Math.sinh(n));
  return {
    lat: Math.max(-85.05112878, Math.min(85.05112878, lat)),
    lng: Math.max(-180, Math.min(180, lng)),
  };
}

export function MapPicker({
  value,
  onChange,
  onUseLocation,
  locating = false,
}: {
  value: Coordinates;
  onChange: (value: Coordinates) => void;
  onUseLocation: () => void;
  locating?: boolean;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; worldX: number; worldY: number } | null>(null);
  const [size, setSize] = useState({ width: 640, height: 320 });
  const [zoom, setZoom] = useState(16);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setSize({ width: Math.max(280, Math.round(rect.width)), height: Math.max(260, Math.round(rect.height)) });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const tiles = useMemo(() => {
    const world = latLngToWorld(value, zoom);
    const leftWorld = world.x - size.width / 2;
    const topWorld = world.y - size.height / 2;
    const firstX = Math.floor(leftWorld / TILE_SIZE);
    const firstY = Math.floor(topWorld / TILE_SIZE);
    const columns = Math.ceil(size.width / TILE_SIZE) + 1;
    const rows = Math.ceil(size.height / TILE_SIZE) + 1;
    const count = 2 ** zoom;
    const result: Tile[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const tileX = firstX + column;
        const tileY = firstY + row;
        if (tileY < 0 || tileY >= count) continue;
        const wrappedX = ((tileX % count) + count) % count;
        result.push({
          key: `${zoom}-${wrappedX}-${tileY}`,
          x: wrappedX,
          y: tileY,
          left: tileX * TILE_SIZE - leftWorld,
          top: tileY * TILE_SIZE - topWorld,
          src: `${TILE_URL}/${zoom}/${wrappedX}/${tileY}.png`,
        });
      }
    }
    return result;
  }, [value.lat, value.lng, size.width, size.height, zoom]);

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const world = latLngToWorld(value, zoom);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, worldX: world.x, worldY: world.y };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const start = dragRef.current;
    if (!start || start.pointerId !== event.pointerId) return;
    const next = worldToLatLng(start.worldX - (event.clientX - start.x), start.worldY - (event.clientY - start.y), zoom);
    onChange(next);
  }

  function pointerEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  }

  return (
    <section className="overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-[0_12px_34px_rgba(7,23,46,.08)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-mark">Delivery location</p>
          <p className="mt-0.5 text-xs text-muted">Move the map to place the pin</p>
        </div>
        <button type="button" onClick={onUseLocation} disabled={locating} className="press inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#cfe6fb] bg-[#edf7ff] px-3 text-xs font-bold text-[#07518c] disabled:opacity-50">
          <Crosshair className="h-4 w-4" />
          {locating ? "Locating…" : "Use my location"}
        </button>
      </div>
      <div
        ref={mapRef}
        role="application"
        aria-label="Interactive map. Drag the map to move the pin. Use plus and minus to zoom."
        className={`relative h-[320px] select-none overflow-hidden bg-[#e7eef4] sm:h-[360px] ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
        style={{ touchAction: "none" }}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerEnd}
        onPointerCancel={pointerEnd}
      >
        {tiles.map((tile) => (
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            aria-hidden="true"
            draggable={false}
            width={TILE_SIZE}
            height={TILE_SIZE}
            className="pointer-events-none absolute max-w-none"
            style={{ width: TILE_SIZE, height: TILE_SIZE, left: tile.left, top: tile.top }}
          />
        ))}
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-[92%]">
          <div className="relative flex flex-col items-center">
            <span className="grid h-10 w-10 place-items-center rounded-full border-[3px] border-white bg-[#087fda] text-white shadow-[0_5px_20px_rgba(7,23,46,.38)]">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span class="-mt-1 h-3 w-3 rotate-45 rounded-[2px] border-b-[3px] border-r-[3px] border-white bg-[#087fda]" />
            <span class="mt-1 rounded-full bg-[#07172e]/90 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg">DELIVER HERE</span>
          </div>
        </div>
        <div className="absolute right-3 top-3 z-20 flex flex-col overflow-hidden rounded-xl border border-white/80 bg-white/95 shadow-lg backdrop-blur">
          <button type="button" aria-label="Zoom in" className="press grid h-10 w-10 place-items-center text-ink" onPointerDown={(e) => e.stopPropagation()} onClick={() => setZoom((z) => Math.min(19, z + 1))}><Plus className="h-4 w-4" /></button>
          <span className="h-px bg-line" />
          <button type="button" aria-label="Zoom out" className="press grid h-10 w-10 place-items-center text-ink" onPointerDown={(e) => e.stopPropagation()} onClick={() => setZoom((z) => Math.max(12, z - 1))}><Minus className="h-4 w-4" /></button>
        </div>
        <div className="absolute bottom-2 right-2 z-20 rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-[#334155] shadow-sm">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">OpenStreetMap contributors</a>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-[11px] leading-4 text-muted">Pin: {value.lat.toFixed(5)}, {value.lng.toFixed(5)}</p>
        <p className="text-[10px] font-semibold text-[#0876c6]">Drag to fine-tune</p>
      </div>
    </section>
  );
}
