import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polygon, LayerGroup } from 'react-leaflet';
import L from 'leaflet';
import type { LatLngExpression } from 'leaflet';
import type { GeoLocation, AnalysisResult } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Crosshair, 
  MapPin, 
  Navigation, 
  Layers, 
  Satellite,
  Map as MapIcon,
  Mountain,
  Eye,
  EyeOff,
  Compass
} from 'lucide-react';

interface AdvancedMapViewProps {
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
  enable3D?: boolean;
}

type MapLayer = 'dark' | 'satellite' | 'terrain' | 'standard';

const createCustomIcon = (color: string = '#fff', size: number = 32) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
        <circle cx="12" cy="10" r="3" fill="${color}"/>
      </svg>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  });
};

const createPulseIcon = (color: string = '#fff') => {
  return L.divIcon({
    className: 'pulse-marker',
    html: `
      <div class="relative">
        <div class="absolute inset-0 animate-ping bg-${color} rounded-full opacity-30"></div>
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3" fill="${color}"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

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

const layerConfigs: Record<MapLayer, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap'
  },
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  }
};

export const AdvancedMapView = ({
  center = { lat: 52.5200, lng: 13.4050 },
  markers = [],
  analysisResult,
  onMapClick,
  height = '100%',
  showAccuracy = true
}: AdvancedMapViewProps) => {
  const { t } = useLanguage();
  const [mapCenter, setMapCenter] = useState<GeoLocation>(center);
  const [activeLayer, setActiveLayer] = useState<MapLayer>('dark');
  const [showMarkers, setShowMarkers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (center) {
      setMapCenter(center);
    }
  }, [center]);

  const getAccuracyRadius = (confidence: number): number => {
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
        <TileLayer
          attribution={layerConfigs[activeLayer].attribution}
          url={layerConfigs[activeLayer].url}
        />

        <MapController center={mapCenter} />
        <MapClickHandler onClick={onMapClick} />

        {/* Grid Overlay */}
        {showGrid && (
          <LayerGroup>
            {Array.from({ length: 20 }, (_, i) => (
              <Polygon
                key={`grid-h-${i}`}
                positions={[
                  [mapCenter.lat - 1 + i * 0.1, mapCenter.lng - 1],
                  [mapCenter.lat - 1 + i * 0.1, mapCenter.lng + 1]
                ] as LatLngExpression[]}
                pathOptions={{ color: 'rgba(255,255,255,0.1)', weight: 1 }}
              />
            ))}
            {Array.from({ length: 20 }, (_, i) => (
              <Polygon
                key={`grid-v-${i}`}
                positions={[
                  [mapCenter.lat - 1, mapCenter.lng - 1 + i * 0.1],
                  [mapCenter.lat + 1, mapCenter.lng - 1 + i * 0.1]
                ] as LatLngExpression[]}
                pathOptions={{ color: 'rgba(255,255,255,0.1)', weight: 1 }}
              />
            ))}
          </LayerGroup>
        )}

        {/* Analysis Result */}
        {analysisResult && showMarkers && (
          <>
            <Marker
              position={[analysisResult.location.lat, analysisResult.location.lng]}
              icon={createPulseIcon('#fff')}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold text-white text-lg">
                    {analysisResult.city}, {analysisResult.country}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm text-white/70">
                      Confidence: <span className={`font-medium ${
                        analysisResult.confidence >= 80 ? 'text-green-400' :
                        analysisResult.confidence >= 50 ? 'text-yellow-400' : 'text-red-400'
                      }`}>{analysisResult.confidence}%</span>
                    </p>
                    <p className="text-sm text-white/50">
                      {analysisResult.location.lat.toFixed(4)}, {analysisResult.location.lng.toFixed(4)}
                    </p>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-white/40 line-clamp-2">{analysisResult.description}</p>
                  </div>
                </div>
              </Popup>
            </Marker>

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

        {/* Custom Markers */}
        {showMarkers && markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.position.lat, marker.position.lng]}
            icon={createCustomIcon('#888', 24)}
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

      {/* Layer Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-6 right-6 z-[1000] flex flex-col gap-2"
          >
            {/* Layer Selector */}
            <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-xl p-2">
              <p className="text-white/50 text-xs mb-2 px-2">{t('map.layers')}</p>
              <div className="space-y-1">
                {([
                  { key: 'dark', icon: MapIcon, label: t('map.dark') },
                  { key: 'satellite', icon: Satellite, label: t('map.satellite') },
                  { key: 'terrain', icon: Mountain, label: t('map.terrain') },
                  { key: 'standard', icon: Layers, label: t('map.standard') }
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveLayer(key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeLayer === key
                        ? 'bg-white/10 text-white'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overlay Controls */}
            <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-xl p-2">
              <p className="text-white/50 text-xs mb-2 px-2">{t('map.layers')}</p>
              <div className="space-y-1">
                <button
                  onClick={() => setShowMarkers(!showMarkers)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showMarkers ? 'text-white' : 'text-white/30'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  {t('map.markers')}
                </button>
                <button
                  onClick={() => setShowGrid(!showGrid)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    showGrid ? 'text-white' : 'text-white/30'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  {t('map.grid')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <div className="absolute bottom-6 left-6 z-[1000] flex gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (mapRef.current) {
              mapRef.current.locate({ setView: true, maxZoom: 16 });
            }
          }}
          className="w-10 h-10 bg-zinc-900/90 backdrop-blur border border-white/20 rounded-lg
                   flex items-center justify-center hover:bg-zinc-800 transition-colors"
          title="Locate me"
        >
          <Navigation className="w-5 h-5 text-white" />
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            if (analysisResult && mapRef.current) {
              mapRef.current.flyTo(
                [analysisResult.location.lat, analysisResult.location.lng],
                16,
                { duration: 1 }
              );
            }
          }}
          className="w-10 h-10 bg-zinc-900/90 backdrop-blur border border-white/20 rounded-lg
                   flex items-center justify-center hover:bg-zinc-800 transition-colors"
          title="Center on result"
        >
          <Crosshair className="w-5 h-5 text-white" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowControls(!showControls)}
          className="w-10 h-10 bg-zinc-900/90 backdrop-blur border border-white/20 rounded-lg
                   flex items-center justify-center hover:bg-zinc-800 transition-colors"
          title="Toggle controls"
        >
          {showControls ? <EyeOff className="w-5 h-5 text-white" /> : <Eye className="w-5 h-5 text-white" />}
        </motion.button>
      </div>

      {/* Layer Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000]">
        <div className="bg-zinc-900/90 backdrop-blur border border-white/20 rounded-lg px-4 py-2">
          <span className="text-xs text-white/60 flex items-center gap-2">
            <Layers className="w-3 h-3" />
            {activeLayer.charAt(0).toUpperCase() + activeLayer.slice(1)} Layer
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdvancedMapView;
