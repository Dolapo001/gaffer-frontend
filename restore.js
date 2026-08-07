const { execSync } = require('child_process');
try {
  execSync('git checkout lib/fantasyMockData.ts', { stdio: 'inherit' });
  console.log('Restored successfully');
} catch (e) {
  console.error('Failed to restore:', e.message);
}
