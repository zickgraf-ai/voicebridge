export function getIdentityPhrase(profile) {
  const parts = [];
  if (profile.name) parts.push('My name is ' + profile.name);
  if (profile.dob) parts.push('Date of birth ' + profile.dob);
  if (profile.address) parts.push('Address ' + profile.address);
  return parts.join('. ') + '.';
}
