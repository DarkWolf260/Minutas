
'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';




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
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by <a href="https://www.hotosm.org/" target="_blank">HOT</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  },
  labels: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: ''
  }
};

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);
  return null;
}

const MapResizer = ({ mapType }: { mapType: string }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map, mapType]);
  return null;
};

const TempMarkerWithPopup = ({ position, onCreateClick, icon }: { position: LatLng, onCreateClick: () => void, icon: L.Icon }) => {
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


export function AddressMap({ latitude, longitude, name, addresses = [], onMapClick }: AddressMapProps) {
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


  const center = useMemo<[number, number]>(() =>
    isValid ? [lat, lon] : [10.16, -64.68],
    [isValid, lat, lon]
  );

  const zoom = useMemo(() => isValid ? 16 : 9, [isValid]);


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
  }

  // Create icon instance memoized
  const customIcon = useMemo(() => {
    return L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
  }, []);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <CardTitle>Mapa Interactivo</CardTitle>
            <CardDescription>
              {tempMarkerPos ? 'Confirma la creación del nuevo punto' : (name ? `Ubicación: ${name}` : 'Haz clic para añadir un punto')}
            </CardDescription>
          </div>
          <div className="flex gap-1 bg-muted p-1 rounded-md self-start sm:self-center">
            <Button
              size="sm"
              variant={mapType === 'street' ? 'secondary' : 'ghost'}
              onClick={() => setMapType('street')}
              className="h-8 px-3"
            >
              <MapIcon className="mr-2 h-4 w-4" />
              Calle
            </Button>
            <Button
              size="sm"
              variant={mapType === 'satellite' ? 'secondary' : 'ghost'}
              onClick={() => setMapType('satellite')}
              className="h-8 px-3"
            >
              <Satellite className="mr-2 h-4 w-4" />
              Satélite
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 rounded-b-lg overflow-hidden relative">
        <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={true}
          doubleClickZoom={false}
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
            <TileLayer
              key="satellite-labels"
              url={TILE_LAYERS.labels.url}
              opacity={0.8}
            />
          )}
          <MapEventsHandler />
          {/* All saved addresses */}
          {addresses.map(address => {
            const aLat = parseFloat(address.latitude || '');
            const aLon = parseFloat(address.longitude || '');
            if (isNaN(aLat) || isNaN(aLon)) return null;

            // Highlight the currently selected address if it matches
            const isSelected = address.id === (addresses.find(a => a.name === name && a.latitude === latitude)?.id);

            return (
              <Marker
                key={address.id}
                position={[aLat, aLon]}
                icon={customIcon}
                opacity={isSelected ? 1 : 0.7}
              >
                <Popup autoPan={false}>
                  <div className="text-sm">
                    <p className="font-bold border-b border-muted pb-1 mb-1">{address.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {[address.municipality, address.parish, address.sector].filter(Boolean).join(', ')}
                    </p>
                    {address.details && <p className="text-[10px] italic mt-1 font-mono">"{address.details}"</p>}
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Temporary marker for new locations */}
          {tempMarkerPos && (
            <TempMarkerWithPopup position={tempMarkerPos} onCreateClick={handleCreateClick} icon={customIcon} />
          )}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
