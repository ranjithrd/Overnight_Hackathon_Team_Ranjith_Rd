/**
 * asyncHandler
 * Wraps an async function and returns a function that catches errors
 * Usage:
 *   const wrapped = asyncHandler(async (args) => { ... });
 *   await wrapped(args);
 */
export const asyncHandler = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (err) {
      // Optional: normalize error shape here
      console.error('API error', err);
      throw err;
    }
  };
};
