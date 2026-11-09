import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Check, ChevronDown, ChevronRight, ShoppingBag, Menu, X, ShieldCheck, Sparkles, Building2, BedDouble, HeartPulse, Landmark, Users, Home as HomeIcon, Truck, Clock3, Plus, Minus, Trash2, Search, CheckCircle2, LoaderCircle, Globe2 } from 'lucide-react';
import { content, navPaths } from './content';
import AdminPanel from './AdminPanel';
import HomeModern from './HomeModern';
import BrandLogo from './BrandLogo';
import { modernContent } from './modern-content';

const Context = createContext();
const useSite = () => useContext(Context);
const readStored = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const waNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '491234567890').replace(/\D/g, '');
const waIsDemo = waNumber === '491234567890';
const money = (amount, lang) => new Intl.NumberFormat({ de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[lang], { style: 'currency', currency: 'EUR' }).format(amount / 100);
function LocalLink({ to = '', children, ...props }) { const { lang } = useSite(); return <Link to={`/${lang}${to ? '/' + to : ''}`} {...props}>{children}</Link>; }
function Button({ to = 'contact', children, light = false, className = '', ...props }) { return <LocalLink to={to} className={`button ${light ? 'button-light' : ''} ${className}`} {...props}>{children}<ArrowUpRight size={18} /></LocalLink>; }
function Eyebrow({ children }) { return <div className="eyebrow"><span />{children}</div>; }
function Logo({ footer = false }) { return <LocalLink className={`logo ${footer ? 'logo-light' : ''}`} aria-label="Williams Facility Services – Home"><BrandLogo/></LocalLink>; }
function WhatsAppIcon({ size = 22 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.7l1.4-4.8a8.5 8.5 0 1 1 16.1-4.1Z"/><path d="M8.3 7.2c-.9.5-1 1.4-.5 2.7 1.1 2.8 3.6 5.1 6.2 5.8 1.3.3 2.2-.2 2.7-1.1l-2.3-1.4-1.1 1c-1.8-.7-3.3-2.1-4-3.7l1-1.1-1.2-2.4Z"/></svg>; }

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathLang = location.pathname.split('/')[1];
  const lang = ['de', 'en', 'fr'].includes(pathLang) ? pathLang : 'de';
  const isAdmin = pathLang === 'admin' || location.pathname.split('/')[2] === 'admin';
  const [products, setProducts] = useState([]);
  const [catalogSource, setCatalogSource] = useState('loading');
  const refreshCatalog = useCallback(async () => {
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error('Catalog unavailable');
      const data = await response.json();
      setProducts(data.products); setCatalogSource(data.source);
      setCart(old => old.filter(item => data.products.some(p => p.id === item.id)));
    } catch { setCatalogSource('error'); }
  }, []);
  useEffect(() => { refreshCatalog(); }, [refreshCatalog]);
  const [cart, setCart] = useState(() => {
    const saved = readStored('williams-cart', []);
    return Array.isArray(saved) ? saved.filter(i => i && typeof i.id === 'string' && /^[a-zA-Z0-9-]{1,80}$/.test(i.id) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 99) : [];
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [notice, setNotice] = useState(false);
  const c = modernContent[lang];
  const t = { ...content[lang], ...(catalogSource === 'live' ? { shopText: c.shopLive, demo: c.liveDisclaimer, vat: c.liveVat } : {}) };
  const count = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = cart.reduce((sum, i) => sum + (products.find(p => p.id === i.id)?.price || 0) * i.qty, 0);
  const add = (id) => setCart(old => old.some(i => i.id === id) ? old.map(i => i.id === id ? { ...i, qty: Math.min(i.qty + 1, 99) } : i) : [...old, { id, qty: 1 }]);
  const quantity = (id, qty) => setCart(old => qty <= 0 ? old.filter(i => i.id !== id) : old.map(i => i.id === id ? { ...i, qty: Math.min(qty, 99) } : i));
  useEffect(() => { try { localStorage.setItem('williams-cart', JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => {
    if (!['de', 'en', 'fr'].includes(pathLang) && pathLang !== 'admin') {
      const saved = readStored('williams-language', 'de');
      navigate(`/${['de', 'en', 'fr'].includes(saved) ? saved : 'de'}${location.pathname === '/' ? '' : location.pathname}${location.search}`, { replace: true });
    }
  }, [pathLang, navigate, location.pathname, location.search]);
  useEffect(() => {
    document.documentElement.lang = lang;
    try { localStorage.setItem('williams-language', JSON.stringify(lang)); } catch {}
    const page = location.pathname.split('/')[2] || '';
    const title = t.nav[navPaths.indexOf(page)] || (page === 'checkout' ? t.cart : t.legal[['impressum', 'privacy', 'terms', 'withdrawal'].indexOf(page)]) || 'Williams';
    document.title = `${title} | Williams Facility Services GmbH`;
    document.querySelector('meta[name="description"]').content = ({ shop: t.shopText, contact: t.contactText, about: t.aboutPageText, careers: t.careersText, laundry: t.serviceIntro[3], facility: t.serviceIntro[4], cleaning: t.serviceIntro[0] })[page] || t.heroText;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.append(canonical); }
    canonical.href = `${import.meta.env.VITE_SITE_URL || window.location.origin}${location.pathname}`;
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());
    ['de', 'en', 'fr'].forEach(l => { const el = document.createElement('link'); el.rel = 'alternate'; el.hreflang = l; el.href = `${import.meta.env.VITE_SITE_URL || window.location.origin}/${l}${page ? '/' + page : ''}`; document.head.append(el); });
    window.scrollTo({ top: 0, behavior: 'instant' });
    setCartOpen(false);
    let robots = document.querySelector('meta[name="robots"]');
    if (isAdmin) { if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.append(robots); } robots.content = 'noindex, nofollow'; }
    else if (robots) robots.remove();
  }, [location.pathname, lang, isAdmin]);
  return <Context.Provider value={{ lang, t, cart, add, quantity, count, total, setCart, cartOpen, setCartOpen, products, catalogSource, refreshCatalog }}>
    <a className="skip-link" href="#main">{lang === 'de' ? 'Zum Inhalt' : lang === 'fr' ? 'Aller au contenu' : 'Skip to content'}</a>
    {!isAdmin && <Header />}
    <main id="main"><Routes>
      <Route path="/admin" element={<AdminPanel lang={lang} onCatalogChange={refreshCatalog}/>} />
      <Route path="/:lang/admin" element={<AdminPanel lang={lang} onCatalogChange={refreshCatalog}/>} />
      <Route path="/:lang" element={<HomePage />} />
      <Route path="/:lang/about" element={<AboutPage />} />
      <Route path="/:lang/cleaning" element={<ServicePage kind="cleaning" />} />
      <Route path="/:lang/laundry" element={<ServicePage kind="laundry" />} />
      <Route path="/:lang/facility" element={<ServicePage kind="facility" />} />
      <Route path="/:lang/shop" element={<ShopPage />} />
      <Route path="/:lang/contact" element={<ContactPage />} />
      <Route path="/:lang/careers" element={<CareersPage />} />
      <Route path="/:lang/checkout" element={<CheckoutPage />} />
      {['impressum', 'privacy', 'terms', 'withdrawal'].map(type => <Route key={type} path={`/:lang/${type}`} element={<LegalPage type={type} />} />)}
      <Route path="/" element={<div className="loading"><LoaderCircle /></div>} />
      <Route path="*" element={<div className="container not-found"><span>404</span><h1>{t.notFound}</h1><Button to="">{t.back}</Button></div>} />
    </Routes></main>
    {!isAdmin && <Footer onStorage={() => setNotice(true)} />}
    {!isAdmin && <a className="whatsapp-float" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer" aria-label={t.whatsapp} title={t.whatsapp}><WhatsAppIcon size={28}/></a>}
    {cartOpen && <CartDrawer />}
    {notice && <div className="storage-notice" role="status"><p>{t.cookies}</p><button className="button" onClick={() => setNotice(false)}>{t.cookieButton}<Check size={16}/></button></div>}
  </Context.Provider>;
}

function Header() {
  const { lang, t, count, setCartOpen } = useSite();
  const [menu, setMenu] = useState(false);
  const location = useLocation();
  useEffect(() => { setMenu(false); }, [location.pathname]);
  return <>
    <div className="topbar"><div className="container"><span><span className="status-dot"/>{t.top}</span><LocalLink to="contact">{t.topLink}<ArrowUpRight size={13}/></LocalLink></div></div>
    <header className="header"><div className="container header-inner"><Logo />
      <nav className={`desktop-nav ${menu ? 'mobile-open' : ''}`} aria-label="Main navigation">
        {[0, 2, 3, 4, 5].map(i => <NavLink end={i === 0} key={i} to={`/${lang}${navPaths[i] ? '/' + navPaths[i] : ''}`}>{t.nav[i]}{i === 2 && <ChevronDown size={12}/>}</NavLink>)}
        <LocalLink to="about" className="mobile-only">{t.nav[1]}</LocalLink><LocalLink to="careers" className="mobile-only">{t.nav[6]}</LocalLink><LocalLink to="contact" className="mobile-only">{t.nav[7]}</LocalLink>
      </nav>
      <div className="header-actions"><div className="language-switch"><Globe2 size={14}/><LanguageSelect /></div><button className="cart-button icon-button" onClick={() => setCartOpen(true)} aria-label={`${t.cart} (${count})`}><ShoppingBag size={21}/>{count > 0 && <span className="cart-count">{count}</span>}</button><Button className="header-quote">{t.quote}</Button><button className="icon-button menu-toggle" onClick={() => setMenu(!menu)} aria-label={menu ? t.close : t.menu} aria-expanded={menu}>{menu ? <X/> : <Menu/>}</button></div>
    </div></header>
  </>;
}
function LanguageSelect() {
  const { lang } = useSite(); const navigate = useNavigate(); const location = useLocation();
  return <select value={lang} aria-label="Language" onChange={e => navigate(`/${e.target.value}${location.pathname.slice(3)}${location.search}`)}>{['de', 'en', 'fr'].map(l => <option key={l} value={l}>{l.toUpperCase()}</option>)}</select>;
}

function HomePage() {
  const { t, lang } = useSite();
  return <HomeModern {...{ t, lang, LocalLink, Button, Eyebrow, ServiceCards, Process, FAQ, InquiryForm }}/>;
}
function HygieneScene() { return <div className="hygiene-scene" aria-hidden="true"><div className="scene-circle"/><div className="scene-products"><div className="scene-product one"><ProductArt type="bottle" color="#c6cbbd"/></div><div className="scene-product two"><ProductArt type="rolls"/></div><div className="scene-product three"><ProductArt type="dispenser"/></div><div className="scene-product four"><ProductArt type="spray" color="#b6c79c"/></div></div><span className="scene-word">ESSENTIALS, ELEVATED.</span></div>; }
function ServiceCards() {
  const { t }=useSite();
  return <div className="service-cards">{t.cards.map(([title,subtitle,description],i)=><LocalLink to={['cleaning','laundry','shop'][i]} key={title} className="service-card"><div className="service-card-image"><img src={['/images/crew.svg','/images/linen.svg','/images/products.svg'][i]} alt={title} loading="lazy"/><span className="service-number">0{i+1}</span><span className="service-card-arrow"><ArrowUpRight size={25}/></span><div className="service-photo-title"><small>WILLIAMS / 0{i+1}</small><h3>{title}</h3></div></div><div className="service-card-copy"><h4>{subtitle}</h4><p>{description}</p><span className="card-link">{t.more}<ArrowRight size={17}/></span></div></LocalLink>)}</div>;
}
function Process() { const { t } = useSite(); return <section className="section process-section"><div className="container"><Eyebrow>{t.processLabel}</Eyebrow><h2>{t.processTitle}</h2><div className="process-grid">{t.process.map(([title, text], i) => <div key={title}><div className="process-number">0{i + 1}<span/></div><h3>{title}</h3><p>{text}</p></div>)}</div></div></section>; }
function CallToAction() { const { t } = useSite(); return <section className="cta-section"><div className="container"><div><Eyebrow>LET’S MAKE IT WILLIAMS.</Eyebrow><h2>{t.ctaTitle}</h2><p>{t.ctaText}</p></div><Button light>{t.quote}</Button></div><span className="cta-decoration">W</span></section>; }
function PageIntro({ label, title, text, image, children }) { const { t } = useSite(); return <section className={`page-intro ${image ? 'with-image' : ''}`}><div className="container"><div className="page-intro-copy"><div className="breadcrumbs"><LocalLink>{t.nav[0]}</LocalLink><ChevronRight size={12}/><span>{label}</span></div><Eyebrow>{label}</Eyebrow><h1>{title}</h1>{text && <p>{text}</p>}{children}</div>{image && <img src={image} alt={title} className="intro-image"/>}</div></section>; }
function ServicePage({ kind }) {
  const { t } = useSite();
  const indexes = kind === 'cleaning' ? [0, 1, 2] : [kind === 'laundry' ? 3 : 4];
  const first = indexes[0];
  return <><PageIntro label={t[kind === 'cleaning' ? 'cleaningTag' : kind === 'laundry' ? 'laundryTag' : 'facilityTag']} title={kind === 'cleaning' ? t.cards[0][1] : t.serviceTitles[first]} text={t.serviceIntro[first]} image={`/images/${kind === 'laundry' ? 'laundry' : kind === 'cleaning' ? 'cleaning' : 'office'}.svg`}><Button to={`contact?service=${first}`}>{t.quote}</Button></PageIntro><section className="section"><div className="container service-details">{indexes.map(i => <div key={i} className="service-detail"><div className="service-detail-heading"><span>0{i + 1}</span><h2>{t.serviceTitles[i]}</h2>{i !== first && <p>{t.serviceIntro[i]}</p>}</div><div><h3>{t.included}</h3><ul className="check-list">{t.serviceItems[i].map(item => <li key={item}><Check size={17}/>{item}</li>)}</ul>{i === 2 && <p className="fine-print">{t.specialNote}</p>}<LocalLink className="text-link dark-link" to={`contact?service=${i}`}>{t.quote}<ArrowUpRight size={17}/></LocalLink></div></div>)}<div className="tailored-panel"><Truck size={32}/><div><h3>{t.tailored}</h3><p>{t.tailoredText}</p></div><Button to={`contact?service=${first}`}>{t.quote}</Button></div></div></section><FAQ/><CallToAction/></>;
}
function AboutPage() { const { t } = useSite(); return <><PageIntro label={t.aboutLabel} title={t.aboutPageTitle} text={t.aboutPageText} image="/images/office.svg"/><section className="section"><div className="container"><div className="section-heading"><h2>{t.slogan}</h2><p>{t.aboutText}</p></div><div className="values-cards">{t.values.map(([title, text], i) => { const Icon = [Users, Clock3, ShieldCheck][i]; return <div key={title}><Icon size={31}/><h3>{title}</h3><p>{text}</p></div>; })}</div></div></section><section className="section pale-section"><div className="container"><Eyebrow>{t.servicesEyebrow}</Eyebrow><h2>{t.servicesTitle}</h2><ServiceCards/></div></section><Process/><CallToAction/></>; }
function CareersPage() { const { t } = useSite(); return <><PageIntro label={t.nav[6]} title={t.careersTitle} text={t.careersText} image="/images/cleaning.svg"><Button to="contact?service=careers">{t.careersButton}</Button><small className="career-note">{t.careersNote}</small></PageIntro><section className="section"><div className="container"><div className="values-cards">{t.values.map(([title, text], i) => <div key={title}><span className="value-index">0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></div></section><CallToAction/></>; }
function FAQ() { const { t } = useSite(); return <section className="section faq-section"><div className="container faq-grid"><div><Eyebrow>FAQ</Eyebrow><h2>{t.faqTitle}</h2><Button>{t.quote}</Button></div><div>{t.faqs.map(([q, a]) => <details key={q}><summary>{q}<Plus size={19}/></summary><p>{a}</p></details>)}</div></div></section>; }

function ContactPage() {
  const { t, lang } = useSite();
  return <><PageIntro label={t.contactLabel} title={t.contactTitle} text={t.contactText}/><section className="section contact-section"><div className="container contact-grid"><aside><h2>{t.footerContact}</h2><p>{t.slogan}</p><a className="contact-method" href={`https://wa.me/${waNumber}`} target="_blank" rel="noreferrer"><WhatsAppIcon size={25}/><div><strong>WhatsApp</strong><span>+{waNumber} {waIsDemo && <small>({lang === 'de' ? 'Demo' : lang === 'fr' ? 'exemple' : 'demo'})</small>}</span></div><ArrowUpRight size={20}/></a><div className="contact-method"><Globe2 size={24}/><div><strong>Deutsch · English · Français</strong><span>{t.form.reference}</span></div></div>{waIsDemo && <div className="contact-note"><ShieldCheck size={22}/><p>{t.demoContact}</p></div>}</aside><InquiryForm/></div></section><FAQ/></>;
}
function InquiryForm({ order = false }) {
  const { t, lang, cart, setCart, catalogSource } = useSite();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialService = params.get('service') || '';
  const industryIndex = Number(params.get('industry'));
  const [status, setStatus] = useState('idle');
  const [reference, setReference] = useState('');
  const [service, setService] = useState(['0','1','2','3','4','careers'].includes(initialService) ? initialService : '');
  const formRef = useRef();
  async function submit(event) {
    event.preventDefault(); if (status === 'sending') return;
    const data = Object.fromEntries(new FormData(event.currentTarget));
    data.language = lang; data.consent = data.consent === 'on';
    if (order) data.items = cart;
    setStatus('sending');
    try {
      const result = await fetch(`/api/${order ? 'orders' : 'inquiries'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await result.json();
      if (!result.ok || !json.reference) throw new Error('Submission failed');
      setReference(json.reference); setStatus('success'); if (order) setCart([]); formRef.current?.reset();
    } catch { setStatus('error'); }
  }
  if (status === 'success') return <div className="success-panel" role="status"><CheckCircle2 size={52}/><h2>{order ? t.orderSuccess : t.form.success}</h2><strong>{reference}</strong><Button to={order ? 'shop' : ''}>{order ? t.backShop : t.back}</Button></div>;
  return <form className="inquiry-form" onSubmit={submit} ref={formRef}>
    <div className="form-heading"><h2>{order ? t.cartItems : t.quote}</h2><span>{t.form.reference}</span></div>
    <p className="fine-print">{t.form.required}</p>
    <div className="form-grid"><label>{t.form.name} *<input name="name" autoComplete="name" required maxLength={120}/></label><label>{t.form.company}<input name="company" autoComplete="organization" maxLength={160}/></label><label>{t.form.email} *<input name="email" type="email" autoComplete="email" required maxLength={254}/></label><label>{t.form.phone}<input name="phone" type="tel" autoComplete="tel" maxLength={40}/></label></div>
    {!order && <div className="form-grid"><label>{t.form.service} *<select name="service" value={service} onChange={e => setService(e.target.value)} required><option value="">{t.form.choose}</option>{t.serviceTitles.map((title, i) => <option key={i} value={i}>{title}</option>)}<option value="shop">{t.nav[5]}</option><option value="careers">{t.nav[6]}</option></select></label><label>{t.form.location}<input name="location" autoComplete="postal-code" maxLength={160}/></label></div>}
    <label>{t.form.message}{!order && ' *'}<textarea name="message" rows={5} placeholder={t.form.messagePlaceholder} required={!order} maxLength={5000} defaultValue={params.has('industry') && t.industries[industryIndex] ? `${t.industries[industryIndex]}: ` : ''}/></label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="consent"><input type="checkbox" name="consent" required/><span>{t.form.consent} <LocalLink to="privacy">{t.legal[1]}<ArrowUpRight size={12}/></LocalLink></span></label>
    {status === 'error' && <div className="form-error" role="alert">{t.form.error}</div>}
    <button className="button form-submit" type="submit" disabled={status === 'sending' || (order && (!cart.length || ['loading','error'].includes(catalogSource)))}>{status === 'sending' ? t.form.sending : order ? t.orderSend : t.form.submit}{status === 'sending' ? <LoaderCircle className="spin" size={18}/> : <ArrowUpRight size={18}/>}</button>
  </form>;
}

function ProductVisual({ product, lang }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.imageUrl]);
  return product.imageUrl && !failed ? <img className="catalog-product-photo" src={product.imageUrl} alt={product.name[lang] || product.name.de} loading="lazy" onError={() => setFailed(true)}/> : <ProductArt type={product.type} color={product.color}/>;
}
function ProductArt({ type = 'bottle', color = '#b7c7b0' }) {
  return <svg className={`product-art art-${type}`} viewBox="0 0 240 210" fill="none" aria-hidden="true"><defs><linearGradient id={`g-${type}-${color.replace('#','')}`} x1="50" y1="60" x2="200" y2="190" gradientUnits="userSpaceOnUse"><stop stopColor="#fff"/><stop offset="1" stopColor="#e2e4df"/></linearGradient></defs><ellipse cx="123" cy="187" rx="67" ry="8" fill="#102e38" opacity=".09"/>
    {type === 'bottle' && <><path d="M88 55h63c9 0 15 10 17 20l9 96c1 8-5 13-13 13H77c-8 0-13-6-12-13l7-94c1-11 8-22 16-22Z" fill={`url(#g-${type}-${color.replace('#','')})`} stroke="#d3d7d0"/><rect x="88" y="42" width="38" height="18" rx="4" fill="#173c3d"/><path d="M137 65h12c6 0 9 6 9 13v14h-21V65Z" stroke="#9caaa0" strokeWidth="5"/><rect x="77" y="104" width="89" height="59" rx="3" fill={color}/><text x="88" y="126" fontSize="10" fontWeight="700" fill="#15333b">WILLIAMS</text><path d="M89 137h58m-58 8h40" stroke="#15333b" strokeWidth="2" opacity=".5"/><text x="90" y="158" fontSize="6" fill="#15333b">PROFESSIONAL CARE · 5L</text></>}
    {type === 'spray' && <><path d="M101 67h36v33l15 22 8 53c1 6-4 10-9 10H86c-6 0-10-4-9-10l9-53 15-22V67Z" fill={`url(#g-${type}-${color.replace('#','')})`} stroke="#d1d8d0"/><path d="M98 54h47v13h-10l-5 15h-9l-4-15H98V54Z" fill="#183a3b"/><path d="M144 58h14v8h-14z" fill="#183a3b"/><path d="M88 125h61l6 44H82l6-44Z" fill={color}/><text x="90" y="144" fontSize="9" fontWeight="700" fill="#15333b">WILLIAMS</text><path d="M95 155h41" stroke="#15333b" opacity=".5" strokeWidth="2"/></>}
    {type === 'rolls' && <>{[[61,117],[110,117],[155,117],[86,70],[135,70]].map(([x,y], i) => <g key={i}><path d={`M${x-21} ${y}h42v49c0 12-42 12-42 0V${y}Z`} fill={`url(#g-${type}-${color.replace('#','')})`} stroke="#d7dbd4"/><ellipse cx={x} cy={y} rx="21" ry="10" fill="#fff" stroke="#d7dbd4"/><ellipse cx={x} cy={y} rx="7" ry="4" fill="#b3ac9b"/></g>)}</>}
    {type === 'paper' && <><path d="m48 139 110-24 43 32-110 25-43-33Z" fill="#fff" stroke="#d6d8d0"/><path d="M48 139v25l43 29v-21l-43-33Z" fill="#d9ded3"/><path d="m91 172 110-25v24L91 193v-21Z" fill="#eef0e8"/>{[0,1,2,3,4].map(i => <path key={i} d={`m50 ${143+i*4} 40 28 109-24`} stroke="#c9cfc2"/>)}<path d="m53 125 108-26 34 32-104 24-38-30Z" fill="#fafbf8" stroke="#e2e4dc"/><path d="M63 120c10-31 40-43 63-21l35 0" fill="#fff" stroke="#e2e4dc"/></>}
    {type === 'cloth' && <>{[0,1,2].map(i => <g key={i}><path d={`m49 ${149-i*13} 99-28 48 27-103 32-44-31Z`} fill={i === 2 ? '#b5ced2' : color} stroke="#92b4bc"/><path d={`m49 ${149-i*13} 44 31v9l-44-31v-9Zm44 31 103-32v9L93 189v-9Z`} fill={color} stroke="#92b4bc"/></g>)}</>}
    {type === 'bags' && <><path d="m70 109 89-8 11 69c4 13-89 23-94 7l-6-68Z" fill={color}/><ellipse cx="115" cy="108" rx="45" ry="16" fill="#89968a"/><ellipse cx="115" cy="108" rx="16" ry="6" fill="#324338"/><path d="m90 126 6 53m16-50 5 51m18-54 4 49" stroke="#fff" opacity=".12"/><path d="m64 108 5 66-16-13V94l11 14Z" fill="#3e5145"/></>}
    {type === 'dispenser' && <><rect x="79" y="39" width="82" height="138" rx="21" fill={`url(#g-${type}-${color.replace('#','')})`} stroke="#c9cec7"/><path d="M80 135h80v19c0 15-12 24-22 24h-36c-13 0-22-11-22-24v-19Z" fill="#1c3337"/><rect x="112" y="74" width="16" height="35" rx="8" fill="#bac8bc"/><path d="M113 180h15v10h-15z" fill="#61756b"/><text x="92" y="125" fontSize="7" fontWeight="700" fill="#17383b">WILLIAMS</text></>}
  </svg>;
}

function ShopPage() {
  const { t, lang, add, products, catalogSource, refreshCatalog } = useSite();
  const [category, setCategory] = useState(0); const [search, setSearch] = useState(''); const [addedId, setAddedId] = useState(null); const [selected, setSelected] = useState(null);
  const filtered = products.filter(p => (!category || p.category === category) && `${p.name[lang]} ${p.unit[lang]}`.toLowerCase().includes(search.toLowerCase()));
  const timer = useRef(); useEffect(() => () => clearTimeout(timer.current), []);
  function addItem(id) { add(id); setAddedId(id); clearTimeout(timer.current); timer.current = setTimeout(() => setAddedId(null), 1800); }
  return <><PageIntro label={t.shopLabel} title={t.shopTitle} text={t.shopText}/><section className="section shop-section"><div className="container"><div className="shop-toolbar"><div className="category-tabs">{t.categories.map((c,i) => <button key={c} className={category === i ? 'active' : ''} onClick={() => setCategory(i)}>{c}</button>)}</div><div className="search-input"><Search size={18}/><input placeholder={t.search} aria-label={t.search} value={search} onChange={e => setSearch(e.target.value)}/>{search && <button className="icon-button" onClick={() => setSearch('')} aria-label={t.reset}><X size={15}/></button>}</div></div><div className="shop-count">{filtered.length} {t.results}<span>{t.demo}</span></div>{catalogSource === 'error' ? <div className="catalog-message" role="alert"><p>{modernContent[lang].catalogError}</p><button className="button" onClick={refreshCatalog}>{modernContent[lang].retry}<ArrowRight size={17}/></button></div> : catalogSource === 'loading' ? <div className="catalog-message" role="status"><LoaderCircle className="spin"/><p>{modernContent[lang].loading}</p></div> : <div className="product-grid">{filtered.map(p => <article className="product-card" key={p.id}><button className="product-image" onClick={() => setSelected(p)} aria-label={p.name[lang]}><span className="product-category">{t.categories[p.category]}</span>{p.sample && <span className="sample-product-badge">{({de:"Beispiel",en:"Sample",fr:"Exemple"})[lang]}</span>}<ProductVisual product={p} lang={lang}/><span className="product-view"><Plus size={19}/></span></button><div className="product-copy"><button className="product-name" onClick={() => setSelected(p)}><h3>{p.name[lang]}</h3></button><p>{p.unit[lang]}</p><div className="product-price"><strong>{money(p.price,lang)}</strong><button className={addedId === p.id ? 'added' : ''} onClick={() => addItem(p.id)} aria-label={`${t.add}: ${p.name[lang]}`}>{addedId === p.id ? <Check size={19}/> : <Plus size={19}/>}</button></div><span className="added-text" aria-live="polite">{addedId === p.id ? t.added : '\u00a0'}</span></div></article>)}</div>}{!filtered.length && !['loading','error'].includes(catalogSource) && <div className="empty-state"><Search size={38}/><h3>{products.length ? t.emptySearch : modernContent[lang].emptyCatalog}</h3><button className="button" onClick={() => {setCategory(0);setSearch('');}}>{t.reset}<ArrowRight size={17}/></button></div>}</div></section><CallToAction/>{selected && <Dialog onClose={() => setSelected(null)} className="product-dialog"><div className="product-dialog-art"><ProductVisual product={selected} lang={lang}/></div><div><Eyebrow>{t.categories[selected.category]}</Eyebrow><h2>{selected.name[lang]}</h2><p>{selected.unit[lang]}</p>{selected.description?.[lang] && <p>{selected.description[lang]}</p>}<strong className="detail-price">{money(selected.price,lang)}</strong><p className="fine-print">{selected.sample ? content[lang].demo : t.demo}</p><button className="button" onClick={() => addItem(selected.id)}>{addedId === selected.id ? t.added : t.add}{addedId === selected.id ? <Check size={18}/> : <ShoppingBag size={18}/>}</button></div></Dialog>}</>;
}
function Dialog({ children, onClose, className = '' }) {
  const { t } = useSite(); const ref = useRef();
  useEffect(() => { const d = ref.current; d.showModal(); const before = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = before; }; }, []);
  return <dialog ref={ref} className={className} aria-label={className.includes('cart-dialog') ? t.cart : t.nav[5]} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current) onClose(); }}><div className="dialog-body"><button className="dialog-close icon-button" onClick={onClose} aria-label={t.close}><X/></button>{children}</div></dialog>;
}
function CartLines() { const { t, lang, cart, quantity, products } = useSite(); return <div className="cart-lines">{cart.filter(item => products.some(p=>p.id===item.id)).map(item => { const p = products.find(p => p.id === item.id); return <div className="cart-line" key={item.id}><div className="cart-art"><ProductVisual product={p} lang={lang}/></div><div className="cart-line-info"><h3>{p.name[lang]}</h3><p>{p.unit[lang]}</p><div className="quantity-control"><button onClick={() => quantity(item.id, item.qty - 1)} aria-label={`${t.quantity} −: ${p.name[lang]}`}><Minus size={13}/></button><span>{item.qty}</span><button onClick={() => quantity(item.id, item.qty + 1)} disabled={item.qty >= 99} aria-label={`${t.quantity} +: ${p.name[lang]}`}><Plus size={13}/></button></div></div><div className="cart-line-end"><strong>{money(p.price * item.qty, lang)}</strong><button className="icon-button" onClick={() => quantity(item.id, 0)} aria-label={`${t.remove}: ${p.name[lang]}`}><Trash2 size={16}/></button></div></div>; })}</div>; }
function CartDrawer() { const { t, lang, cart, count, total, setCartOpen, setCart } = useSite(); return <Dialog onClose={() => setCartOpen(false)} className="cart-dialog"><div className="cart-heading"><ShoppingBag size={23}/><h2>{t.cart} <span>({count})</span></h2></div>{cart.length ? <><CartLines/><div className="cart-summary"><div><span>{t.subtotal}</span><strong>{money(total,lang)}</strong></div><p>{t.vat}</p><Button to="checkout">{t.checkout}</Button><button className="clear-cart" onClick={() => setCart([])}>{t.clear}</button></div></> : <div className="empty-state"><ShoppingBag size={49} strokeWidth={1}/><h3>{t.emptyCart}</h3><Button to="shop">{t.browse}</Button></div>}</Dialog>; }
function CheckoutPage() { const { t, lang, cart, total } = useSite(); return <><PageIntro label={t.cart} title={t.orderTitle} text={t.orderText}/><section className="section"><div className="container checkout-grid"><div><LocalLink to="shop" className="text-link dark-link">← {t.backShop}</LocalLink>{cart.length ? <><CartLines/><div className="checkout-total"><span>{t.subtotal}</span><strong>{money(total,lang)}</strong></div><p className="fine-print">{t.vat}</p></> : <p className="empty-message">{t.emptyCart}</p>}</div><InquiryForm order/></div></section></>; }

const legalCopy = {
  de: {
    impressum: [['Unternehmensangaben', 'Williams Facility Services GmbH. Anschrift, vertretungsberechtigte Geschäftsführung, Handelsregister und Registernummer, USt-IdNr. sowie geschäftliche E-Mail und Telefonnummer sind noch zu ergänzen.'], ['Redaktioneller Stand', 'Diese Website ist eine Entwicklungsversion. Die beispielhafte WhatsApp-Nummer stellt keinen bestätigten Unternehmenskontakt dar.']],
    privacy: [['Verantwortlicher', 'Williams Facility Services GmbH. Die vollständige Geschäftsanschrift und Datenschutz-Kontaktdaten werden vor dem Start ergänzt.'], ['Anfragen und Produktanfragen', 'Bei Absenden des Formulars werden Name, Kontaktdaten, Nachricht und gegebenenfalls Produktauswahl zur Bearbeitung Ihrer Anfrage gespeichert. Im konfigurierten Betrieb werden die Daten in MongoDB verarbeitet. Vor dem Start sind Rechtsgrundlagen, Empfänger, Aufbewahrungsfristen, Hostinganbieter und gegebenenfalls internationale Datenübermittlungen anhand der tatsächlichen Konfiguration festzulegen.'], ['Lokale Speicherung', 'Sprachwahl und Warenkorb werden im Local Storage Ihres Browsers gespeichert. Sie können diese Daten in den Browsereinstellungen löschen. Es ist kein Analyse- oder Werbetracking eingebaut.'], ['WhatsApp', 'Erst durch einen Klick auf den WhatsApp-Link verlassen Sie diese Website und öffnen einen externen Dienst. Für die weitere Datenverarbeitung gelten dessen Bedingungen.'], ['Ihre Rechte', 'Die vollständigen Informationen über Auskunft, Berichtigung, Löschung, Einschränkung, Widerspruch, Datenübertragbarkeit, Widerruf und zuständige Aufsichtsbehörde sind vor dem Start zu vervollständigen.']],
    terms: [['Unverbindliche Produktanfragen', 'Die dargestellten Artikel und Preise sind Beispiele. Der Warenkorb dient der Zusammenstellung einer unverbindlichen Anfrage. Mit dem Absenden wird keine Bestellung aufgegeben und kein Kaufvertrag geschlossen.'], ['Angebot und Vertrag', 'Verbindliche Preise, Verfügbarkeit, Leistungsumfang, Zahlungsbedingungen und Lieferkonditionen werden in einem gesonderten Angebot vereinbart. Vor Aufnahme eines verbindlichen Onlineverkaufs sind vollständige AGB und Pflichtinformationen zu hinterlegen.']],
    withdrawal: [['Aktueller Shop-Ablauf', 'Die Website nimmt ausschließlich unverbindliche Produktanfragen entgegen. Es erfolgt keine Onlinezahlung und kein verbindlicher Kaufabschluss.'], ['Vor Aufnahme des Onlineverkaufs', 'Versandgebiete, Lieferzeiten, Versandkosten, Zahlungsarten sowie gegebenenfalls Widerrufsbelehrung und Muster-Widerrufsformular sind anhand des tatsächlichen Geschäftsmodells und der Kundengruppe zu ergänzen.']]
  },
  en: {
    impressum: [['Company information', 'Williams Facility Services GmbH. Registered address, managing director, commercial register details, VAT ID, business email and telephone must be added.'], ['Development version', 'This website is a development version. The sample WhatsApp number is not a confirmed company contact.']],
    privacy: [['Data controller', 'Williams Facility Services GmbH. The registered address and privacy contact details will be added before launch.'], ['Enquiries and product requests', 'Submitted names, contact details, messages and product selections are stored to process enquiries. When configured, MongoDB is used for storage. Legal bases, recipients, retention, hosting providers and any international transfers must be documented against the actual production setup before launch.'], ['Local storage', 'Your language preference and cart are stored in your browser’s local storage. You can remove them using browser settings. No analytics or advertising tracking is included.'], ['WhatsApp', 'Clicking the WhatsApp link opens an external service. Its terms apply to further data processing.'], ['Your rights', 'Complete information on access, rectification, erasure, restriction, objection, portability, withdrawal of consent and the relevant supervisory authority must be added before launch.']],
    terms: [['Non-binding product enquiries', 'Products and prices shown are examples. The cart compiles a non-binding enquiry. Submitting it does not place an order or conclude a purchase contract.'], ['Quotation and contract', 'Binding prices, availability, service scope, payment and delivery terms are agreed in a separate quotation. Complete terms and mandatory disclosures must be added before binding online sales are enabled.']],
    withdrawal: [['Current shop process', 'This website accepts non-binding product enquiries only. No online payment or binding purchase takes place.'], ['Before online sales begin', 'Delivery regions, times, charges, payment methods and, where applicable, withdrawal instructions and a model withdrawal form must be completed for the actual business model and customer group.']]
  },
  fr: {
    impressum: [['Informations sur l’entreprise', 'Williams Facility Services GmbH. Adresse du siège, direction, registre du commerce, numéro de TVA, e-mail et téléphone professionnels à compléter.'], ['Version de développement', 'Ce site est une version de développement. Le numéro WhatsApp donné à titre d’exemple n’est pas un contact confirmé.']],
    privacy: [['Responsable du traitement', 'Williams Facility Services GmbH. Adresse et coordonnées de confidentialité à compléter avant le lancement.'], ['Demandes et produits', 'Les noms, coordonnées, messages et sélections de produits soumis sont conservés pour traiter les demandes. MongoDB est utilisé lorsque le service est configuré. Les bases légales, destinataires, durées de conservation, hébergeurs et transferts internationaux éventuels doivent être documentés selon la configuration réelle.'], ['Stockage local', 'Votre langue et votre panier sont conservés dans le stockage local du navigateur. Vous pouvez les supprimer dans ses paramètres. Aucun suivi publicitaire ou analytique n’est intégré.'], ['WhatsApp', 'Le lien WhatsApp ouvre un service externe. Ses conditions s’appliquent au traitement ultérieur des données.'], ['Vos droits', 'Les informations sur les droits d’accès, rectification, effacement, limitation, opposition, portabilité, retrait du consentement et l’autorité de contrôle compétente doivent être complétées avant le lancement.']],
    terms: [['Demandes sans engagement', 'Les produits et prix sont des exemples. Le panier constitue une demande sans engagement. Son envoi ne constitue ni une commande ni un contrat d’achat.'], ['Devis et contrat', 'Prix définitifs, disponibilité, prestations, paiement et livraison sont convenus dans un devis séparé. Les conditions et informations obligatoires doivent être ajoutées avant toute vente en ligne ferme.']],
    withdrawal: [['Fonctionnement actuel', 'Le site accepte uniquement des demandes de produits sans engagement. Aucun paiement ni achat ferme n’est effectué en ligne.'], ['Avant le lancement des ventes', 'Zones, délais et frais de livraison, moyens de paiement et, le cas échéant, informations et formulaire de rétractation sont à compléter selon le modèle commercial et la clientèle.']]
  }
};
function LegalPage({ type }) { const { t, lang } = useSite(); const title = t.legal[['impressum','privacy','terms','withdrawal'].indexOf(type)]; return <><PageIntro label="WILLIAMS FACILITY SERVICES GMBH" title={title}/><section className="section"><article className="container legal-content"><div className="legal-draft"><ShieldCheck size={22}/>{t.legalDraft}</div>{legalCopy[lang][type].map(([heading, text]) => <section key={heading}><h2>{heading}</h2><p>{text}</p></section>)}</article></section></>; }
function Footer({ onStorage }) { const { t } = useSite(); return <footer className="footer"><div className="container"><div className="footer-wordmark" aria-hidden="true">WILLIAMS<ArrowUpRight/></div><div className="footer-grid"><div className="footer-brand"><Logo footer/><p>{t.footerText}</p><span className="footer-slogan">{t.slogan}</span></div><div><h3>{t.footerServices}</h3>{[2,3,4,5].map(i => <LocalLink to={navPaths[i]} key={i}>{t.nav[i]}</LocalLink>)}</div><div><h3>{t.footerCompany}</h3>{[1,6,7].map(i => <LocalLink to={navPaths[i]} key={i}>{t.nav[i]}</LocalLink>)}</div><div className="footer-talk"><h3>{t.footerContact}</h3><p>{t.ctaText}</p><LocalLink to="contact">{t.quote}<ArrowUpRight size={19}/></LocalLink><div className="footer-languages">DE <span>/</span> EN <span>/</span> FR</div></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Williams Facility Services GmbH. {t.footerRights}</span><div>{['impressum','privacy','terms','withdrawal'].map((p,i) => <LocalLink key={p} to={p}>{t.legal[i]}</LocalLink>)}<LocalLink to="admin">Admin</LocalLink><button onClick={onStorage}><ShieldCheck size={14}/><span className="sr-only">Local storage info</span></button></div></div></div></footer>; }
