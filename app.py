import streamlit as st
import streamlit.components.v1 as components

# --- CONFIGURAZIONE SERVER ---
st.set_page_config(page_title="FrenchiePal", page_icon="🐾", layout="wide")

# Nascondiamo l'interfaccia standard di Streamlit per sembrare un vero sito
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# --- RECUPERO CHIAVI DAI SECRETS (Streamlit Cloud) ---
# Assicurati che su Streamlit Cloud i secrets siano impostati!
try:
    SUPABASE_URL = st.secrets["supabase"]["url"]
    SUPABASE_KEY = st.secrets["supabase"]["key"]
    OPENAI_KEY = st.secrets["openai"]["key"]
except:
    # Fallback per evitare crash se non hai ancora messo le chiavi
    SUPABASE_URL = ""
    SUPABASE_KEY = ""
    OPENAI_KEY = ""

# --- IL SITO WEB COMPLETO (HTML + TAILWIND + JS) ---
# Questo è un "sito dentro il sito". Grafica al 100% personalizzata.
website_code = f"""
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FrenchiePal</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;500;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    
    <style>
        body {{ font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0F172A; color: white; }}
        .glass-panel {{ background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.1); }}
        .gradient-text {{ background: linear-gradient(135deg, #A78BFA 0%, #34D399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        
        /* Animazione pulsante pericolo */
        @keyframes pulse-red {{
            0% {{ box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }}
            70% {{ box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }}
            100% {{ box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }}
        }}
        .pulse-danger {{ animation: pulse-red 2s infinite; border-color: #EF4444 !important; }}
        
        /* Scrollbar nascosta per la chat */
        .no-scrollbar::-webkit-scrollbar {{ display: none; }}
        .no-scrollbar {{ -ms-overflow-style: none; scrollbar-width: none; }}
    </style>
</head>
<body class="overflow-x-hidden">

    <nav class="flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/20">🐶</div>
            <span class="text-xl font-bold tracking-tight">FrenchiePal</span>
        </div>
        <button onclick="document.getElementById('waitlist-section').scrollIntoView({{behavior: 'smooth'}})" class="bg-white text-slate-900 px-6 py-2 rounded-full font-bold hover:bg-gray-100 transition shadow-lg">
            Pre-ordina
        </button>
    </nav>

    <div class="flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto px-6 py-10 gap-12">
        
        <div class="lg:w-1/2 space-y-8 z-10">
            <div class="inline-block px-4 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold mb-4">
                🚀 MVP Live Demo
            </div>
            <h1 class="text-5xl lg:text-7xl font-extrabold leading-tight">
                Il Guardian Angel <br>
                <span class="gradient-text">del tuo Frenchie.</span>
            </h1>
            <p class="text-slate-400 text-lg leading-relaxed max-w-lg">
                L'unico ecosistema AI che previene i rischi vitali (IVDD, BAOS) e gestisce il benessere quotidiano. 
                <br><br>
                <strong class="text-white">Non crederci sulla parola. Provalo qui a destra. 👉</strong>
            </p>
            
            <div class="flex gap-4 pt-4">
                <div class="glass-panel p-4 rounded-2xl flex items-center gap-3">
                    <i class="fas fa-bone text-indigo-400 text-xl"></i>
                    <div>
                        <div class="text-xs text-slate-400 uppercase font-bold">Protezione</div>
                        <div class="font-bold">IVDD Shield</div>
                    </div>
                </div>
                <div class="glass-panel p-4 rounded-2xl flex items-center gap-3">
                    <i class="fas fa-lungs text-emerald-400 text-xl"></i>
                    <div>
                        <div class="text-xs text-slate-400 uppercase font-bold">Monitoraggio</div>
                        <div class="font-bold">Airway Guard</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="lg:w-1/2 flex justify-center relative">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            <div class="relative w-[360px] h-[720px] bg-white rounded-[45px] border-8 border-slate-900 shadow-2xl overflow-hidden flex flex-col z-20">
                
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-30"></div>

                <div class="bg-slate-50 pt-10 pb-4 px-6 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</div>
                        <div id="status-text" class="text-lg font-extrabold text-gray-800">In Attesa...</div>
                    </div>
                    <div id="score-circle" class="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center font-bold text-gray-400 transition-all duration-500">
                        --
                    </div>
                </div>

                <div class="p-4 grid grid-cols-3 gap-2 bg-slate-50">
                    <button onclick="setScenario('wellness')" class="p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-emerald-400 hover:bg-emerald-50 transition group">
                        <div class="text-2xl mb-1 group-hover:scale-110 transition">💤</div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase">Wellness</div>
                    </button>
                    <button onclick="setScenario('derma')" class="p-3 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-orange-400 hover:bg-orange-50 transition group">
                        <div class="text-2xl mb-1 group-hover:scale-110 transition">🐾</div>
                        <div class="text-[10px] font-bold text-gray-500 uppercase">Derma</div>
                    </button>
                    <button onclick="setScenario('danger')" class="p-3 rounded-xl bg-white border border-red-100 shadow-sm hover:bg-red-50 transition group text-red-500">
                        <div class="text-2xl mb-1 group-hover:scale-110 transition">🚨</div>
                        <div class="text-[10px] font-bold uppercase">Pericolo</div>
                    </button>
                </div>

                <div id="chat-box" class="flex-1 bg-white p-4 overflow-y-auto no-scrollbar space-y-3">
                    <div class="flex items-start gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div>
                        <div class="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600">
                            Ciao! Tocca uno dei pulsanti sopra per simulare una situazione reale.
                        </div>
                    </div>
                </div>

                <div class="p-4 bg-gray-50 border-t border-gray-100">
                    <div class="flex gap-2">
                        <input type="text" id="user-input" placeholder="Chiedi al coach..." class="flex-1 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-indigo-500 text-gray-800">
                        <button onclick="sendMessage()" class="w-10 h-10 bg-indigo-600 rounded-full text-white flex items-center justify-center shadow-md hover:bg-indigo-700 transition">
                            <i class="fas fa-paper-plane text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div id="waitlist-section" class="max-w-3xl mx-auto text-center py-20 px-6">
        <h2 class="text-3xl font-bold mb-4">Pronto per il lancio?</h2>
        <p class="text-slate-400 mb-8">Unisciti agli altri 2.400 proprietari in lista d'attesa.</p>
        <div class="flex gap-2 max-w-md mx-auto">
            <input type="email" id="email-input" placeholder="tua@email.com" class="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white outline-none focus:border-indigo-500">
            <button onclick="saveLead()" class="bg-white text-slate-900 font-bold px-6 rounded-lg hover:bg-gray-200 transition">ISCRIVITI</button>
        </div>
        <p id="lead-status" class="mt-4 text-sm text-emerald-400 hidden">🎉 Sei dentro! Ti aggiorneremo.</p>
    </div>

    <script>
        // --- 1. CONFIGURAZIONE CHIAVI (INJECTED DA PYTHON) ---
        const SUPABASE_URL = "{SUPABASE_URL}";
        const SUPABASE_KEY = "{SUPABASE_KEY}";
        const OPENAI_KEY = "{OPENAI_KEY}";

        // Init Supabase
        let supabase = null;
        if(SUPABASE_URL && SUPABASE_KEY) {{
            supabase = dev.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }}

        // Stato App
        let currentScenario = 'neutral';
        const scenarios = {{
            wellness: {{ score: 98, text: 'Ottima Salute', color: 'text-emerald-500', border: 'border-emerald-500', bg: 'bg-emerald-50', prompt: "Sei un coach felice. Il cane sta benissimo." }},
            derma: {{ score: 72, text: 'Allerta Pelle', color: 'text-orange-500', border: 'border-orange-500', bg: 'bg-orange-50', prompt: "Sei preoccupato. Il cane si gratta molto." }},
            danger: {{ score: 45, text: 'CRITICO', color: 'text-red-600', border: 'border-red-600', bg: 'bg-red-50', prompt: "URGENTE: FERMA IL CANE. Rischio IVDD e Colpo di calore. Sii breve e autoritario." }}
        }};

        // --- 2. FUNZIONI UI ---
        function setScenario(type) {{
            currentScenario = type;
            const data = scenarios[type];
            const chatBox = document.getElementById('chat-box');

            // Update Header
            document.getElementById('status-text').innerText = data.text;
            document.getElementById('status-text').className = `text-lg font-extrabold ${{data.color}}`;
            
            const circle = document.getElementById('score-circle');
            circle.innerText = data.score;
            circle.className = `w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold ${{data.color}} ${{data.border}} bg-white transition-all duration-500`;

            // Effetto Pericolo
            const frame = document.querySelector('.relative.w-\\\\[360px\\\\]');
            if(type === 'danger') {{
                frame.classList.add('pulse-danger');
                addMessage('assistant', "🚨 STOP IMMEDIATO! Rilevati salti eccessivi e temperatura alta. Ferma il cane.");
            }} else {{
                frame.classList.remove('pulse-danger');
                if(type === 'wellness') addMessage('assistant', "Tutto perfetto! Stitch riposa. 🟢");
                if(type === 'derma') addMessage('assistant', "⚠️ Noto che si gratta spesso l'orecchio destro. Controlla.");
            }}
            
            // Log Event
            logEvent('click_scenario_' + type);
        }}

        function addMessage(role, text) {{
            const box = document.getElementById('chat-box');
            const div = document.createElement('div');
            div.className = role === 'user' ? "flex justify-end" : "flex items-start gap-2";
            
            if(role === 'user') {{
                div.innerHTML = `<div class="bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none text-sm shadow-md">${{text}}</div>`;
            }} else {{
                div.innerHTML = `<div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div><div class="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600">${{text}}</div>`;
            }}
            box.appendChild(div);
            box.scrollTop = box.scrollHeight;
        }}

        // --- 3. LOGICA AI & DATABASE ---
        async function sendMessage() {{
            const input = document.getElementById('user-input');
            const text = input.value;
            if(!text) return;

            addMessage('user', text);
            input.value = '';

            // OpenAI Call
            if(OPENAI_KEY) {{
                try {{
                    const sysPrompt = currentScenario === 'neutral' ? "Sei un assistente." : scenarios[currentScenario].prompt;
                    
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json', 'Authorization': `Bearer ${{OPENAI_KEY}}` }},
                        body: JSON.stringify({{
                            model: "gpt-3.5-turbo",
                            messages: [
                                {{role: "system", content: sysPrompt + " Rispondi in italiano brevemente."}},
                                {{role: "user", content: text}}
                            ]
                        }})
                    }});
                    const data = await response.json();
                    if(data.choices) {{
                        const reply = data.choices[0].message.content;
                        addMessage('assistant', reply);
                        saveChat(text, reply);
                    }}
                }} catch(e) {{
                    addMessage('assistant', "Errore connessione AI.");
                }}
            }} else {{
                setTimeout(() => addMessage('assistant', "Simulazione: Configura la API Key per chattare davvero."), 1000);
            }}
        }}

        // Analytics functions
        async function logEvent(name) {{
            if(supabase) {{
                await supabase.from('mba_events').insert([{{ event_type: name, scenario_active: currentScenario }}]);
            }}
        }}

        async function saveChat(user, ai) {{
            if(supabase) {{
                await supabase.from('chat_logs').insert([{{ user_msg: user, ai_response: ai, scenario_context: currentScenario }}]);
            }}
        }}
        
        async function saveLead() {{
            const email = document.getElementById('email-input').value;
            if(email && supabase) {{
                await supabase.from('mba_events').insert([{{ event_type: 'lead_submitted', metadata: {{email: email}} }}]);
                document.getElementById('lead-status').classList.remove('hidden');
                document.getElementById('email-input').value = '';
            }}
        }}

    </script>
</body>
</html>
"""

# RENDERIZZA IL SITO A TUTTO SCHERMO
components.html(website_code, height=1200, scrolling=True)
