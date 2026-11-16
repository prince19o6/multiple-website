const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

function loadFixture(filename) {
  const file = path.join(fixturesDir, filename);
  const content = fs.readFileSync(file, 'utf8');
  return JSON.parse(content);
}

describe('Site Config Fixtures Suite', () => {
  it('validates GujjuTours fixture contract', () => {
    const config = loadFixture('gujjutours.config.json');
    assert.strictEqual(config.site.id, 'gujjutours');
    assert.strictEqual(config.site.name, 'Gujju Tours');
    assert.strictEqual(config.site.currency, 'USD');
    assert.strictEqual(config.theme.primary, '#2882c5');
    assert.ok(Array.isArray(config.modules));
    assert.ok(config.modules.some((m) => m.id === 'tours' && m.enabled));
  });

  it('validates TripGoAsia fixture contract', () => {
    const config = loadFixture('tripgoasia.config.json');
    assert.strictEqual(config.site.id, 'tripgoasia');
    assert.strictEqual(config.site.name, 'TripGo Asia');
    assert.strictEqual(config.site.currency, 'USD');
    assert.strictEqual(config.theme.primary, '#FF932C');
    assert.ok(Array.isArray(config.modules));
    assert.ok(config.modules.some((m) => m.id === 'hotels' && m.enabled));
  });

  it('validates Technoheaven fixture contract', () => {
    const config = loadFixture('technoheaven.config.json');
    assert.strictEqual(config.site.id, 'technoheaven');
    assert.strictEqual(config.site.name, 'Technoheaven');
    assert.strictEqual(config.site.currency, 'USD');
    assert.strictEqual(config.theme.primary, '#00aacf');
    assert.ok(Array.isArray(config.modules));
    assert.ok(config.modules.some((m) => m.id === 'visas' && m.enabled));
  });

  it('validates sample catalog tours fixture', () => {
    const tours = loadFixture('sample-tours.json');
    assert.ok(Array.isArray(tours));
    assert.strictEqual(tours.length, 2);
    assert.strictEqual(tours[0].tourNumericId, 101);
    assert.strictEqual(tours[0].Title, 'Desert Safari with BBQ Dinner');
  });
});

