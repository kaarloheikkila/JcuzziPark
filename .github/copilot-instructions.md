<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# JacuzziPark - Sähköjättien Sijaintioptimointi

Tämä projekti on React TypeScript Vite -sovellus, joka optimoi sähköjättien puiston sijaintia Suomessa perustuen:
- Sääolosuhteisiin (huonoin sää = paras kysyntä)
- Sähköntuotantoon (halvin energia)
- Yritystiheyteen (potentiaaliset asiakkaat)

## Teknologiat
- React 18 + TypeScript
- Vite (build tool)
- Chart.js/D3.js (data visualisointi)
- Leaflet (kartat)
- Tailwind CSS (styling)

## Datalähteet
- avoindata.fi
- Ilmatieteenlaitos (sää)
- Fingrid (sähköntuotanto)
- Tilastokeskus (yritysdata)

## Projektin Tavoitteet
- [x] ✅ Copilot-ohjeiden luominen
- [x] ✅ Projektin skaffoldaus (Vite + React + TypeScript)
- [x] ✅ Kustomointi JacuzziPark-vaatimuksille
- [ ] Tarvittavien laajennusten asennus
- [ ] Riippuvuuksien asennus
- [ ] Projektin kääntäminen
- [ ] Tehtävän luominen ja suoritus
- [ ] Projektin käynnistäminen
- [ ] Dokumentaation viimeistely

## Projektin Kuvaus

JacuzziPark on moderni React-sovellus sähköjättien puiston sijaintioptimoinnille Suomessa. Sovellus analysoi:

### 📊 Data-analytiikka
- **Säädata**: Huonoin sää = paras jacuzzi-kysyntä
- **Sähkönhinta**: Uusiutuva energia ja grid-kuorma
- **Yritysdata**: Potentiaaliset asiakkaat ja ostovoima

### 🎯 Ominaisuudet
- Interaktiivinen Suomen kartta
- Reaaliaikainen pisteytys (0-100)
- Dashboard-analytiikka  
- Optimointisuositukset
- Responsive design

### 🔧 Tekninen toteutus
- React 18 + TypeScript + Vite
- Tailwind CSS (modern styling)
- Chart.js (data-visualisointi)
- Leaflet kartat (tulevaisuudessa)
- Simuloitu avoindata.fi integraatio
