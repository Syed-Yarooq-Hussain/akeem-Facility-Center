import fs from 'node:fs/promises';
import path from 'node:path';
import { build, loadEnv } from 'vite';
import { pathToFileURL } from 'node:url';
import { languages } from '../shared/languages.js';
import { allPages, indexablePages, siteOrigin } from '../shared/seo-config.js';
const env={...loadEnv('production',process.cwd(),''),...process.env};
const origin=siteOrigin(env.VITE_SITE_URL);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const template=await fs.readFile('dist/index.html','utf8');
// Compile a production server bundle; do not start Vite's development server in CI.
const renderDirectory=path.resolve('node_modules/.cache/williams-seo-render');
await build({mode:'production',build:{ssr:'src/entry-server.jsx',outDir:renderDirectory,emptyOutDir:true,minify:false,rollupOptions:{output:{entryFileNames:'render.mjs'}}}});
{
 const {render,pageSeo}=await import(pathToFileURL(path.join(renderDirectory,'render.mjs')).href);
 const write=async(route,filename)=>{
  const seo=pageSeo(route);
  let html=template.replace('<html lang="de">',`<html lang="${seo.lang}">`).replace(/<title>[\s\S]*?<\/title>/,'').replace(/<meta name="description"[^>]*>/,'');
  const tags=[`<title>${escape(seo.title)}</title>`,`<meta name="description" content="${escape(seo.description)}">`,`<meta name="robots" content="${seo.indexable?'index, follow, max-image-preview:large':'noindex, follow'}">`];
  if(seo.canonical)tags.push(`<link rel="canonical" href="${escape(seo.canonical)}">`);
  for(const a of seo.alternatives)tags.push(`<link rel="alternate" hreflang="${a.lang}" href="${escape(a.url)}">`);
  for(const [key,value] of Object.entries({'og:type':'website','og:site_name':'Williams Facility Services','og:title':seo.title,'og:description':seo.description,'og:url':seo.canonical||origin,'og:image':seo.image,'og:locale':seo.locale}))tags.push(`<meta property="${key}" content="${escape(value)}">`);
  for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':seo.title,'twitter:description':seo.description,'twitter:image':seo.image}))tags.push(`<meta name="${key}" content="${escape(value)}">`);
  if(env.GOOGLE_SITE_VERIFICATION)tags.push(`<meta name="google-site-verification" content="${escape(env.GOOGLE_SITE_VERIFICATION)}">`);
  if(seo.schema)tags.push(`<script id="business-schema" type="application/ld+json">${JSON.stringify(seo.schema).replaceAll('<','\\u003c')}</script>`);
  html=html.replace('</head>',tags.join('\n')+'\n</head>').replace('<div id="root"></div>',`<div id="root">${render(route)}</div>`);
  await fs.mkdir(path.dirname(filename),{recursive:true});await fs.writeFile(filename,html);
 };
 for(const lang of languages)for(const page of allPages){const route=`/${lang}${page?'/'+page:''}`;await write(route,`dist${route}.html`);}
 await write('/admin','dist/admin.html');await write('/de/not-found','dist/404.html');await write('/de','dist/index.html');
 const urls=[];
 for(const lang of languages)for(const page of indexablePages){const suffix=page?'/'+page:'';urls.push(`<url><loc>${origin}/${lang}${suffix}</loc>${[...languages,'x-default'].map(l=>`<xhtml:link rel="alternate" hreflang="${l}" href="${origin}/${l==='x-default'?'de':l}${suffix}"/>`).join('')}</url>`);}
 await fs.writeFile('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.join('\n')}</urlset>\n`);
 // Admin and checkout remain crawlable so crawlers can read their noindex directives.
 await fs.writeFile('dist/robots.txt',`User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml\n`);
 console.log(`SEO: ${languages.length*allPages.length} localized HTML pages; ${urls.length} indexable sitemap URLs at ${origin}`);
}
