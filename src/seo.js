import { languages, locales } from './localization';
import { content, navPaths } from './content';
import { modernContent } from './modern-content';
import { indexablePages, siteOrigin } from '../shared/seo-config';

export const origin = siteOrigin(import.meta.env.VITE_SITE_URL);
export function pageSeo(pathname) {
  const parts=pathname.split('/').filter(Boolean);
  const lang=languages.includes(parts[0])?parts[0]:'de';
  const page=parts[1] || (parts[0]==='admin'?'admin':'');
  const valid=languages.includes(parts[0]) && parts.length<=2;
  const indexable=valid && indexablePages.includes(page);
  const t=content[lang];
  const name=t.nav[navPaths.indexOf(page)] || t.legal[['impressum','privacy','terms','withdrawal'].indexOf(page)] || (page==='checkout'?t.cart:page==='admin'?'Admin':t.notFound);
  const title=page===''?(lang==='de'?'Gebäudereinigung & Wäscheservice in Hamburg | Williams Facility':`${t.nav[2]} & ${t.nav[3]} · Hamburg | Williams Facility`):`${name} · Hamburg | Williams Facility Services`;
  const description=({shop:modernContent[lang].shopLive,contact:t.contactText,about:t.aboutPageText,careers:t.careersText,laundry:t.serviceIntro[3],facility:t.serviceIntro[4],cleaning:t.serviceIntro[0]})[page] || t.heroText;
  const path=`/${lang}${page?'/'+page:''}`;
  const canonical=indexable?origin+path:null;
  const alternatives=indexable?[...languages.map(l=>({lang:l,url:`${origin}/${l}${page?'/'+page:''}`})),{lang:'x-default',url:`${origin}/de${page?'/'+page:''}`}]:[];
  const business={
    '@type':'LocalBusiness','@id':`${origin}/#business`,name:'Williams Facility Services GmbH',url:origin+'/de',
    email:'info@williamsfacility.com',logo:origin+'/brand/williams-logo.svg',image:origin+'/images/cleaning-transformation.png',
    address:{'@type':'PostalAddress',streetAddress:'Borselstraße 20',postalCode:'22765',addressLocality:'Hamburg',addressCountry:'DE'},
    contactPoint:{'@type':'ContactPoint',email:'info@williamsfacility.com',contactType:'customer service',availableLanguage:languages},
  };
  const graph=[business,{'@type':'WebSite','@id':origin+'/#website',url:origin+'/de',name:'Williams Facility Services',publisher:{'@id':business['@id']},inLanguage:languages},
    {'@type':'WebPage','@id':`${origin}${path}#webpage`,url:origin+path,name:title,description,inLanguage:lang,isPartOf:{'@id':origin+'/#website'},about:{'@id':business['@id']}}];
  if(page)graph.push({'@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:t.nav[0],item:origin+'/'+lang},{'@type':'ListItem',position:2,name,item:origin+path}]});
  if(['cleaning','laundry','facility'].includes(page))graph.push({'@type':'Service',name,description,url:origin+path,provider:{'@id':business['@id']}});
  return {lang,title,description,canonical,alternatives,indexable,locale:locales[lang].replace('-','_'),image:origin+'/images/cleaning-transformation.png',schema:indexable?{'@context':'https://schema.org','@graph':graph}:null};
}

export function applySeo(pathname) {
 const seo=pageSeo(pathname);document.documentElement.lang=seo.lang;document.title=seo.title;
 const meta=(attr,key,value)=>{let el=document.head.querySelector(`meta[${attr}="${key}"]`);if(!el){el=document.createElement('meta');el.setAttribute(attr,key);document.head.append(el);}el.content=value;};
 meta('name','description',seo.description);meta('name','robots',seo.indexable?'index, follow, max-image-preview:large':'noindex, follow');
 for(const [key,value] of Object.entries({'og:type':'website','og:site_name':'Williams Facility Services','og:title':seo.title,'og:description':seo.description,'og:url':seo.canonical||origin,'og:image':seo.image,'og:locale':seo.locale}))meta('property',key,value);
 for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':seo.title,'twitter:description':seo.description,'twitter:image':seo.image}))meta('name',key,value);
 document.head.querySelectorAll('link[rel="canonical"],link[hreflang]').forEach(el=>el.remove());
 if(seo.canonical){const el=document.createElement('link');el.rel='canonical';el.href=seo.canonical;document.head.append(el);}
 for(const alternate of seo.alternatives){const el=document.createElement('link');el.rel='alternate';el.hreflang=alternate.lang;el.href=alternate.url;document.head.append(el);}
 document.getElementById('business-schema')?.remove();
 if(seo.schema){const el=document.createElement('script');el.id='business-schema';el.type='application/ld+json';el.textContent=JSON.stringify(seo.schema);document.head.append(el);}
}
