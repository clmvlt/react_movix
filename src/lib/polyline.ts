export type LngLat = [number, number];

export function decodePolyline(value: string, precision = 5): LngLat[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: LngLat[] = [];
  const factor = Math.pow(10, precision);

  while (index < value.length) {
    let result = 1;
    let shift = 0;
    let byte: number;
    do {
      byte = value.charCodeAt(index++) - 63 - 1;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x1f);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      byte = value.charCodeAt(index++) - 63 - 1;
      result += byte << shift;
      shift += 5;
    } while (byte >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coordinates.push([lng / factor, lat / factor]);
  }
  return coordinates;
}
