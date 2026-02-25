declare namespace google {
    namespace maps {
        class Map {
            constructor(element: HTMLElement, options?: MapOptions);
            setCenter(latlng: LatLng | LatLngLiteral): void;
            setZoom(zoom: number): void;
            getZoom(): number | undefined;
            fitBounds(bounds: LatLngBounds): void;
        }

        interface MapOptions {
            center?: LatLng | LatLngLiteral;
            zoom?: number;
            styles?: MapTypeStyle[];
        }

        interface MapTypeStyle {
            featureType?: string;
            elementType?: string;
            stylers?: Array<Record<string, unknown>>;
        }

        class Marker {
            constructor(options?: MarkerOptions);
            setMap(map: Map | null): void;
            addListener(event: string, handler: () => void): void;
        }

        interface MarkerOptions {
            position?: LatLng | LatLngLiteral;
            map?: Map | null;
            title?: string;
            animation?: Animation;
        }

        enum Animation {
            DROP = 2,
        }

        class InfoWindow {
            constructor(options?: InfoWindowOptions);
            open(map: Map, marker: Marker): void;
        }

        interface InfoWindowOptions {
            content?: string;
        }

        class Geocoder {
            geocode(
                request: GeocoderRequest,
                callback: (
                    results: GeocoderResult[] | null,
                    status: GeocoderStatus
                ) => void
            ): void;
        }

        interface GeocoderRequest {
            address?: string;
        }

        interface GeocoderResult {
            geometry: GeocoderGeometry;
        }

        interface GeocoderGeometry {
            location: LatLng;
        }

        enum GeocoderStatus {
            OK = "OK",
        }

        class LatLng {
            constructor(lat: number, lng: number);
            lat(): number;
            lng(): number;
        }

        interface LatLngLiteral {
            lat: number;
            lng: number;
        }

        class LatLngBounds {
            extend(point: LatLng | LatLngLiteral): void;
        }

        namespace event {
            function addListener(
                instance: Map,
                eventName: string,
                handler: () => void
            ): void;
            function removeListener(listener: MapsEventListener): void;
            function trigger(instance: Map, eventName: string): void;
        }

        interface MapsEventListener {}
    }
}


