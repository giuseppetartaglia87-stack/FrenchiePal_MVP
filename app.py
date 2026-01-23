import streamlit as st
from supabase import create_client, Client
import openai
import uuid
import hashlib
from datetime import datetime
import time

# --- CONFIGURAZIONE SECRETS (STREAMLIT CLOUD) ---
# Nel file .streamlit/secrets.toml o nelle impostazioni di Streamlit Cloud dovrai mettere:
# [supabase]
# url = "IL_TUO_PROJECT_URL"
# key = "LA_TUA_ANON_KEY"
# [openai]
# key = "LA_TUA_OPENAI_API_KEY"

# --- 1. SETUP CONNESSIONI ---
# Connessione Supabase
try:
    supabase: Client = create_client(st.secrets["supabase"]["url"], st.secrets["supabase"]["key"])
    DB_ACTIVE = True
except Exception as e:
    st.error(f"Errore connessione Supabase: {e}")
    DB_ACTIVE = False

# Connessione OpenAI
if "openai" in st.secrets:
    openai.api_key = st.secrets["openai"]["key"]
    AI_ACTIVE = True
else:
    AI_ACTIVE = False

# --- 2. SETUP SESSIONE UTENTE ---
if 'session_id' not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

if 'scenario' not in st.session_state:
    st.session_state.scenario = "neutral" # neutral, wellness, derma, danger

if 'messages' not in st.session_state:
    st.session_state.messages = []

# --- 3. FUNZIONI LOGGING (SUPABASE) ---
def log_event(event_type, metadata=None):
    if DB_ACTIVE:
        try:
            data = {
                "session_id": st.session_state.session_id,
                "event_type": event_type,
                "scenario_active": st.session_state.scenario,
                "metadata": metadata if metadata else {}
            }
            supabase.table("mba_events").insert(data).execute()
        except Exception as e:
            print(f"Log Error: {e}")

def log_chat(user_msg, ai_response):
    if DB_ACTIVE:
        try:
            data = {
                "session_id": st.session_state.session_id,
                "user_msg": user_msg,
                "ai_response": ai_response,
                "scenario_context": st.session_state.scenario
            }
            supabase.table("chat_logs").insert(data).execute()
        except:
            pass

def hash_email(email):
    return hashlib.sha256(email.encode().lower().strip()).hexdigest()

# --- 4. INTELLIGENZA CHATBOT (4 PILASTRI) ---
def get_ai_response(user_input, scenario):
    # DEFINIZIONE CONTESTO E VIBE
    if scenario == "wellness":
        context = "DATI: Sonno 95/100 (Ottimo), Grattate 0. CANE: Riposato."
        role = "Sei un Longevity Coach. Tono: Entusiasta, positivo. Fai i complimenti per la gestione."
    elif scenario == "derma":
        context = "DATI: Grattate orecchie 15x/ora (ALTO). Scuotimenti testa 3x. CANE: Fastidio."
        role = "Sei un Esperto Veterinario. Tono: Preoccupato ma calmo. Sospetta otite o allergia. Consiglia controllo orecchie."
    elif scenario == "danger":
        context = "DATI: Salti 20 (ROSSO), Temp 28°C (ROSSO). CANE: Rischio IVDD + BAOS."
        role = "Sei un Sistema di Emergenza. Tono: Allarmato, Direttivo. Ordina STOP immediato. Ignora chiacchiere."
    else:
        context = "Nessun dato."
        role = "Assistente generico."

    if AI_ACTIVE:
        try:
            response = openai.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": f"{role} CONTESTO SENSORI: {context}. Rispondi brevemente in italiano."},
                    {"role": "user", "content": user_input}
                ]
            )
            return response.choices[0].message.content
        except:
            return "⚠️ Errore AI."
    else:
        return "Simulazione: Risposta AI non disponibile (Manca Key)."

# --- 5. INTERFACCIA (VIBE: APP MODERNA) ---
st.set_page_config(page_title="FrenchiePal Guardian", page_icon="🐾", layout="centered")

