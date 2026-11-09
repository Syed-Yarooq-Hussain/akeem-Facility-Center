import './brand-logo.css';

// Original client vector artwork; the display asset trims only its empty margins.
export default function BrandLogo({ className = '', loading = 'eager' }) {
  return <img
    className={`brand-logo-image ${className}`}
    src="/brand/williams-logo.svg"
    alt="Williams Facility Services"
    width="880"
    height="205"
    loading={loading}
    decoding="async"
  />;
}
