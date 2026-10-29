/** Writes lib/courseTitles.json (kumoocNNN -> course title) from the KU_MOOC documents in the snapshot. */
import fs from 'fs';
import path from 'path';

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/all_docs.json'), 'utf8'));
const titles: Record<string, string> = {};
for (const { _source: d } of dump.hits.hits) {
  if (d.source === 'KU_MOOC' && d.course_code) titles[d.course_code] = d.title;
}
fs.writeFileSync(path.join(__dirname, '../lib/courseTitles.json'), JSON.stringify(titles, null, 2) + '\n');
console.log(`${Object.keys(titles).length} course titles`);
