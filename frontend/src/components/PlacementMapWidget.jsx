import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, ZoomControl, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api/axios";

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// All coordinates are stored as [longitude, latitude] and swapped to [lat, lng] for Leaflet
const GEOCODE_CACHE = {
    "chennai": [80.2707, 13.0827],
    "bangalore": [77.5946, 12.9716],
    "bengaluru": [77.5946, 12.9716],
    "hyderabad": [78.4867, 17.3850],
    "mumbai": [72.8777, 19.0760],
    "pune": [73.8567, 18.5204],
    "delhi": [77.1025, 28.7041],
    "new delhi": [77.2090, 28.6139],
    "gurgaon": [77.0266, 28.4595],
    "gurugram": [77.0266, 28.4595],
    "noida": [77.3910, 28.5355],
    "coimbatore": [76.9558, 11.0168],
    "kochi": [76.2673, 9.9312],
    "trivandrum": [76.9366, 8.5241],
    "ahmedabad": [72.5714, 23.0225],
    "kolkata": [88.3639, 22.5726],
    "coimbatore, tamil nadu, india": [76.9616, 11.0168],
    "chennai, tamil nadu, india": [80.2707, 13.0827],
    "bengaluru, karnataka, india": [77.5946, 12.9716],
    "hyderabad, telangana, india": [78.4867, 17.3850],
    "united states, united states": [-95.7129, 37.0902],
    "mumbai, maharashtra, india": [72.8777, 19.0760],
    "pune, maharashtra, india": [73.8567, 18.5204],
    "delhi, nct, india": [77.1025, 28.7041],
    "gurugram, haryana, india": [77.0266, 28.4595],
    "noida, uttar pradesh, india": [77.3910, 28.5355],
    "ahmedabad, gujarat, india": [72.5714, 23.0225],
    "kolkata, west bengal, india": [88.3639, 22.5726],
    "gurgaon, haryana, india": [77.0266, 28.4595],
};

const MAP_STYLES = `
  .marker-glow-pulse {
    animation: ripple 2s infinite;
  }
  @keyframes ripple {
    0% { stroke-width: 2; stroke-opacity: 0.8; r: 8; }
    100% { stroke-width: 20; stroke-opacity: 0; r: 40; }
  }
  .leaflet-popup-content-wrapper {
    border-radius: 12px !important;
    padding: 0 !important;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important;
  }
  .leaflet-popup-content {
    margin: 0 !important;
    width: auto !important;
  }
  .glow-marker-inner {
    filter: drop-shadow(0 0 5px rgba(99, 102, 241, 0.8));
  }
  .custom-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    font-weight: 800 !important;
    color: #4f46e5 !important;
    text-shadow: 0 0 3px white, 0 0 5px white, 0 0 8px white !important;
    font-size: 10px !important;
    text-transform: uppercase !important;
    letter-spacing: 0.05em !important;
    pointer-events: none !important;
  }
  .custom-tooltip:before { display: none !important; }
`;

/**
 * FlyToController — child component that exposes the Leaflet map instance to parent
 * via a ref. This is the correct pattern for react-leaflet v3+, since useMap() only
 * works inside a MapContainer descendant.
 */
function FlyToController({ mapRef, flyTarget }) {
    const map = useMap();

    // Expose map instance to parent on mount
    useEffect(() => {
        if (mapRef) mapRef.current = map;
    }, [map, mapRef]);

    // Fly to target when requested
    useEffect(() => {
        if (flyTarget && map) {
            // flyTarget is [lng, lat] — swap for Leaflet [lat, lng]
            map.flyTo([flyTarget[1], flyTarget[0]], 8, { duration: 1.5 });
        }
    }, [flyTarget, map]);

    return null;
}

