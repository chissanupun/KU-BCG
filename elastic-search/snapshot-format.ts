/** Serializes like the ES `_search` dump in data/all_docs.json, so rewriting it only shows real changes in git. */
export const pretty = (v: unknown, ind = ''): string => {
  if (Array.isArray(v)) return v.length ? `[\n${v.map((x) => `${ind}  ${pretty(x, ind + '  ')}`).join(',\n')}\n${ind}]` : '[ ]';
  if (v && typeof v === 'object') {
    const e = Object.entries(v);
    return e.length ? `{\n${e.map(([k, x]) => `${ind}  ${JSON.stringify(k)} : ${typeof x === 'number' && /^(_score|max_score)$/.test(k) ? x.toFixed(1) : pretty(x, ind + '  ')}`).join(',\n')}\n${ind}}` : '{ }';
  }
  return JSON.stringify(v);
};
