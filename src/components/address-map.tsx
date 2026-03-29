'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { Address } from '@/types';

interface AddressMapProps {
  latitude?: string | null;
  longitude?: string | null;
  name?: string | null;
  addresses?: Address[];
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

type MapType = 'street' | 'satellite';

const TILE_LAYERS = {
  street: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  labels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
  },
};

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);
  return null;
};

const MapResizer = ({ mapType }: { mapType: string }) => {
  const map = useMap();
  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };

    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [map, mapType]);
  return null;
};

const TempMarkerWithPopup = ({
  position,
  onCreateClick,
  icon,
}: {
  position: LatLng;
  onCreateClick: () => void;
  icon: L.Icon;
}) => {
  const map = useMap();

  useEffect(() => {
    // Auto-centering removed as per user request to avoid jumping/zooming when clicking the map
    // map.setView(position, map.getZoom(), { animate: false });
  }, [position, map]);

  return (
    <Marker position={position} icon={icon}>
      <Popup autoClose={false} closeOnClick={false} closeButton={false} autoPan={false}>
        <div className="text-center p-1">
          <p className="font-semibold mb-2">Nuevo Punto</p>
          <Button size="sm" onClick={onCreateClick}>
            Crear Dirección Aquí
          </Button>
        </div>
      </Popup>
    </Marker>
  );
};

export function AddressMap({
  latitude,
  longitude,
  name,
  addresses = [],
  onMapClick,
}: AddressMapProps) {
  const [mapType, setMapType] = useState<MapType>('street');
  const [tempMarkerPos, setTempMarkerPos] = useState<LatLng | null>(null);

  const { lat, lon, isValid } = useMemo(() => {
    if (!latitude || !longitude) {
      return { lat: NaN, lon: NaN, isValid: false };
    }
    const parsedLat = parseFloat(latitude);
    const parsedLon = parseFloat(longitude);
    const valid = !isNaN(parsedLat) && !isNaN(parsedLon);
    return { lat: parsedLat, lon: parsedLon, isValid: valid };
  }, [latitude, longitude]);

  useEffect(() => {
    // Cleanup helper for strict mode / React 19
    // Removed manual cleanup that was causing _leaflet_events error
    return () => { };
  }, []);

  useEffect(() => {
    // When a permanent address is selected, remove the temporary marker
    if (isValid) {
      setTempMarkerPos(null);
    }
  }, [isValid, latitude, longitude]);

  const center = useMemo<[number, number]>(
    () => (isValid ? [lat, lon] : [10.16, -64.68]),
    [isValid, lat, lon]
  );

  const zoom = useMemo(() => (isValid ? 16 : 9), [isValid]);

  const MapEventsHandler = () => {
    useMapEvents({
      click(e) {
        if (onMapClick) {
          setTempMarkerPos(e.latlng);
        }
      },
    });
    return null;
  };

  const handleCreateClick = () => {
    if (tempMarkerPos && onMapClick) {
      onMapClick({ lat: tempMarkerPos.lat, lng: tempMarkerPos.lng });
      setTempMarkerPos(null); // Clear marker after clicking the button
    }
  };

  // Create custom SVG markers
  const customMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          background-color: var(--primary);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.3);
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30],
    });
  }, []);

  const selectedMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'selected-div-icon',
      html: `
        <div style="
          background-color: #ef4444;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.5);
        ">
          <div style="
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
  }, []);

  const tempMarkerIcon = useMemo(() => {
    return L.divIcon({
      className: 'temp-div-icon',
      html: `
        <div style="
          background-color: #10b981;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50% 50% 50% 50%;
          border: 2px dashed white;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
          animation: pulse 2s infinite;
        ">
          <div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
        </style>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -15],
    });
  }, []);

  return (
    <div className="h-full flex flex-col relative group/map">
      {/* Absolute Overlay Controls */}
      <div className="absolute top-4 right-4 z-[40] transition-opacity group-hover/map:opacity-100 opacity-90">
        <div className="flex flex-col gap-2 p-1.5 bg-background/80 backdrop-blur-md rounded-xl border shadow-xl">
          <Button
            size="sm"
            variant={mapType === 'street' ? 'secondary' : 'ghost'}
            onClick={() => setMapType('street')}
            className={cn(
              "h-8 w-8 p-0 transition-all rounded-lg",
              mapType === 'street' 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-muted"
            )}
            title="Vista de Calle"
          >
            <MapIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={mapType === 'satellite' ? 'secondary' : 'ghost'}
            onClick={() => setMapType('satellite')}
            className={cn(
              "h-8 w-8 p-0 transition-all rounded-lg",
              mapType === 'satellite' 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "text-muted-foreground hover:bg-muted"
            )}
            title="Vista de Satélite"
          >
            <Satellite className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Title/Info Overlay */}
      <div className="absolute top-4 left-4 z-[40] pointer-events-none">
        <div className="bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border shadow-lg max-w-[240px]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground truncate">
            {name || 'Mapa del Sector'}
          </p>
          {isValid && (
            <p className="text-[9px] text-muted-foreground font-mono">
              {lat.toFixed(5)}, {lon.toFixed(5)}
            </p>
          )}
        </div>
      </div>
      <div className="flex-1 rounded-xl overflow-hidden relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          doubleClickZoom={false}
          zoomControl={false} // Disable default zoom to match premium look
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
        >
          <MapResizer mapType={mapType} />
          <ChangeView key={`${latitude}-${longitude}`} center={center} zoom={zoom} />
          <TileLayer
            key={mapType}
            attribution={TILE_LAYERS[mapType].attribution}
            url={TILE_LAYERS[mapType].url}
          />
          {mapType === 'satellite' && (
            <TileLayer key="satellite-labels" url={TILE_LAYERS.labels.url} opacity={0.8} />
          )}
          <MapEventsHandler />
          {/* All saved addresses */}
          {addresses.map((address) => {
            const aLat = parseFloat(address.latitude || '');
            const aLon = parseFloat(address.longitude || '');
            if (isNaN(aLat) || isNaN(aLon)) return null;

            // Highlight the currently selected address if it matches
            const isSelected =
              address.id === addresses.find((a) => a.name === name && a.latitude === latitude)?.id;

            return (
              <Marker
                key={address.id}
                position={[aLat, aLon]}
                icon={(isSelected ? selectedMarkerIcon : customMarkerIcon) as any}
                zIndexOffset={isSelected ? 1000 : 0}
              >
                <Popup autoPan={false}>
                  <div className="text-sm p-0.5">
                    <p className="font-bold text-primary border-b border-primary/10 pb-1 mb-1.5">{address.name}</p>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                        {[address.municipality, address.parish, address.sector]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {address.details && (
                        <p className="text-[9px] text-foreground/70 bg-muted/30 p-1.5 rounded border-l-2 border-primary/40 italic">
                          "{address.details}"
                        </p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Temporary marker for new locations */}
          {tempMarkerPos && (
            <TempMarkerWithPopup
              position={tempMarkerPos}
              onCreateClick={handleCreateClick}
              icon={tempMarkerIcon as any}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
