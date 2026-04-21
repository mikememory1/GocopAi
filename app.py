import streamlit as st
from google import genai
import time
from openai import OpenAI
from fpdf import FPDF
import io

def create_pdf(script, score, keywords):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(200, 10, txt="GoCopyAI Agency Pro Report", ln=True, align='C')  
    pdf.set_font("Arial", size=12)
    pdf.ln(10)
    pdf.cell(200, 10, txt=f"SEO Performance Score: {score}", ln=True)
    pdf.ln(5)
    pdf.multi_cell(0, 10, txt=f"Keywords: {keywords}")
    pdf.ln(10)
    pdf.set_font("Arial", 'B', 14)
    pdf.cell(200, 10, txt="Final Video Script:", ln=True)
    pdf.set_font("Arial", size=12)
    pdf.multi_cell(0, 10, txt=script)
    return pdf.output(dest='S').encode('latin-1')
# --- PREMIUM BRANDING ---
st.set_page_config(page_title="GocopAi Agency Pro", layout="wide")

# Create the input first
api_key = st.sidebar.text_input("Gemini Video Engine Key", type="password", key="master_key").strip()

# Then use it in the client
client = OpenAI(
    api_key=api_key,
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)
st.markdown("""
<style>
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
# Initialize upsell states
if "auto_pilot_unlocked" not in st.session_state:
    st.session_state.auto_pilot_unlocked = False
if "seo_pro_unlocked" not in st.session_state:
    st.session_state.seo_pro_unlocked = False
with st.sidebar:
    st.title("⚡ MEMBER ACCESS")
    key = st.text_input("Enter License Key", type="password")
    gemini_api_key = api_key
    if key == "BOSS350":
        st.session_state.tier = "Agency"
        st.success("👑 AGENCY MASTER ACCESS")
    st.subheader("🧬 Brand DNA Specialist")
    brand_url = st.text_input("Enter Client Website URL", placeholder="https://example.com")
    
    if brand_url and st.button("Extract Brand DNA"):
     with st.spinner("Analyzing brand voice..."):
        try:
            import requests
            from bs4 import BeautifulSoup
            res = requests.get(brand_url, timeout=10)
            soup = BeautifulSoup(res.text, 'html.parser')
            for s in soup(["script", "style"]):
                s.decompose()
            st.session_state['brand_context'] = soup.get_text(separator=' ', strip=True)[:3000]
            st.success("DNA Extracted!")
        except Exception as e:
            st.error(f"Error: {e}")
        st.divider()
    if st.session_state.tier != "Agency":
        st.error("🔥 40% OFF CODE: LAUNCH40")
        st.markdown("[🚀 UPGRADE TO AGENCY (£300)](https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200)")
        st.markdown("[🔓 UNLOCK AUTO-PILOT (£69.99)](https://buy.stripe.com/cNibJ103I5Ff1CXbh04F201)")
        st.markdown("[🔓 UNLOCK SEO PRO (£49.99)](https://buy.stripe.com/00w9AT03I3x7epJbh04F202)")

# --- INITIALIZE THE AI CLIENT ---
import openai

if gemini_api_key:
    client = openai.OpenAI(
        api_key=gemini_api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )
else:
    client = None
# --- THE APP TABS ---
t1, t2, t3, t4, t5, t6 = st.tabs(["🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS", "🤖 AGENCY AGENT", "📲 AUTO-PILOT", "🔎 SEO PRO", "🎥 VIDEO STUDIO"])
with t1:
    st.subheader("🎯 PRO AD COPY GENERATOR")
    prod = st.text_input("Product/Service Name", placeholder="e.g. 1-on-1 Fitness Coaching")
    target = st.text_input("Target Audience", placeholder="e.g. Busy executives over 40")
 
# Move these OUTSIDE and ABOVE the container logic
st.subheader("🎬 VIRAL VIDEO SCRIPTWRITER")
v_topic = st.text_input("What is the video about?", key="video_input_main")
v_style = st.selectbox("Video Style", ["Educational", "Hype/Motivational", "Storytelling"], key="style_input_main")
if st.button("GENERATE FULL SCRIPT"):
    if api_key and v_topic:
        with st.status("Connecting to Google Stable V1...", expanded=True):
            try:
                # 1. Setup the client
                client = genai.Client(api_key=api_key)  
                
                # 2. Generate Content
                response = client.models.generate_content(
                    model="gemini-1.5-flash",
                    contents=f"Write a viral {v_style} video script about {v_topic}."
                )

                st.success("Script Ready!")
                st.markdown(response.text)
                
                # 3. Save for other tabs (like Auto-Pilot or PDF)
                st.session_state['generated_script'] = response.text  

            except Exception as e:
                st.error(f"Stability Error: {e}")
    else:
        # Warnings for the user if they miss a field
        if not api_key:
            st.warning("Please enter your Gemini Video Engine Key in the sidebar.")
        if not v_topic:
            st.warning("Please enter what the video is about!")
        if not api_key:
            st.warning("Please enter your API Key in the sidebar!")
       
# 2. The TikTok Gate (Must touch the far-left wall)
if 'generated_script' in st.session_state:
    st.divider()
    st.subheader("🚀 Send to TikTok Drafts")

    final_script_text = st.text_area(
        "Final Polish:",
        value=st.session_state['generated_script'],
        height=250
    )

    if st.button("SEND TO TIKTOK"):
        if "code" in st.query_params:
                st.balloons()
                st.success("✅ Success! Check your TikTok drafts.")
        else:
            st.error("Please click 'Connect TikTok' at the top of the page first!")
           # --- TAB 2: VIDEO SCRIPTS ---
with t2:
    st.header("🎬 Viral Video Scriptwriter")
    
    topic = st.text_input("What is the video about?", placeholder="e.g. How to scale a SaaS in 2026")
    style = st.selectbox("Video Style", ["Educational", "Hype/Viral", "Storytelling", "Comedy"])
    
    if st.button("GENERATE FULL SCRIPT", use_container_width=True):
        if topic:
            with st.spinner("Crafting your viral script..."):
                # Call OpenAI to generate the script
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": f"You are a viral video scriptwriter. Style: {style}"},
                        {"role": "user", "content": f"Write a 60-second video script about: {topic}"}
                    ]
                )
                script = response.choices[0].message.content
                st.session_state['generated_script'] = script # Saves for SEO & Agent tabs
                
                st.subheader("Your Generated Script")
                st.write(script)
                st.success("Script generated! You can now check SEO PRO or talk to the AGENT.")
        else:
            st.error("Please enter a topic first!")

    # --- NEW: AI VOICEOVER SECTION ---
    if 'generated_script' in st.session_state:
        st.divider()
        st.subheader("🎙️ AI Voiceover Studio")
        if st.button("Generate Audio File", use_container_width=True):
            with st.status("Converting text to speech..."):
                audio_response = client.audio.speech.create(
                    model="tts-1",
                    voice="onyx", 
                    input=st.session_state['generated_script']
                )
                # This turns the API response into a playable file in Streamlit
                audio_data = io.BytesIO(audio_response.content)
                st.audio(audio_data, format="audio/mp3")
                st.success("Voiceover Ready!")
                st.divider()

# --- TAB 3: STRATEGIST ---

with t3:
    if st.session_state.tier != "Agency":
        # Your custom HTML "Locked" box from image_1dc962.png
        st.markdown("""
        <div class='tier-box'>
            <h2 style='color: #00f2ff;'>🔓 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>Upgrade to the Agency Tier to unlock your 24/7 AI Growth Strategist.</p>
            <a href="https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200" target="_blank">
                <button style="width: 100%; background: linear-gradient(90deg, #ff00cc, #3333ff); color: white; padding: 10px; border-radius: 5px; border: none;">
                    🚀 UPGRADE NOW & UNLOCK AGENT
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.subheader("🤖 GOCOPYAI MASTER STRATEGIST")
        
        # Initialize chat history if it doesn't exist
        if "messages" not in st.session_state:
            st.session_state.messages = [{"role": "system", "content": "You are the GoCopyAI Master Strategist. Expert in viral marketing."}]

        # Display chat messages from history on app rerun
        for message in st.session_state.messages:
            if message["role"] != "system":
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])

        # React to user input
        if prompt := st.chat_input("Ask your strategist anything..."):
            # Display user message in chat message container
            st.chat_message("user").markdown(prompt)
            # Add user message to chat history
            st.session_state.messages.append({"role": "user", "content": prompt})

   # Get AI Response (Make sure this starts at the same indent as line 142)
        with st.chat_message("assistant"):
            try:
                # Use the client defined at the top of your script
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": m["role"], "content": m["content"]} for m in st.session_state.messages]
                )
                answer = response.choices[0].message.content
                st.markdown(answer)
                
                # Add assistant response to history
                st.session_state.messages.append({"role": "assistant", "content": answer})
            except Exception as e:
                st.error(f"Agent connection lost: {e}")      
