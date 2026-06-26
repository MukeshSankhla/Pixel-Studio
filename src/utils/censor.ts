const BANNED_WORDS = [
  'hate', 'abuse', 'harass', 'bully', 'idiot', 'stupid', 'kill', 'die', 'jerk', 'fool', 'trash',
  'bitch', 'asshole', 'fuck', 'shit', 'crap', 'bastard', 'loser', 'suck', 'dummy', 'moron', 'retard'
];

export function censorText(text: string): string {
  if (!text) return text;
  let censored = text;
  BANNED_WORDS.forEach(word => {
    // Regex using word boundaries (\b) and case insensitivity (i) to match exact words
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    censored = censored.replace(regex, (match) => '*'.repeat(match.length));
  });
  return censored;
}
