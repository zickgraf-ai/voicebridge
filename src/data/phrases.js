export const CATEGORIES = [
  { id: 'smart', label: 'Smart', icon: '\u2728', color: '#8B5CF6' },
  { id: 'build', label: 'Build', icon: '\u{1F517}', color: '#F59E0B' },
  { id: 'quick', label: 'Quick', icon: '\u26A1', color: '#EAB308' },
  { id: 'medical', label: 'Med', icon: '\u{1F3E5}', color: '#EF4444' },
  { id: 'food', label: 'Food', icon: '\u{1F37D}\uFE0F', color: '#10B981' },
  { id: 'comfort', label: 'Comfort', icon: '\u{1F6CB}\uFE0F', color: '#3B82F6' },
  { id: 'people', label: 'People', icon: '\u{1F465}', color: '#EC4899' },
  { id: 'emotions', label: 'Feel', icon: '\u{1F4AD}', color: '#A855F7' },
];

export const CATEGORY_PHRASES = {
  quick: [
    { t: 'Yes', i: '\u2705' },
    { t: 'No', i: '\u274C' },
    { t: 'Maybe', i: '\u{1F914}' },
    { t: 'Please', i: '\u{1F64F}' },
    { t: 'Thank you', i: '\u{1F49B}' },
    { t: 'Help!', i: '\u{1F198}' },
    { t: 'Wait', i: '\u270B' },
    { t: 'Come here', i: '\u{1F44B}' },
    { t: 'Bathroom', i: '\u{1F6BB}' },
    { t: 'Repeat that', i: '\u{1F504}' },
    { t: 'Stop', i: '\u{1F6D1}' },
    { t: "Don't know", i: '\u{1F937}' },
  ],
  medical: [
    { t: 'My Info', i: '\u{1FAAA}', a: 'identity' },
    { t: "I'm in pain", i: '\u{1F534}', a: 'pain' },
    { t: 'Need medication', i: '\u{1F48A}' },
    { t: 'Call the doctor', i: '\u{1F4DE}' },
    { t: 'Feel nauseous', i: '\u{1F922}' },
    { t: 'I need ice', i: '\u{1F9CA}' },
    { t: 'Jaw feels stiff', i: '\u{1F623}' },
    { t: 'Hard to breathe', i: '\u{1F630}' },
    { t: 'Mouth rinse', i: '\u{1FAA5}' },
    { t: 'Swelling worse', i: '\u{1F61F}' },
    { t: 'I feel dizzy', i: '\u{1F4AB}' },
    { t: 'Pain is better', i: '\u{1F4C9}' },
  ],
  food: [
    { t: "I'm hungry", i: '\u{1F60B}' },
    { t: "I'm thirsty", i: '\u{1F4A7}' },
    { t: 'Water', i: '\u{1F4A7}' },
    { t: 'Ice water', i: '\u{1F9CA}' },
    { t: 'Smoothie', i: '\u{1F964}' },
    { t: 'Warm broth', i: '\u{1F35C}' },
    { t: 'Protein shake', i: '\u{1F95B}' },
    { t: 'Applesauce', i: '\u{1F34E}' },
    { t: 'Yogurt', i: '\u{1F963}' },
    { t: 'Juice', i: '\u{1F9C3}' },
    { t: 'Warm tea', i: '\u{1F375}' },
    { t: 'Ice cream', i: '\u{1F366}' },
    { t: 'Pudding', i: '\u{1F36E}' },
    { t: 'Soup', i: '\u{1F963}' },
    { t: 'Too hot', i: '\u{1F321}\uFE0F' },
    { t: 'Too cold', i: '\u2744\uFE0F' },
    { t: "I'm full", i: '\u270B' },
    { t: 'Not that', i: '\u{1F645}' },
  ],
  comfort: [
    { t: 'I need help', i: '\u{1F198}' },
    { t: 'Bathroom', i: '\u{1F6BB}' },
    { t: 'Adjust pillow', i: '\u{1F6CF}\uFE0F' },
    { t: "I'm cold", i: '\u{1F976}' },
    { t: "I'm hot", i: '\u{1F975}' },
    { t: 'Turn on TV', i: '\u{1F4FA}' },
    { t: 'Turn off lights', i: '\u{1F4A1}' },
    { t: 'Open window', i: '\u{1FA9F}' },
    { t: 'Blanket', i: '\u{1F9E3}' },
    { t: 'Sit me up', i: '\u{1FA91}' },
    { t: 'Heating pad', i: '\u2668\uFE0F' },
    { t: 'Want to walk', i: '\u{1F6B6}' },
  ],
  people: [
    { t: 'I love you', i: '\u2764\uFE0F' },
    { t: 'Thank you', i: '\u{1F64F}' },
    { t: 'Please stay', i: '\u{1F91D}' },
    { t: 'Need privacy', i: '\u{1F6AA}' },
    { t: 'Miss you', i: '\u{1F97A}' },
    { t: 'Come back soon', i: '\u{1F44B}' },
  ],
  emotions: [
    { t: "I'm scared", i: '\u{1F628}' },
    { t: 'Frustrated', i: '\u{1F624}' },
    { t: "I'm sad", i: '\u{1F622}' },
    { t: 'Feel better', i: '\u{1F60A}' },
    { t: 'Nauseous', i: '\u{1F922}' },
    { t: 'I love you', i: '\u2764\uFE0F' },
    { t: 'Grateful', i: '\u{1F979}' },
    { t: 'Bored', i: '\u{1F610}' },
    { t: 'Tired', i: '\u{1F634}' },
    { t: 'Anxious', i: '\u{1F630}' },
    { t: "I'm okay", i: '\u{1F44C}' },
    { t: 'Need a hug', i: '\u{1F917}' },
    { t: 'Leave me alone', i: '\u{1F645}' },
    { t: 'Hopeful', i: '\u{1F31F}' },
    { t: 'Lonely', i: '\u{1F614}' },
    { t: 'Embarrassed', i: '\u{1F633}' },
  ],
};

