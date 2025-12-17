import Decimal from 'decimal.js';
import { z } from 'zod';

export const decimalInput = z.union([z.string(), z.number()]).transform((value, ctx) => {
  try {
    const decimalValue = new Decimal(value as Decimal.Value);
    if (!decimalValue.isFinite()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Value must be finite' });
      return z.NEVER;
    }
    return decimalValue;
  } catch (error) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid decimal value' });
    return z.NEVER;
  }
});
