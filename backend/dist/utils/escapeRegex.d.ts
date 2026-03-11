/**
 * Escapes all special RegExp metacharacters in a user-supplied string so it
 * can be embedded inside `new RegExp(...)` without enabling ReDoS or unintended
 * wildcard matching.
 *
 * Example: "fo+o (bar)" → "fo\+o \(bar\)"
 */
export declare const escapeRegex: (str: string) => string;
