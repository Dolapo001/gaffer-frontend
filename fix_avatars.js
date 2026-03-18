const fs = require('fs');

let data = fs.readFileSync('lib/fantasyMockData.ts', 'utf8');

const getJersey = (teamCode, position) => {
  let teamId = 1;
  switch (teamCode) {
    case 'ENG': teamId = 13; break; // Man City
    case 'LAW': teamId = 1; break;  // Arsenal
    case 'MED': teamId = 14; break; // Liverpool
    case 'SCI': teamId = 6; break;  // Chelsea
    case 'BUS': teamId = 17; break; // Spurs (using 17 instead of 18)
    default: teamId = 1;
  }
  const isGk = position === 'GK';
  return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamId}${isGk ? '_1' : ''}-66.webp`;
};

// Replace avatarUrl for each player based on their teamCode and position.
// Actually it's easier to dynamically replace it if we parse, but regex is fine if we can match the block.

// Instead of regex on the whole, let's just use string replace. Or just replace avatarUrl with empty string.
data = data.replace(/avatarUrl:\s*['"][^'"]+['"]/g, "avatarUrl: ''");

fs.writeFileSync('lib/fantasyMockData.ts', data);
console.log('Done!');
