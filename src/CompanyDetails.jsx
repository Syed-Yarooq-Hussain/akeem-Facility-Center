import { extraContent } from './extra-content';
export default function CompanyDetails({ lang, compact = false }) {
  const t = extraContent[lang] || extraContent.de;
  return <div className={`company-details ${compact ? 'company-details-compact' : ''}`}>
    <h3>Facility</h3>
    <dl><div><dt>{t.management}</dt><dd>C. Agbanyo</dd></div><div><dt>{t.address}</dt><dd><address>Borselstraße 20<br/>22765 Altona</address></dd></div></dl>
  </div>;
}
