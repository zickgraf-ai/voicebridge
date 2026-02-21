export function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export const SMART_PHRASES = {
  morning: [
    { t: 'Good morning', i: '\u2600\uFE0F' },
    { t: 'Need medication', i: '\u{1F48A}' },
    { t: "I'm thirsty", i: '\u{1F4A7}' },
    { t: 'Bathroom', i: '\u{1F6BB}' },
    { t: 'I need ice', i: '\u{1F9CA}' },
    { t: "Didn't sleep well", i: '\u{1F634}' },
    { t: "I'm in pain", i: '\u{1F534}', a: 'pain' },
    { t: 'I want a smoothie', i: '\u{1F964}' },
    { t: 'My Info', i: '\u{1FAAA}', a: 'identity' },
  ],
  afternoon: [
    { t: "I'm in pain", i: '\u{1F534}', a: 'pain' },
    { t: 'Medication time', i: '\u{1F48A}' },
    { t: "I'm thirsty", i: '\u{1F4A7}' },
    { t: 'Bathroom', i: '\u{1F6BB}' },
    { t: 'I want broth', i: '\u{1F35C}' },
    { t: 'Need to rest', i: '\u{1F634}' },
    { t: 'Feeling better', i: '\u{1F60A}' },
    { t: 'I need ice', i: '\u{1F9CA}' },
    { t: 'My Info', i: '\u{1FAAA}', a: 'identity' },
  ],
  evening: [
    { t: 'Evening meds', i: '\u{1F48A}' },
    { t: "I'm thirsty", i: '\u{1F4A7}' },
    { t: 'Bathroom', i: '\u{1F6BB}' },
    { t: 'I want a shake', i: '\u{1F964}' },
    { t: 'Watch TV', i: '\u{1F4FA}' },
    { t: 'Adjust pillow', i: '\u{1F6CF}\uFE0F' },
    { t: 'Mouth rinse', i: '\u{1FAA5}' },
    { t: "I'm in pain", i: '\u{1F534}', a: 'pain' },
    { t: 'My Info', i: '\u{1FAAA}', a: 'identity' },
  ],
};
