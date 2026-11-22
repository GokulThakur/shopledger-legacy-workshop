'use strict';

var test = require('node:test');
var assert = require('node:assert/strict');
var pricing = require('../lib/pricing');
var invoice = require('../lib/invoice');
var reports = require('../lib/reports');

test('CURRENT BEHAVIOUR: order pricing applies the HSN slab to the discounted taxable amount', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 2000, qty: 1 }];
  var totals = pricing.computeTotals(items, 'SAVE10');

  assert.equal(totals.subtotal, 2000);
  assert.equal(totals.discount, 150); // SAVE10 is capped at ₹150.
  assert.equal(totals.taxable, 1850);
  assert.equal(totals.tax, 92.5); // HSN 1006 is 5%.
  assert.equal(totals.cgst, 46.25);
  assert.equal(totals.sgst, 46.25);
  assert.equal(totals.total, 1942.5);
});

test('invoice uses the same HSN slab and capped pre-tax coupon discount as order pricing', function () {
  var order = {
    id: 1001,
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Rice', sku: 'RICE-1', hsn: '1006', price: 2000, qty: 1 }]
  };
  var figures = invoice.computeInvoiceFigures(order);

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, 92.5);
  assert.equal(figures.discount, 150);
  assert.equal(figures.cgst, 46.25);
  assert.equal(figures.sgst, 46.25);
  assert.equal(figures.total, 1942.5);
});

test('invoice and order pricing agree for the same SAVE10 order', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 2000, qty: 1 }];
  var totals = pricing.computeTotals(items, 'SAVE10');
  var figures = invoice.computeInvoiceFigures({ coupon: 'SAVE10', items: items });

  assert.equal(totals.total, 1942.5);
  assert.equal(figures.total, totals.total);
  assert.equal(figures.tax, totals.tax);
  assert.equal(figures.discount, totals.discount);
});

test('GST reconciliation reports matching invoice and ledger figures after billing', function () {
  var order = {
    id: 1001,
    date: '01/01/2022',
    customer: 'In-memory customer',
    coupon: 'SAVE10',
    items: [{ id: 1, name: 'Rice', hsn: '1006', price: 2000, qty: 1 }],
    subtotal: 2000,
    discount: 150,
    tax: 92.5,
    total: 1942.5
  };
  var reconciliation = reports.getGstReconciliation({ orders: [order] });

  assert.equal(reconciliation.totalChecked, 1);
  assert.equal(reconciliation.mismatchCount, 0);
  assert.equal(reconciliation.rows[0].invoiceTax, 92.5);
  assert.equal(reconciliation.rows[0].invoiceTotal, 1942.5);
  assert.equal(reconciliation.rows[0].delta, 0);
  assert.equal(reconciliation.rows[0].matched, true);
});

test('invoice GST and total match the amounts recorded when the order is billed', function () {
  var items = [{ id: 1, name: 'Rice', hsn: '1006', price: 2000, qty: 1 }];
  var billed = pricing.computeTotals(items, 'SAVE10');
  var figures = invoice.computeInvoiceFigures({
    coupon: 'SAVE10',
    items: items,
    subtotal: billed.subtotal,
    discount: billed.discount,
    tax: billed.tax,
    total: billed.total
  });

  assert.equal(figures.rows[0].gstPercent, 5);
  assert.equal(figures.tax, billed.tax);
  assert.equal(figures.cgst, billed.cgst);
  assert.equal(figures.sgst, billed.sgst);
  assert.equal(figures.discount, billed.discount);
  assert.equal(figures.total, billed.total);

  var html = invoice.render({ id: 1001, coupon: 'SAVE10', items: items, total: billed.total });
  assert.match(html, /<td>CGST<\/td><td class="r">₹46\.25<\/td>/);
  assert.match(html, /<td>SGST<\/td><td class="r">₹46\.25<\/td>/);
  assert.match(html, /₹1942\.50/);
});
