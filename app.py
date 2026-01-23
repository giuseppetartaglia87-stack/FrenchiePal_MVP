import streamlit as st
from supabase import create_client, Client
import openai
import uuid
import hashlib
import time

# --- CONFIGURAZIONE PAGINA ---
st.set_page_config(page_title="FrenchiePal", page_icon="🐾", layout="centered", initial_sidebar_state="collapsed")

# --- CSS AVANZATO (GOOGLE STYLE) ---
st.markdown("""
<style>
    /* 1. FONT E COLORI GLOBALI */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
    
    html, body, [class*="css"]  {
        font-family: 'Inter', sans-serif;
        color: #1E293B !important; 
    }

    /* 2. NASCONDI ELEMENTI STREAMLIT INUTILI */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    .stDeployButton {display:none;}
    
    /* 3. CARD MODERNE CON OMBRA MORBIDA */
    .metric-card {
        background-color: white;
        border-radius: 20px;
        padding: 24px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.04);
        border: 1px solid #F1F5F9;
        text-align: center;
        margin-bottom: 20px;
        transition: transform 0.2s;
    }
    
    /* 4. BOTTONI SCENARIO PERSONALIZZATI */
    /* Resettiamo lo stile dei bottoni standard per renderli "Pillole" */
    div.stButton > button {
        width: 100%;
        border-radius: 12px;
        height: 50px;
        font-weight: 700;
        border: none;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        transition: all 0.3s;
    }

    /* 5. STILE CHAT */
    .stChatMessage {
        background-color: white;
        border: 1px solid #E2E8F0;
        box-shadow: 0 2px 5px rgba(0,0,0,0.02);
    }
    
    /* 6. ANIMAZIONE PULSAZIONE */
    @keyframes pulse-animation {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.7); }
        70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 82, 82, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 82, 82, 0); }
    }
    .pulse-danger {
        animation: pulse-animation 2s infinite;
        border: 2px solid #FF5252;
    }

</style>
""", unsafe_allow_html=True)

# --- BACKEND (NON MODIFICARE QUESTA PARTE) ---
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
        except: return "⚠️ Errore AI. (Controlla le chiavi o il credito)."
    else: return "Simulazione: Chatbot offline (Manca API Key)."

# --- INTERFACCIA UI (FRONTEND) ---

# 1. Header Pulito
c_logo, c_text = st.columns([1, 5])
with c_logo:
    st.image("https://img.icons8.com/3d-fluency/94/french-bulldog.png", width=60)
with c_text:
    st.markdown("<h2 style='margin-bottom:0; color:#1E293B;'>FrenchiePal</h2>", unsafe_allow_html=True)
    st.markdown("<p style='margin-top:0; color:#64748B; font-size:14px;'>Intelligent Biometric Guardian</p>", unsafe_allow_html=True)

st.divider()

# 2. Selettore Scenari (Bottoni Colorati)
st.markdown("<p style='font-size:12px; font-weight:700; color:#94A3B8; letter-spacing:1px; text-transform:uppercase;'>SIMULA CONTESTO</p>", unsafe_allow_html=True)

