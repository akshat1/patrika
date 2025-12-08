/* But Akshat, why did you write your own debounce function?
   Because I'm using TS, and TS-Node, and for some reason this setup doesn't
   seem to like importing this particular package (debounce-fn). I suspect
   somewhere in my tooling club sanchwich of doom, imports are being transpiled
   to require, and I'm no mood to dive into that rabbit hole, get pissed off,
   and lose the day.

   This is a barebones version, doesn't have things like max-delay etc. but I
   don't need that and this works well enough for me.
*/
/**
 * @param fn - The function be debounced.
 * @param delayMS - Delay in milliseconds. Zero by default (so at the end of current call stack).
 * @returns
 */
// Whooooooooo! Unsafe function type! Scaaaaaryyyyyyy! Oooooh JavaScript! Mysterious!
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function debounce (fn: Function, delayMS: number = 0) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delayMS);
  };
};
