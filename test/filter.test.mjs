import test from "node:test";
import assert from "node:assert/strict";
import { filterTargetListings, isTargetListing } from "../src/filter.mjs";

const terms = ["garage", "garagebox", "garage-box", "autobox", "garage-unit"];

test("accepteert een garagebox in Heemstede", () => {
  assert.equal(isTargetListing({ text: "Heemstede\nGaragebox\n€ 110" }, "Heemstede", terms), true);
});

test("weigert een gewone woning in Heemstede", () => {
  assert.equal(isTargetListing({ text: "Heemstede\nTussenwoning\n3 kamers" }, "Heemstede", terms), false);
});

test("weigert een garage buiten Heemstede", () => {
  assert.equal(isTargetListing({ text: "Haarlem\nGaragebox" }, "Heemstede", terms), false);
});

test("weigert parkeerplaats en parkeergarage zonder expliciet garagewoord", () => {
  assert.equal(isTargetListing({ text: "Heemstede\nParkeerplaats" }, "Heemstede", terms), false);
  assert.equal(isTargetListing({ text: "Heemstede\nPlek in parkeergarage" }, "Heemstede", terms), false);
});

test("dedupliceert dezelfde publicatie-id", () => {
  const found = filterTargetListings([
    { id: "42", text: "Heemstede Garagebox", url: "a" },
    { id: "42", text: "Heemstede Garagebox", url: "a" }
  ], "Heemstede", terms);
  assert.equal(found.length, 1);
});
