// A topic is either a code/name alone or "code - name", "code: name" or "code | name".
// A hyphen without surrounding whitespace remains part of the code (e.g. B-01).
export function topicCode(value) {
  return value.split(/\s+[-–—]\s+|\s*[|:]\s*/u, 1)[0].trim();
}

function key(value) {
  return value.normalize('NFC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('vi');
}

export function duplicateEntries(text, extract = value => value) {
  const seen = new Map();
  text.split(/\r?\n/u).forEach((line, index) => {
    const entry = line.trim();
    if (!entry) return;
    const label = extract(entry);
    const normalized = key(label);
    if (!normalized) return;
    const found = seen.get(normalized);
    if (found) found.lines.push(index + 1);
    else seen.set(normalized, { label, lines: [index + 1] });
  });
  return [...seen.values()].filter(entry => entry.lines.length > 1);
}

export function validateLists(teams, topics) {
  return {
    teams: duplicateEntries(teams),
    topics: duplicateEntries(topics, topicCode)
  };
}
