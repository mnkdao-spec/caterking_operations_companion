import { describe, it, expect } from 'vitest';
import { parseInvoiceText } from '../lib/ocr-helpers';

describe('OCR Parsing Logic', () => {
  it('should parse standard line items', () => {
    const text = `Sysco Food Services
Beef Ribeye 4 @ 125.00 500.00
Total 500.00`;
    const result = parseInvoiceText(text);
    
    expect(result.items.length).toBe(1);
    expect(result.items[0].description).toBe("Beef Ribeye");
    expect(result.items[0].quantity).toBe(4);
    expect(result.items[0].unitPrice).toBe(125.00);
    expect(result.total).toBe(500.00);
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  it('should handle different quantity markers (x instead of @)', () => {
    const text = `US Foods
Salmon Fillet 10 x 15.00 150.00
Grand Total 150.00`;
    const result = parseInvoiceText(text);
    
    expect(result.items[0].description).toBe("Salmon Fillet");
    expect(result.items[0].quantity).toBe(10);
    expect(result.items[0].unitPrice).toBe(15.00);
    expect(result.total).toBe(150.00);
  });

  it('should calculate total from items if grand total is missing', () => {
    const text = `Produce Express
Apples 5 @ 2.00 10.00
Oranges 2 @ 3.00 6.00`;
    const result = parseInvoiceText(text);
    
    expect(result.items.length).toBe(2);
    expect(result.total).toBe(16.00);
  });

  it('should handle low confidence for garbled text', () => {
    const text = "?? garbled ?? text !!";
    const result = parseInvoiceText(text);
    
    expect(result.items.length).toBe(0);
    expect(result.confidence).toBeLessThan(0.5);
  });
});