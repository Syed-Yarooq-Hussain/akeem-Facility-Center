import { languages, languageNames, locales } from '../shared/languages';
import { content } from './content';
import { modernContent } from './modern-content';
import { premiumContent } from './premium-content';
import { adminContent } from './admin-content';
import { legalCopy } from './legal-content';
import { cleanCopy } from './clean-content';
import { extraContent } from './extra-content';
const files = import.meta.glob('./locales/*.json', { eager:true, import:'default' });
const dictionaries = Object.fromEntries(Object.entries(files).map(([path, value]) => [path.split('/').pop().replace('.json',''), value]));
export { languages, languageNames, locales };
export function translatedText(text, lang) { return dictionaries[lang]?.[text] || text; }
function translateTree(value, lang) {
  if (typeof value === 'string') return translatedText(value, lang);
  if (Array.isArray(value)) return value.map(item => translateTree(item, lang));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,translateTree(v,lang)]));
  return value;
}
for (const collection of [content,modernContent,premiumContent,adminContent,legalCopy,cleanCopy,extraContent]) {
  for (const lang of languages) if (!collection[lang]) collection[lang] = translateTree(collection.en, lang);
}
// Replace outdated placeholder contact statements with confirmed company information.
for (const lang of languages) {
  content[lang].demoContact = extraContent[lang].contactNote;
  legalCopy[lang].impressum[0][1] = `Williams Facility Services GmbH. Borselstraße 20, 22765 Altona. ${extraContent[lang].management}: C. Agbanyo. info@williamsfacility.com. ${extraContent[lang].registerNote}`;
  legalCopy[lang].privacy[0][1] = 'Williams Facility Services GmbH. Borselstraße 20, 22765 Altona. info@williamsfacility.com.';
}
export function localizeProducts(products) {
  return products.map(p => ({...p,...Object.fromEntries(['name','unit','description'].map(field=>{
    const original=p[field] || {};
    return [field,Object.fromEntries(languages.map(lang=>[lang,original[lang] || translatedText(original.en || original.de || '',lang)]))];
  }))}));
}