export const BUILDERS = {
  'I want': {
    i: '\u{1F449}',
    s: [
      { t: 'water', i: '\u{1F4A7}' },
      { t: 'ice water', i: '\u{1F9CA}' },
      { t: 'a smoothie', i: '\u{1F964}' },
      { t: 'broth', i: '\u{1F35C}' },
      { t: 'protein shake', i: '\u{1F95B}' },
      { t: 'yogurt', i: '\u{1F963}' },
      { t: 'applesauce', i: '\u{1F34E}' },
      { t: 'juice', i: '\u{1F9C3}' },
      { t: 'warm tea', i: '\u{1F375}' },
      { t: 'ice cream', i: '\u{1F366}' },
      { t: 'pudding', i: '\u{1F36E}' },
      { t: 'soup', i: '\u{1F963}' },
      { t: 'to rest', i: '\u{1F634}' },
      { t: 'to watch TV', i: '\u{1F4FA}' },
      { t: 'my phone', i: '\u{1F4F1}' },
      { t: 'a blanket', i: '\u{1F9E3}' },
      { t: 'a hug', i: '\u{1F917}' },
      { t: 'to go outside', i: '\u{1F333}' },
    ],
  },
  'I need': {
    i: '\u{1F198}',
    s: [
      { t: 'water', i: '\u{1F4A7}' },
      { t: 'medication', i: '\u{1F48A}' },
      { t: 'ice', i: '\u{1F9CA}' },
      { t: 'help', i: '\u{1F198}' },
      { t: 'the bathroom', i: '\u{1F6BB}' },
      { t: 'mouth rinse', i: '\u{1FAA5}' },
      { t: 'a tissue', i: '\u{1F927}' },
      { t: 'pillow adjusted', i: '\u{1F6CF}\uFE0F' },
      { t: 'pain relief', i: '\u{1F623}' },
      { t: 'to spit', i: '\u{1F6B0}' },
      { t: 'heating pad', i: '\u2668\uFE0F' },
      { t: 'to sit up', i: '\u{1FA91}' },
      { t: 'privacy', i: '\u{1F6AA}' },
      { t: 'the nurse', i: '\u{1F469}\u200D\u2695\uFE0F' },
      { t: 'the doctor', i: '\u{1F468}\u200D\u2695\uFE0F' },
    ],
  },
  'I feel': {
    i: '\u{1F4AD}',
    s: [
      { t: 'pain', i: '\u{1F534}' },
      { t: 'better', i: '\u{1F60A}' },
      { t: 'nauseous', i: '\u{1F922}' },
      { t: 'dizzy', i: '\u{1F4AB}' },
      { t: 'cold', i: '\u{1F976}' },
      { t: 'hot', i: '\u{1F975}' },
      { t: 'scared', i: '\u{1F628}' },
      { t: 'frustrated', i: '\u{1F624}' },
      { t: 'tired', i: '\u{1F634}' },
      { t: 'anxious', i: '\u{1F630}' },
      { t: 'hungry', i: '\u{1F60B}' },
      { t: 'grateful', i: '\u{1F979}' },
    ],
  },
  'Please call': {
    i: '\u{1F4DE}',
    s: [
      { t: 'Jeff', i: '\u{1F468}' },
      { t: 'Mom', i: '\u{1F469}' },
      { t: 'Emily', i: '\u{1F469}\u200D\u{1F9B0}' },
      { t: 'Dr. Martinez', i: '\u{1F468}\u200D\u2695\uFE0F' },
      { t: 'Nurse Kim', i: '\u{1F469}\u200D\u2695\uFE0F' },
      { t: 'my friend', i: '\u{1F464}' },
    ],
  },
  'Can you': {
    i: '\u{1F64F}',
    s: [
      { t: 'get me water', i: '\u{1F4A7}' },
      { t: 'adjust pillow', i: '\u{1F6CF}\uFE0F' },
      { t: 'turn on TV', i: '\u{1F4FA}' },
      { t: 'turn off light', i: '\u{1F4A1}' },
      { t: 'open window', i: '\u{1FA9F}' },
      { t: 'get a blanket', i: '\u{1F9E3}' },
      { t: 'help me sit up', i: '\u{1FA91}' },
      { t: 'close the door', i: '\u{1F6AA}' },
      { t: 'get the nurse', i: '\u{1F469}\u200D\u2695\uFE0F' },
    ],
  },
};

