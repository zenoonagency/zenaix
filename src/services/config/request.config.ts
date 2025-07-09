export const REQUEST_CONFIG = {
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeouts: {
    default: 15000,
    upload: 60000,
    polling: 10000
  },
  retries: {
    count: 2,
    delay: 1000
  }
};