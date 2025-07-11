
'use client';

import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Map as MapIcon, Satellite } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fix for default Leaflet icon not showing up in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import iconRetina from 'leaflet/dist/images/marker-icon-2x.png';

const DefaultIcon = L.icon({
    iconRetinaUrl: iconRetina.src,
    iconUrl: icon.src,
    shadowUrl: iconShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;


interface AddressMapProps {
  latitude?: string | null;
  longitude?: string | null;
  name?: string | null;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
}

type MapType = 'street' | 'satellite';

const TILE_LAYERS = {
    street: {
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
};

const ChangeView = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
}

const TempMarkerWithPopup = ({ position, onCreateClick }: { position: LatLng, onCreateClick: () => void }) => {
  const map = useMap();

  useEffect(() => {
    // When this component mounts, fly to the position.
    map.flyTo(position, map.getZoom());
  }, [position, map]);

  return (
    <Marker position={position}>
      <Popup autoClose={false} closeOnClick={false} closeButton={false}>
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


export function AddressMap({ latitude, longitude, name, onMapClick }: AddressMapProps) {
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
    // When a permanent address is selected, remove the temporary marker
    if(isValid) {
        setTempMarkerPos(null);
    }
  }, [isValid, latitude, longitude]);
  
  const mapKey = useMemo(() => `${lat}-${lon}`, [lat, lon]);

  const center: [number, number] = isValid ? [lat, lon] : [10.16, -64.68];
  const zoom = isValid ? 16 : 9;

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
      <CardContent className="flex-1 p-0 rounded-b-lg overflow-hidden">
        <MapContainer key={mapKey} center={center} zoom={zoom} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
            <ChangeView center={center} zoom={zoom}/>
            <TileLayer
                key={mapType}
                attribution={TILE_LAYERS[mapType].attribution}
                url={TILE_LAYERS[mapType].url}
            />
            <MapEventsHandler />
            {isValid && !tempMarkerPos && (
                <Marker position={[lat, lon]}>
                    <Popup>
                        {name || `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`}
                    </Popup>
                </Marker>
            )}
            {tempMarkerPos && (
                <TempMarkerWithPopup position={tempMarkerPos} onCreateClick={handleCreateClick} />
            )}
        </MapContainer>
      </CardContent>
    </Card>
  );
}
