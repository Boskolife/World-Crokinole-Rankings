let loadPromise: Promise<void> | null = null;

export function loadGoogleMapsWithPlaces(): Promise<void> {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Not in browser"));
    }
    if (window.google?.maps?.places?.Autocomplete) {
        return Promise.resolve();
    }
    if (loadPromise) return loadPromise;

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        return Promise.reject(new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set"));
    }

    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
        loadPromise = new Promise((resolve, reject) => {
            const check = () => {
                if (window.google?.maps?.places?.Autocomplete) {
                    resolve();
                    return;
                }
                setTimeout(check, 50);
            };
            setTimeout(() => {
                if (window.google?.maps?.places?.Autocomplete) resolve();
                else check();
            }, 100);
            setTimeout(() => {
                if (!window.google?.maps?.places?.Autocomplete) {
                    reject(new Error("Google Maps Places failed to load"));
                }
            }, 15000);
        });
        return loadPromise;
    }

    loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            const check = () => {
                if (window.google?.maps?.places?.Autocomplete) {
                    resolve();
                } else {
                    setTimeout(check, 50);
                }
            };
            setTimeout(check, 100);
        };
        script.onerror = () => {
            loadPromise = null;
            reject(new Error("Failed to load Google Maps script"));
        };
        document.head.appendChild(script);
    });

    return loadPromise;
}
