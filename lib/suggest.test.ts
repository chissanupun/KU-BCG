import test from "node:test";
import assert from "node:assert/strict";
import { normalize, suggest, type Suggestion } from "./suggest";

const index: Suggestion[] = [
  { text: "การประเมิน Carbon Footprint ของข้าว", kind: "title" },
  { text: "Carbon Footprint", kind: "topic" },
  { text: "carbon footprint", kind: "keyword" },
  { text: "คาร์บอนฟุตพริ้นท์รายบุคคล", kind: "course" },
  { text: "ชีวมวล", kind: "topic" },
  { text: "การลดคาร์บอนในนาข้าว", kind: "title" },
  { text: "Café culture", kind: "title" },
  { text: "Microplastics 101", kind: "course" },
];
const texts = (q: string, limit?: number) => suggest(index, q, limit).map((s) => s.text);

test("ranks prefix, then word start, then middle; ties by kind then length", () => {
  assert.deepEqual(texts("carbon"), [
    "Carbon Footprint",            // prefix, topic
    "การประเมิน Carbon Footprint ของข้าว", // word start (after a space)
  ]);
  assert.deepEqual(texts("คาร์บอน"), ["คาร์บอนฟุตพริ้นท์รายบุคคล", "การลดคาร์บอนในนาข้าว"]); // prefix, then middle of an unspaced Thai title
});

test("an NFD query matches like its NFC form", () => {
  assert.deepEqual(texts("café"), ["Café culture"]);
  assert.equal(normalize("café"), normalize("café"));
});

test("fewer than 2 characters suggests nothing", () => {
  assert.deepEqual(texts("c"), []);
  assert.deepEqual(texts("  c "), []);
  assert.deepEqual(texts(""), []);
});

test("duplicates that differ only in case appear once, keeping the higher-ranked kind", () => {
  const got = suggest(index, "carbon footprint").filter((s) => normalize(s.text) === "carbon footprint");
  assert.deepEqual(got, [{ text: "Carbon Footprint", kind: "topic" }]);
});

test("limit is respected and a miss returns an empty list", () => {
  assert.equal(texts("a", 1).length, 0);
  assert.equal(suggest(index, "การ", 2).length, 2);
  assert.deepEqual(texts("zzzzzz"), []);
});
