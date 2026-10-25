// City settings. To use this project for another city, change these values and re-run the scan
// (tools/ai_scan.js on a Mac, or the "AI street scan" GitHub Action).
window.CITY_CONFIG = {
  name: "Vadodara",
  // Area to scan: south, west, north, east (degrees).
  box: { s: 22.24, w: 73.10, n: 22.40, e: 73.27 },
  // Where the map opens.
  center: [22.310, 73.180],
  zoom: 15,
  // Local time offset from UTC, in hours (used to skip photos taken in the dark).
  utcOffsetHours: 5.5
};
