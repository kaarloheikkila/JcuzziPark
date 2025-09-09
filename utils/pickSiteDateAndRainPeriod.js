/**
 * Determine which site has the largest contiguous rain period and return metadata.
 *
 * This function analyses the output of getDailyRain.js. The input should be an object
 * keyed by site names where each value is another object keyed by "dd.mm" date strings
 * with numeric rainfall amounts. It searches for the contiguous 1–4 day period with strictly
 * positive rainfall for each site (zero or negative rain ends a period before that day),
 * selects the site with the largest total rainfall over such a period (breaking ties by
 * longer length and then earlier start), and then calls FindMinKeskihintaDate.js with
 * the dates preceding that period. If there are no preceding dates, the period start
 * date is included instead. The function returns the chosen site, the date from
 * FindMinKeskihintaDate, and the Unix epoch timestamps (milliseconds) marking the start
 * and end of the rain period.
 *
 * @example
 * const rainData = {
 *   Helsinki: { "09.09": 1.2, "10.09": 0, "11.09": 3.1, "12.09": 4.0 },
 *   Tampere: { "09.09": 0.4, "10.09": 0.7, "11.09": 0, "12.09": 2.5 }
 * };
 * pickSiteDateAndRainPeriod(rainData).then(result => {
 *   console.log(result);
 * });
 *
 * @param {Object<string, Object<string, number>>} rainData - The rain amounts keyed by site and date.
 * @param {Object} [opts] Optional settings.
 * @param {number} [opts.year] - The calendar year used to interpret "dd.mm" dates. Defaults to current year.
 * @param {number} [opts.minDays] - Minimum length of a rain period. Defaults to 1.
 * @param {number} [opts.maxDays] - Maximum length of a rain period. Defaults to 4.
 * @returns {Promise<{ site: string, dateFromFindMinKeskihintaDate: string, periodStartTs: number, periodEndTs: number }>}
 */

const findMinKeskihintaDate = require("./FindMinKeskihintaDate.js");

async function pickSiteDateAndRainPeriod(rainData, opts = {}) {
  if (!rainData || typeof rainData !== "object") {
    throw new Error("rainData must be an object of { site: { 'dd.mm': number } }");
  }
  const year = typeof opts.year === "number" ? opts.year : new Date().getFullYear();
  const minDays = typeof opts.minDays === "number" ? opts.minDays : 1;
  const maxDays = typeof opts.maxDays === "number" ? opts.maxDays : 4;

  // Helper to convert "dd.mm" date strings into a UTC timestamp (midnight).
  // Using UTC eliminates timezone variations. Each date is interpreted in the given year.
  function ddmmToTimestamp(ddmm) {
    const [ddStr, mmStr] = ddmm.split(".");
    const day = Number(ddStr);
    const month = Number(mmStr);
    // Use Date.UTC so all timestamps are comparable regardless of server timezone.
    return Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  }

  // Helper to find the best contiguous rain period for a given sequence.
  // Accepts an array of objects { key: "dd.mm", rain: number, ts: number } sorted by ts asc.
  function bestPeriodForSeries(series) {
    let best = {
      sum: -1,
      startIdx: -1,
      endIdx: -1,
      length: 0,
    };
    for (let i = 0; i < series.length; i++) {
      // Only begin periods on days with positive rain.
      if (!(series[i].rain > 0)) continue;
      let sum = 0;
      let end = i;
      for (let len = 1; len <= maxDays && i + len - 1 < series.length; len++) {
        const j = i + len - 1;
        const r = series[j].rain;
        if (!(r > 0)) {
          // Non-positive ends the period before this day.
          break;
        }
        sum += r;
        end = j;
        if (len >= minDays) {
          const periodLength = end - i + 1;
          // Update the best period if sum is higher, or same sum but longer length, or same length but earlier start.
          if (
            sum > best.sum ||
            (sum === best.sum &&
              (periodLength > best.length ||
                (periodLength === best.length && series[i].ts < (series[best.startIdx]?.ts ?? Infinity))))
          ) {
            best.sum = sum;
            best.startIdx = i;
            best.endIdx = end;
            best.length = periodLength;
          }
        }
      }
    }
    if (best.startIdx === -1) {
      // If no positive rain period is found, treat as a zero-length period starting at the first date.
      return {
        sum: 0,
        startIdx: 0,
        endIdx: 0,
        length: 0,
      };
    }
    return best;
  }

  // Find the site with the best rain period.
  let globalResult = {
    site: null,
    sum: -1,
    length: 0,
    startIdx: 0,
    endIdx: 0,
    startTs: 0,
    endTs: 0,
    dates: [],
  };
  for (const [site, dateMap] of Object.entries(rainData)) {
    if (!dateMap || typeof dateMap !== "object") continue;
    const dateKeys = Object.keys(dateMap);
    if (dateKeys.length === 0) continue;
    // Sort dates chronologically.
    dateKeys.sort((a, b) => ddmmToTimestamp(a) - ddmmToTimestamp(b));
    // Build series array with keys, rain values, and timestamps.
    const series = dateKeys.map((ddmm) => ({
      key: ddmm,
      rain: Number(dateMap[ddmm] ?? 0),
      ts: ddmmToTimestamp(ddmm),
    }));
    const best = bestPeriodForSeries(series);
    const startTs = series[best.startIdx]?.ts ?? ddmmToTimestamp(dateKeys[0]);
    const endTs = series[best.endIdx]?.ts ?? startTs;
    // Compare this site's best period with the global best.
    if (
      best.sum > globalResult.sum ||
      (best.sum === globalResult.sum &&
        (best.length > globalResult.length ||
          (best.length === globalResult.length && startTs < globalResult.startTs)))
    ) {
      globalResult.site = site;
      globalResult.sum = best.sum;
      globalResult.length = best.length;
      globalResult.startIdx = best.startIdx;
      globalResult.endIdx = best.endIdx;
      globalResult.startTs = startTs;
      globalResult.endTs = endTs;
      globalResult.dates = dateKeys;
    }
  }
  if (!globalResult.site) {
    throw new Error("No sites found in rainData or data structure incorrect.");
  }
  // Build the list of dates before the chosen period.
  const datesBefore = globalResult.dates.slice(0, Math.max(0, globalResult.startIdx));
  // If there are no prior dates, include the start date itself.
  if (datesBefore.length === 0) {
    datesBefore.push(globalResult.dates[globalResult.startIdx]);
  }
  // Call FindMinKeskihintaDate.js with the preceding dates. It may return a Promise.
  const dateFromFindMinKeskihintaDate = await Promise.resolve(findMinKeskihintaDate(datesBefore));
  return {
    site: globalResult.site,
    dateFromFindMinKeskihintaDate,
    periodStartTs: globalResult.startTs,
    periodEndTs: globalResult.endTs,
  };
}

module.exports = pickSiteDateAndRainPeriod;