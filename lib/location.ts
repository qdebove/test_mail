import crypto from "node:crypto";

export type GeocodeInput = {
  address?: string | null;
  addressComplement?: string | null;
  zipCode?: string | null;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  normalizedAddress: string;
};

const GEOHASH_BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function sanitizePart(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function buildQuery(input: GeocodeInput) {
  const parts = [input.address, input.addressComplement, input.zipCode]
    .map((part) => sanitizePart(part))
    .filter((part) => part.length > 0);

  return parts.join(", ");
}

function computeDeterministicCoordinate(hash: Buffer, offset: number, range: [number, number]) {
  const slice = hash.subarray(offset, offset + 4);
  const fraction = slice.readUInt32BE() / 0xffffffff;
  const [min, max] = range;
  const raw = min + fraction * (max - min);
  return Number(raw.toFixed(6));
}

export async function geocodeAddress(input: GeocodeInput): Promise<GeocodeResult | null> {
  const query = buildQuery(input);

  if (!query) {
    return null;
  }

  const normalized = query.toLowerCase();
  const hash = crypto.createHash("sha256").update(normalized).digest();
  const latitude = computeDeterministicCoordinate(hash, 0, [-90, 90]);
  const longitude = computeDeterministicCoordinate(hash, 4, [-180, 180]);

  return {
    latitude,
    longitude,
    normalizedAddress: query,
  };
}

export function encodeGeohash(latitude: number, longitude: number, precision = 9) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Latitude and longitude must be finite numbers");
  }

  const latRange: [number, number] = [-90, 90];
  const lonRange: [number, number] = [-180, 180];
  let geohash = "";
  let bit = 0;
  let ch = 0;
  let isEvenBit = true;

  while (geohash.length < precision) {
    if (isEvenBit) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (longitude >= mid) {
        ch = (ch << 1) + 1;
        lonRange[0] = mid;
      } else {
        ch = (ch << 1) + 0;
        lonRange[1] = mid;
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (latitude >= mid) {
        ch = (ch << 1) + 1;
        latRange[0] = mid;
      } else {
        ch = (ch << 1) + 0;
        latRange[1] = mid;
      }
    }

    isEvenBit = !isEvenBit;
    bit++;

    if (bit === 5) {
      geohash += GEOHASH_BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
}
