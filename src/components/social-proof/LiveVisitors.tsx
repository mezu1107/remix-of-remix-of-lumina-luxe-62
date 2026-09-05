/**
 * LiveVisitors — intentionally a no-op.
 *
 * The previous implementation displayed a randomly-drifting "23 people are
 * viewing this right now" counter that had NO connection to real visitor data.
 * This is a dark-pattern (fake urgency) that damages brand trust. The component
 * is kept as a named export so existing imports compile cleanly.
 *
 * To re-enable properly: integrate a real-time presence system (e.g. Supabase
 * Realtime channels or a dedicated analytics service) and only display the count
 * when it genuinely reflects live sessions on that product.
 */
export function LiveVisitors({ label: _label, className: _className }: { label?: string; className?: string }) {
  return null;
}
