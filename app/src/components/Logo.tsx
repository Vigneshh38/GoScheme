/** GoScheme wordmark: a small voice-orb mark next to the name. */
export function Logo({ small }: { small?: boolean }) {
  return (
    <div className={`logo${small ? ' logo--small' : ''}`} aria-label="GoScheme">
      <span className="logo-mark" aria-hidden="true">
        <span />
      </span>
      <span className="logo-word">
        Go<b>Scheme</b>
      </span>
    </div>
  )
}
