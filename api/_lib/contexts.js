export const ASSISTANT_CONTEXTS = {
  home: {
    label: 'Home · Stato di oggi',
    data: 'Stato generale nella norma. Attività intensa 10 minuti, temperatura esterna 22 °C, respiro a riposo 16 rpm, energia 80%. Il consiglio del giorno invita a evitare le ore più calde.'
  },
  health: {
    label: 'Salute · Diario e fascicolo',
    data: 'La sezione contiene diario quotidiano e fascicolo sanitario. Antirabbica in scadenza il 23 giugno 2026, sensibilità cutanea alle pieghe e integratore articolare quotidiano.'
  },
  dash: {
    label: 'Alert · Riepilogo',
    data: 'Tre alert dimostrativi: attività elevata da gestire per proteggere la schiena, respirazione elevata col caldo e grattamento delle pieghe in aumento.'
  },
  profile: {
    label: 'Profilo · Dati di Enea',
    data: 'Enea è un Bulldog Francese adulto. Il profilo dimostrativo raccoglie peso, caratteristiche della razza, sensibilità cutanea e attenzione alla schiena.'
  },
  activities: {
    label: 'Attività · Agenda',
    data: 'Agenda dimostrativa con pappe, passeggiate e richiamo vaccinale. La giornata deve restare regolare e gli sforzi intensi vanno limitati.'
  },
  'm-activity': {
    label: 'Attività · Questa settimana',
    data: 'Oggi 10 minuti di attività intensa; media settimanale 11, minimo 6 e massimo 18. Fascia indicativa mostrata nella demo: 5-15 minuti al giorno.'
  },
  'm-temp': {
    label: 'Temperatura esterna · Questa settimana',
    data: 'Oggi 22 °C; minimo 14, media 20 e massimo 27. La demo segnala maggiore prudenza sopra i 25 °C.'
  },
  'm-resp': {
    label: 'Respiro · Questa settimana',
    data: 'Respiro a riposo 16 rpm, media 17 e picco 22 durante una giornata calda. La fascia mostrata come abituale è 14-20 rpm.'
  },
  'm-energy': {
    label: 'Energia · Questa settimana',
    data: 'Energia oggi 80%, media 72, minimo 52 e massimo 88. Il calo dimostrativo di sabato segue una giornata più intensa.'
  },
  diary: {
    label: 'Salute · Diario di oggi',
    data: 'Pappa mattutina completata, cena programmata alle 20:00, passeggiata mattutina di 15 minuti e passeggiata serale programmata. Nota: tranquillo, riposo al fresco, nessun grattamento.'
  },
  records: {
    label: 'Salute · Fascicolo sanitario',
    data: 'Polivalente registrata, antirabbica in scadenza il 23 giugno 2026, sensibilità cutanea delle pieghe, integratore articolare e ultima visita a febbraio 2026.'
  },
  'alert-activity': {
    label: 'Alert · Attività elevata',
    data: 'Alert dimostrativo: 22 minuti di attività intensa, sopra la fascia indicativa 5-15. Attenzione a salti, scale, rigidità, dolore o esitazione nei movimenti.'
  },
  'alert-resp': {
    label: 'Alert · Respirazione elevata',
    data: 'Alert dimostrativo: picco di 22 rpm nelle ore calde. Riposo al fresco, acqua e attenzione ad affanno persistente, debolezza o alterazioni del colore delle mucose.'
  },
  'alert-skin': {
    label: 'Alert · Grattamento in aumento',
    data: 'Alert dimostrativo: grattamento aumentato del 40% rispetto alla media. Controllare, pulire e asciugare le pieghe e osservare rossore, odore o lesioni.'
  },
  places: {
    label: 'Luoghi · Mappa del quartiere',
    data: 'Mappa dimostrativa e statica: vetri rotti in Via Verdi a 90 m, area cani Parco Sempione a 350 m, proprietari in zona Via Dante e ambulatorio a 600 m. I dati non rappresentano informazioni in tempo reale.'
  },
  'place-hazard': {
    label: 'Luoghi · Segnalazione',
    data: 'Segnalazione dimostrativa di vetri rotti sul marciapiede in Via Verdi, a circa 90 metri. Suggerire prudenza e un percorso alternativo.'
  },
  'place-park': {
    label: 'Luoghi · Area cani',
    data: 'Area cani dimostrativa del Parco Sempione, a circa 350 metri, indicata come recintata e dotata di acqua e ombra.'
  },
  'place-owners': {
    label: 'Luoghi · Proprietari vicini',
    data: 'Elenco dimostrativo di tre proprietari di Frenchie in zona Via Dante. Le posizioni sono dichiarate approssimative e subordinate al consenso.'
  },
  'place-vet': {
    label: 'Luoghi · Veterinario',
    data: 'Ambulatorio veterinario dimostrativo a circa 600 metri, associato al fascicolo di Enea e al promemoria dell’antirabbica.'
  },
  'place-add': {
    label: 'Luoghi · Nuova segnalazione',
    data: 'Schermata dimostrativa per segnalare pericoli, aree cani, veterinari o punti acqua. La pubblicazione non è ancora collegata a dati reali.'
  }
};

export function getAssistantContext(key) {
  return ASSISTANT_CONTEXTS[key] || ASSISTANT_CONTEXTS.home;
}
