import streamlit as st
from supabase import create_client, Client
import openai
import uuid
import hashlib

# --- 1. CONFIGURAZIONE PAGINA (FORCE LIGHT MODE) ---
st.set_page_config(
    page_title="FrenchiePal", 
    page_icon="🐾", 
    layout="centered", 
    initial_sidebar_state="collapsed"
)

# --- 2. CSS "IPHONE STYLE" (FORZATURA GRAFICA) ---
st.markdown("""
<style>
    /* Import Font Moderno */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    /* Reset Generale - Forza Sfondo Grigio Chiaro e Testo Scuro */
    .stApp {
        background-color: #F2F4F7;
        font-family: 'Inter', sans-serif;
    }
    
    /* Nascondi header Streamlit */
    header {visibility: hidden;}
    #MainMenu {visibility: hidden;}
    
    /* STILE CARD (Il riquadro bianco) */
    .css-1r6slb0, .css-12oz5g7 {
        background-color: white;
        border-radius: 20px;
        padding: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    
    /* BOTTONI SCENARIO (Stile Pillola) */
    div.stButton > button {
        width: 100%;
        border-radius: 15px;
        height: 55px;
        font-weight: 700;
        font-size: 14px;
        border: none;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        transition: transform 0.1s;
    }
    div.stButton > button:active {
        transform: scale(0.98);
    }

    /* METRICHE GRANDI */
    div[data-testid="stMetricValue"] {
        font-size: 42px;
        font-weight: 900;
    }
    div[data-testid="stMetricLabel"] {
        font-size: 14px;
        color: #64748B;
        font-weight: 600;
    }
    
    /* CHAT MESSAGES */
    .stChatMessage {
        background-color: white;
        border-radius: 15px;
        border: 1px solid #E5E7EB;
    }
    
    /* Container Bianco Personalizzato */
    .white-card {
        background-color: white;
        padding: 25px;
        border-radius: 24px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        text-align: center;
        margin-bottom: 20px;
    }
    
    /* Colori Status */
    .status-green { color: #16A34A; background-color: #DCFCE7; padding: 5px 10px; border-radius: 10px; font-weight:bold; font-size:12px; }
    .status-orange { color: #EA580C; background-color: #FFEDD5; padding: 5px 10px; border-radius: 10px; font-weight:bold; font-size:12px; }
    .status-red { color: #DC2626; background-color: #FEE2E2; padding: 5px 10px; border-radius: 10px; font-weight:bold; font-size:12px; }

</style>
""", unsafe_allow_html=True)

# --- 3. BACKEND (SUPABASE & AI) ---
try:
    supabase: Client = create_client(st.secrets["supabase"]["url"], st.secrets["supabase"]["key"])
    DB_ACTIVE = True
except:
    DB_ACTIVE = False

if "openai" in st.secrets:
    openai.api_key = st.secrets["openai"]["key"]
    AI_ACTIVE = True
else:
    AI_ACTIVE = False

if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'scenario' not in st.session_state:
    st.session_state.scenario = "neutral" 
if 'messages' not in st.session_state:
    st.session_state.messages = []

# --- 4. FUNZIONI LOGICHE ---
def log_event(event_type, metadata=None):
    if DB_ACTIVE:
        try:
            supabase.table("mba_events").insert({
                "session_id": st.session_state.session_id, 
                "event_type": event_type, 
                "scenario_active": st.session_state.scenario, 
                "metadata": metadata if metadata else {}
            }).execute()
        except: pass

def log_chat(user_msg, ai_response):
    if DB_ACTIVE:
        try:
            supabase.table("chat_logs").insert({
                "session_id": st.session_state.session_id, 
                "user_msg": user_msg, 
                "ai_response": ai_response, 
                "scenario_context": st.session_state.scenario
            }).execute()
        except: pass

def get_ai_response(user_input, scenario):
    if scenario == "wellness":
        role = "Sei un Longevity Coach per Frenchie. Tono: Entusiasta. Dati: Sonno 95/100."
    elif scenario == "derma":
        role = "Sei un Veterinario attento. Tono: Preoccupato. Dati: Grattate 15x/ora."
    elif scenario == "danger":
        role = "Sei un Sistema di Emergenza. Tono: Allarmato, Breve. Ordina STOP. Dati: Salti 20, Temp 28C."
    else:
        role = "Assistente generico."

    if AI_ACTIVE:
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "system", "content": role}, {"role": "user", "content": user_input}]
            )
            return response.choices[0].message.content
        except: return "⚠️ Errore AI (Controlla credito/chiavi)."
    else: return "Simulazione: Manca API Key."

# --- 5. INTERFACCIA UTENTE (DESIGN PULITO) ---

# HEADER
c1, c2 = st.columns([1, 5])
with c1:
    st.image("https://img.icons8.com/3d-fluency/94/french-bulldog.png", width=60)
