import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import type { GeoLocation, AnalysisResult } from '@/types';
import { Crosshair, MapPin, Navigation } from 'lucide-react';

interface MapViewProps {
  center?: GeoLocation;
  markers?: Array<{
    position: GeoLocation;
    title: string;
    popup?: string;
  }>;
  analysisResult?: AnalysisResult | null;
  onMapClick?: (location: GeoLocation) => void;
  height?: string;
  showAccuracy?: boolean;
}

// Custom marker icon
const createCustomIcon = (color: string = '#fff') => {
  return L.icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

// Map controller component
const MapController = ({ center }: { center: GeoLocation }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.flyTo([center.lat, center.lng], 15, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, map]);
  
  return null;
};

// Click handler
const MapClickHandler = ({ onClick }: { onClick?: (loc: GeoLocation) => void }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!onClick) return;
    
    const handleClick = (e: any) => {
      onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    
    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [map, onClick]);
  
  return null;
};

export const MapView = ({
  center = { lat: 52.5200, lng: 13.4050 },
  markers = [],
  analysisResult,
  onMapClick,
  height = '100%',
  showAccuracy = true
}: MapViewProps) => {
  const [mapCenter, setMapCenter] = useState<GeoLocation>(center);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
  }, [center]);

  // Get accuracy radius based on confidence
  const getAccuracyRadius = (confidence: number): number => {
    // Lower confidence = larger radius
    const baseRadius = 1000;
    const multiplier = (100 - confidence) / 10;
    return baseRadius * multiplier;
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        ref={mapRef}
        center={[mapCenter.lat, mapCenter.lng] as LatLngExpression}
        zoom={13}
        style={{ height, width: '100%', background: '#000' }}
        className="rounded-xl overflow-hidden"
        zoomControl={false}
      >
        {/* Dark theme map tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Alternative: Standard OSM with dark filter applied via CSS */}
        {/* <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        /> */}

        {/* Map controller for flying to locations */}
        <MapController center={mapCenter} />

        {/* Click handler */}
        <MapClickHandler onClick={onMapClick} />

        {/* Analysis result marker */}
        {analysisResult && (
          <>
            <Marker
              position={[analysisResult.location.lat, analysisResult.location.lng]}
              icon={createCustomIcon('#fff')}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-white">
                    {analysisResult.city}, {analysisResult.country}
                  </h3>
                  <p className="text-sm text-white/70 mt-1">
                    Confidence: {analysisResult.confidence}%
                  </p>
                </div>
              </Popup>
            </Marker>

            {/* Accuracy circle */}
            {showAccuracy && (
              <Circle
                center={[analysisResult.location.lat, analysisResult.location.lng]}
                radius={getAccuracyRadius(analysisResult.confidence)}
                pathOptions={{
                  fillColor: 'rgba(255, 255, 255, 0.1)',
                  fillOpacity: 0.3,
                  color: 'rgba(255, 255, 255, 0.3)',
                  weight: 1
                }}
              />
            )}
          </>
        )}

        {/* Custom markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.position.lat, marker.position.lng]}
            icon={createCustomIcon('#888')}
          >
            {marker.popup && (
              <Popup>
                <div className="p-2">
                  <h4 className="font-medium text-white">{marker.title}</h4>
                  <p className="text-sm text-white/70">{marker.popup}</p>
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.locate({ setView: true, maxZoom: 16 });
            }
          }}
          className="w-10 h-10 bg-zinc-900 border border-white/20 rounded-lg 
                     flex items-center justify-center hover:bg-zinc-800 
                     transition-colors"
          title="Locate me"
        >
          <Navigation className="w-5 h-5 text-white" />
        </button>
        
        <button
          onClick={() => {
            if (analysisResult && mapRef.current) {
              mapRef.current.flyTo(
                [analysisResult.location.lat, analysisResult.location.lng],
                16,
                { duration: 1 }
              );
            }
          }}
          className="w-10 h-10 bg-zinc-900 border border-white/20 rounded-lg 
                     flex items-center justify-center hover:bg-zinc-800 
                     transition-colors"
          title="Center on result"
        >
          <Crosshair className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Map style indicator */}
      <div className="absolute bottom-6 left-6 z-[1000]">
        <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-lg px-3 py-2">
          <span className="text-xs text-white/60 flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            OpenStreetMap + CartoDB Dark
          </span>
        </div>
      </div>
    </div>
  );
};

export default MapView;
