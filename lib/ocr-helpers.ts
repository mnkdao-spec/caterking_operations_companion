/**
 * OCR Helper Utilities
 * Logic for parsing raw text into structured invoice data
 */

export interface ParsedLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ParsedInvoice {
  items: ParsedLineItem[];
  total: number;
  confidence: number;
}

/**
 * Parses raw text from OCR into a structured invoice format
 */
export function parseInvoiceText(text: string): ParsedInvoice {
  const lines = text.split('\n');
  const items: ParsedLineItem[] = [];
  let total = 0;

  // Simple regex patterns for common invoice formats
  // Matches: Item Name 2 @ 10.50 21.00
  // Matches: 2x Item Name 10.50
  const lineItemRegex = /^(?!(?:total|subtotal|tax|amount)\b)(.+?)\s+(\d+(?:\.\d+)?)\s*(?:@|x)?\s*(\d+(?:\.\d+)?)\s*(\d+(?:\.\d+)?)/i;

  for (const line of lines) {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(lineItemRegex);
    if (match) {
      const description = match[1].trim();
      const quantity = parseFloat(match[2]);
      const unitPrice = parseFloat(match[3]);
      const totalPrice = parseFloat(match[4]);

      if (!isNaN(quantity) && !isNaN(unitPrice)) {
        items.push({
          description,
          quantity,
          unitPrice,
          totalPrice: totalPrice || (quantity * unitPrice),
        });
      }
    }
  }

  // Look for total
  const totalRegex = /(?:total|amount due|grand total).+?(\d+(?:\.\d+)?)/i;
  const totalMatch = text.match(totalRegex);
  if (totalMatch) {
    total = parseFloat(totalMatch[1]);
  } else {
    total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  }

  return {
    items,
    total,
    confidence: calculateConfidence(text, items, total),
  };
}

/**
 * Calculates a basic confidence score based on parsing success
 */
function calculateConfidence(rawText: string, items: ParsedLineItem[], total: number): number {
  if (items.length === 0) return 0.1;
  
  let score = 0.5;
  
  // If sum of items matches total, high confidence
  const itemsSum = items.reduce((sum, item) => sum + item.totalPrice, 0);
  if (Math.abs(itemsSum - total) < 0.01) {
    score += 0.4;
  }
  
  // Scale by density of information
  if (items.length > 3) score += 0.1;
  
  return Math.min(score, 1.0);
}