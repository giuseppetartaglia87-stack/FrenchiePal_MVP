import streamlit as st
from supabase import create_client, Client
import openai
import uuid
import hashlib
from datetime import datetime
import time

# --- CONFIGURAZIONE PAGINA & LAYOUT ---
st.set_page_config(page_title="FrenchiePal", page_icon="🐾", layout="centered")

# --- CSS INJECTION (IL TRUCCO PER LA GRAFICA MODERNA) ---
st.markdown("""
<style>
    /* 1. IMPORT FONT GOOGLE (Poppins) */
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap');

    html, body, [class*="css"]  {
        font-family: 'Poppins', sans-serif;
        background-color: #F4F6F9; /* Sfondo Grigio Moderno */
        color: #1E293B;
    }

    /* 2. RIMUOVERE SPAZI VUOTI INUTILI */
    .block-container {
        padding-top: 2rem;
        padding-bottom: 5rem;
    }
    header {visibility: hidden;}
    footer {visibility: hidden;}

    /* 3. STILE BOTTONI (SCENARI) */
    div.stButton > button {
        width: 100%;
        border: none;
        border-radius: 16px;
        padding: 15px 20px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* Hover effect */
    div.stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 15px rgba(0,0,0,0.1);
    }

    /* 4. CARDS (CONTAINER) */
    .app-card {
        background: white;
        border-radius: 24px;
        padding: 25px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        margin-bottom: 20px;
        text-align: center;
        border: 1px solid rgba(0,0,0,0.02);
    }

    /* 5. SCORE GRANDE */
    .score-circle {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        width: 120px;
        height: 120px;
        border-radius: 50%;
        border: 6px solid;
        font-size: 42px;
        font-weight: 800;
        margin-bottom: 10px;
    }

    /* 6. STATUS BADGE */
    .status-badge {
        display: inline-block;
        padding: 6px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 15px;
    }

    /* 7. CHAT BUBBLES */
    .stChatMessage {
        background-color: white;
        border-radius: 16px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.02);
        border: 1px solid #F1F5F9;
    }
    
    /* ANIMAZIONE PULSAZIONE (PER DANGER) */
    @keyframes pulse-red {
        0% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
        70% { box-shadow: 0 0 0 15px rgba(255, 82, 82, 0); }
        100% { box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
    }
    .pulse {
        animation: pulse-red 2s infinite;
    }

</style>
""", unsafe_allow_html=True)

# --- LOGICA BACKEND (SUPABASE & OPENAI) - QUESTA NON CAMBIA ---

# Connessione Supabase
try:
    supabase: Client = create_client(st.secrets["supabase"]["url"], st.secrets["supabase"]["key"])
    DB_ACTIVE = True
except Exception as e:
    st.error(f"Errore DB: {e}")
    DB_ACTIVE = False

# Connessione OpenAI
if "openai" in st.secrets:
    openai.api_key = st.secrets["openai"]["key"]
    AI_ACTIVE = True
else:
    AI_ACTIVE = False

# Sessione
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())
if 'scenario' not in st.session_state:
    st.session_state.scenario = "neutral" 
if 'messages' not in st.session_state:
    st.session_state.messages = []

# Funzioni Log
def log_event(event_type, metadata=None):
    if DB_ACTIVE:
        try:
            data = {"session_id": st.session_state.session_id, "event_type": event_type, "scenario_active": st.session_state.scenario, "metadata": metadata if metadata else {}}
            supabase.table("mba_events").insert(data).execute()
        except: pass

def log_chat(user_msg, ai_response):
    if DB_ACTIVE:
        try:
            data = {"session_id": st.session_state.session_id, "user_msg": user_msg, "ai_response": ai_response, "scenario_context": st.session_state.scenario}
            supabase.table("chat_logs").insert(data).execute()
        except: pass

def hash_email(email):
    return hashlib.sha256(email.encode().lower().strip()).hexdigest()

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
        except: return "⚠️ Errore AI."
    else: return "Simulazione: Manca API Key."

# --- INTERFACCIA UI/UX (RIDISEGNATA) ---

# Header Minimalista
c_logo, c_title = st.columns([1, 4])
with c_logo:
    st.image("https://img.icons8.com/3d-fluency/94/french-bulldog.png", width=70)
