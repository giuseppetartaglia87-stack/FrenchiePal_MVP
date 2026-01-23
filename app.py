import streamlit as st
import streamlit.components.v1 as components

# --- CONFIGURAZIONE PAGINA STREAMLIT ---
# Impostiamo il layout su "wide" e nascondiamo l'interfaccia nativa di Streamlit
st.set_page_config(page_title="FrenchiePal - The French Bulldog Guardian", page_icon="🐾", layout="wide")
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    /* Rimuove i margini bianchi standard di Streamlit */
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# --- CODICE HTML/TAILWIND DELLA LANDING PAGE ---
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
        /* Impostazioni Base di Stile */
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: #0F172A; /* Sfondo Scuro (Slate 900) */
            color: #E2E8F0; /* Testo Chiaro (Slate 200) */
            overflow-x: hidden;
        }
        /* Effetto Vetro (Glassmorphism) per le card */
        .glass-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        /* Testo con Gradiente */
        .gradient-text {
            background: linear-gradient(135deg, #818CF8 0%, #2DD4BF 100%); /* Indigo to Teal */
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            display: inline-block;
        }
        /* Bottone con Gradiente */
        .gradient-btn {
            background: linear-gradient(135deg, #6366F1 0%, #14B8A6 100%);
        }
        .gradient-btn:hover {
            background: linear-gradient(135deg, #4F46E5 0%, #0D9488 100%);
            box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4);
        }
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

        <div class="max-w-4xl mx-auto text-center relative z-10">
            <div class="inline-block px-4 py-1.5 mb-6 rounded-full bg-slate-800 border border-slate-700 text-sm font-medium text-indigo-300">
                🚀 Startup in sviluppo
            </div>
            <h1 class="text-5xl md:text-7xl font-extrabold leading-tight mb-6 text-white">
                Il tuo Frenchie è unico. <br>
                <span class="gradient-text">Anche i suoi rischi lo sono.</span>
            </h1>
            <p class="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
                Proteggi la sua schiena e il suo respiro prima che sia tardi. 
                FrenchiePal è il primo assistente intelligente dedicato alla gestione proattiva dei rischi IVDD e BAOS.
            </p>
            <a href="#waitlist" class="gradient-btn inline-flex items-center px-8 py-4 rounded-full text-lg font-bold text-white transition-all transform hover:scale-105">
                Tienimi aggiornato sugli sviluppi
                <i class="fas fa-arrow-right ml-3"></i>
            </a>
        </div>
    </section>

    <section class="py-20 px-6 bg-slate-900/50">
        <div class="max-w-6xl mx-auto relative">
             <div class="text-center mb-16">
                <h2 class="text-3xl md:text-4xl font-bold mb-4 text-white">Amare un Frenchie significa gestirne le fragilità.</h2>
                <p class="text-slate-400 max-w-xl mx-auto">La loro genetica nasconde due nemici silenziosi che ogni proprietario deve conoscere. L'ignoranza è il rischio maggiore.</p>
            </div>

            <div class="grid md:grid-cols-2 gap-8">
                <div class="glass-card p-8 rounded-3xl border-red-500/20 hover:border-red-500/40 transition relative overflow-hidden">
                    <div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                    <div class="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center text-red-400 text-2xl mb-6">
                        <i class="fas fa-bone"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 text-white">Il Nemico della Schiena (IVDD)</h3>
                    <p class="text-slate-400 mb-4">
                        I loro dischi spinali invecchiano precocemente. Un salto sbagliato dal divano non è solo un gioco, può trasformarsi in un trauma improvviso con conseguenze gravi e costose.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-red-500/10 text-red-300 text-sm font-bold">Rischio Paralisi</div>
                </div>

                <div class="glass-card p-8 rounded-3xl border-orange-500/20 hover:border-orange-500/40 transition relative overflow-hidden">
                     <div class="absolute top-0 right-0 -mt-10 -mr-10 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
                    <div class="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 text-2xl mb-6">
                        <i class="fas fa-lungs"></i>
                    </div>
                    <h3 class="text-2xl font-bold mb-3 text-white">Il Nemico del Respiro (BAOS)</h3>
                    <p class="text-slate-400 mb-4">
                        "Russare forte" non è carino, è fatica respiratoria. Il caldo e l'esercizio eccessivo possono diventare letali in pochi minuti per un cane che fatica a raffreddarsi.
                    </p>
                    <div class="inline-block px-3 py-1 rounded-lg bg-orange-500/10 text-orange-300 text-sm font-bold">Rischio Colpo di Calore</div>
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
                <p class="text-slate-400 text-lg max-w-2xl mx-auto">Le soluzioni generiche ti dicono <em>quanto</em> si è mosso. Noi ti diciamo <em>come</em> si è mosso e se è al sicuro.</p>
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
                    <h3 class="text-xl font-bold mb-4 text-white">3. Longevity Coach</h3>
                    <p class="text-slate-400 leading-relaxed">
                        Un'IA verticale sulla razza per la gestione quotidiana: controllo del peso, gestione dello stress e dermatiti. Consigli su misura, ogni giorno.
                    </p>
                </div>
            </div>
        </div>
    </section>

    <section class="py-20 px-6 bg-slate-900/50 border-y border-slate-800/50">
        <div class="max-w-4xl mx-auto text-center">
            <h2 class="text-3xl font-bold mb-6 text-white">Perché un'app solo per i Bulldog Francesi?</h2>
            <p class="text-lg text-slate-300 leading-relaxed mb-8">
                Perché un Pastore Tedesco non rischia la paralisi saltando giù dal letto. Il tuo Frenchie sì.
                <br>Le app generiche trattano tutti i cani allo stesso modo. Noi crediamo che una razza speciale meriti una protezione specializzata.
            </p>
            <div class="text-5xl">🐾</div>
        </div>
    </section>

    <section id="waitlist" class="py-24 px-6 relative">
        <div class="max-w-3xl mx-auto text-center glass-card p-10 md:p-16 rounded-[3rem]">
            <h2 class="text-3xl md:text-4xl font-extrabold mb-4 text-white">Stiamo costruendo il futuro del benessere per i Frenchie.</h2>
            <p class="text-slate-400 text-lg mb-10">
                Siamo una startup in fase di sviluppo. Lasciaci la tua email per seguire il viaggio, darci feedback ed essere tra i primi a provare FrenchiePal. Nessuno spam, promesso.
            </p>

            <form class="flex flex-col md:flex-row gap-4 max-w-xl mx-auto">
                <input type="email" placeholder="La tua email migliore..." required
                    class="flex-1 bg-slate-800 border border-slate-700 rounded-full px-6 py-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition w-full">
                <button type="submit" class="gradient-btn px-8 py-4 rounded-full font-bold text-white shrink-0 transition-all hover:shadow-lg hover:scale-105">
                    Tienimi aggiornato
                </button>
            </form>
            <p class="text-slate-500 text-sm mt-6">Unendoti accetti di ricevere aggiornamenti sullo sviluppo del prodotto.</p>
        </div>
    </section>

    <footer class="py-8 text-center text-slate-500 text-sm">
        <p>© 2026 FrenchiePal Startup. Tutti i diritti riservati.</p>
    </footer>

</body>
</html>
"""

# Renderizza l'HTML a tutta pagina
components.html(landing_page_html, height=1600, scrolling=True)