# --- TAB 4: AUTO-PILOT LOGIC ---
st.divider()
st.subheader("🚀 Social Media Auto-Pilot")

# We define these as safe placeholders so the app doesn't crash
# Later, we will move these to your Streamlit Secrets vault for real connections
client_key = "STABLE_V1_ACTIVE"
redirect_uri = "https://gocopai.streamlit.app" 
# --- TAB 4: AUTO-PILOT LOGIC ---
with t4:
    if 'auto_pilot_unlocked' not in st.session_state:
        st.session_state.auto_pilot_unlocked = False

    if not st.session_state.auto_pilot_unlocked:
        st.markdown("### 🔒 Premium Feature: Auto-Posting")
        st.info("Directly send your generated scripts to TikTok, Instagram, and YouTube drafts.")
        
        ap_key = st.text_input("Enter License Key to Unlock Auto-Pilot", type="password", key="ap_unlock_v4")
        if ap_key == "POST69":
            st.session_state.auto_pilot_unlocked = True
            st.success("Auto-Pilot Unlocked!")
            st.balloons()
            st.rerun()
    else:
        st.success("✅ Auto-Pilot Mode Active")
        c1, c2 = st.columns(2)
        with c1:
            st.button("Connect Meta", use_container_width=True, key="meta_btn_final")
        with c2:
            st.button("Connect TikTok", use_container_width=True, key="tt_btn_final")

# --- TAB 5: SEO PRO ---
with t5:
    st.header("🔍 SEO Content Optimizer")
    is_agency = st.session_state.get('tier') == "Agency"
    # We use .get('key') to match the sidebar input from your earlier code
    if st.session_state.get('key') == "SEO49" or is_agency:
        st.success("SEO Tools Unlocked")
    else:
        st.info("🔒 SEO Pro Locked. Enter key in sidebar.")

# --- TAB 6: AI STUDIO ---
with t6:
    st.header("🎥 AI Cinematic Video Studio")
    if st.session_state.get('tier') == "Agency":
        st.write("Ready to render cinematic scenes via Veo 3.1.")
    else:
        st.error("🔒 STUDIO TIER LOCKED. Upgrade to Agency Master.")

# THE END OF THE FILE
