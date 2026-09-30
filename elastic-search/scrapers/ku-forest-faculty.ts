import { chromium, type Browser, type Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import type { KUForestDoc } from './ku-forest';

const BASE = 'https://research.ku.ac.th/forest';

// ── Faculty/Department structure for 4 target faculties ──────────────
export interface FacultyDef {
  id: string;
  name_th: string;
  name_en: string;
  campusId: string;
}

export const FACULTIES: FacultyDef[] = [
  { id: '02', name_th: 'คณะเกษตร', name_en: 'Agriculture', campusId: '01' },
  { id: '03', name_th: 'คณะประมง', name_en: 'Fisheries', campusId: '01' },
  { id: '04', name_th: 'คณะวนศาสตร์', name_en: 'Forestry', campusId: '01' },
  { id: 'AE', name_th: 'คณะสหวิทยาการจัดการและเทคโนโลยี', name_en: 'Integrated Management', campusId: '01' },
];

// ── Output types ─────────────────────────────────────────────────────
export interface KUForestResearcher {
  person_id: string;
  name_th: string;
  position: string;
  department: string;
  faculty: string;
  faculty_en: string;
  expertise: string[];
  url: string;
}

export interface KUForestRelation {
  subject: string;
  predicate: string;
  object: string;
  source: 'KU_Forest';
}

// ── MVP limits ───────────────────────────────────────────────────────
const MAX_RESEARCHERS_PER_DEPT = 3;
const MAX_PUBS_PER_PERSON = 8;
const DELAY_MS = 600;

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Locator-based extractors (no regex on raw HTML) ──────────────────

async function getDepartments(page: Page): Promise<{ name: string; href: string }[]> {
  const links = await page.locator('a[href*="SectionID"]').all();
  const depts: { name: string; href: string }[] = [];
  for (const link of links) {
    const text = (await link.textContent())?.trim() || '';
    const href = (await link.getAttribute('href')) || '';
    if (text && !text.includes('สำนักงานเลขานุการ')) {
      depts.push({ name: text, href });
    }
  }
  return depts;
}

async function getPersonLinks(page: Page): Promise<{ id: string; name: string; position: string }[]> {
  const links = await page.locator('a[href*="Person.aspx?id="]').all();
  const persons: { id: string; name: string; position: string }[] = [];
  for (const link of links) {
    const href = (await link.getAttribute('href')) || '';
    const idMatch = href.match(/id=(\d+)/);
    if (!idMatch) continue;
    const raw = (await link.textContent())?.trim() || '';
    const parts = raw.split(',').map(s => s.trim());
    const name = parts[0].replace(/^ดร\.\s*/, '').trim();
    const position = parts[1] || '';
    if (name.length > 2) persons.push({ id: idMatch[1], name, position });
  }
  return persons;
}

async function getExpertise(page: Page): Promise<string[]> {
  try {
    const cloud = page.locator('#ExpertCloud, [id*="Interest"], [id*="Expertise"]').first();
    if (!(await cloud.isVisible().catch(() => false))) return [];
    const tags = await cloud.locator('a, span').all();
    const kws: string[] = [];
    for (const tag of tags.slice(0, 30)) {
      const text = (await tag.textContent())?.trim() || '';
      if (text.length > 2 && text.length < 60) kws.push(text);
    }
    return [...new Set(kws)];
  } catch { return []; }
}

async function getPublications(page: Page): Promise<{ title: string; year?: number; docType: string }[]> {
  const pubs: { title: string; year?: number; docType: string }[] = [];
  const seen = new Set<string>();

  // Publications are in links within the main content
  const allLinks = await page.locator('a').all();
  for (const link of allLinks) {
    const text = (await link.textContent())?.trim() || '';
    // Publication titles are typically > 20 chars and contain research-like text
    if (text.length < 15 || text.length > 500) continue;
    // Skip navigation/menu links
    if (text.match(/^(Home|Back|Next|Previous|\d+|International|National|Journal|Conference|Patent)/i)) continue;
    if (text.match(/^(หน้าแรก|ถัดไป|ก่อนหน้า|ย้อนกลับ)/)) continue;

    const key = text.slice(0, 60);
    if (seen.has(key)) continue;
    seen.add(key);
    pubs.push({ title: text, docType: 'publication' });
    if (pubs.length >= MAX_PUBS_PER_PERSON) break;
  }

  return pubs;
}

async function getProjects(page: Page): Promise<{ title: string; year?: number; role: string; funding: string }[]> {
  const projects: { title: string; year?: number; role: string; funding: string }[] = [];
  const html = await page.content();
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

  // Look for project entries with Thai year (25xx) or Western year
  const entries = text.split(/(?=\b(?:25[4-7]\d|20[1-3]\d)\b)/);

  for (const entry of entries) {
    const yearMatch = entry.match(/^(25[4-7]\d|20[1-3]\d)\b/);
    if (!yearMatch) continue;

    let year = parseInt(yearMatch[1]);
    if (year > 2500) year -= 543;

    const rest = entry.slice(yearMatch[0].length).trim();
    if (rest.length < 15) continue;

    const roleMatch = rest.match(/(หัวหน้าโครงการ|ผู้ร่วมวิจัย|ที่ปรึกษา)/);
    const role = roleMatch?.[1] || '';

    const fundingMatch = rest.match(/(ทุนอุดหนุนวิจัย มก\.|สวก\.|วช\.|สกว\.|สกสว\.|สวทช\.)/);
    const funding = fundingMatch?.[1] || '';

    // Title: text before role keyword or first 200 chars
    let title = rest;
    if (roleMatch) title = rest.slice(0, rest.indexOf(roleMatch[0])).trim();
    title = title.slice(0, 200).trim();

    if (title.length > 10 && !projects.some(p => p.title.slice(0, 60) === title.slice(0, 60))) {
      projects.push({ title, year, role, funding });
    }
    if (projects.length >= MAX_PUBS_PER_PERSON) break;
  }

  return projects;
}

// ── Main scraper ─────────────────────────────────────────────────────

export async function scrapeKUForestFaculties(): Promise<{
  docs: KUForestDoc[];
  researchers: KUForestResearcher[];
  relations: KUForestRelation[];
}> {
  const allDocs: KUForestDoc[] = [];
  const allResearchers: KUForestResearcher[] = [];
  const allRelations: KUForestRelation[] = [];
  const seenDocs = new Set<string>();
  const seenPersons = new Set<string>();

  const browser = await chromium.launch({ headless: true });
  const now = new Date().toISOString();

  for (const faculty of FACULTIES) {
    console.log(`\n=== ${faculty.name_th} (${faculty.name_en}) ===`);

    const page = await browser.newPage();
    try {
      await page.goto(
        `${BASE}/Department.aspx?CampusID=${faculty.campusId}&FacultyID=${faculty.id}`,
        { waitUntil: 'domcontentloaded', timeout: 20000 },
      );
      await delay(1500);

      const departments = await getDepartments(page);
      console.log(`  ${departments.length} departments`);
      await page.close();

      for (const dept of departments) {
        console.log(`  > ${dept.name}`);

        const deptPage = await browser.newPage();
        try {
          await deptPage.goto(`${BASE}/${dept.href}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await delay(1500);

          const persons = (await getPersonLinks(deptPage)).slice(0, MAX_RESEARCHERS_PER_DEPT);
          console.log(`    ${persons.length} researchers`);
          await deptPage.close();

          for (const person of persons) {
            if (seenPersons.has(person.id)) continue;
            seenPersons.add(person.id);

            const personUrl = `${BASE}/Person.aspx?id=${person.id}`;

            // Expertise from person page
            let expertise: string[] = [];
            const pPage = await browser.newPage();
            try {
              await pPage.goto(personUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await delay(1000);
              expertise = await getExpertise(pPage);
            } catch { /* skip */ }
            finally { await pPage.close(); }

            // Save researcher entity
            allResearchers.push({
              person_id: person.id,
              name_th: person.name,
              position: person.position,
              department: dept.name,
              faculty: faculty.name_th,
              faculty_en: faculty.name_en,
              expertise,
              url: personUrl,
            });

            // Relations
            allRelations.push(
              { subject: person.name, predicate: 'belongsTo', object: dept.name, source: 'KU_Forest' },
              { subject: dept.name, predicate: 'partOf', object: faculty.name_th, source: 'KU_Forest' },
            );
            for (const kw of expertise.slice(0, 5)) {
              allRelations.push({ subject: person.name, predicate: 'hasExpertise', object: kw, source: 'KU_Forest' });
            }

            // Publications
            const pubPage = await browser.newPage();
            try {
              await pubPage.goto(`${BASE}/OutputByPerson.aspx?ID=${person.id}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await delay(1500);
              const pubs = await getPublications(pubPage);

              for (const pub of pubs) {
                const key = pub.title.slice(0, 80);
                if (seenDocs.has(key)) continue;
                seenDocs.add(key);

                allDocs.push({
                  source: 'KU_Forest',
                  title: pub.title,
                  authors: [person.name],
                  year: pub.year,
                  url: `${BASE}/OutputByPerson.aspx?ID=${person.id}`,
                  topic_ids: [],
                  bcg_pillars: [],
                  keywords: expertise.slice(0, 5),
                  search_keyword: dept.name,
                  doc_type: pub.docType,
                  indexed_at: now,
                });

                allRelations.push({ subject: person.name, predicate: 'authored', object: pub.title.slice(0, 100), source: 'KU_Forest' });
              }
              console.log(`      ${person.name}: ${pubs.length} pubs`);
            } catch { console.log(`      ${person.name}: pubs failed`); }
            finally { await pubPage.close(); }

            // Projects
            const projPage = await browser.newPage();
            try {
              await projPage.goto(`${BASE}/ProjectByPerson.aspx?ID=${person.id}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
              await delay(1500);
              const projects = await getProjects(projPage);

              for (const proj of projects) {
                const key = proj.title.slice(0, 80);
                if (seenDocs.has(key)) continue;
                seenDocs.add(key);

                allDocs.push({
                  source: 'KU_Forest',
                  title: proj.title,
                  authors: [person.name],
                  year: proj.year,
                  url: `${BASE}/ProjectByPerson.aspx?ID=${person.id}`,
                  topic_ids: [],
                  bcg_pillars: [],
                  keywords: expertise.slice(0, 5),
                  search_keyword: dept.name,
                  doc_type: proj.role === 'หัวหน้าโครงการ' ? 'research_project_pi' : 'research_project',
                  funding: proj.funding || undefined,
                  indexed_at: now,
                });

                allRelations.push({
                  subject: person.name,
                  predicate: proj.role === 'หัวหน้าโครงการ' ? 'leadsProject' : 'participatesIn',
                  object: proj.title.slice(0, 100),
                  source: 'KU_Forest',
                });
              }
              console.log(`      ${person.name}: ${projects.length} projects`);
            } catch { console.log(`      ${person.name}: projects failed`); }
            finally { await projPage.close(); }

            await delay(DELAY_MS);
          }
        } catch (err) {
          console.warn(`    dept error: ${(err as Error).message.slice(0, 60)}`);
          try { await deptPage.close(); } catch {}
        }
      }
    } catch (err) {
      console.warn(`  faculty error: ${(err as Error).message.slice(0, 60)}`);
      try { await page.close(); } catch {}
    }
  }

  await browser.close();

  // Deduplicate relations
  const relSet = new Set<string>();
  const uniqueRelations = allRelations.filter(r => {
    const key = `${r.subject}|${r.predicate}|${r.object}`;
    if (relSet.has(key)) return false;
    relSet.add(key);
    return true;
  });

  console.log(`\n=== KU Forest Faculty Scrape Summary ===`);
  console.log(`  Researchers: ${allResearchers.length}`);
  console.log(`  Documents: ${allDocs.length}`);
  console.log(`  Relations: ${uniqueRelations.length}`);

  return { docs: allDocs, researchers: allResearchers, relations: uniqueRelations };
}

// ── CLI runner ───────────────────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'data');
scrapeKUForestFaculties()
  .then(({ docs, researchers, relations }) => {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'ku-forest-faculty-docs.json'), JSON.stringify(docs, null, 2));
    fs.writeFileSync(path.join(outDir, 'ku-forest-faculty-researchers.json'), JSON.stringify(researchers, null, 2));
    fs.writeFileSync(path.join(outDir, 'ku-forest-faculty-relations.json'), JSON.stringify(relations, null, 2));
    console.log(`\nSaved to ${outDir}/ku-forest-faculty-*.json`);
  })
  .catch((err) => { console.error(err); process.exit(1); });
