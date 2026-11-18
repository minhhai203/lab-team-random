// Each input line is the topic identifier; never derive a code from its shuffled position.
export function teamAssignments(groups, revealed = groups.length) {
  return groups.slice(0, revealed).flatMap(({topic, teams}) => teams.map(team => ({team, topic})));
}
// The needle begins at the centre of item zero and crosses the next boundary half a card later.
export function itemUnderNeedle(distance, itemWidth) {
  return Math.floor((distance + itemWidth / 2) / itemWidth);
}