# Hack CSS per colorare i bottoni specifici
st.markdown("""
<style>
/* Bottone 1: Verde */
div.stButton > button:first-child { color: #166534; background-color: #DCFCE7; border: 1px solid #BBF7D0; }
div.stButton > button:first-child:hover { background-color: #BBF7D0; }
/* Bottone 2: Arancio */
div.row-widget.stButton:nth-of-type(2) > button { color: #9A3412; background-color: #FFEDD5; border: 1px solid #FED7AA; }
div.row-widget.stButton:nth-of-type(2) > button:hover { background-color: #FED7AA; }
/* Bottone 3: Rosso */
div.row-widget.stButton:nth-of-type(3) > button { color: #991B1B; background-color: #FEE2E2; border: 1px solid #FECACA; }
div.row-widget.stButton:nth-of-type(3) > button:hover { background-color: #FECACA; }
</style>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)
if col1.button("💤 Wellness"):
    st.session_state.scenario = "wellness"
    st.session_state.messages = []
    log_event("click_wellness")

if col2.button("🐾 Prurito"):
    st.session_state.scenario = "derma"
    st.session_state.messages = []
    log_event("click_derma")

if col3.button("🚨 Pericolo"):
    st.session_state.scenario = "danger"
    st.session_state.messages = []
    log_event("click_danger")

# 3. Dashboard Dinamica
score_val = "--"
status_text = "Seleziona uno scenario"
status_color = "#94A3B8"
pulse_css = ""
intro_msg = "Ciao! Seleziona uno scenario sopra per iniziare il test."

if st.session_state.scenario == "wellness":
    score_val = 98
    status_text = "SALUTE OTTIMA"
    status_color = "#22C55E" # Green 500
    intro_msg = "☀️ **Tutto perfetto!**\nStitch ha dormito 8 ore (Deep Sleep). Nessun prurito. Giornata ideale per il parco!"

elif st.session_state.scenario == "derma":
    score_val = 72
    status_text = "ALLERTA PELLE"
    status_color = "#F97316" # Orange 500
    intro_msg = "⚠️ **Rilevato fastidio.**\nSi sta grattando l'orecchio destro (15x/ora). Possibile inizio di otite."

elif st.session_state.scenario == "danger":
    score_val = 45
    status_text = "RISCHIO CRITICO"
    status_color = "#EF4444" # Red 500
    pulse_css = "pulse-danger"
    intro_msg = "🚨 **STOP IMMEDIATO!**\nRilevati 20 Salti + 28°C.\nRischio combinato IVDD e Colpo di Calore."

# Render HTML Card
st.markdown(f"""
<div class="metric-card {pulse_css}">
    <div style="font-size:12px; font-weight:800; color:{status_color}; letter-spacing:1px; margin-bottom:10px;">
        {status_text}
    </div>
    <div style="font-size:56px; font-weight:900; line-height:1; color:{status_color}; margin-bottom:5px;">
        {score_val}
    </div>
    <div style="font-size:14px; color:#64748B;">Guardian Score</div>
    
    <div style="margin-top:20px; padding-top:15px; border-top:1px solid #F1F5F9; display:flex; justify-content:space-around;">
        <span style="font-size:24px;" title="Schiena">🦴</span>
        <span style="font-size:24px;" title="Respiro">🫁</span>
        <span style="font-size:24px;" title="Pelle">🐾</span>
    </div>
</div>
""", unsafe_allow_html=True)

# 4. Chatbot
st.markdown("<h4 style='color:#334155; margin-bottom:15px;'>Coach AI</h4>", unsafe_allow_html=True)

if not st.session_state.messages and st.session_state.scenario != "neutral":
    st.session_state.messages.append({"role": "assistant", "content": intro_msg})

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("Chiedi consiglio...")
if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
    
    with st.chat_message("assistant"):
        with st.spinner("Analisi in corso..."):
            reply = get_ai_response(user_input, st.session_state.scenario)
            st.markdown(reply)
            
    st.session_state.messages.append({"role": "assistant", "content": reply})
    log_chat(user_input, reply)

# 5. Lead Gen (Solo Danger)
if st.session_state.scenario == "danger":
    st.markdown("<br>", unsafe_allow_html=True)
    with st.form("lead"):
        st.markdown("<div style='color:#991B1B; font-weight:600; font-size:14px;'>⚠️ Proteggi Stitch prima che sia tardi.</div>", unsafe_allow_html=True)
        email = st.text_input("Email", placeholder="tua@email.com")
        if st.form_submit_button("ENTRA IN LISTA D'ATTESA"):
            if email:
                log_event("lead_submitted", {"email_hash": hashlib.sha256(email.encode()).hexdigest()})
                st.success("Sei in lista!")