export const LOCATION_PHRASES = {
  hotel: [
    { t: 'When is checkout?', i: '\u{1F3E8}' },
    { t: 'Room service please', i: '\u{1F6CE}\uFE0F' },
    { t: 'Need extra towels', i: '\u{1F9F4}' },
    { t: 'Wi-Fi password?', i: '\u{1F4F6}' },
    { t: 'Key card not working', i: '\u{1F5DD}\uFE0F' },
    { t: 'Where is the elevator?', i: '\u{1F6D7}' },
    { t: 'When is breakfast?', i: '\u{1F95E}' },
    { t: 'Late checkout please', i: '\u{1F553}' },
    { t: 'Need extra pillows', i: '\u{1F6CF}\uFE0F' },
  ],
  hospital: [
    { t: 'When can I go home?', i: '\u{1F3E0}' },
    { t: 'I need the nurse', i: '\u{1F469}\u200D\u2695\uFE0F' },
    { t: 'When is the doctor coming?', i: '\u{1F468}\u200D\u2695\uFE0F' },
    { t: 'Any test results?', i: '\u{1F4CB}' },
    { t: 'IV hurts', i: '\u{1F489}' },
    { t: 'Can I have visitors?', i: '\u{1F465}' },
    { t: 'I need the bedpan', i: '\u{1F6BD}' },
    { t: 'Call button please', i: '\u{1F514}' },
    { t: 'Discharge papers?', i: '\u{1F4C4}' },
  ],
  home: [
    { t: 'Can you make food?', i: '\u{1F373}' },
    { t: 'I want to go outside', i: '\u{1F333}' },
    { t: 'Bring my phone', i: '\u{1F4F1}' },
    { t: 'Help me shower', i: '\u{1F6BF}' },
    { t: 'Help me to bed', i: '\u{1F6CF}\uFE0F' },
    { t: 'Turn on the AC', i: '\u2744\uFE0F' },
    { t: 'Turn on the heat', i: '\u{1F525}' },
    { t: 'Laundry please', i: '\u{1F9FA}' },
    { t: 'Open the door', i: '\u{1F6AA}' },
  ],
  restaurant: [
    { t: 'Can I see the menu?', i: '\u{1F4D6}' },
    { t: 'I need soft food', i: '\u{1F35C}' },
    { t: 'I need a straw', i: '\u{1F964}' },
    { t: 'Where is the restroom?', i: '\u{1F6BB}' },
    { t: 'Check please', i: '\u{1F4B3}' },
    { t: 'I have dietary restrictions', i: '\u26A0\uFE0F' },
    { t: 'Can this be blended?', i: '\u{1F964}' },
    { t: 'More water please', i: '\u{1F4A7}' },
    { t: 'Something cold to drink', i: '\u{1F9CA}' },
  ],
  therapy: [
    { t: 'Show me the exercises', i: '\u{1F4AA}' },
    { t: 'That hurts', i: '\u{1F61F}' },
    { t: 'I need a break', i: '\u270B' },
    { t: 'How many reps?', i: '\u{1F522}' },
    { t: 'Am I making progress?', i: '\u{1F4C8}' },
    { t: 'Show me again', i: '\u{1F504}' },
    { t: 'When is next appointment?', i: '\u{1F4C5}' },
    { t: 'Too fast', i: '\u{1F6D1}' },
    { t: 'Can I do this at home?', i: '\u{1F3E0}' },
  ],
  doctor: [
    { t: 'How is my recovery?', i: '\u{1F4CA}' },
    { t: 'When can I eat solid food?', i: '\u{1F37D}\uFE0F' },
    { t: 'Can I stop this medication?', i: '\u{1F48A}' },
    { t: 'I have a new symptom', i: '\u{1F6A8}' },
    { t: 'When is my follow-up?', i: '\u{1F4C5}' },
    { t: 'Can I get a work note?', i: '\u{1F4DD}' },
    { t: 'Is this normal?', i: '\u2753' },
    { t: 'Any restrictions?', i: '\u26A0\uFE0F' },
    { t: 'How long until healed?', i: '\u{1F552}' },
  ],
  pharmacy: [
    { t: 'Picking up prescription', i: '\u{1F48A}' },
    { t: 'I need a refill', i: '\u{1F504}' },
    { t: 'Is there a liquid form?', i: '\u{1F9C3}' },
    { t: 'Any side effects?', i: '\u26A0\uFE0F' },
    { t: 'Is there a generic?', i: '\u{1F4B2}' },
    { t: 'How do I take this?', i: '\u2753' },
    { t: 'Insurance question', i: '\u{1F4C4}' },
    { t: 'Can I crush this pill?', i: '\u{1F48A}' },
  ],
  store: [
    { t: 'Help reaching something', i: '\u{1F44B}' },
    { t: 'Where are soft foods?', i: '\u{1F35C}' },
    { t: 'I need to sit down', i: '\u{1FA91}' },
    { t: 'Can you carry this?', i: '\u{1F6D2}' },
    { t: 'Where is the restroom?', i: '\u{1F6BB}' },
    { t: 'Is there a wheelchair?', i: '\u267F' },
    { t: 'I need assistance', i: '\u{1F198}' },
  ],
  car: [
    { t: 'I need a break', i: '\u270B' },
    { t: 'Please pull over', i: '\u{1F6D1}' },
    { t: 'Turn up the AC', i: '\u2744\uFE0F' },
    { t: 'I feel car sick', i: '\u{1F922}' },
    { t: 'How much longer?', i: '\u{1F552}' },
    { t: 'Stop for water', i: '\u{1F4A7}' },
    { t: 'Drive slower please', i: '\u{1F697}' },
    { t: 'Roll down window', i: '\u{1FA9F}' },
  ],
};