/** Renders the markers inside a MapContainer */
function MapMarkers({ mapData, isExpanded }) {
    return (
        <>
            {mapData.map((marker, index) => {
                const leafCoords = [marker.coordinates[1], marker.coordinates[0]]; // [lat, lng]
                const baseRadius = isExpanded ? 12 : 8;
                const dynamicRadius = Math.min(
                    Math.max(marker.students * 2, baseRadius),
                    isExpanded ? 40 : 25
                );

                return (
                    <React.Fragment key={`${marker.location}-${index}`}>
                        {/* Animated outer ring */}
                        <CircleMarker
                            center={leafCoords}
                            radius={dynamicRadius}
                            pathOptions={{
                                fillColor: '#6366f1',
                                fillOpacity: 0.2,
                                color: '#6366f1',
                                weight: 2,
                                className: 'marker-glow-pulse'
                            }}
                            interactive={false}
                        />
                        {/* Solid inner circle with popup */}
                        <CircleMarker
                            center={leafCoords}
                            radius={dynamicRadius * 0.6}
                            pathOptions={{
                                fillColor: '#4f46e5',
                                fillOpacity: 1,
                                color: '#ffffff',
                                weight: 2,
                                className: 'glow-marker-inner'
                            }}
                        >
                            <Tooltip
                                permanent={isExpanded}
                                direction="top"
                                offset={[0, -dynamicRadius * 0.6]}
                                className="custom-tooltip"
                            >
                                {marker.location}
                            </Tooltip>
                            <Popup className="custom-leaflet-popup">
                                <div className="p-3 min-w-[200px]">
                                    <h4 className="font-bold text-slate-900 mb-1 uppercase tracking-wider text-[11px]">
                                        {marker.location}
                                    </h4>
                                    <div className="flex items-end gap-2 mb-2">
                                        <span className="text-3xl font-black text-indigo-600 leading-none">
                                            {marker.students}
                                        </span>
                                        <span className="text-xs text-slate-500 font-bold mb-0.5">Placements</span>
                                    </div>
                                    <div className="mt-3">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Top Companies</p>
                                        <div className="flex flex-wrap gap-1">
                                            {marker.companies.slice(0, 3).map(company => (
                                                <span key={company} className="px-1.5 py-0.5 bg-slate-100 text-[9.5px] rounded font-medium text-slate-600">
                                                    {company}
                                                </span>
                                            ))}
                                            {marker.companies.length > 3 && (
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-[9px] rounded font-medium text-slate-500">
                                                    +{marker.companies.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    </React.Fragment>
                );
            })}
        </>
    );
}

export default function PlacementMapWidget() {
    const [mapData, setMapData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    // Separate map refs for card and modal — same MapContainer can't exist in two places
    const cardMapRef = useRef(null);
    const modalMapRef = useRef(null);

    // flyTarget: coordinates [lng, lat] to fly to on sidebar click
    const [flyTarget, setFlyTarget] = useState(null);

    const focusLocation = (coords) => {
        // Set the fly target — FlyToController in both maps will respond
        setFlyTarget([...coords]);
    };

    useEffect(() => {
        const fetchMapData = async () => {
            try {
                const res = await api.get("/admin/placement-map-data");
                const computedData = await Promise.all(
                    res.data.map(async (item) => {
                        const normalizedLoc = item.location.toLowerCase().trim();
                        let coordinates = GEOCODE_CACHE[normalizedLoc];

                        if (!coordinates) {
                            try {
                                const geocodeRes = await fetch(
                                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(item.location)}&count=1&language=en&format=json`
                                );
                                const geocodeData = await geocodeRes.json();
                                if (geocodeData.results?.length > 0) {
                                    coordinates = [
                                        geocodeData.results[0].longitude,
                                        geocodeData.results[0].latitude
                                    ];
                                    GEOCODE_CACHE[normalizedLoc] = coordinates;
                                }
                            } catch (e) {
                                console.error("Dynamic Geocode failed for", item.location, e);
                            }
                        }

                        return { ...item, coordinates: coordinates || null };
                    })
                );
                setMapData(computedData.filter(item => item.coordinates));
            } catch (error) {
                console.error("Failed to load map data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMapData();
    }, []);

    const mapCenter = [22, 80]; // India center [lat, lng]

    /** Shared tile layer + markers JSX — rendered inside each MapContainer independently */
    const MapContents = ({ isExp, mapRef }) => (
        <>
            <FlyToController mapRef={mapRef} flyTarget={flyTarget} />
            <ZoomControl position="bottomleft" />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            <MapMarkers mapData={mapData} isExpanded={isExp} />
        </>
    );

    const FloatingHeader = () => (
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 z-[1000] pointer-events-none flex items-start justify-between gap-2 sm:gap-4">
            {/* Title pill */}
            <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-[14px] sm:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 dark:border-slate-700/60 min-w-0">
                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-100 dark:border-indigo-500/30">
                    <span className="text-base sm:text-xl drop-shadow-md">🗺️</span>
                </div>
                <div className="flex flex-col min-w-0 pr-1 sm:pr-2">
                    <h3 className="font-black text-slate-900 dark:text-white text-[10px] sm:text-sm lg:text-base leading-none tracking-tight truncate">
                        Global Placements
                    </h3>
                    <p className="text-[7.5px] sm:text-[10px] lg:text-[11px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest leading-none mt-1 sm:mt-1.5 truncate">
                        Hotspots Explorer
                    </p>
                </div>
            </div>

            {/* Expand/Collapse */}
            <button
                onClick={() => setIsExpanded(prev => !prev)}
                className="pointer-events-auto p-2 sm:p-3 lg:p-3.5 bg-white/95 dark:bg-slate-900/95 hover:bg-slate-50 dark:hover:bg-slate-800 backdrop-blur-xl rounded-[14px] sm:rounded-2xl text-slate-600 dark:text-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 dark:border-slate-700/60 transition-all shrink-0 flex items-center justify-center"
                title={isExpanded ? "Collapse Map" : "Expand Fullscreen"}
            >
                {isExpanded ? (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                )}
            </button>
        </div>
    );

    return (
        <>
            <style>{MAP_STYLES}</style>

            {/* ── Standard Card View ── */}
            <div className="relative w-full h-[300px] md:h-[400px] bg-[#f8fafc] dark:bg-[#0f172a] rounded-xl overflow-hidden shadow-inner border border-slate-200 dark:border-slate-800 isolate">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full w-full gap-3">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">
                            Mapping Placements...
                        </span>
                    </div>
                ) : (
                    <div className="relative w-full h-full">
                        <FloatingHeader />
                        <MapContainer
                            center={mapCenter}
                            zoom={3}
                            zoomControl={false}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                            className="bg-[#f8fafc] dark:bg-[#0f172a]"
                        >
                            <MapContents isExp={false} mapRef={cardMapRef} />
                        </MapContainer>
                    </div>
                )}
            </div>

            {/* ── Expanded Modal View — separate MapContainer instance ── */}
            {isExpanded && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 lg:p-12 animate-fadeIn">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-pointer"
                        onClick={() => setIsExpanded(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full h-full max-w-[1600px] bg-[#f8fafc] dark:bg-[#0f172a] rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800 isolate animate-slideUp flex flex-col lg:flex-row">
                        {/* Map area */}
                        <div className="flex-[1_1_55%] lg:flex-1 relative min-h-[45vh] lg:min-h-0 lg:h-full">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <div className="w-8 h-8 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                                        Mapping Placements...
                                    </span>
                                </div>
                            ) : (
                                <div className="relative w-full h-full">
                                    <FloatingHeader />
                                    <MapContainer
                                        center={mapCenter}
                                        zoom={4}
                                        zoomControl={false}
                                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                                        className="bg-[#f8fafc] dark:bg-[#0f172a]"
                                    >
                                        <MapContents isExp={true} mapRef={modalMapRef} />
                                    </MapContainer>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="w-full lg:w-80 h-[45vh] lg:h-full bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col z-[1000] flex-[1_1_45%] lg:flex-none">
                            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                                <h4 className="text-lg font-black text-slate-800 dark:text-white mb-1 uppercase tracking-tight">
                                    Location Index
                                </h4>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    {mapData.length} active placement regions
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2">
                                {[...mapData]
                                    .sort((a, b) => b.students - a.students)
                                    .map(loc => (
                                        <button
                                            key={loc.location}
                                            onClick={() => focusLocation(loc.coordinates)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 group transition-all text-left"
                                        >
                                            <div>
                                                <p className="font-bold text-sm text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 capitalize">
                                                    {loc.location}
                                                </p>
                                                <p className="text-[10px] text-slate-400 font-medium uppercase">
                                                    {loc.companies.length} companies
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-indigo-500 group-hover:scale-110 transition-transform">
                                                    {loc.students}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    Offers
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
                                <p className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-widest leading-none">
                                    Click a location to zoom in
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