with c2:
    st.markdown("<h2 style='margin:0; color:#1E293B; padding-top:10px;'>FrenchiePal</h2>", unsafe_allow_html=True)
    st.caption("AI Guardian System")

st.write("") # Spazio

# SELETTORE SCENARI
st.caption("SELEZIONA SCENARIO")
col_a, col_b, col_c = st.columns(3)

# Hack CSS per i colori dei bottoni
st.markdown("""
<style>
div.stButton > button:first-child { background: #DCFCE7; color: #166534; border: 1px solid #86EFAC; }
div.row-widget.stButton:nth-of-type(2) > button { background: #FFEDD5; color: #9A3412; border: 1px solid #FDBA74; }
div.row-widget.stButton:nth-of-type(3) > button { background: #FEE2E2; color: #991B1B; border: 1px solid #FCA5A5; }
</style>
""", unsafe_allow_html=True)

with col_a:
    if st.button("💤 Wellness"):
        st.session_state.scenario = "wellness"
        st.session_state.messages = []
        log_event("click_wellness")
with col_b:
    if st.button("🐾 Prurito"):
        st.session_state.scenario = "derma"
        st.session_state.messages = []
        log_event("click_derma")
with col_c:
    if st.button("🚨 Pericolo"):
        st.session_state.scenario = "danger"
        st.session_state.messages = []
        log_event("click_danger")

# LOGICA DASHBOARD
score = 0
delta_color = "normal"
status_html = ""
intro_text = "Seleziona uno scenario sopra."

if st.session_state.scenario == "wellness":
    score = 98
    delta_color = "normal" # Verde nativo
    status_html = "<span class='status-green'>ECCELLENTE</span>"
    intro_text = "☀️ **Tutto perfetto!** Stitch ha dormito 8 ore. Nessun prurito. Giornata ideale!"
elif st.session_state.scenario == "derma":
    score = 72
    delta_color = "off" # Grigio/Neutro (usiamo HTML per colore)
    status_html = "<span class='status-orange'>ALLERTA PELLE</span>"
    intro_text = "⚠️ **Rilevato fastidio.** Grattate frequenti all'orecchio destro. Possibile otite."
elif st.session_state.scenario == "danger":
    score = 45
    delta_color = "inverse" # Rosso nativo
    status_html = "<span class='status-red'>CRITICO</span>"
    intro_text = "🚨 **STOP IMMEDIATO!**\nRischio IVDD (Schiena) + Colpo di calore."

# DASHBOARD CARD (SENZA HTML COMPLESSO)
# Usiamo un container nativo così non si rompe
st.markdown("<br>", unsafe_allow_html=True)

with st.container():
    # Simuliamo la Card bianca col CSS applicato al container
    st.markdown(f"""
    <div class="white-card">
        {status_html}
        <h1 style="font-size: 60px; margin: 10px 0; color: #1E293B;">{score}</h1>
        <p style="color: #64748B; font-weight: 600;">Guardian Score</p>
        <hr style="border: 0; border-top: 1px solid #F1F5F9; margin: 20px 0;">
        <div style="display: flex; justify-content: space-around; width: 100%;">
            <div><span style="font-size:20px">🦴</span><br><span style="font-size:10px; color:#94A3B8; font-weight:bold">SCHIENA</span></div>
            <div><span style="font-size:20px">🫁</span><br><span style="font-size:10px; color:#94A3B8; font-weight:bold">RESPIRO</span></div>
            <div><span style="font-size:20px">💤</span><br><span style="font-size:10px; color:#94A3B8; font-weight:bold">SONNO</span></div>
        </div>
    </div>
    """, unsafe_allow_html=True)

# CHATBOT
st.markdown("#### 💬 Coach AI")

if not st.session_state.messages and st.session_state.scenario != "neutral":
    st.session_state.messages.append({"role": "assistant", "content": intro_text})

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("Chiedi al coach...")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
    
    with st.chat_message("assistant"):
        with st.spinner("..."):
            reply = get_ai_response(user_input, st.session_state.scenario)
            st.markdown(reply)
            
    st.session_state.messages.append({"role": "assistant", "content": reply})
    log_chat(user_input, reply)

# LEAD GEN FORM (DANGER)
if st.session_state.scenario == "danger":
    st.markdown("<br>", unsafe_allow_html=True)
    with st.form("lead_form"):
        st.error("⚠️ Proteggi Stitch prima che sia tardi.")
        email = st.text_input("Lascia la tua email")
        if st.form_submit_button("ENTRA IN LISTA D'ATTESA"):
            if email:
                log_event("lead_submitted", {"email_hash": hashlib.sha256(email.encode()).hexdigest()})
                st.success("Sei in lista!")
