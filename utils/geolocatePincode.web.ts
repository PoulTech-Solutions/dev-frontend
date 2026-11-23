import { Platform } from "react-native";

export type BrowserLocationArea = {
  pincode: string;
  state?: string;
  district?: string;
  village_city?: string;
};

/** Web: browser GPS → Nominatim reverse geocode → India 6-digit pincode when available. */
export async function resolveAreaFromBrowserLocation(): Promise<BrowserLocationArea | null> {
  if (Platform.OS !== "web") return null;
  if (typeof navigator === "undefined" || !navigator.geolocation) return null;

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 120_000,
    });
  });

  const { latitude, longitude } = position.coords;
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const body = (await res.json()) as {
    address?: {
      postcode?: string;
      country_code?: string;
      state?: string;
      county?: string;
      state_district?: string;
      city?: string;
      town?: string;
      village?: string;
    };
  };
  if (body.address?.country_code?.toLowerCase() !== "in") return null;

  const raw = body.address?.postcode?.replace(/\D/g, "") ?? "";
  const pin = raw.slice(0, 6);
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;

  return {
    pincode: pin,
    state: body.address?.state,
    district: body.address?.state_district || body.address?.county || body.address?.city,
    village_city: body.address?.city || body.address?.town || body.address?.village,
  };
}

export async function resolvePincodeFromBrowserLocation(): Promise<string | null> {
  const area = await resolveAreaFromBrowserLocation();
  return area?.pincode ?? null;
}