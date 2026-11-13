import { ArrowDown, ArrowUpRight, Check, Sparkles, Truck, Shirt, ShieldCheck, Users, CalendarClock, HeartPulse } from 'lucide-react';
import { modernContent } from './modern-content';
import { premiumContent } from './premium-content';
import CleanReveal from './CleanReveal';

export default function HomeModern({ t, lang, LocalLink, Button, Eyebrow, ServiceCards, Process, FAQ, InquiryForm }) {
  const c=modernContent[lang], p=premiumContent[lang];
  return <>
    <section className="premium-hero modern-hero">
      <img className="premium-hero-photo" src="/images/hero-interior.svg" alt={t.cards[0][0]} fetchPriority="high"/>
      <div className="premium-hero-shade"/>
      <div className="container premium-hero-inner">
        <Eyebrow>{p.heroTag}</Eyebrow>
        <div className="premium-hero-content"><h1>{p.hero1}<br/><em>{p.hero2}</em></h1><p>{p.heroText}</p><div className="premium-hero-actions"><Button light>{t.quote}</Button><a href="#services" className="premium-outline-link">{p.explore}<ArrowDown size={17}/></a></div></div>
        <div className="premium-hero-bottom"><span>{t.slogan}</span><LocalLink to="about">{c.personal}<ArrowUpRight size={18}/></LocalLink></div>
      </div>
    </section>
    <div className="premium-assurance"><div className="container">{t.pillars.map((text,i)=>{const Icon=[ShieldCheck,CalendarClock,Users][i];return <div key={text}><Icon size={20}/><span>{text}</span></div>;})}</div></div>
    <CleanReveal lang={lang} LocalLink={LocalLink}/>
    <section id="services" className="section premium-services">
      <div className="container"><div className="premium-intro"><Eyebrow>{p.introTag}</Eyebrow><h2>{p.introTitle}<br/><em>{p.introAccent}</em></h2><p>{p.introText}</p></div><ServiceCards/></div>
    </section>
    <section className="premium-about section">
      <div className="container premium-about-grid"><div className="premium-about-photos"><img className="premium-about-main" src="/images/crew.svg" alt={t.cards[0][0]} loading="lazy"/><div className="premium-about-inset"><img src="/images/precision.svg" alt={t.serviceItems[0][2]} loading="lazy"/><span>{p.photoTag}</span></div></div>
        <div className="premium-about-copy"><Eyebrow>{p.whyTag}</Eyebrow><h2>{p.whyTitle}</h2><p>{p.whyText}</p><div className="premium-values">{t.values.map(([title,text],i)=>{const Icon=[Users,CalendarClock,Sparkles][i];return <div key={title}><span><Icon size={20}/></span><div><h3>{title}</h3><p>{text}</p></div></div>;})}</div><Button to="about">{t.aboutCta}</Button></div>
      </div>
    </section>
    <section className="premium-specialist"><div className="premium-specialist-photo"><img src="/images/medical.svg" alt={t.serviceTitles[2]} loading="lazy"/><span>WILLIAMS / HYGIENE</span></div><div className="premium-specialist-copy"><Eyebrow>{p.specialistTag}</Eyebrow><h2>{p.specialistTitle}<br/><em>{p.specialistAccent}</em></h2><p>{p.specialistText}</p><ul>{[t.serviceItems[2][1],t.serviceItems[2][3],t.serviceItems[2][4]].map(item=><li key={item}><Check size={16}/>{item}</li>)}</ul><Button to="contact?service=2" light>{p.specialistLink}</Button><small>{t.specialNote}</small></div></section>
    <section className="photo-industries section premium-gallery"><div className="container"><div className="modern-section-heading"><div><Eyebrow>{c.galleryTag}</Eyebrow><h2>{c.galleryTitle}<br/><em>{c.galleryAccent}</em></h2></div><p>{c.galleryText}</p></div><div className="photo-industry-grid">{['office','hotel','detail','linen'].map((photo,i)=><LocalLink key={photo} to={`contact?industry=${[0,1,0,4][i]}`} className={`photo-industry photo-industry-${i}`}><img src={`/images/${photo}.svg`} alt={c.galleryNames[i]} loading="lazy"/><div><span>0{i+1}</span><h3>{c.galleryNames[i]}</h3><ArrowUpRight size={22}/></div></LocalLink>)}</div><small className="photo-disclosure">{c.photoNote}</small></div></section>
    <section className="laundry-story"><div className="container laundry-story-grid"><div className="laundry-story-copy"><Eyebrow>{t.laundryTag}</Eyebrow><h2>{c.laundryTitle}<br/><em>{c.laundryAccent}</em></h2><p>{c.laundryText}</p><div className="laundry-benefits">{[Truck,Shirt,ShieldCheck].map((Icon,i)=><div key={i}><Icon size={21}/><span>{[t.serviceItems[3][6],t.serviceItems[3][3],t.serviceItems[3][7]][i]}</span></div>)}</div><Button to="laundry">{t.more}</Button></div><div className="laundry-story-photos"><img className="laundry-story-main" src="/images/linen.svg" alt={t.serviceItems[3][1]} loading="lazy"/><img className="laundry-story-small" src="/images/laundry.svg" alt={t.serviceTitles[3]} loading="lazy"/><span className="laundry-photo-word">FRESH.<br/>EVERY DAY.</span></div></div></section>
    <Process/><FAQ/>
    <section className="premium-contact section"><div className="container premium-contact-grid"><div className="premium-contact-copy"><Eyebrow>{p.contactTag}</Eyebrow><h2>{p.contactTitle}<br/><em>{p.contactAccent}</em></h2><p>{p.contactText}</p><img src="/images/hotel.svg" alt={t.industries[1]} loading="lazy"/><div><ShieldCheck size={17}/>{t.form.reference}</div></div><InquiryForm/></div></section>
  </>;
}
