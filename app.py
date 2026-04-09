import streamlit as st
import time
from openai import OpenAI
# --- PREMIUM BRANDING ---
st.set_page_config(page_title="GocopAi Agency Pro", layout="wide")

st.markdown("""
    <style>
    .main { background-color: #050505; color: white; }
    h1, h2, h3 { color: #00f2ff !important; font-family: 'Inter', sans-serif; text-transform: uppercase; }
    .stButton>button { 
        background: linear-gradient(90deg, #00f2ff, #0072ff); 
        color: white; border-radius: 12px; font-weight: bold; border: none; height: 3.5rem;
    }
    .tier-box { padding: 20px; border: 1px solid #333; border-radius: 15px; background: #111; text-align: center; }
    </style>
    """, unsafe_allow_html=True)

# --- THE SALES ENGINE ---
if 'tier' not in st.session_state: st.session_state.tier = "Standard"

with st.sidebar:
    st.title("⚡ MEMBER ACCESS")
    key = st.text_input("Enter License Key", type="password")
    
    if key == "BOSS350":
        st.session_state.tier = "Agency"
        st.success("👑 AGENCY MASTER ACCESS")
    
    st.divider()
    if st.session_state.tier != "Agency":
        st.error("🔥 40% OFF CODE: LAUNCH40")
        st.markdown("[🚀 UPGRADE TO AGENCY (£350)](https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200)") 

# --- THE APP TABS ---
t1, t2, t3 = st.tabs(["🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS", "🤖 BUSINESS AGENT"])

with t1:
    st.subheader("🚀 AD GENERATOR")
    prod = st.text_input("Product Name", placeholder="e.g. Luxury Watch")
    if st.button("RUN AD STRATEGY"):
        with st.status("Analyzing Market Psychology..."):
            time.sleep(1.5)
        st.success("Ad Script Generated!")
        st.code(f"HOOK: Why {prod} is the #1 choice in 2026. \nCTA: Link in Bio.")

with t2:
    st.subheader("🎬 AI VIDEO SCRIPT GENERATOR (PRO)")
    v_topic = st.text_input("What is the video topic?", placeholder="e.g. 3 ways to get clients with cold DMing")
    
    if st.button("GENERATE FULL SCRIPT"):
        if v_topic:
            with st.status("AI is writing your viral script..."):
                # This calls OpenAI just like your Business Agent does
                client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a viral TikTok and Reel scriptwriter. Write engaging, high-retention scripts with visual cues."},
                        {"role": "user", "content": f"Write a 60-second viral video script about: {v_topic}. Include a strong hook, 3 value points, and a CTA."}
                    ]
                )
                full_script = response.choices[0].message.content
            
            st.success("Script Generated!")
            st.markdown("---")
            st.markdown(full_script) # This will now show the full AI response
        else:
            st.warning("Please enter a topic first.")

with t3:
    if st.session_state.tier != "Agency":
        st.markdown("""
        <div class="tier-box">
            <h2>🔒 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>Upgrade to unlock your AI Strategy Agent and automate your growth.</p>
            <p style="font-size: 24px; color: #00f2ff;"><b>Price: £350.00</b></p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.subheader("🤖 GOCOPYAI STRATEGY AGENT")
        client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

        if "messages" not in st.session_state:
            st.session_state.messages = [{"role": "system", "content": "You are a master agency strategist."}]

        for message in st.session_state.messages:
            if message["role"] != "system":
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])

        if prompt := st.chat_input("How can I help you scale?"):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            with st.chat_message("assistant"):
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=st.session_state.messages
                )
                answer = response.choices[0].message.content
                st.markdown(answer)
                st.session_state.messages.append({"role": "assistant", "content": answer})
