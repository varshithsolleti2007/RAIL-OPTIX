// Wraps an async route handler so rejected promises reach the error middleware
// instead of being silently swallowed.
export default function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
