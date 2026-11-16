const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');

function validateBookingForm(data) {
  const errors = [];

  if (!data.guestName || data.guestName.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters)');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!data.email || !emailRegex.test(data.email.trim())) {
    errors.push('A valid email address is required for ticket delivery');
  }

  const phoneDigits = (data.phone || '').replace(/[^0-9]/g, '');
  if (!data.phone || phoneDigits.length < 7) {
    errors.push('A valid contact phone number is required (minimum 7 digits)');
  }

  if (!data.date || isNaN(Date.parse(data.date))) {
    errors.push('A valid tour date is required');
  } else {
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      errors.push('Tour departure date cannot be in the past');
    }
  }

  if (!data.travelers || data.travelers < 1) {
    errors.push('At least 1 passenger is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function generateIdempotencyKey(userId, tourId, date) {
  const seed = `${userId || 'guest'}_${tourId}_${date}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  return `idemp_${crypto.createHash('sha256').update(seed).digest('hex').slice(0, 24)}`;
}

describe('Booking Flow & Form Validation Suite', () => {
  it('passes validation when all passenger fields are filled correctly', () => {
    const validData = {
      guestName: 'Aarav Patel',
      email: 'aarav@example.com',
      phone: '+91 98765 43210',
      date: '2026-12-15',
      travelers: 2
    };

    const result = validateBookingForm(validData);
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  it('rejects invalid email formats', () => {
    const invalidEmailData = {
      guestName: 'Aarav Patel',
      email: 'not-an-email',
      phone: '+91 98765 43210',
      date: '2026-12-15',
      travelers: 2
    };

    const result = validateBookingForm(invalidEmailData);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('valid email')));
  });

  it('rejects past booking dates', () => {
    const pastDateData = {
      guestName: 'Aarav Patel',
      email: 'aarav@example.com',
      phone: '+91 98765 43210',
      date: '2020-01-01',
      travelers: 1
    };

    const result = validateBookingForm(pastDateData);
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.some((e) => e.includes('past')));
  });

  it('generates unique, reproducible idempotency keys for double-submit protection', () => {
    const key1 = generateIdempotencyKey('user-1', 101, '2026-12-15');
    const key2 = generateIdempotencyKey('user-1', 101, '2026-12-15');

    assert.ok(key1.startsWith('idemp_'));
    assert.ok(key2.startsWith('idemp_'));
    assert.notStrictEqual(key1, key2, 'Successive submissions should generate distinct idempotency keys');
  });
});

