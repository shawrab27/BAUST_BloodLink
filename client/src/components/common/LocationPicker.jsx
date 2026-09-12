import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths in bundlers (Vite)
const pinIcon = L.divIcon({
  className: 'custom-leaflet-pin',
  html: `
    <div style="
      background: #b80035;
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(184, 0, 53, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        background: #ffffff;
        border-radius: 50%;
        transform: rotate(45deg);
      "></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Key Regional Hospital & Campus Points
const CAMPUS_PRESETS = [
  { name: 'BAUST Medical Center', lat: 25.7533, lng: 88.8953, desc: 'Ground Floor, Academic Building South' },
  { name: 'CMH Saidpur Cantonment', lat: 25.7766, lng: 88.8912, desc: 'Combined Military Hospital Triage' },
  { name: 'Saidpur Upazila Health Complex', lat: 25.7825, lng: 88.8988, desc: 'Public Emergency Ward' },
  { name: 'RMCH Rangpur', lat: 25.7439, lng: 89.2752, desc: 'Rangpur Medical College Hospital' },
];

/**
 * Click handler component inside react-leaflet MapContainer
 */
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/**
 * LocationPicker — Interactive Leaflet map with OpenStreetMap tiles
 *
 * Requirements:
 * - Built with react-leaflet & OpenStreetMap (NO Google Maps, NO billing keys).
 * - Default center: Saidpur / BAUST area [25.7533, 88.8953].
 * - Interactive pin placement on click.
 * - Preset campus hospital chips for rapid selection.
 */
function LocationPicker({
  value = { lat: 25.7533, lng: 88.8953, address: 'BAUST Campus Medical Center' },
  onChange,
}) {
  const [position, setPosition] = useState([value.lat || 25.7533, value.lng || 88.8953]);
  const [selectedLabel, setSelectedLabel] = useState(value.address || 'BAUST Campus Medical Center');

  useEffect(() => {
    if (value && value.lat && value.lng) {
      setPosition([value.lat, value.lng]);
    }
  }, [value.lat, value.lng]);

  const handleSelectCoordinate = (lat, lng, name = null) => {
    const newPos = [lat, lng];
    setPosition(newPos);
    const label = name || `GeoPoint (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    setSelectedLabel(label);
    if (onChange) {
      onChange({
        lat,
        lng,
        address: label,
      });
    }
  };

  const handlePresetClick = (preset) => {
    handleSelectCoordinate(preset.lat, preset.lng, preset.name);
  };

  return (
    <div className="w-full space-y-3">
      {/* Preset Quick-Picks */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-semibold text-on-surface-variant flex-shrink-0 flex items-center gap-1">
          <span className="material-symbols-outlined text-[15px] text-primary">near_me</span>
          Quick Presets:
        </span>
        {CAMPUS_PRESETS.map((p) => {
          const isSelected = selectedLabel === p.name;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => handlePresetClick(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:text-primary hover:border-primary/40'
              }`}
            >
              <span className="material-symbols-outlined text-[13px]">
                {isSelected ? 'check_circle' : 'location_on'}
              </span>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-primary/20 shadow-sm z-0">
        <div className="h-[220px] w-full">
          <MapContainer
            center={position}
            zoom={14}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%' }}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <Marker position={position} icon={pinIcon} />
            <MapClickHandler onLocationSelect={handleSelectCoordinate} />
          </MapContainer>
        </div>

        {/* Live Coordinate Pill Overlay */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-lg border border-outline-variant/30 flex items-center justify-between text-xs z-[1000] shadow-sm">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-[16px] flex-shrink-0">pin_drop</span>
            <span className="font-semibold text-on-surface truncate">{selectedLabel}</span>
          </div>
          <span className="text-[11px] font-mono text-on-surface-variant bg-surface-container px-2 py-0.5 rounded ml-2 flex-shrink-0">
            {position[0].toFixed(4)}, {position[1].toFixed(4)}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-on-surface-variant flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px] text-primary">info</span>
        Click anywhere on the OpenStreetMap view to drop a pinpoint marker for patient transfer coordinates.
      </p>
    </div>
  );
}

export default LocationPicker;
