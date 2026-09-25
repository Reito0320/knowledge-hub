/** Private server-to-server API address; never derived from an incoming Host header. */
export const getApiOrigin = () => (process.env.API_ORIGIN ?? 'http://127.0.0.1:3001').replace(/\/$/, '');
