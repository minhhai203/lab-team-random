// Fisher–Yates with rejection sampling to avoid modulo bias.
function randomIndex(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  const value = new Uint32Array(1);
  do { crypto.getRandomValues(value); } while (value[0] >= limit);
  return value[0] % max;
}
export function shuffle(items, pick = randomIndex) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function draw(teams, topics, pick = randomIndex) {
  const shuffledTeams = shuffle(teams, pick);
  // Shuffle topic indices too: remainder slots are not biased toward the first topics.
  const order = shuffle(topics.map((_, i) => i), pick);
  const groups = topics.map((topic) => ({ topic, teams: [] }));
  shuffledTeams.forEach((team, i) => groups[order[i % topics.length]].teams.push(team));
  return groups;
}
export const lines = (text) => text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
