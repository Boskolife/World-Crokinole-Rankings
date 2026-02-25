"use client";

import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import css from "./styles.module.scss";
import { IEventCardProps } from "@/shared/types";
import { clientRoutes } from "@/shared/routes/client";
import { localeConfig } from "@/app/localization/config";

interface EventsMapProps {
    events: IEventCardProps[];
}

declare global {
    interface Window {
        google: typeof google;
        initMap: () => void;
    }
}

const LABEL_STYLE = {
    background: "#FFFFFF",
    border: "1px solid #AAC7E1",
    borderRadius: "4px",
    boxShadow: "4px 4px 16px rgba(0, 33, 61, 0.1)",
    padding: "7px 12px",
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: "14px",
    fontWeight: 500,
    lineHeight: 1.25,
    color: "#1F1F1F",
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
};

const TRANSPARENT_ICON =
    "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildEventCardInfoContent(event: IEventCardProps, eventDetailUrl: string): string {
    const title = escapeHtml(event.title);
    const location = escapeHtml(event.location);
    const date = escapeHtml(event.date);
    const format = escapeHtml(event.format || "");
    const price =
        !event.price || event.price.toLowerCase() === "free"
            ? "Free"
            : escapeHtml(event.price);
    const isFree = !event.price || event.price.toLowerCase() === "free";
    const registrationText = event.isRegistrationRequired
        ? "Registration is Required"
        : "No registration required";
    const registrationColor = event.isRegistrationRequired ? "#00284B" : "#F4B44B";
    const rankText =
        event.currentRank != null && event.totalParticipants != null
            ? `${event.currentRank}/${event.totalParticipants}`
            : "";
    const imageStyle = event.image
        ? `background:url('${escapeHtml(event.image)}') center/cover no-repeat;`
        : "background:linear-gradient(90deg,#00284B 0%,#00284B 1%,#2A5298 100%);";
    const rankingSvg =
        '<svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 18V8h2v10H4zm5-10v10h2V8H9zm5 4v6h2v-6h-2zM4 6h2V4H4v2zm5 0h2V4H9v2zm5 0h2V4h-2v2z" fill="#00284B"/></svg>';

    return `
    <div style="font-family:Inter,-apple-system,sans-serif;max-width:320px;border-radius:8px;overflow:hidden;box-shadow:4px 4px 16px rgba(0,33,61,0.1);background:#fff;">
      <div style="position:relative;height:180px;${imageStyle}">
        <span style="position:absolute;left:10px;top:10px;background:#fff;color:${registrationColor};padding:7px 12px;border-radius:4px;font-size:14px;font-weight:500;line-height:1.25;box-shadow:4px 4px 16px rgba(0,33,61,0.1);">${registrationText}</span>
        ${rankText ? `<div style="position:absolute;right:10px;top:10px;display:flex;align-items:center;gap:6px;background:#fff;padding:5px 12px;border-radius:4px;box-shadow:4px 4px 16px rgba(0,33,61,0.1);font-size:16px;font-weight:500;color:#00284B;">${rankingSvg}<span>${rankText}</span></div>` : ""}
        ${!event.image ? '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><img src="/images/logo.png" alt="" style="width:80px;height:auto;opacity:0.9;" onerror="this.style.display=\'none\'"/></div>' : ""}
      </div>
      <div style="padding:16px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <h3 style="margin:0;font-family:Aleo,serif;font-size:24px;font-weight:600;line-height:1.25;color:#0E0E0E;">${title}</h3>
          <span style="background:#fff;border:1px solid ${isFree ? "#AAC7E1" : "#F4B44B"};padding:6px 12px;border-radius:111px;font-size:14px;color:#0E0E0E;">${price}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">
          <p style="margin:0;font-size:18px;line-height:1.35;color:#0E0E0E;">${date}</p>
          <p style="margin:0;display:flex;align-items:center;gap:8px;font-size:18px;line-height:1.35;color:#0E0E0E;">
            <svg width="15" height="24" viewBox="0 0 15 24" fill="none" style="flex-shrink:0;"><path d="M7.5 0C3.36 0 0 3.36 0 7.5c0 5.63 7.5 16.5 7.5 16.5S15 13.13 15 7.5C15 3.36 11.64 0 7.5 0zm0 10.12a2.62 2.62 0 110-5.24 2.62 2.62 0 010 5.24z" fill="#00284B"/></svg>
            ${location}
          </p>
          ${format ? `<p style="margin:0;font-size:18px;line-height:1.35;color:#0E0E0E;">${format}</p>` : ""}
        </div>
        <a href="${escapeHtml(eventDetailUrl)}" style="display:block;margin-top:8px;padding:12px 24px;background:linear-gradient(90deg,#F4B44B,#D48F1F);color:#fff;text-align:center;border-radius:8px;font-size:16px;font-weight:500;text-decoration:none;">More details</a>
      </div>
    </div>
  `.trim();
}

