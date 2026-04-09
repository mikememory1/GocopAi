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
    st.subheader("🎯 PRO AD COPY GENERATOR")
    prod = st.text_input("Product/Service Name", placeholder="e.g. 1-on-1 Fitness Coaching")
    target = st.text_input("Target Audience", placeholder="e.g. Busy executives over 40")
    
    if st.button("GENERATE AI ADS"):
        if prod and target:
            with st.status("Analyzing Market Psychology..."):
                client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an expert direct-response copywriter like Gary Halbert. Write high-converting ad copy."},
                        {"role": "user", "content": f"Write 3 different ad variations for {prod} targeting {target}. Include one 'Short & Punchy', one 'Story-based', and one 'List of Benefits'. Use emojis."}
                    ]
                )
                ad_results = response.choices[0].message.content
            st.success("Ads Ready!")
            st.markdown(ad_results)
        else:
            st.warning("Please fill in both fields.")

with t2:
    st.subheader("🎬 VIRAL VIDEO SCRIPTWRITER")
    v_topic = st.text_input("What is the video about?", key="video_input")
    v_style = st.selectbox("Video Style", ["Educational", "Hype/Motivation", "Storytelling", "Controversial"])
    
    if st.button("GENERATE FULL SCRIPT"):
        if v_topic:
            with st.status("Crafting Viral Narrative..."):
                client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a viral content specialist for TikTok and Reels."},
                        {"role": "user", "content": f"Write a professional 60-second video script about {v_topic} in a {v_style} style. Include visual cues in [brackets] and a powerful hook."}
                    ]
                )
                st.markdown(response.choices[0].message.content)
        else:
            st.warning("Enter a topic first.")

with t3:
    if st.session_state.tier != "Agency":
        st.markdown("""
        <div class="tier-box">
            <h2 style='color: #00f2ff;'>🔒 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>Upgrade to the Agency Tier to unlock your 24/7 AI Growth Strategist.</p>
            <p style="font-size: 28px; color: #ffffff;"><b>Price: £350.00</b></p>
            <a href="https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200" target="_blank">
                <button style="width: 100%; background: linear-gradient(90deg, #ff00cc, #3333ff); color: white; padding: 15px; border: none; border-radius: 10px; cursor: pointer; font-weight: bold;">
                    UPGRADE NOW & UNLOCK AGENT
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.subheader("🤖 GOCOPYAI MASTER STRATEGIST")
        client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])

        if "messages" not in st.session_state:
            st.session_state.messages = [{"role": "system", "content": "You are the GoCopyAI Master Strategist. Your goal is to help the user hit £10k/month. Give actionable, no-fluff advice."}]

        for message in st.session_state.messages:
            if message["role"] != "system":
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])

        if prompt := st.chat_input("Ask your strategist anything..."):
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
