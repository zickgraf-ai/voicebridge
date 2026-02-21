// Known quality voice names (partial match on lowercase)
const QUALITY_NAMES = [
  'samantha', 'siri', 'alex', 'karen', 'daniel',
  'moira', 'tessa', 'fiona', 'victoria', 'ava',
  'zoe', 'nicky', 'google', 'allison', 'tom',
  'susan', 'evan', 'joelle', 'premium', 'enhanced',
];

// Known bad / novelty / robotic voices to always exclude
const BAD_VOICES = [
  'albert', 'bad news', 'bahh', 'bells', 'boing',
  'bruce', 'bubbles', 'cellos', 'eddy', 'flo',
  'fred', 'good news', 'grandma', 'grandpa', 'junior',
  'kathy', 'organ', 'ralph', 'reed', 'rocko',
  'sandy', 'shelley', 'superstar', 'trinoids', 'whisper',
  'wobble', 'zarvox', 'espeak', 'mbrola', 'microsoft',
];

export function filterVoices(allVoices) {
  const english = allVoices.filter((v) => v.lang.startsWith('en'));

  // First: try quality names only
  const quality = english.filter((v) => {
    const name = v.name.toLowerCase();
    return QUALITY_NAMES.some((q) => name.includes(q));
  });

  if (quality.length > 0) return quality;

  // Fallback: all English minus known-bad voices
  const cleaned = english.filter((v) => {
    const name = v.name.toLowerCase();
    return !BAD_VOICES.some((b) => name.includes(b));
  });

  return cleaned.length > 0 ? cleaned : english;
}
