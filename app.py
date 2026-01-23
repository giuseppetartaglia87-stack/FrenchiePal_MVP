import streamlit as st
import streamlit.components.v1 as components

# --- CONFIGURAZIONE ---
st.set_page_config(page_title="FrenchiePal - Startup", page_icon="🐾", layout="wide")

# CSS per nascondere l'interfaccia standard di Streamlit
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# --- CODICE HTML COMPLETO ---
landing_page_html = """
<!DOCTYPE html>
<html lang="it" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FrenchiePal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0F172A; color: #E2E8F0; overflow-x: hidden; }
        .glass-card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .gradient-text { background: linear-gradient(135deg, #818CF8 0%, #2DD4BF 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; display: inline-block; }
        .gradient-btn { background: linear-gradient(135deg, #6366F1 0%, #14B8A6 100%); }
        .gradient-btn:hover { background: linear-gradient(135deg, #4F46E5 0%, #0D9488 100%); box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4); }
        
        /* Animazione pulsante pericolo nel simulatore */
        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-danger { animation: pulse-red 2s infinite; border-color: #EF4444 !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
    </style>
</head>
<body>

    <nav class="fixed top-0 left-0 right-0 z-50 glass-card border-t-0 border-r-0 border-l-0 px-6 py-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center space-x-2">
                <span class="text-3xl">🐾</span>
                <span class="text-xl font-bold tracking-tight text-white">FrenchiePal</span>
            </div>
            <a href="#waitlist" class="hidden md:inline-block px-6 py-2.5 text-sm font-bold bg-white text-slate-900 rounded-full hover:bg-slate-200 transition shadow-lg">
                Unisciti alla Lista d'Attesa
            </a>
        </div>
    </nav>

    <section class="pt-32 pb-20 px-6 relative overflow-hidden">
        <div class="absolute top-20 left-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10"></div>
        <div class="absolute bottom-0 right-0 w-96 h-96 bg-teal-600/20 rounded-full blur-[120px] -z-10"></div>

        <div class="max-w-5xl mx-auto text-center relative z-10">
            <h1 class="text-5xl md:text-7xl font-extrabold leading-tight mb-8 text-white">
                Il tuo Frenchie è unico. <br>
                <span class="gradient-text">Anche i suoi rischi lo sono.</span>
            </h1>
            <p class="text-xl md:text-2xl text-slate-300 font-medium mb-2">
                Proteggi la sua schiena, il suo respiro e la sua pelle.
            </p>
            <p class="text-lg text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                FrenchiePal è il primo assistente intelligente dedicato esclusivamente alla gestione proattiva dei rischi IVDD, BAOS e delle dermatiti.
            </p>

            <a href="#waitlist" class="gradient-btn inline-flex items-center px-8 py-4 rounded-full text-lg font-bold text-white transition-all transform hover:scale-105 hover:shadow-xl">
                Unisciti alla Lista d'Attesa
                <i class="fas fa-arrow-right ml-3"></i>
            </a>
        </div>
    </section>

    <section class="py-20 px-6 bg-slate-900/50">
        <div class="max-w-7xl mx-auto relative">
             <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">Amare un Frenchie significa gestirne le fragilità.</h2>
                <p class="text-slate-400 max-w-xl mx-auto">La genetica nasconde tre nemici silenziosi che ogni proprietario deve conoscere.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-red-500 hover:border-red-500/40 transition relative group">
                    <div class="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-bone"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">Il Nemico della Schiena (IVDD)</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        I dischi spinali invecchiano precocemente. Un salto sbagliato dal divano può trasformarsi in un trauma improvviso con conseguenze gravi.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-wider">Rischio Paralisi</div>
                </div>

                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-teal-500 hover:border-teal-500/40 transition relative group">
                    <div class="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-lungs"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">Il Nemico del Respiro (BAOS)</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        "Russare forte" è fatica respiratoria. Il caldo e l'esercizio eccessivo possono diventare letali per un cane che fatica a raffreddarsi.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-teal-500/10 text-teal-300 text-xs font-bold uppercase tracking-wider">Rischio Colpo di Calore</div>
                </div>

                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-pink-500 hover:border-pink-500/40 transition relative group">
                    <div class="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-paw"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">Il Nemico della Pelle</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        La cute delicata e le pieghe sono terreno ideale per infezioni. Un prurito ignorato diventa un'otite cronica dolorosa.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-pink-500/10 text-pink-300 text-xs font-bold uppercase tracking-wider">Infezioni & Allergie</div>
                </div>
            </div>
        </div>
    </section>

    <section class="py-24 px-6 relative overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[150px] -z-10"></div>

        <div class="max-w-7xl mx-auto">
            <div class="text-center mb-20">
                <h2 class="text-4xl md:text-5xl font-extrabold mb-6 text-white">
                    Non un semplice monitoraggio. <br>
                    Un <span class="gradient-text">Consulente Proattivo.</span>
                </h2>
                <p class="text-slate-400 text-lg max-w-2xl mx-auto">
                    Le soluzioni generiche ti dicono <em>quanto</em> si è mosso. Noi ti diciamo <em>come</em> si è mosso, se è al sicuro e come sta davvero.
                </p>
            </div>

            <div class="grid md:grid-cols-3 gap-8">
                <div class="glass-card p-8 rounded-3xl text-center group hover:-translate-y-2 transition-all duration-300">
                    <div class="w-20 h-20 mx-auto bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 text-3xl mb-8 group-hover:scale-110 transition">
                        <i class="fas fa-shield-dog"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-4 text-white">1. IVDD Shield</h3>
                    <p class="text-slate-400 leading-relaxed">
                        Analizziamo la <strong>qualità</strong> del movimento. Monitoriamo l'impatto dei salti verticali per preservare la sua colonna vertebrale negli anni.
                    </p>
                </div>

                <div class="glass-card p-8 rounded-3xl text-center group hover:-translate-y-2 transition-all duration-300">
                    <div class="w-20 h-20 mx-auto bg-teal-500/20 rounded-3xl flex items-center justify-center text-teal-400 text-3xl mb-8 group-hover:scale-110 transition">
                        <i class="fas fa-temperature-arrow-up"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-4 text-white">2. Airway Guard</h3>
                    <p class="text-slate-400 leading-relaxed">
                        Incrociamo temperatura esterna e attività. Ti avvisiamo quando l'ambiente diventa rischioso per un brachicefalo prima che vada in affanno.
                    </p>
                </div>

                <div class="glass-card p-8 rounded-3xl text-center group hover:-translate-y-2 transition-all duration-300">
                    <div class="w-20 h-20 mx-auto bg-purple-500/20 rounded-3xl flex items-center justify-center text-purple-400 text-3xl mb-8 group-hover:scale-110 transition">
                        <i class="fas fa-brain"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-4 text-white">3. Daily Wellness & Derma</h3>
                    <p class="text-slate-400 leading-relaxed">
                        Monitoriamo l'insorgere di pruriti, ti ricordiamo la pulizia delle pieghe e l'alimentazione ideale. Un coach per la gestione quotidiana.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 px-6 bg-slate-900/50 border-y border-slate-800/50">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-bold mb-6 text-white">Perché un'app solo per i Bulldog Francesi?</h2>
            <p class="text-lg text-slate-300 leading-relaxed mb-8">
                Perché un Pastore Tedesco non rischia la paralisi saltando giù dal letto e non soffre se non gli pulisci le pieghe del muso. Il tuo Frenchie sì.
                <br>Noi crediamo che una razza speciale meriti una protezione specializzata.
            </p>
        </div>
    </section>

    <section class="py-24 px-6 relative flex flex-col items-center justify-center">
        <div class="text-center mb-16">
            <div class="inline-block px-4 py-1.5 mb-4 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-sm font-bold">
                📱 LIVE DEMO
            </div>
            <h2 class="text-4xl font-extrabold text-white mb-4">Provalo ora in tempo reale.</h2>
            <p class="text-slate-400">Tocca i pulsanti sullo schermo del telefono per simulare gli eventi.</p>
        </div>

        <div class="relative w-[340px] h-[720px] bg-white rounded-[45px] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col z-20">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 -z-10 pointer-events-none"></div>
            
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-30"></div>

            <div class="bg-slate-50 pt-12 pb-4 px-6 flex justify-between items-center border-b border-gray-100">
                <div>
                    <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</div>
                    <div id="status-text" class="text-lg font-extrabold text-gray-800">In Attesa...</div>
                </div>
                <div id="score-circle" class="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center font-bold text-gray-400">--</div>
            </div>

            <div class="p-4 bg-slate-50">
                <p class="text-[10px] text-gray-400 font-bold uppercase mb-2 pl-1">Simula un evento:</p>
                <div class="grid grid-cols-3 gap-2">
                    <button onclick="setScenario('wellness')" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-emerald-400 hover:bg-emerald-50 transition flex flex-col items-center group">
                        <span class="text-2xl mb-1 group-hover:scale-110 transition">💤</span>
                        <span class="text-[9px] font-bold text-gray-500">Wellness</span>
                    </button>
                    <button onclick="setScenario('derma')" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-pink-400 hover:bg-pink-50 transition flex flex-col items-center group">
                        <span class="text-2xl mb-1 group-hover:scale-110 transition">🐾</span>
                        <span class="text-[9px] font-bold text-gray-500">Dermatiti</span>
                    </button>
                    <button onclick="setScenario('danger')" class="p-2 rounded-xl bg-white border border-red-100 shadow-sm hover:bg-red-50 transition text-red-500 flex flex-col items-center group">
                        <span class="text-2xl mb-1 group-hover:scale-110 transition">🚨</span>
                        <span class="text-[9px] font-bold">Pericolo</span>
                    </button>
                </div>
            </div>

            <div id="chat-box" class="flex-1 bg-white p-4 overflow-y-auto no-scrollbar space-y-3">
                <div class="flex items-start gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div>
                    <div class="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600">
                        Ciao! Sono FrenchiePal. Tocca un pulsante sopra per vedere come ti proteggo.
                    </div>
                </div>
            </div>

            <div class="p-4 bg-gray-50 border-t border-gray-100">
                <div class="flex gap-2">
                    <input type="text" placeholder="Chiedi al coach..." disabled class="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm outline-none text-gray-400 cursor-not-allowed">
                    <button class="w-10 h-10 bg-indigo-600 rounded-full text-white flex items-center justify-center shadow-md opacity-50 cursor-not-allowed">
                        <i class="fas fa-paper-plane text-xs"></i>
                    </button>
                </div>
            </div>
        </div>
    </section>

    <section id="waitlist" class="py-24 px-6 relative">
        <div class="max-w-3xl mx-auto text-center glass-card p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-700">
            <h2 class="text-3xl md:text-4xl font-extrabold mb-4 text-white">Stiamo costruendo il futuro del benessere per i Frenchie.</h2>
            <p class="text-slate-400 text-lg mb-8">
                Siamo una startup in fase di sviluppo. Se vuoi seguire il nostro viaggio, darci feedback e essere tra i primi a provare FrenchiePal quando sarà pronto, lasciaci la tua email.
            </p>

            <form class="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input type="email" placeholder="La tua email migliore..." class="flex-1 bg-slate-900 border border-slate-700 rounded-full px-6 py-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition w-full shadow-inner">
                <button type="button" class="gradient-btn px-8 py-4 rounded-full font-bold text-white shrink-0 transition-all hover:shadow-lg hover:scale-105">
                    Tienimi aggiornato
                </button>
            </form>
            <p class="text-slate-500 text-sm mt-6">Nessuno spam. Solo aggiornamenti reali.</p>
        </div>
    </section>

    <footer class="py-8 text-center text-slate-600 text-sm border-t border-slate-800/50">
        <p>© 2026 FrenchiePal Startup. Tutti i diritti riservati.</p>
    </footer>

    <script>
        const scenarios = {
            wellness: { 
                text: 'Ottima Salute', 
                color: 'text-emerald-500', 
                border: 'border-emerald-500', 
                score: 98, 
                msg: "Tutto perfetto! Stitch riposa. Ricordati di pulire le pieghe del muso stasera. 🟢" 
            },
            derma: { 
                text: 'Allerta Pelle', 
                color: 'text-pink-400', 
                border: 'border-pink-400', 
                score: 72, 
                msg: "⚠️ Rilevato grattamento frequente all'orecchio destro. Controlla possibili arrossamenti o cattivo odore." 
            },
            danger: { 
                text: 'CRITICO', 
                color: 'text-red-600', 
                border: 'border-red-600', 
                score: 45, 
                msg: "🚨 STOP IMMEDIATO! Rilevati salti eccessivi e temperatura alta. Rischio IVDD e Colpo di Calore." 
            }
        };

        function setScenario(type) {
            const data = scenarios[type];
            
            // Aggiorna Testi e Colori
            const statusText = document.getElementById('status-text');
            statusText.innerText = data.text;
            statusText.className = `text-lg font-extrabold ${data.color}`;
            
            const circle = document.getElementById('score-circle');
            circle.innerText = data.score;
            circle.className = `w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold ${data.color} ${data.border} bg-white transition-all duration-300`;

            // Effetto Pulsazione per Pericolo
            const frame = document.querySelector('.relative.w-\\\\[340px\\\\]');
            if(type === 'danger') {
                frame.classList.add('pulse-danger');
            } else {
                frame.classList.remove('pulse-danger');
            }
            
            // Aggiungi messaggio chat simulato
            addMessage(data.msg);
        }

        function addMessage(text) {
            const box = document.getElementById('chat-box');
            const div = document.createElement('div');
            div.className = "flex items-start gap-2 animate-fade-in";
            div.innerHTML = `<div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div><div class="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600">${text}</div>`;
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        }
    </script>

</body>
</html>
"""

# Renderizza l'HTML a tutta pagina
components.html(landing_page_html, height=3500, scrolling=True)