export const LOCATION_BUILDERS = {
  hotel: {
    'Can I get': {
      i: '\u{1F6CE}\uFE0F',
      s: [
        { t: 'room service', i: '\u{1F37D}\uFE0F' },
        { t: 'extra towels', i: '\u{1F9F4}' },
        { t: 'late checkout', i: '\u{1F553}' },
        { t: 'the Wi-Fi password', i: '\u{1F4F6}' },
        { t: 'a wake-up call', i: '\u23F0' },
        { t: 'extra pillows', i: '\u{1F6CF}\uFE0F' },
        { t: 'an extra blanket', i: '\u{1F9E3}' },
        { t: 'my bill', i: '\u{1F4B3}' },
      ],
    },
  },
  hospital: {
    'Can I get': {
      i: '\u{1F3E5}',
      s: [
        { t: 'another blanket', i: '\u{1F9E3}' },
        { t: 'ice chips', i: '\u{1F9CA}' },
        { t: 'the call button', i: '\u{1F514}' },
        { t: 'discharge papers', i: '\u{1F4C4}' },
        { t: 'a warm blanket', i: '\u2668\uFE0F' },
      ],
    },
  },
  restaurant: {
    'Can I get': {
      i: '\u{1F37D}\uFE0F',
      s: [
        { t: 'a straw', i: '\u{1F964}' },
        { t: 'this blended', i: '\u{1F964}' },
        { t: 'the check', i: '\u{1F4B3}' },
        { t: 'more water', i: '\u{1F4A7}' },
        { t: 'something soft', i: '\u{1F35C}' },
        { t: 'no ice', i: '\u{1F9CA}' },
      ],
    },
  },
};

