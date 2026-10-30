/** Writes lib/topicNames.json (English topic name -> Thai name) from the paired topic_names_en/th fields in the snapshot. */
import fs from 'fs';
import path from 'path';

const dump = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/all_docs.json'), 'utf8'));
const names: Record<string, string> = {};
for (const { _source: d } of dump.hits.hits) {
  (d.topic_names_en ?? []).forEach((en: string, i: number) => {
    if (d.topic_names_th?.[i]) names[en] = d.topic_names_th[i];
  });
}
fs.writeFileSync(path.join(__dirname, '../lib/topicNames.json'), JSON.stringify(names, null, 2) + '\n');
console.log(`${Object.keys(names).length} topic names`);
