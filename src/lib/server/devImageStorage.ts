// Development image storage (in-memory)
// This is only used in development when R2 is not configured
export const devImageStorage = new Map<string, { buffer: ArrayBuffer; contentType: string }>();
