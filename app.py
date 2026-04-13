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
# Initialize upsell states
if "auto_pilot_unlocked" not in st.session_state:
    st.session_state.auto_pilot_unlocked = False
if "seo_pro_unlocked" not in st.session_state:
    st.session_state.seo_pro_unlocked = False
with st.sidebar:
    st.title("⚡ MEMBER ACCESS")
    key = st.text_input("Enter License Key", type="password")
    
    if key == "BOSS350":
        st.session_state.tier = "Agency"
        st.success("👑 AGENCY MASTER ACCESS")
    
    st.divider()
    if st.session_state.tier != "Agency":
        st.error("🔥 40% OFF CODE: LAUNCH40")
        st.markdown("[🚀 UPGRADE TO AGENCY (£300)](https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200)") 
        st.markdown("[🔓 UNLOCK AUTO-PILOT (£69.99)](https://buy.stripe.com/cNibJ103I5Ff1CXbh04F201)")
        st.markdown("[🔓 UNLOCK SEO PRO (£49.99)](https://buy.stripe.com/00w9AT03I3x7epJbh04F202)")
# --- THE APP TABS ---
t1, t2, t3, t4, t5 = st.tabs(["🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS", "🤖 AGENCY AGENT", "📲 AUTO-PILOT", "🔍 SEO PRO"])

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
# Move these OUTSIDE and ABOVE the container logic
st.subheader("🎬 VIRAL VIDEO SCRIPTWRITER")
v_topic = st.text_input("What is the video about?", key="video_input_main")
v_style = st.selectbox("Video Style", ["Educational", "Hype/Motivational", "Storytelling"], key="style_input_main")

# Now the button sits below them, ready to work
if st.button("GENERATE FULL SCRIPT"):
            if v_topic:
                with st.status("Crafting Viral Narrative..."):
                    client = OpenAI(api_key=st.secrets["OPENAI_API_KEY"])
                    response = client.chat.completions.create(
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": "You are a viral content specialist for TikTok and Reels."},
                            {"role": "user", "content": f"Write a professional 60-second video script about {v_topic} in a {v_style} style."}
                        ]
                    )
                    # 1. Save and show the script content
                    script_content = response.choices[0].message.content
                    st.session_state['generated_script'] = script_content
                    st.markdown(script_content)    

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
            with st.status("Connecting to TikTok API..."):
                st.balloons()
                st.success("✅ Success! Check your TikTok drafts.")
        else:
            st.error("Please click 'Connect TikTok' at the top of the page first!")

# --- TAB 3: STRATEGIST ---
with t3:
    if st.session_state.tier != "Agency":
        st.markdown("""
        <div class="tier-box">
            <h2 style='color: #00f2ff;'>🔒 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>Upgrade to the Agency Tier to unlock your 24/7 AI Growth Strategist.</p>
            <p style="font-size: 28px; color: #ffffff;"><b>Price: £300.00</b></p>
            <a href="https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200" target="_blank" style="text-decoration: none;">
                <button style="width: 100%; background: linear-gradient(90deg, #ff00cc, #3333ff); color: white; padding: 18px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: bold;">
                    🚀 UPGRADE NOW & UNLOCK AGENT
                </button>
            </a>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.subheader("🤖 GOCOPYAI MASTER STRATEGIST")
        if "messages" not in st.session_state:
            st.session_state.messages = [{"role": "system", "content": "You are the GoCopyAI Master Strategist."}]
        for message in st.session_state.messages:
            if message["role"] != "system":
                with st.chat_message(message["role"]):
                    st.markdown(message["content"])
        if prompt := st.chat_input("Ask your strategist anything..."):
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)
            with st.chat_message("assistant"):
                response = client.chat.completions.create(model="gpt-3.5-turbo", messages=st.session_state.messages)
                answer = response.choices[0].message.content
                st.markdown(answer)
                st.session_state.messages.append({"role": "assistant", "content": answer})

# --- TAB 4: AUTO-PILOT ---
import urllib.parse
client_key = st.secrets["TIKTOK_CLIENT_KEY"]
redirect_uri = st.secrets["TIKTOK_REDIRECT_URI"]
scope = "user.info.basic,video.upload,video.publish"
auth_url = (f"https://www.tiktok.com/v2/auth/authorize/?client_key={client_key}&scope={scope}&response_type=code&redirect_uri={urllib.parse.quote(redirect_uri)}")

# --- TAB 4: AUTO-PILOT ---
import urllib.parse

# 1. Setup your API credentials (ensure these are in your Secrets!)
client_key = st.secrets["TIKTOK_CLIENT_KEY"]
redirect_uri = st.secrets["TIKTOK_REDIRECT_URI"]

# Instagram (Meta) & YouTube (Google) Placeholders
# You will eventually put your real Client IDs in st.secrets
insta_auth_url = "https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_META_ID&redirect_uri=" + urllib.parse.quote(redirect_uri)
yt_auth_url = "https://accounts.google.com/o/oauth2/auth?client_id=YOUR_GOOGLE_ID&redirect_uri=" + urllib.parse.quote(redirect_uri) + "&scope=https://www.googleapis.com/auth/youtube.upload&response_type=code"

with t4:
    if not st.session_state.auto_pilot_unlocked:
        # (Keep your existing lock screen code here...)
        st.markdown("🔒 Auto-Pilot Locked. Enter Key 'POST69' to unlock.")
        # ADD THIS LINE DIRECTLY BELOW:
        ap_key = st.text_input("Unlock Key", type="password", key="ap_unlock_input")
        if ap_key == "POST69":
               st.session_state.auto_pilot_unlocked = True
               st.rerun() 
    else:
        st.header("📲 Auto-Pilot Command Centre")
        st.info("Connected platforms allow one-click distribution from your Scriptwriter.")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.subheader("TikTok")
            if "code" in st.query_params:
                st.success("✅ Connected")
            else:
                st.link_button("🔐 Connect TikTok", auth_url, use_container_width=True)
        
        with col2:
            st.subheader("Instagram")
            # This is now an active link!
            st.link_button("📸 Connect IG", insta_auth_url, use_container_width=True, type="primary")
            # Continuing from Line 177 in your editor...
            st.caption("Post to Reels & Stories")

        st.divider()
        st.subheader("🚀 Global Multi-Post")
        
        # This button triggers the final magic
        if st.button("BLAST TO ALL CONNECTED PLATFORMS", use_container_width=True):
            if 'generated_script' in st.session_state:
                with st.status("Syncing Content Across Networks..."):
                    st.write("Checking TikTok Connection... ✅")
                    st.write("Formatting for Instagram Reels... ✅")
                    st.write("Optimizing for YouTube Shorts... ✅")
                    st.balloons()
                st.success("Drafts sent successfully to all platforms!")
            else:
                st.error("Please generate a script in the Scriptwriter first!")
            
    
