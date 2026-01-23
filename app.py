import streamlit as st
import streamlit.components.v1 as components

# --- CONFIGURAZIONE SERVER ---
st.set_page_config(page_title="FrenchiePal", page_icon="🐾", layout="wide")

# CSS per nascondere l'interfaccia di Streamlit
st.markdown("""
<style>
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .block-container {padding: 0 !important; max-width: 100% !important;}
</style>
""", unsafe_allow_html=True)

# --- RECUPERO CHIAVI ---
try:
    SUPABASE_URL = st.secrets["supabase"]["url"]
    SUPABASE_KEY = st.secrets["supabase"]["key"]
    OPENAI_KEY = st.secrets["openai"]["key"]
except:
    SUPABASE_URL = ""
    SUPABASE_KEY = ""
    OPENAI_KEY = ""

# --- SITO COMPLETO (HTML/JS/TAILWIND) ---
website_code = f"""
<!DOCTYPE html>
<html lang="it" class="scroll-smooth">
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
        .glass-nav {{ background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid rgba(255, 255, 255, 0.1); }}
        .gradient-text {{ background: linear-gradient(135deg, #A78BFA 0%, #34D399 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
        
        /* Animazione pulsante pericolo */
        @keyframes pulse-red {{
            0% {{ box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }}
            70% {{ box-shadow: 0 0 0 20px rgba(239, 68, 68, 0); }}
            100% {{ box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }}
        }}
        .pulse-danger {{ animation: pulse-red 2s infinite; border-color: #EF4444 !important; }}
        .no-scrollbar::-webkit-scrollbar {{ display: none; }}
        .no-scrollbar {{ -ms-overflow-style: none; scrollbar-width: none; }}
    </style>
</head>
<body class="overflow-x-hidden">

    <nav class="fixed top-0 left-0 right-0 z-50 glass-nav px-6 py-4">
        <div class="max-w-7xl mx-auto flex justify-between items-center">
            <div class="flex items-center gap-2">
                <span class="text-2xl">🐾</span>
                <span class="text-xl font-bold tracking-tight">FrenchiePal</span>
            </div>
            
            <div class="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
                <a href="#home" class="hover:text-white transition">Home</a>
                <a href="#rischi" class="hover:text-white transition">I 3 Rischi</a>
                <a href="#simulatore" class="hover:text-white transition">Live Demo</a>
            </div>

            <a href="#waitlist" class="bg-white text-slate-900 px-5 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition shadow-lg">
                Unisciti
            </a>
        </div>
    </nav>

    <section id="home" class="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
        
        <div class="lg:w-1/2 z-10">
            <h1 class="text-5xl lg:text-7xl font-extrabold leading-tight mb-6">
                Il tuo Frenchie è unico. <br>
                <span class="gradient-text">Anche i suoi rischi lo sono.</span>
            </h1>

            <div class="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl mb-8 backdrop-blur-md">
                <p class="text-slate-300 leading-relaxed">
                    <strong class="text-white">Siamo una Startup</strong> che sta sviluppando il primo <strong>Consulente Digitale</strong> dedicato esclusivamente al Bulldog Francese. 
                    <br>Gestiamo proattivamente i rischi di <span class="text-indigo-400 font-bold">IVDD</span> (schiena), <span class="text-teal-400 font-bold">BAOS</span> (respiro) e <span class="text-orange-400 font-bold">Dermatiti</span>.
                </p>
            </div>
            
            <p class="text-slate-400 text-lg mb-8">
                Non crederci sulla parola. <strong>Prova il simulatore qui a destra</strong> 👉
                <br>Vedi come l'AI reagisce ai rischi reali.
            </p>

            <div class="flex gap-4">
                <a href="#rischi" class="px-6 py-3 rounded-full border border-slate-600 text-slate-300 font-bold hover:bg-slate-800 transition">Scopri i Rischi</a>
                <a href="#waitlist" class="px-6 py-3 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/30">Pre-ordina</a>
            </div>
        </div>

        <div id="simulatore" class="lg:w-1/2 flex justify-center relative">
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>

            <div class="relative w-[360px] h-[740px] bg-white rounded-[45px] border-[8px] border-slate-900 shadow-2xl overflow-hidden flex flex-col z-20">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-xl z-30"></div>

                <div class="bg-slate-50 pt-12 pb-4 px-6 flex justify-between items-center border-b border-gray-100">
                    <div>
                        <div class="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</div>
                        <div id="status-text" class="text-lg font-extrabold text-gray-800">In Attesa...</div>
                    </div>
                    <div id="score-circle" class="w-12 h-12 rounded-full border-4 border-gray-200 flex items-center justify-center font-bold text-gray-400">--</div>
                </div>

                <div class="p-4 bg-slate-50">
                    <p class="text-[10px] text-gray-400 font-bold uppercase mb-2">Simula un evento:</p>
                    <div class="grid grid-cols-3 gap-2">
                        <button onclick="setScenario('wellness')" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-emerald-400 hover:bg-emerald-50 transition group flex flex-col items-center">
                            <span class="text-2xl mb-1">💤</span>
                            <span class="text-[9px] font-bold text-gray-500">Wellness</span>
                        </button>
                        <button onclick="setScenario('derma')" class="p-2 rounded-xl bg-white border border-gray-100 shadow-sm hover:border-orange-400 hover:bg-orange-50 transition group flex flex-col items-center">
                            <span class="text-2xl mb-1">🐾</span>
                            <span class="text-[9px] font-bold text-gray-500">Dermatiti</span>
                        </button>
                        <button onclick="setScenario('danger')" class="p-2 rounded-xl bg-white border border-red-100 shadow-sm hover:bg-red-50 transition group text-red-500 flex flex-col items-center">
                            <span class="text-2xl mb-1">🚨</span>
                            <span class="text-[9px] font-bold">Pericolo</span>
                        </button>
                    </div>
                </div>

                <div id="chat-box" class="flex-1 bg-white p-4 overflow-y-auto no-scrollbar space-y-3">
                    <div class="flex items-start gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm">🤖</div>
                        <div class="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-sm text-gray-600">
                            Ciao! Tocca un pulsante sopra per vedere come proteggo Stitch.
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
    </section>

    <section id="rischi" class="py-20 px-6 bg-slate-900/50">
        <div class="max-w-7xl mx-auto">
             <div class="text-center mb-12">
                <h2 class="text-3xl font-bold mb-4">I 3 Nemici Silenziosi</h2>
                <p class="text-slate-400">La genetica non è un'opinione. Ecco cosa monitoriamo 24/7.</p>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div class="glass-panel p-8 rounded-3xl border-t-4 border-t-red-500 relative overflow-hidden group hover:bg-slate-800/50 transition">
                    <div class="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-400 text-xl mb-6"><i class="fas fa-bone"></i></div>
                    <h3 class="text-xl font-bold mb-2">IVDD (Schiena)</h3>
                    <p class="text-slate-400 text-sm">I dischi spinali invecchiano presto. Un salto dal divano può causare paralisi.</p>
                </div>
                <div class="glass-panel p-8 rounded-3xl border-t-4 border-t-teal-500 relative overflow-hidden group hover:bg-slate-800/50 transition">
                    <div class="w-12 h-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-400 text-xl mb-6"><i class="fas fa-lungs"></i></div>
                    <h3 class="text-xl font-bold mb-2">BAOS (Respiro)</h3>
                    <p class="text-slate-400 text-sm">Il caldo e l'esercizio eccessivo possono essere letali. Monitoriamo il rischio colpo di calore.</p>
                </div>
                <div class="glass-panel p-8 rounded-3xl border-t-4 border-t-orange-500 relative overflow-hidden group hover:bg-slate-800/50 transition">
                    <div class="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 text-xl mb-6"><i class="fas fa-paw"></i></div>
                    <h3 class="text-xl font-bold mb-2">Dermatiti</h3>
                    <p class="text-slate-400 text-sm">Pieghe e pelle delicata portano infezioni. Un prurito ignorato diventa un problema cronico.</p>
                </div>
            </div>
        </div>
    </section>

    <section id="waitlist" class="py-24 px-6 text-center">
        <div class="max-w-3xl mx-auto glass-panel p-12 rounded-[3rem]">
            <h2 class="text-3xl font-bold mb-4">Costruiamo il futuro insieme.</h2>
            <p class="text-slate-400 mb-8">Siamo in sviluppo. Lascia la mail per accedere alla Beta.</p>
            <div class="flex flex-col md:flex-row gap-4 max-w-md mx-auto">
                <input type="email" id="email-input" placeholder="La tua email..." class="flex-1 bg-slate-900 border border-slate-700 rounded-full px-6 py-3 text-white outline-none focus:border-indigo-500">
                <button onclick="saveLead()" class="bg-white text-slate-900 font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition">ISCRIVITI</button>
            </div>
            <p id="lead-status" class="mt-4 text-emerald-400 text-sm hidden font-bold">🎉 Sei in lista! Grazie.</p>
        </div>
        <footer class="mt-12 text-slate-600 text-sm">© 2026 FrenchiePal Startup.</footer>
    </section>

    <script>
        const SUPABASE_URL = "{SUPABASE_URL}";
        const SUPABASE_KEY = "{SUPABASE_KEY}";
        const OPENAI_KEY = "{OPENAI_KEY}";

        let supabase = null;
        if(SUPABASE_URL && SUPABASE_KEY) {{
            supabase = dev.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }}

        let currentScenario = 'neutral';
        const scenarios = {{
            wellness: {{ score: 98, text: 'Ottima Salute', color: 'text-emerald-500', border: 'border-emerald-500', prompt: "Sei un coach felice. Il cane sta benissimo." }},
            derma: {{ score: 72, text: 'Allerta Pelle', color: 'text-orange-500', border: 'border-orange-500', prompt: "Il cane si gratta le orecchie insistentemente. Sospetta otite o dermatite." }},
            danger: {{ score: 45, text: 'CRITICO', color: 'text-red-600', border: 'border-red-600', prompt: "URGENTE: FERMA IL CANE. Rischio IVDD e Colpo di calore. Sii breve e autoritario." }}
        }};

        function setScenario(type) {{
            currentScenario = type;
            const data = scenarios[type];
            
            document.getElementById('status-text').innerText = data.text;
            document.getElementById('status-text').className = `text-lg font-extrabold ${{data.color}}`;
            
            const circle = document.getElementById('score-circle');
            circle.innerText = data.score;
            circle.className = `w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold ${{data.color}} ${{data.border}} bg-white transition-all duration-500`;

            const frame = document.querySelector('.relative.w-\\\\[360px\\\\]');
            if(type === 'danger') {{
                frame.classList.add('pulse-danger');
                addMessage('assistant', "🚨 STOP IMMEDIATO! Rilevati salti eccessivi e temperatura alta.");
            }} else {{
                frame.classList.remove('pulse-danger');
                if(type === 'wellness') addMessage('assistant', "Tutto perfetto! Stitch riposa. 🟢");
                if(type === 'derma') addMessage('assistant', "⚠️ Noto che si gratta spesso l'orecchio destro. Controlliamo?");
            }}
            
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

        async function sendMessage() {{
            const input = document.getElementById('user-input');
            const text = input.value;
            if(!text) return;

            addMessage('user', text);
            input.value = '';

            if(OPENAI_KEY) {{
                try {{
                    const sysPrompt = currentScenario === 'neutral' ? "Sei un assistente." : scenarios[currentScenario].prompt;
                    const response = await fetch('https://api.openai.com/v1/chat/completions', {{
                        method: 'POST',
                        headers: {{ 'Content-Type': 'application/json', 'Authorization': `Bearer ${{OPENAI_KEY}}` }},
                        body: JSON.stringify({{
                            model: "gpt-3.5-turbo",
                            messages: [{{role: "system", content: sysPrompt + " Rispondi in italiano brevemente."}}, {{role: "user", content: text}}]
                        }})
                    }});
                    const data = await response.json();
                    if(data.choices) {{
                        addMessage('assistant', data.choices[0].message.content);
                        saveChat(text, data.choices[0].message.content);
                    }}
                }} catch(e) {{ addMessage('assistant', "Errore AI."); }}
            }} else {{
                setTimeout(() => addMessage('assistant', "Simulazione: Manca API Key."), 1000);
            }}
        }}

        async function logEvent(name) {{
            if(supabase) await supabase.from('mba_events').insert([{{ event_type: name, scenario_active: currentScenario }}]);
        }}
        async function saveChat(user, ai) {{
            if(supabase) await supabase.from('chat_logs').insert([{{ user_msg: user, ai_response: ai, scenario_context: currentScenario }}]);
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

components.html(website_code, height=2000, scrolling=True)
