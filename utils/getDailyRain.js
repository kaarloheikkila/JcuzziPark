// getDailyRain.js
// Utility to fetch FMI 10-day edited forecast and return daily rainfall totals
const BASE_URL = "https://opendata.fmi.fi/wfs";
const STOREDQUERY_ID =
  "fmi::forecast::edited::weather::scandinavia::point::timevaluepair";

// Build a WFS URL for precipitation1h for one site
function buildUrl(site) {
  const u = new URL(BASE_URL);
  u.searchParams.set("service", "WFS");
  u.searchParams.set("version", "2.0.0");
  u.searchParams.set("request", "getFeature");
  u.searchParams.set("storedquery_id", STOREDQUERY_ID);
  u.searchParams.set("place", site);
  // ask only for hourly precipitation to reduce payload
  u.searchParams.set("parameters", "precipitation1h");
  // hourly is the natural timestep; FMI will return ~240 hours by default
  u.searchParams.set("timestep", "60");
  return u.toString();
}

// Parse FMI WML2 timevaluepair XML -> array of {time, value}
function parsePrecipitation1h(xmlText) {
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  const points = Array.from(
    doc.querySelectorAll(
      "wml2\\:MeasurementTimeseries > wml2\\:point, MeasurementTimeseries > point"
    )
  );
  return points.map((p) => {
    const t =
      p.querySelector("wml2\\:time, time")?.textContent?.trim() ??
      p.querySelector(
        "gml\\:time, beginPosition, gml\\:beginPosition"
      )?.textContent?.trim() ??
      "";
    const v = Number(p.querySelector("wml2\\:value, value")?.textContent ?? "0");
    return { time: t, value: Number.isFinite(v) ? v : 0 };
  });
}

// Group by local day (Europe/Helsinki) and sum mm
function toDailyRainfallMM(hourly, days = 10, tz = "Europe/Helsinki") {
  const out = {};
  // from today 00:00 local to +days
  const now = new Date();
  const startDateString = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(now)
    .split("/")
    .reverse()
    .join("-") + "T00:00:00";
  const start = new Date(startDateString);
  for (let d = 0; d < days; d++) {
    const day = new Date(start.getTime());
    day.setDate(start.getDate() + d);
    const label = new Intl.DateTimeFormat("fi-FI", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
    })
      .format(day)
      .replace(/\u200E/g, "");
    out[label] = 0;
  }
  // sum values into matching local day keys
  for (const { time, value } of hourly) {
    const local = new Date(time);
    const key = new Intl.DateTimeFormat("fi-FI", {
      timeZone: tz,
      day: "2-digit",
      month: "2-digit",
    })
      .format(local)
      .replace(/\u200E/g, "");
    if (out.hasOwnProperty(key)) {
      out[key] += value;
    }
  }
  // round to one decimal
  for (const k of Object.keys(out)) {
    out[k] = Math.round(out[k] * 10) / 10;
  }
  return out;
}

// Fetch one site and return { [dd.mm]: mm } for next 10 days
async function fetchSiteDailyRain(site) {
  const url = buildUrl(site);
  const resp = await fetch(url, { headers: { Accept: "application/xml" } });
  if (!resp.ok) {
    throw new Error(`${site}: HTTP ${resp.status}`);
  }
  const xml = await resp.text();
  const hourly = parsePrecipitation1h(xml);
  return toDailyRainfallMM(hourly, 10, "Europe/Helsinki");
}

// Main: returns { [site]: { [dd.mm]: mm } } for a list of sites
async function getDailyRainForSites(sites) {
  const results = {};
  const promises = sites.map((s) => fetchSiteDailyRain(s).then((data) => [s, data]));
  const settled = await Promise.allSettled(promises);
  for (const item of settled) {
    if (item.status === "fulfilled") {
      const [site, data] = item.value;
      results[site] = data;
    } else {
      // include site with empty data if fetch failed
      const index = settled.indexOf(item);
      results[sites[index]] = {};
    }
  }
  return results;
}

// Example usage:
// (async () => {
//   const sites = ["Tampere", "Helsinki", "Turku"];
//   const data = await getDailyRainForSites(sites);
//   console.log(JSON.stringify(data, null, 2));
// })();

module.exports = {
  buildUrl,
  parsePrecipitation1h,
  toDailyRainfallMM,
  fetchSiteDailyRain,
  getDailyRainForSites,
};
