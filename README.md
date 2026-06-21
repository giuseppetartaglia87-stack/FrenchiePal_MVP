# FrenchiePal v4

Landing page e demo interattiva con:

- assistente OpenAI contestuale a ogni schermata;
- waitlist e analytics su Supabase;
- mappe OpenStreetMap con dati dimostrativi statici;
- API serverless pronte per Vercel.

## Struttura per la manutenzione

La grafica e la logica sono separate:

```text
index.html            contenuto e struttura HTML
styles/main.css       aspetto grafico
scripts/app.js        tutta la logica frontend
api/chat.js           backend OpenAI
api/_lib/contexts.js  contesti attendibili usati dal backend
```

Puoi quindi modificare liberamente colori, testi e layout in `index.html` e
`styles/main.css` senza riscrivere le chiamate OpenAI. Conserva gli `id` degli
elementi interattivi e i riferimenti agli script presenti in fondo a
`index.html`.

Per una nuova schermata contestuale aggiorna la configurazione corrispondente in
`scripts/app.js` e aggiungi il contesto sicuro per OpenAI in
`api/_lib/contexts.js`.

## Pubblicazione rapida

### 1. GitHub

Carica **il contenuto di questa cartella** nella root del repository collegato a Vercel.

### 2. Variabili Vercel

In Vercel → Project → Settings → Environment Variables verifica:

```text
OPENAI_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Sono sufficienti in Production, Preview e Development.  
Opzionale:

```text
OPENAI_MODEL=gpt-4o-mini
```

Se il progetto Vercel usato dalla v3 contiene già queste variabili, non devi modificarle.

### 3. Supabase

Se stai usando lo stesso progetto Supabase della v3 e le tabelle esistono già, non è necessaria alcuna modifica per far funzionare chat, waitlist e tracking.

Per creare o aggiornare in modo sicuro tabelle, indici e dashboard v4:

1. apri Supabase → SQL Editor;
2. incolla il contenuto di `supabase/setup_v4.sql`;
3. premi **Run** una sola volta.

Lo script è idempotente e non cancella i dati della v3.

## Deploy

Vercel rileva automaticamente:

- `index.html` come sito;
- `api/chat.js`;
- `api/waitlist.js`;
- `api/event.js`;
- `api/health.js`;
- le dipendenze indicate in `package.json`.

Non pubblicare il progetto soltanto con GitHub Pages: le API serverless non funzionerebbero.

Dopo il deploy apri:

```text
https://TUO-DOMINIO.vercel.app/api/health
```

Se tutto è configurato correttamente vedrai `"ok": true`, senza che vengano mostrate le chiavi.

## OpenStreetMap

Le due mappe utilizzano tile OpenStreetMap reali, ma marker, distanze, proprietari, parchi e segnalazioni sono dati dimostrativi statici. La ricerca e la pubblicazione di segnalazioni reali saranno collegate in una fase successiva.
