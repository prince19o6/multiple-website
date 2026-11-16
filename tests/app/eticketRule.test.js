const { describe, it } = require('node:test');
const assert = require('node:assert');

// Authoritative E-Ticket access evaluator
function evaluateETicketAccess(booking) {
  if (!booking || !booking.status) {
    return {
      canAccessETicket: false,
      badgeText: 'Unknown',
      badgeColor: '#64748b',
      qrVoucherUnlocked: false,
      actionButtonLabel: null
    };
  }

  const status = String(booking.status).trim().toLowerCase();

  switch (status) {
    case 'confirmed':
      return {
        canAccessETicket: true,
        badgeText: 'Confirmed',
        badgeColor: '#16a34a',
        qrVoucherUnlocked: true,
        actionButtonLabel: 'View E-Ticket & QR Voucher'
      };

    case 'pending':
      return {
        canAccessETicket: false,
        badgeText: 'Pending Approval',
        badgeColor: '#f59e0b',
        qrVoucherUnlocked: false,
        actionButtonLabel: 'Awaiting Operator Approval'
      };

    case 'cancelled':
      return {
        canAccessETicket: false,
        badgeText: 'Cancelled',
        badgeColor: '#ef4444',
        qrVoucherUnlocked: false,
        actionButtonLabel: null
      };

    case 'rejected':
      return {
        canAccessETicket: false,
        badgeText: 'Reservation Declined',
        badgeColor: '#ef4444',
        qrVoucherUnlocked: false,
        actionButtonLabel: null
      };

    case 'completed':
      return {
        canAccessETicket: true,
        badgeText: 'Trip Completed',
        badgeColor: '#3b82f6',
        qrVoucherUnlocked: false,
        actionButtonLabel: 'View Receipt & Trip Summary'
      };

    case 'expired':
    default:
      return {
        canAccessETicket: false,
        badgeText: 'Expired',
        badgeColor: '#94a3b8',
        qrVoucherUnlocked: false,
        actionButtonLabel: null
      };
  }
}

describe('E-Ticket & QR Voucher Access Rule', () => {
  it('unlocks E-Ticket and QR voucher strictly when booking is Confirmed', () => {
    const booking = {
      reference: 'GT-CONF-101',
      status: 'confirmed',
      guestName: 'Aarav Patel',
      totalPrice: 450
    };

    const access = evaluateETicketAccess(booking);
    assert.strictEqual(access.canAccessETicket, true);
    assert.strictEqual(access.qrVoucherUnlocked, true);
    assert.strictEqual(access.badgeText, 'Confirmed');
    assert.strictEqual(access.badgeColor, '#16a34a');
  });

  it('keeps E-Ticket locked when booking status is Pending', () => {
    const booking = {
      reference: 'GT-PEND-202',
      status: 'pending',
      guestName: 'Priya Shah'
    };

    const access = evaluateETicketAccess(booking);
    assert.strictEqual(access.canAccessETicket, false);
    assert.strictEqual(access.qrVoucherUnlocked, false);
    assert.strictEqual(access.badgeText, 'Pending Approval');
    assert.strictEqual(access.actionButtonLabel, 'Awaiting Operator Approval');
  });

  it('permanently disables E-Ticket when booking is Cancelled', () => {
    const booking = {
      reference: 'GT-CANC-303',
      status: 'cancelled',
      cancellationReason: 'Travel plans altered'
    };

    const access = evaluateETicketAccess(booking);
    assert.strictEqual(access.canAccessETicket, false);
    assert.strictEqual(access.qrVoucherUnlocked, false);
    assert.strictEqual(access.badgeText, 'Cancelled');
  });

  it('handles case-insensitivity in status safely', () => {
    const bookingUpper = { status: 'CONFIRMED' };
    const accessUpper = evaluateETicketAccess(bookingUpper);
    assert.strictEqual(accessUpper.canAccessETicket, true);

    const bookingMixed = { status: ' Pending ' };
    const accessMixed = evaluateETicketAccess(bookingMixed);
    assert.strictEqual(accessMixed.canAccessETicket, false);
  });
});

