import fs from 'node:fs';
// Reviewed role labels: Bauleitung refers to a construction site, not a website.
const roles={
 tr:['Genel Müdür','Şantiye Yönetimi ve İrtibat Kişisi','Temizlik'],
 pl:['Dyrektorka zarządzająca','Kierowniczka budowy i osoba do kontaktu','Sprzątanie'],
 ro:['Directoare generală','Conducerea șantierului și persoană de contact','Curățenie'],
 sq:['Drejtoreshë ekzekutive','Drejtimi i kantierit dhe personi i kontaktit','Pastrim'],
 es:['Directora general','Dirección de obra y persona de contacto','Limpieza'],
 el:['Διευθύνουσα σύμβουλος','Διεύθυνση εργοταξίου και υπεύθυνη επικοινωνίας','Καθαρισμός'],
 uk:['Керуюча директорка','Керівниця будівництва та контактна особа','Прибирання'],
 bg:['Управляваща директорка','Ръководство на строителството и лице за контакт','Почистване'],
 it:['Amministratrice delegata','Direzione lavori e referente','Pulizia']
};
for(const [lang,[director,site,clean]] of Object.entries(roles)){
 const path=`src/locales/${lang}.json`;const data=JSON.parse(fs.readFileSync(path,'utf8'));
 data['Managing Director']=director;data['Site Management & Contact Person']=site;data.Cleaning=clean;
 fs.writeFileSync(path,JSON.stringify(data,null,2)+'\n');
}