# CSS Custom per look "App"
st.markdown("""
<style>
    .stApp {background-color: #FAFAFA;}
    div.stButton > button {width: 100%; border-radius: 15px; height: 55px; font-weight: bold; border:none; box-shadow: 0 2px 5px rgba(0,0,0,0.05);}
    .score-card {background: white; padding: 25px; border-radius: 25px; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.08); margin-bottom: 20px; transition: all 0.3s;}
    .big-score {font-size: 56px; font-weight: 900; line-height: 1;}
    .status-badge {display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 10px;}
    .pillar-icon {font-size: 20px; margin: 0 5px;}
</style>
""", unsafe_allow_html=True)

st.image("https://img.icons8.com/color/96/french-bulldog.png", width=60)
st.caption("FrenchiePal • AI Health & Longevity System")

st.markdown("#### Simula una situazione:")

# SELEZIONE SCENARI (4 PILASTRI)
c1, c2 = st.columns(2)
c3, c4 = st.columns(2)

if c1.button("💤 Wellness"):
    st.session_state.scenario = "wellness"
    st.session_state.messages = []
    log_event("click_scenario_wellness")
    
if c2.button("🐾 Dermatiti"):
    st.session_state.scenario = "derma"
    st.session_state.messages = []
    log_event("click_scenario_derma")

if c3.button("🦴 IVDD/BAOS"): # Danger
    st.session_state.scenario = "danger"
    st.session_state.messages = []
    log_event("click_scenario_danger")
    log_event("emotional_peak")

# LOGICA VISUALIZZAZIONE
score = "--"
bg_color = "white"
text_color = "#333"
status = "Scegli scenario"
msg_intro = "Attendo dati..."

if st.session_state.scenario == "wellness":
    score = 98
    text_color = "#2E7D32" # Verde
    status = "ECCELLENTE"
    msg_intro = "Buongiorno! ☀️ Stitch ha dormito 8 ore (Deep Sleep). Nessun prurito rilevato. Giornata perfetta per uscire!"
    
elif st.session_state.scenario == "derma":
    score = 75
    text_color = "#F57C00" # Arancione
    status = "ALLERTA PELLE"
    msg_intro = "⚠️ **Rilevato fastidio.** Si è grattato l'orecchio destro 15 volte nell'ultima ora. Controlla rossori (Possibile Otite)."

elif st.session_state.scenario == "danger":
    score = 45
    text_color = "#C62828" # Rosso
    status = "PERICOLO COMBINATO"
    msg_intro = "🚨 **STOP IMMEDIATO.**\nSalti eccessivi + Temperatura Alta.\nRischio Ernia e Colpo di Calore."

# DASHBOARD
st.markdown(f"""
<div class="score-card" style="border: 2px solid {text_color};">
    <div class="status-badge" style="background-color: {text_color}20; color: {text_color};">{status}</div>
    <div class="big-score" style="color: {text_color};">{score}</div>
    <div style="color: #888; font-size: 14px; margin-top: 5px;">Guardian Score</div>
    <hr style="margin: 15px 0; border-top: 1px solid #eee;">
    <div>
        <span class="pillar-icon" title="Schiena">🦴</span>
        <span class="pillar-icon" title="Respiro">🫁</span>
        <span class="pillar-icon" title="Pelle">🐾</span>
        <span class="pillar-icon" title="Sonno">💤</span>
    </div>
</div>
""", unsafe_allow_html=True)

# CHAT
st.subheader("💬 AI Coach")

# Intro msg se vuoto
if not st.session_state.messages and st.session_state.scenario != "neutral":
    st.session_state.messages.append({"role": "assistant", "content": msg_intro})

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("Scrivi al Coach...")

if user_input:
    st.session_state.messages.append({"role": "user", "content": user_input})
    with st.chat_message("user"):
        st.markdown(user_input)
    
    # Risposta AI
    with st.chat_message("assistant"):
        with st.spinner("Elaborazione dati biometrici..."):
            reply = get_ai_response(user_input, st.session_state.scenario)
            st.markdown(reply)
            
    st.session_state.messages.append({"role": "assistant", "content": reply})
    log_chat(user_input, reply)

# LEAD GEN (Solo Danger)
if st.session_state.scenario == "danger":
    st.divider()
    with st.form("lead"):
        st.warning("⚠️ Nella realtà non c'è il tasto Reset. Proteggilo oggi.")
        email = st.text_input("Email per lista d'attesa")
        if st.form_submit_button("MI ISCRIVO"):
            if email:
                email_hash = hash_email(email)
                log_event("lead_submitted", {"email_hash": email_hash})
                st.success("Sei in lista!")
