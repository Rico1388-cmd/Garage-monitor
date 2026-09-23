function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function containsWholeTerm(text, term) {
  const normalizedText = normalizeText(text);
  const normalizedTerm = normalizeText(term);
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(normalizedTerm)}([^a-z0-9]|$)`, "i");
  return pattern.test(normalizedText);
}

export function isTargetListing(listing, targetCity, garageTerms) {
  const text = normalizeText(listing.text);
  const isCity = containsWholeTerm(text, targetCity);
  const isGarage = garageTerms.some((term) => containsWholeTerm(text, term));
  return isCity && isGarage;
}

export function filterTargetListings(listings, targetCity, garageTerms) {
  const unique = new Map();
  for (const listing of listings) {
    if (listing?.id && isTargetListing(listing, targetCity, garageTerms)) {
      unique.set(String(listing.id), { ...listing, id: String(listing.id) });
    }
  }
  return [...unique.values()];
}
