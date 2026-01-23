import streamlit as st
import streamlit.components.v1 as components

# --- CONFIGURAZIONE ---
st.set_page_config(page_title="FrenchiePal - Startup", page_icon="🐾", layout="wide")
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# --- CODICE HTML ---
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

            <div class="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 md:p-8 mb-10 backdrop-blur-sm max-w-3xl mx-auto shadow-2xl">
                <p class="text-lg md:text-xl text-slate-300 leading-relaxed">
                    <strong class="text-white">Siamo una Startup</strong> che sta sviluppando la prima soluzione tecnologica dedicata esclusivamente al Bulldog Francese. 
                    <br><br>
                    Il nostro obiettivo è creare un <strong>Consulente Digitale</strong> per la gestione proattiva dei rischi, 
                    specializzato in <span class="text-indigo-400 font-bold">IVDD</span> (schiena), 
                    <span class="text-teal-400 font-bold">BAOS</span> (respiro) e 
                    <span class="text-pink-400 font-bold">Dermatiti</span>.
                    <br>Ti aiutiamo a intercettare i problemi prima che diventino emergenze.
                </p>
            </div>

            <a href="#waitlist" class="gradient-btn inline-flex items-center px-8 py-4 rounded-full text-lg font-bold text-white transition-all transform hover:scale-105 hover:shadow-xl">
                Tienimi aggiornato sugli sviluppi
                <i class="fas fa-arrow-right ml-3"></i>
            </a>
        </div>
    </section>

    <section class="py-20 px-6 bg-slate-900/50">
        <div class="max-w-7xl mx-auto relative">
             <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">Amare un Frenchie significa gestirne le fragilità.</h2>
                <p class="text-slate-400 max-w-xl mx-auto">La genetica non è un'opinione. Ecco i tre nemici silenziosi che la nostra app ti aiuta a combattere ogni giorno.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                
                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-red-500 hover:border-red-500/40 transition relative group">
                    <div class="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-bone"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">IVDD (Schiena)</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        I dischi spinali del Frenchie invecchiano precocemente. Un salto dal divano o troppe scale possono causare traumi improvvisi e paralisi.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-red-500/10 text-red-300 text-xs font-bold uppercase tracking-wider">Monitoraggio Salti</div>
                </div>

                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-teal-500 hover:border-teal-500/40 transition relative group">
                    <div class="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-lungs"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">BAOS (Respiro)</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        Il respiro affannoso non è "normale". Il caldo e l'esercizio eccessivo possono diventare letali in pochi minuti per un cane che non dissipa calore.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-teal-500/10 text-teal-300 text-xs font-bold uppercase tracking-wider">Alert Meteo + Attività</div>
                </div>

                <div class="glass-card p-8 rounded-3xl border-t-4 border-t-pink-500 hover:border-pink-500/40 transition relative group">
                    <div class="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-400 text-2xl mb-6 group-hover:scale-110 transition">
                        <i class="fas fa-paw"></i>
                    </div>
                    <h3 class="text-xl font-bold mb-3 text-white">Dermatiti & Otiti</h3>
                    <p class="text-slate-400 text-sm leading-relaxed mb-4">
                        La pelle delicata e le pieghe sono il terreno ideale per allergie e infezioni. Un prurito ignorato diventa un'otite cronica molto dolorosa.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-pink-500/10 text-pink-300 text-xs font-bold uppercase tracking-wider">Tracking Sintomi</div>
                </div>

            </div>
        </div>
    </section>

    <section class="py-24 px-6 relative overflow-hidden">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[150px] -z-10"></div>
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-bold mb-6 text-white">La nostra Proposta di Valore</h2>
            <p class="text-lg text-slate-300 leading-relaxed mb-10">
                Non offriamo un semplice tracker GPS. Offriamo un <strong>Sistema di Allerta Precoce</strong>.
                <br>FrenchiePal unisce dati biometrici e intelligenza artificiale per darti consigli proattivi, non solo grafici che non sai interpretare.
            </p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div class="text-2xl mb-2">🛡️</div>
                    <div class="text-xs font-bold text-slate-400">Prevenzione</div>
                </div>
                <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div class="text-2xl mb-2">🧠</div>
                    <div class="text-xs font-bold text-slate-400">AI Coach</div>
                </div>
                <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div class="text-2xl mb-2">📊</div>
                    <div class="text-xs font-bold text-slate-400">Dati Reali</div>
                </div>
                <div class="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div class="text-2xl mb-2">❤️</div>
                    <div class="text-xs font-bold text-slate-400">Longevità</div>
                </div>
            </div>
        </div>
    </section>

    <section id="waitlist" class="py-24 px-6 relative">
        <div class="max-w-3xl mx-auto text-center glass-card p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-700">
            <h2 class="text-3xl md:text-4xl font-extrabold mb-4 text-white">Costruiamo insieme il futuro.</h2>
            <p class="text-slate-400 text-lg mb-8">
                Siamo in fase di sviluppo attivo. Lasciaci la tua email per ricevere aggiornamenti sul lancio della Beta e consigli esclusivi per il tuo Frenchie.
            </p>

            <form class="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input type="email" placeholder="La tua email migliore..." required
                    class="flex-1 bg-slate-900 border border-slate-700 rounded-full px-6 py-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition w-full shadow-inner">
                <button type="submit" class="gradient-btn px-8 py-4 rounded-full font-bold text-white shrink-0 transition-all hover:shadow-lg hover:scale-105">
                    Tienimi aggiornato
                </button>
            </form>
            <p class="text-slate-500 text-sm mt-6">Zero spam. Solo aggiornamenti importanti.</p>
        </div>
    </section>

    <footer class="py-8 text-center text-slate-600 text-sm border-t border-slate-800/50">
        <p>© 2026 FrenchiePal Startup. Tutti i diritti riservati.</p>
    </footer>

</body>
</html>
"""

components.html(landing_page_html, height=2200, scrolling=True)
