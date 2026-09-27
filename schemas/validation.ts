/** Small, dependency-free runtime schemas. Strict objects reject misspelled or secret fields. */
export type Schema<T> = { parse(value: unknown, path?: string): T };
export type Infer<S> = S extends Schema<infer T> ? T : never;
export function rule<T>(check: (value: unknown) => boolean, description: string): Schema<T> {
  return { parse(value, path = '$') {
    if (!check(value)) throw new Error(`${path}: expected ${description}`);
    return value as T;
  } };
}
export const text = rule<string>(v => typeof v === 'string' && v.trim().length > 0 && !v.includes('\0'), 'nonempty string');
export const boolean = rule<boolean>(v => typeof v === 'boolean', 'boolean');
export const nonnegative = rule<number>(v => typeof v === 'number' && Number.isFinite(v) && v >= 0, 'finite nonnegative number');
export const positiveInteger = rule<number>(v => typeof v === 'number' && Number.isSafeInteger(v) && v > 0, 'positive integer');
export function literal<const T extends string | number | boolean>(expected: T): Schema<T> {
  return rule<T>((v): v is T => v === expected, JSON.stringify(expected));
}
export function choice<const T extends readonly string[]>(...values: T): Schema<T[number]> {
  return rule<T[number]>((v): v is T[number] => typeof v === 'string' && values.includes(v), values.join(' | '));
}
export function array<T>(item: Schema<T>): Schema<T[]> {
  return { parse(value, path = '$') {
    if (!Array.isArray(value)) throw new Error(`${path}: expected array`);
    return Array.from(value, (v, i) => item.parse(v, `${path}[${i}]`));
  } };
}
export function nullable<T>(item: Schema<T>): Schema<T | null> {
  return { parse: (v, p) => v === null ? null : item.parse(v, p) };
}
export function object<S extends Record<string, Schema<unknown>>>(shape: S): Schema<{ [K in keyof S]: Infer<S[K]> }> {
  return { parse(value, path = '$') {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${path}: expected object`);
    const input = value as Record<string, unknown>;
    for (const key of Object.keys(input)) {
      if (!Object.hasOwn(shape, key)) throw new Error(`${path}.${key}: unknown field`);
    }
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(shape)) result[key] = shape[key].parse(input[key], `${path}.${key}`);
    return result as { [K in keyof S]: Infer<S[K]> };
  } };
}
export function refine<T>(schema: Schema<T>, check: (value: T) => boolean, description: string): Schema<T> {
  return { parse(value, path = '$') {
    const parsed = schema.parse(value, path);
    if (!check(parsed)) throw new Error(`${path}: ${description}`);
    return parsed;
  } };
}
