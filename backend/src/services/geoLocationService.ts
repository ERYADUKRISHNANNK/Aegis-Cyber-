import axios from "axios";

interface GeoResult {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
  status: string;
}

// In-memory cache to avoid hitting rate limits
const geoCache = new Map<string, GeoResult>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const cacheTimestamps = new Map<string, number>();

const defaultGeo: GeoResult = {
  city: "Unknown",
  region: "Unknown",
  country: "Unknown",
  countryCode: "XX",
  lat: 0,
  lon: 0,
  isp: "Unknown",
  org: "Unknown",
  status: "fail"
};

/**
 * Resolve an IP address to geographic location.
 * Uses ip-api.com (free, no API key, 45 req/min limit).
 * Caches results for 24 hours.
 */
export const resolveIPGeo = async (ip: string): Promise<GeoResult> => {
  // Skip private/local IPs
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return { ...defaultGeo, city: "Local Network", country: "Local", countryCode: "LO", status: "private" };
  }

  // Check cache
  const cached = geoCache.get(ip);
  const cachedTime = cacheTimestamps.get(ip) || 0;
  if (cached && Date.now() - cachedTime < CACHE_TTL_MS) {
    return cached;
  }

  try {
    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,isp,org`, {
      timeout: 3000
    });

    if (response.data.status === "success") {
      const geo: GeoResult = {
        city: response.data.city || "Unknown",
        region: response.data.regionName || "Unknown",
        country: response.data.country || "Unknown",
        countryCode: response.data.countryCode || "XX",
        lat: response.data.lat || 0,
        lon: response.data.lon || 0,
        isp: response.data.isp || "Unknown",
        org: response.data.org || "Unknown",
        status: "success"
      };

      geoCache.set(ip, geo);
      cacheTimestamps.set(ip, Date.now());
      return geo;
    }
  } catch (err: any) {
    console.warn(`GeoIP lookup failed for ${ip}: ${err.message}`);
  }

  return defaultGeo;
};

/**
 * Get cache stats for monitoring
 */
export const getGeoCacheStats = () => ({
  cacheSize: geoCache.size,
  oldestEntry: Array.from(cacheTimestamps.values()).sort()[0] || null,
  newestEntry: Array.from(cacheTimestamps.values()).sort().reverse()[0] || null
});