with c_title:
    st.markdown("<h2 style='margin:0; padding-top:10px;'>FrenchiePal</h2><p style='color:#64748B; margin:0;'>AI Guardian System</p>", unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# SELETTORE SCENARI (STILE APP NAVIGATION)
st.markdown("<p style='font-weight:600; color:#94A3B8; font-size:12px; letter-spacing:1px;'>SELEZIONA STATO SIMULAZIONE</p>", unsafe_allow_html=True)

# CSS specifico per colorare i bottoni diversamente
st.markdown("""
<style>
div.stButton > button:first-child { background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%); } /* Wellness */
div.row-widget.stButton:nth-of-type(2) > button { background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); } /* Derma */
div.row-widget.stButton:nth-of-type(3) > button { background: linear-gradient(135deg, #FF5252 0%, #D32F2F 100%); } /* Danger */
</style>
""", unsafe_allow_html=True)

c1, c2, c3 = st.columns(3)

with c1:
    if st.button("💤 WELLNESS"):
        st.session_state.scenario = "wellness"
        st.session_state.messages = []
        log_event("click_wellness")
with c2:
    if st.button("🐾 PRURITO"):
        st.session_state.scenario = "derma"
        st.session_state.messages = []
        log_event("click_derma")
with c3:
    if st.button("🚨 PERICOLO"):
        st.session_state.scenario = "danger"
        st.session_state.messages = []
        log_event("click_danger")
        log_event("emotional_peak")

# LOGICA VISUALIZZAZIONE DATI
score = "--"
theme_color = "#94A3B8"
status_text = "Seleziona uno scenario"
pulse_class = ""
intro_msg = "Ciao! Sono pronto a monitorare Stitch."

if st.session_state.scenario == "wellness":
    score = 98
    theme_color = "#4CAF50" # Verde Material
    status_text = "OTTIMA SALUTE"
    intro_msg = "☀️ **Tutto perfetto!** Stitch ha dormito 8 ore. Nessun fastidio cutaneo. Giornata ideale per una passeggiata!"
elif st.session_state.scenario == "derma":
    score = 72
    theme_color = "#FF9800" # Arancione Material
    status_text = "ALLERTA PELLE"
    intro_msg = "⚠️ **Rilevato fastidio.** Si gratta l'orecchio destro (15 volte/ora). Potrebbe essere un principio di otite."
elif st.session_state.scenario == "danger":
    score = 45
    theme_color = "#FF5252" # Rosso Material
    status_text = "RISCHIO CRITICO"
    pulse_class = "pulse"
    intro_msg = "🚨 **STOP IMMEDIATO!**\nSalti eccessivi (20) + Temperatura Alta (28°C).\nRischio combinato IVDD + Colpo di Calore."

# DASHBOARD CARD (DESIGN NUOVO)
st.markdown(f"""
<div class="app-card {pulse_class}" style="border-top: 5px solid {theme_color};">
    <div class="status-badge" style="background-color: {theme_color}20; color: {theme_color};">
        {status_text}
    </div>
    <br>
    <div class="score-circle" style="color: {theme_color}; border-color: {theme_color}; background-color: {theme_color}10;">
        {score}
    </div>
    <div style="color: #64748B; font-size: 14px; font-weight: 500;">Guardian Score</div>
    
    <div style="display: flex; justify-content: space-around; margin-top: 25px; border-top: 1px solid #F1F5F9; padding-top: 15px;">
        <div style="text-align: center;">
            <div style="font-size: 20px;">🦴</div>
            <div style="font-size: 10px; color: #94A3B8; font-weight: 600;">SCHIENA</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 20px;">🫁</div>
            <div style="font-size: 10px; color: #94A3B8; font-weight: 600;">RESPIRO</div>
        </div>
        <div style="text-align: center;">
            <div style="font-size: 20px;">💤</div>
            <div style="font-size: 10px; color: #94A3B8; font-weight: 600;">SONNO</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# CHAT INTERFACE
st.markdown("<h4 style='color:#1E293B;'>💬 AI Coach</h4>", unsafe_allow_html=True)

if not st.session_state.messages and st.session_state.scenario != "neutral":
    st.session_state.messages.append({"role": "assistant", "content": intro_msg})

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("Chiedi al coach...")
if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
    
    with st.chat_message("assistant"):
        with st.spinner("Analisi..."):
            reply = get_ai_response(user_input, st.session_state.scenario)
            st.markdown(reply)
    st.session_state.messages.append({"role": "assistant", "content": reply})
    log_chat(user_input, reply)

# LEAD GEN (Solo Danger)
if st.session_state.scenario == "danger":
    st.markdown("<br>", unsafe_allow_html=True)
    with st.form("lead"):
        st.markdown(f"<div style='background:#FEF2F2; padding:15px; border-radius:10px; border:1px solid #FECACA; color:#991B1B; font-size:14px;'>⚠️ <b>Nella realtà non c'è il tasto reset.</b><br>Proteggi Stitch prima che sia tardi.</div>", unsafe_allow_html=True)
        st.markdown("<br>", unsafe_allow_html=True)
        email = st.text_input("La tua email", placeholder="esempio@gmail.com")
        if st.form_submit_button("ENTRA IN LISTA D'ATTESA"):
            if email:
                log_event("lead_submitted", {"email_hash": hash_email(email)})
                st.success("Sei in lista!")
