"use client";

import React, { useEffect, useRef, useState } from "react";
import css from "./styles.module.scss";
import { IEventCardProps } from "@/shared/types";

interface EventsMapProps {
    events: IEventCardProps[];
}

declare global {
    interface Window {
        google: typeof google;
        initMap: () => void;
    }
}

const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
    if (!window.google || !window.google.maps) {
        return null;
    }

    return new Promise((resolve) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: location }, (results, status) => {
            if (status === "OK" && results && results[0]) {
                const location = results[0].geometry.location;
                resolve({
                    lat: location.lat(),
                    lng: location.lng(),
                });
            } else {
                resolve(null);
            }
        });
    });
};

let googleMapsLoadingPromise: Promise<void> | null = null;
let isGoogleMapsLoaded = false;

const loadGoogleMaps = (): Promise<void> => {
    if (window.google && window.google.maps) {
        isGoogleMapsLoaded = true;
        return Promise.resolve();
    }

    if (googleMapsLoadingPromise) {
        return googleMapsLoadingPromise;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return Promise.reject(new Error("Google Maps API key is not configured"));
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
        return new Promise((resolve, reject) => {
            const checkInterval = setInterval(() => {
                if (window.google && window.google.maps) {
                    clearInterval(checkInterval);
                    isGoogleMapsLoaded = true;
                    resolve();
                }
            }, 100);

            setTimeout(() => {
                clearInterval(checkInterval);
                if (!window.google || !window.google.maps) {
                    reject(new Error("Failed to load Google Maps"));
                }
            }, 10000);
        });
    }

    googleMapsLoadingPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            const checkGoogleMaps = () => {
                if (window.google && window.google.maps && window.google.maps.Map) {
                    isGoogleMapsLoaded = true;
                    resolve();
                } else {
                    setTimeout(checkGoogleMaps, 50);
                }
            };
            setTimeout(checkGoogleMaps, 100);
        };
        script.onerror = () => {
            googleMapsLoadingPromise = null;
            reject(new Error("Failed to load Google Maps"));
        };

        document.head.appendChild(script);
    });

    return googleMapsLoadingPromise;
};

export const EventsMap: React.FC<EventsMapProps> = ({ events }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const initializeMap = React.useCallback(() => {
        if (!mapRef.current) return false;
        if (!window.google?.maps?.Map) return false;

        try {
            const defaultCenter = { lat: 40.7128, lng: -74.0060 };
            const mapInstance = new window.google.maps.Map(mapRef.current, {
                center: defaultCenter,
                zoom: 3,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                ],
            });

            setMap(mapInstance);
            setIsLoading(false);
            return true;
        } catch (err) {
            console.error("Error initializing map:", err);
            setError(`Failed to initialize map: ${err instanceof Error ? err.message : String(err)}`);
            setIsLoading(false);
            return false;
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let retryCount = 0;
        const maxRetries = 20;

        loadGoogleMaps()
            .then(() => {
                if (!isMounted) return;

                const tryInitialize = () => {
                    retryCount++;
                    if (!mapRef.current) {
                        if (retryCount < maxRetries) setTimeout(tryInitialize, 100);
                        else setError("Map container not found"), setIsLoading(false);
                        return;
                    }
                    if (!window.google?.maps?.Map) {
                        if (retryCount < maxRetries) setTimeout(tryInitialize, 100);
                        else setError("Google Maps API failed to load"), setIsLoading(false);
                        return;
                    }
                    const success = initializeMap();
                    if (!success && retryCount < maxRetries) setTimeout(tryInitialize, 100);
                };

                setTimeout(tryInitialize, 200);
            })
            .catch((err) => {
                if (!isMounted) return;
                console.error("Error loading Google Maps:", err);
                setError(err.message || "Failed to load Google Maps");
                setIsLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [initializeMap]);

    useEffect(() => {
        if (!map || !window.google || !window.google.maps) {
            return;
        }

        const loadMarkers = async () => {
            markers.forEach((m) => m.setMap(null));

            const newMarkers: google.maps.Marker[] = [];
            const bounds = new window.google.maps.LatLngBounds();
            let hasValidLocation = false;

            for (const event of events) {
                if (!event.location || /online|virtual/i.test(event.location)) continue;

                const coordinates =
                    typeof event.latitude === "number" && typeof event.longitude === "number"
                        ? { lat: event.latitude, lng: event.longitude }
                        : await geocodeLocation(event.location);

                if (coordinates) {
                    const marker = new window.google.maps.Marker({
                        position: coordinates,
                        map: map,
                        title: event.title,
                        animation: window.google.maps.Animation.DROP,
                    });

                    const escapedTitle = event.title.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                    const escapedLocation = event.location.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                    const escapedDate = event.date.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
                    const escapedFormat = event.format ? event.format.replace(/"/g, "&quot;").replace(/'/g, "&#39;") : "";

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div style="padding: 10px; max-width: 250px;">
                                <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">${escapedTitle}</h3>
                                <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${escapedLocation}</p>
                                <p style="margin: 0 0 4px 0; color: #666; font-size: 14px;">${escapedDate}</p>
                                ${escapedFormat ? `<p style="margin: 0; color: #666; font-size: 12px;">${escapedFormat}</p>` : ""}
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(map, marker);
                    });

                    newMarkers.push(marker);
                    bounds.extend(coordinates);
                    hasValidLocation = true;
                }
                if (typeof event.latitude !== "number" || typeof event.longitude !== "number") {
                    await new Promise((r) => setTimeout(r, 60));
                }
            }

            setMarkers(newMarkers);

            if (hasValidLocation) {
                window.google.maps.event.trigger(map, "resize");
                map.fitBounds(bounds);
                const listener = window.google.maps.event.addListener(map, "bounds_changed", () => {
                    const z = map.getZoom();
                    if (z != null && z > 15) map.setZoom(15);
                    window.google.maps.event.removeListener(listener as unknown as google.maps.MapsEventListener);
                }) as unknown as google.maps.MapsEventListener;
            } else if (events.length === 0) {
                map.setCenter({ lat: 40.7128, lng: -74.0060 });
                map.setZoom(3);
            }
        };

        loadMarkers();
    }, [map, events]);

    useEffect(() => {
        if (!map || isLoading) return;
        const t = setTimeout(() => {
            window.google?.maps?.event?.trigger(map, "resize");
        }, 100);
        return () => clearTimeout(t);
    }, [map, isLoading]);

    if (error) {
        return (
            <div className={css.events_map_error}>
                <p>{error}</p>
                <p style={{ fontSize: "14px", color: "#666", marginTop: "8px" }}>
                    Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment variables.
                </p>
            </div>
        );
    }

    return (
        <div style={{ position: "relative" }}>
            {isLoading && (
                <div className={css.events_map_loading}>
                    <p>Loading map...</p>
                </div>
            )}
            <div 
                ref={mapRef} 
                className={css.events_map}
                style={{ 
                    display: isLoading ? "none" : "block",
                    opacity: isLoading ? 0 : 1,
                    transition: "opacity 0.3s"
                }}
            />
        </div>
    );
};

