import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';

const labels = { de: ['Video pausieren', 'Video abspielen'], en: ['Pause video', 'Play video'], fr: ['Mettre en pause', 'Lire la vidéo'] };

export default function CleaningVideo({ hero = false, lang }) {
  const root = useRef(null), video = useRef(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false, frame = 0;
    const sync = () => {
      if (visible && !reduced.matches) video.current?.play().catch(() => {});
      else video.current?.pause();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: .1 });
    observer.observe(root.current);
    const paint = () => {
      frame = 0;
      const rect = root.current?.getBoundingClientRect();
      if (rect && !hero) root.current.style.setProperty('--video-inset', `${reduced.matches ? 0 : Math.max(0, Math.min(5, rect.top / innerHeight * 5))}%`);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    reduced.addEventListener('change', sync);
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    paint();
    return () => { observer.disconnect(); reduced.removeEventListener('change', sync); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); cancelAnimationFrame(frame); };
  }, [hero]);
  const text = labels[lang] || labels.en;
  return <div ref={root} className={hero ? 'cleaning-video cleaning-video-hero' : 'cleaning-video cleaning-video-feature'}>
    <video ref={video} muted loop playsInline preload={hero ? 'auto' : 'metadata'} poster={hero ? '/images/hero-interior.svg' : '/images/precision.svg'} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} aria-hidden="true">
      <source src={hero ? '/videos/cleaning-hero.mp4' : '/videos/window-cleaning.mp4'} type="video/mp4" />
    </video>
    <button className="video-control" type="button" aria-label={text[playing ? 0 : 1]} onClick={() => { if (playing) video.current.pause(); else video.current.play().catch(() => {}); }}>{playing ? <Pause size={18}/> : <Play size={18}/>}</button>
  </div>;
}
