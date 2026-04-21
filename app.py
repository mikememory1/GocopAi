import streamlit as st
from google import genai
import time
from openai import OpenAI
from fpdf import FPDF
import io
import requests
from bs4 import BeautifulSoup

# --- 1. UTILITY FUNCTIONS ---
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

# --- 2. PREMIUM BRANDING & CONFIG ---
st.set_page_config(page_title="GocopAi Agency Pro", layout="wide")

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

# --- 3. SESSION STATE & SIDEBAR ---
if 'tier' not in st.session_state: st.session_state.tier = "Standard"
if 'generated_script' not in st.session_state: st.session_state.generated_script = ""

with st.sidebar:
    st.title("⚡ MEMBER ACCESS")
    api_key = st.text_input("Gemini Video Engine Key", type="password", key="master_key").strip()
    license_key = st.text_input("Enter License Key", type="password")
    
    if license_key == "BOSS350":
        st.session_state.tier = "Agency"
        st.success("👑 AGENCY MASTER ACCESS")
    
    st.subheader("🧬 Brand DNA Specialist")
    brand_url = st.text_input("Enter Client Website URL", placeholder="https://example.com")
    
    if brand_url and st.button("Extract Brand DNA"):
        with st.spinner("Analyzing brand voice..."):
            try:
                res = requests.get(brand_url, timeout=10)
                soup = BeautifulSoup(res.text, 'html.parser')
                for s in soup(["script", "style"]): s.decompose()
                st.session_state['brand_context'] = soup.get_text(separator=' ', strip=True)[:3000]
                st.success("DNA Extracted!")
            except Exception as e:
                st.error(f"Error: {e}")
    
    if st.session_state.tier != "Agency":
        st.error("🔥 40% OFF CODE: LAUNCH40")
        st.markdown("[🚀 UPGRADE TO AGENCY (£300)](https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200)")

# --- 4. AI CLIENT SETUP ---
client = None
if api_key:
    client = OpenAI(
        api_key=api_key,
        base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
    )

# --- 5. THE APP TABS ---
t1, t2, t3, t4, t5, t6 = st.tabs(["🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS", "🤖 AGENCY AGENT", "📲 AUTO-PILOT", "🔎 SEO PRO", "🎥 VIDEO STUDIO"])

with t1:
    st.subheader("🎯 PRO AD COPY GENERATOR")
    prod = st.text_input("Product/Service Name", placeholder="e.g. 1-on-1 Fitness Coaching")
    target = st.text_input("Target Audience", placeholder="e.g. Busy executives over 40")
    
    if st.button("Generate Ad"):
        if api_key and prod and target:
            with st.spinner("Writing high-converting ad copy..."):
                try:
                    # Uses the client you defined at the top of the script
                    response = client.chat.completions.create(
                        model="gemini-1.5-flash",
                        messages=[
                            {"role": "system", "content": "You are an expert direct-response copywriter."},
                            {"role": "user", "content": f"Write a high-converting Facebook ad for {prod} targeting {target}."}
                        ]
                    )
                    
                    ad_text = response.choices[0].message.content
                    st.success("Ad Copy Generated!")
                    st.write(ad_text)
                    
                    # Optional: Add a copy button
                    st.button("Copy to Clipboard", on_click=lambda: st.write("Copied! (This is a placeholder for actual copy logic)"))
                    
                except Exception as e:
                    st.error(f"Ad Generation Error: {e}")
        else:
            st.warning("Please enter your API Key, Product Name, and Target Audience.")

with t2:
    st.subheader("🎬 VIRAL VIDEO SCRIPTWRITER")
    v_topic = st.text_input("What is the video about?", key="v_topic_input")
    v_style = st.selectbox("Video Style", ["Educational", "Hype/Motivational", "Storytelling"], key="v_style_input")
    
    if st.button("GENERATE FULL SCRIPT"):
        if api_key and v_topic:
            with st.status("Connecting via Google v1beta...", expanded=True):
                try:
                    # Logic fixed: Using genai for the specific Video Script Handshake
                    from google import genai
                    script_client = genai.Client(api_key=api_key, http_options={'api_version': 'v1beta'})
                    
                    response = script_client.models.generate_content(
                        model="models/gemini-1.5-flash",
                        contents=f"Write a viral {v_style} video script about {v_topic}."
                    )
                    
                    st.session_state.generated_script = response.text
                    st.success("Script Ready!")
                    st.markdown(response.text)
                except Exception as e:
                    st.error(f"Stability Error: {e}")
        else:
            st.warning("Please ensure API Key and Topic are filled!")

    if st.session_state.generated_script:
        st.divider()
        st.subheader("🎙️ AI Voiceover Studio")
        if st.button("Generate Audio File"):
            if client:
                with st.spinner("Converting to speech..."):
                    audio_response = client.audio.speech.create(
                        model="tts-1", voice="onyx", input=st.session_state.generated_script
                    )
                    st.audio(audio_response.content, format="audio/mp3")
            else:
                st.error("OpenAI Client not initialized.")

with t3:
    if st.session_state.tier != "Agency":
        st.markdown("<div class='tier-box'><h2>🔓 AGENT LOCKED</h2><p>Upgrade to Agency Tier.</p></div>", unsafe_allow_html=True)
    else:
        st.subheader("🤖 GOCOPYAI MASTER STRATEGIST")
        if "messages" not in st.session_state:
            st.session_state.messages = []
        
        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]): st.markdown(msg["content"])
            
        if prompt := st.chat_input("Ask your strategist..."):
            st.chat_message("user").markdown(prompt)
            st.session_state.messages.append({"role": "user", "content": prompt})
            if client:
                resp = client.chat.completions.create(model="gpt-3.5-turbo", messages=st.session_state.messages)
                answer = resp.choices[0].message.content
                st.chat_message("assistant").markdown(answer)
                st.session_state.messages.append({"role": "assistant", "content": answer})

with t4:
    st.subheader("🚀 Social Media Auto-Pilot")
    if license_key != "POST69" and st.session_state.tier != "Agency":
        st.info("🔒 Enter POST69 to unlock Auto-Pilot.")
    else:
        st.success("✅ Auto-Pilot Active")
        st.button("Connect TikTok")

with t5:
    st.header("🔍 SEO Content Optimizer")
    if st.session_state.tier == "Agency" or license_key == "SEO49":
        st.success("SEO Tools Unlocked")
    else:
        st.info("🔒 SEO Pro Locked.")

with t6:
    st.header("🎥 AI Cinematic Video Studio")
    if st.session_state.tier == "Agency":
        st.write("Ready to render cinematic scenes.")
    else:
        st.error("🔒 STUDIO TIER LOCKED.")
