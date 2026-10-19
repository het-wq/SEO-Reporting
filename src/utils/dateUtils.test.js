import {
  formatPeriod,
  parsePeriod,
  getPreviousPeriod,
  getNextPeriod,
  formatPeriodComparison,
  calculatePercentageChange,
  formatPercentage,
} from './dateUtils.js';

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log('Testing dateUtils...');

// 1. September 2026 -> August 2026
const sep2026 = parsePeriod('September 2026');
assert(sep2026.year === 2026, 'Sep year should be 2026');
assert(sep2026.month === 9, 'Sep month should be 9');
assert(sep2026.label === 'September 2026', 'Sep label should be "September 2026"');
assert(sep2026.key === '2026-09', 'Sep key should be "2026-09"');

const aug2026 = getPreviousPeriod(sep2026);
assert(aug2026.year === 2026, 'Aug year should be 2026');
assert(aug2026.month === 8, 'Aug month should be 8');
assert(aug2026.label === 'August 2026', 'Aug label should be "August 2026"');

assert(
  formatPeriodComparison('September 2026') === 'September 2026 vs August 2026',
  'Comparison for September 2026 should be "September 2026 vs August 2026"'
);

// 2. October 2026 -> September 2026
const oct2026 = parsePeriod('October 2026');
const prevOct = getPreviousPeriod(oct2026);
assert(prevOct.label === 'September 2026', 'Prev of Oct 2026 should be September 2026');
assert(
  formatPeriodComparison('October 2026') === 'October 2026 vs September 2026',
  'Comparison for October 2026 should be "October 2026 vs September 2026"'
);

// 3. January 2027 -> December 2026 (Year transition test)
const jan2027 = parsePeriod('January 2027');
assert(jan2027.year === 2027 && jan2027.month === 1, 'Jan 2027 parsing');
const dec2026 = getPreviousPeriod(jan2027);
assert(dec2026.year === 2026, 'Dec year should be 2026');
assert(dec2026.month === 12, 'Dec month should be 12');
assert(dec2026.label === 'December 2026', 'Dec label should be "December 2026"');
assert(
  formatPeriodComparison('January 2027') === 'January 2027 vs December 2026',
  'Comparison for January 2027 should be "January 2027 vs December 2026"'
);

// 4. Various input formats
const fromKey = parsePeriod('2026-09');
assert(fromKey.label === 'September 2026', 'Parse 2026-09');

const fromId = parsePeriod('boulder-decision-sep-2026');
assert(fromId.label === 'September 2026', 'Parse boulder-decision-sep-2026');

// 5. Percentage calculations
assert(calculatePercentageChange(1629, 2350) === -30.68, 'Traffic change %');
assert(calculatePercentageChange(469, 723) === -35.13, 'Organic traffic change %');
assert(calculatePercentageChange(100, 100) === 0, 'Equal values = 0%');
assert(calculatePercentageChange(50, 0) === 100, '0 -> 50 = 100%');
assert(calculatePercentageChange(null, 100) === null, 'Missing current = null');
assert(calculatePercentageChange(100, null) === null, 'Missing previous = null');

console.log('All dateUtils tests passed successfully!');
