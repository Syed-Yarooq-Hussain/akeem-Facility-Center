import { useEffect, useRef } from 'react';
import { ArrowDown, Sparkles, MoveHorizontal } from 'lucide-react';
import './clean-reveal.css';

const copy = {
  de: { tag: 'DER WILLIAMS EFFEKT', title: 'Ein Raum. Ein neuer Eindruck.', text: 'Scrollen Sie und erleben Sie den Unterschied, den professionelle Reinigung macht.', before: 'Vorher', after: 'Nachher', scroll: 'Scrollen & Sauberkeit entdecken', control: 'Reinigung selbst entdecken', note: 'KI-generierte Visualisierung · kein Kundenprojekt', link: 'Ihr Raum. Unser nächster Auftrag.', alt: 'Bürofoyer vor und nach einer professionellen Reinigung' },
  en: { tag: 'THE WILLIAMS EFFECT', title: 'Same space. A fresh start.', text: 'Scroll to discover the difference professional cleaning can make.', before: 'Before', after: 'After', scroll: 'Scroll to reveal the clean', control: 'Explore the cleaning transformation', note: 'AI-generated illustration · not a client project', link: 'Your space. Our next transformation.', alt: 'Office lobby before and after professional cleaning' },
  fr: { tag: 'L’EFFET WILLIAMS', title: 'Même espace. Nouveau départ.', text: 'Faites défiler pour découvrir la différence d’un nettoyage professionnel.', before: 'Avant', after: 'Après', scroll: 'Défilez pour révéler la propreté', control: 'Explorer la transformation', note: 'Illustration générée par IA · pas un projet client', link: 'Votre espace. Notre prochaine mission.', alt: 'Hall de bureau avant et après un nettoyage professionnel' },
};

export default function CleanReveal({ lang, LocalLink }) {
  const section = useRef(null), stage = useRef(null), slider = useRef(null);
  const c = copy[lang] || copy.de;
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    const paint = value => {
      stage.current?.style.setProperty('--clean', `${value}%`);
      if (slider.current) slider.current.value = value;
    };
    const update = () => {
      frame = 0;
      if (!section.current) return;
      if (reduced.matches) return paint(50);
      const rect = stage.current.getBoundingClientRect();
      const header = document.querySelector('.header')?.offsetHeight || 0;
      const start = innerHeight * .85;
      const end = header + 20;
      paint(Math.max(0, Math.min(100, (start - rect.top) / Math.max(1, start - end) * 100)));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    reduced.addEventListener('change', schedule);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); reduced.removeEventListener('change', schedule); };
  }, []);
  return <section className="clean-story" ref={section} aria-labelledby="clean-title">
    <div className="clean-flow"><div className="container">
      <div className="clean-heading"><div><div className="eyebrow"><span />{c.tag}</div><h2 id="clean-title">{c.title}</h2></div><p>{c.text}</p></div>
      <div className="clean-stage" ref={stage} style={{ '--clean': '0%' }} role="img" aria-label={c.alt}>
        <div className="clean-photo clean-before" />
        <div className="clean-photo clean-after" />
        <span className="clean-label clean-label-before">01 / {c.before}</span><span className="clean-label clean-label-after"><Sparkles size={14} />{c.after} / 02</span>
        <div className="clean-wipe" aria-hidden="true"><span><MoveHorizontal size={21} /></span></div>
        <div className="clean-prompt"><ArrowDown size={15} />{c.scroll}</div>
      </div>
      <div className="clean-footer"><label>{c.control}<input ref={slider} type="range" min="0" max="100" defaultValue="0" onInput={e => stage.current.style.setProperty('--clean', `${e.target.value}%`)} /></label><small>{c.note}</small><LocalLink to="contact">{c.link}<span aria-hidden="true">↗</span></LocalLink></div>
    </div></div>
  </section>;
}
