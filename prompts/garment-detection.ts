export const GARMENT_DETECTION_PROMPT = `You classify one clothing product image into exactly one label for virtual try-on.
Reply with ONLY one token, one of: upper_body, lower_body, dresses.
Definitions:
- upper_body: shirts, sweaters, coats worn on torso/arms unless full-length dress.
- lower_body: pants, skirts, shorts.
- dresses: one-piece dresses or gowns.`;