function createLabelOverlay(
    position: { lat: number; lng: number },
    text: string,
    map: google.maps.Map,
    marker: google.maps.Marker,
    infoWindow: google.maps.InfoWindow
) {
    const g = window.google;
    if (!g?.maps?.OverlayView) return null;

    class MapLabelOverlay extends g.maps.OverlayView {
        private position: { lat: number; lng: number };
        private text: string;
        private div: HTMLDivElement | null = null;
        private marker: google.maps.Marker;
        private infoWindow: google.maps.InfoWindow;

        constructor(
            pos: { lat: number; lng: number },
            labelText: string,
            m: google.maps.Marker,
            iw: google.maps.InfoWindow
        ) {
            super();
            this.position = pos;
            this.text = labelText;
            this.marker = m;
            this.infoWindow = iw;
        }

        onAdd() {
            const div = document.createElement("div");
            div.style.position = "absolute";
            div.style.left = "0";
            div.style.top = "0";
            Object.assign(div.style, LABEL_STYLE);
            div.textContent = this.text;
            div.addEventListener("click", () => {
                this.infoWindow.open(this.getMap()!, this.marker);
            });
            this.div = div;
            const panes = this.getPanes();
            if (panes?.overlayMouseTarget) panes.overlayMouseTarget.appendChild(div);
        }

        draw() {
            if (!this.div) return;
            const projection = this.getProjection();
            if (!projection) return;
            const point = projection.fromLatLngToDivPixel(
                new window.google.maps.LatLng(this.position.lat, this.position.lng)
            );
            if (point) {
                const x = typeof point.x === "function" ? point.x() : point.x;
                const y = typeof point.y === "function" ? point.y() : point.y;
                this.div.style.left = `${x}px`;
                this.div.style.top = `${y}px`;
                this.div.style.transform = "translate(-50%, -50%)";
            }
        }

        onRemove() {
            if (this.div?.parentNode) this.div.parentNode.removeChild(this.div);
            this.div = null;
        }
    }

    const overlay = new MapLabelOverlay(position, text, marker, infoWindow);
    overlay.setMap(map);
    return overlay;
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

type LabelOverlay = { setMap: (map: google.maps.Map | null) => void };

export const EventsMap: React.FC<EventsMapProps> = ({ events }) => {
    const params = useParams() as { locale?: string };
    const locale = params?.locale ?? localeConfig.defaultLocale;
    const mapRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
    const overlaysRef = useRef<LabelOverlay[]>([]);
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
            overlaysRef.current.forEach((o) => o.setMap(null));
            overlaysRef.current = [];

            const newMarkers: google.maps.Marker[] = [];
            const newOverlays: LabelOverlay[] = [];
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
                        icon: TRANSPARENT_ICON,
                        visible: true,
                    });

                    const eventDetailUrl = `/${locale}${clientRoutes.eventDetail(event.id)}`;
                    const infoWindow = new window.google.maps.InfoWindow({
                        content: buildEventCardInfoContent(event, eventDetailUrl),
                    });

                    const overlay = createLabelOverlay(
                        coordinates,
                        event.title,
                        map,
                        marker,
                        infoWindow
                    );
                    if (overlay) newOverlays.push(overlay);

                    newMarkers.push(marker);
                    bounds.extend(coordinates);
                    hasValidLocation = true;
                }
                if (typeof event.latitude !== "number" || typeof event.longitude !== "number") {
                    await new Promise((r) => setTimeout(r, 60));
                }
            }

            overlaysRef.current = newOverlays;
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
    }, [map, events, locale]);

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

