export default function Badge({ type, children }) {
  return <span className={`um-badge um-badge-${type}`}>{children}</span>;
}
