// findMinKeskihintaDate.js
// Helper that fetches a JSON mapping { "dd.mm": number } and returns
// the date with the minimum "Keskihinta" among the provided dates.
//
// Usage example:
//   import { findMinKeskihintaDate } from './findMinKeskihintaDate';
//   const minDate = await findMinKeskihintaDate(['01.01', '16.10', '05.03']);
//   console.log(minDate);
//
// Assumes `sahkonhinta.json` is served from your app's public root.
// (e.g., place it in `public/sahkonhinta.json` for Create React App / Vite).

export async function findMinKeskihintaDate(dates, jsonUrl = '/sahkonhinta.json') {
  if (!Array.isArray(dates) || dates.length === 0) return null;

  const res = await fetch(jsonUrl);
  if (!res.ok) throw new Error(`Failed to load data from ${jsonUrl}`);
  const prices = await res.json();

  let minDate = null;
  let minValue = Number.POSITIVE_INFINITY;

  for (const d of dates) {
    const parts = String(d).replace(/[\/-]/g, '.').split('.');
    const key = parts.length >= 2
      ? `${String(parts[0]).padStart(2, '0')}.${String(parts[1]).padStart(2, '0')}`
      : String(d);

    const v = prices[key];
    if (typeof v === 'number' && Number.isFinite(v) && v < minValue) {
      minValue = v;
      minDate  = key;
    }
  }

  return minDate;
}