export const TAB_SIZES = {
  normal: { h: 50, minW: 52, icon: 18, label: 11, pad: '4px 10px', gap: 2, radius: 10 },
  large: { h: 64, minW: 70, icon: 24, label: 13, pad: '6px 14px', gap: 3, radius: 12 },
  xl: { h: 80, minW: 88, icon: 32, label: 16, pad: '8px 18px', gap: 4, radius: 14 },
};

// Flattened, deduplicated list of all standard phrase texts for TTS pre-caching
export const ALL_STANDARD_PHRASES = (() => {
  const seen = new Set();
  const result = [];

  // Category phrases
  for (const phrases of Object.values(CATEGORY_PHRASES)) {
    for (const p of phrases) {
      if (!seen.has(p.t)) {
        seen.add(p.t);
        result.push(p.t);
      }
    }
  }

  // Builder starters + sub-phrases (composed)
  for (const [starter, data] of Object.entries(BUILDERS)) {
    for (const sub of data.s) {
      const composed = starter + ' ' + sub.t;
      if (!seen.has(composed)) {
        seen.add(composed);
        result.push(composed);
      }
    }
  }

  // Location phrases
  for (const phrases of Object.values(LOCATION_PHRASES)) {
    for (const p of phrases) {
      if (!seen.has(p.t)) {
        seen.add(p.t);
        result.push(p.t);
      }
    }
  }

  // Location builder composed phrases
  for (const locBuilders of Object.values(LOCATION_BUILDERS)) {
    for (const [starter, data] of Object.entries(locBuilders)) {
      for (const sub of data.s) {
        const composed = starter + ' ' + sub.t;
        if (!seen.has(composed)) {
          seen.add(composed);
          result.push(composed);
        }
      }
    }
  }

  // Pain scale phrases
  for (let i = 1; i <= 10; i++) {
    const painPhrase = 'My pain is ' + i + ' out of 10';
    if (!seen.has(painPhrase)) {
      seen.add(painPhrase);
      result.push(painPhrase);
    }
  }

  return result;
})();
