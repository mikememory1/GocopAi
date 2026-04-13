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
                
             # 1. Save the AI response to the app's memory
        script_content = response.choices[0].message.content
        st.session_state['generated_script'] = script_content
        
        # 2. Show the script on the page immediately
        st.markdown(script_content)

# 3. The Safety Gate: Only show the TikTok section if a script exists in memory
if 'generated_script' in st.session_state:
    st.divider()
    st.subheader("🚀 Send to TikTok Drafts")
    
    # 4. Use the saved script in the editable text area
    final_script_text = st.text_area(
        "Final Polish:", 
        value=st.session_state['generated_script'], 
        height=250
    )
    
    # 5. The Post Button logic
    if st.button("SEND TO TIKTOK"):
        if "code" in st.query_params:
            with st.status("Connecting to TikTok API..."):
                st.balloons()
                st.success("✅ Success! Check your TikTok drafts.")
        else:
            st.error("Please connect your TikTok account at the top first!") 
    
    if st.button("SEND TO TIKTOK"):
        if "code" in st.query_params:
            with st.status("Connecting to TikTok API..."):
                st.balloons()
                st.success("✅ Success! Open TikTok on your phone to find this in your drafts.")
        else:
            st.error("Please click 'Connect TikTok' at the top of the page first!")
           
with t3:
    if st.session_state.tier != "Agency":
        st.markdown("""
        <div class="tier-box">
            <h2 style='color: #00f2ff;'>🔒 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>Upgrade to the Agency Tier to unlock your 24/7 AI Growth Strategist and scale to £10k/month.</p>
            <p style="font-size: 28px; color: #ffffff;"><b>Price: £300.00</b></p>
            <a href="https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200" target="_blank" style="text-decoration: none;">
                <button style="width: 100%; background: linear-gradient(90deg, #ff00cc, #3333ff); color: white; padding: 18px; border: none; border-radius: 12px; cursor: pointer; font-size: 18px; font-weight: bold; box-shadow: 0px 4px 15px rgba(255, 0, 204, 0.3);">
                    🚀 UPGRADE NOW & UNLOCK AGENT
                </button>
            </a>
            <p style="font-size: 12px; color: #666; margin-top: 15px;">One-time payment • Lifetime Access</p>
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
# --- TAB 4: AUTO-PILOT (LOCKED) ---
import urllib.parse

# This builds the bridge between your app and TikTok
client_key = st.secrets["TIKTOK_CLIENT_KEY"]
redirect_uri = st.secrets["TIKTOK_REDIRECT_URI"]
scope = "user.info.basic,video.upload,video.publish"

auth_url = (
    f"https://www.tiktok.com/v2/auth/authorize/"
    f"?client_key={client_key}"
    f"&scope={scope}"
    f"&response_type=code"
    f"&redirect_uri={urllib.parse.quote(redirect_uri)}"
)


# --- TAB 4: AUTO-PILOT (LOCKED) ---

with t4:
    if not st.session_state.auto_pilot_unlocked:
        st.markdown("""
        <div style="background: rgba(255, 0, 204, 0.1); border: 2px solid #ff00cc; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style='color: #ff00cc;'>📲 AUTO-PILOT ACTIVATION</h3>
            <p>Post instantly to TikTok & Instagram. <b>Price: £69.99</b></p>
            <a href="https://buy.stripe.com/cNibJ103I5Ff1CXbh04F201"_blank"><button style="background: #ff00cc; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">BUY ACTIVATION KEY</button></a>
        </div>
        """, unsafe_allow_html=True)
        
        ap_key = st.text_input("Enter Auto-Pilot Key", type="password", key="ap_input")
        if ap_key == "POST69":
            st.session_state.auto_pilot_unlocked = True
            st.success("Auto-Pilot Unlocked!")
            st.rerun()
    else:
      # New Auto-Pilot Content for Phase 7 & 9
        st.header("📲 Auto-Pilot Command Centre")
        st.write("Connect your social media accounts to enable one-click publishing.")

        col1, col2, col3 = st.columns(3)

        with col1:
            st.subheader("TikTok")
            # This uses the secrets you just saved in Streamlit
            st.link_button("🔐 Connect TikTok", auth_url, use_container_width=True)
            
        with col2:
            st.subheader("Instagram")
            st.button("🔐 Connect IG (Coming Soon)", disabled=True, use_container_width=True)
            
        with col3:
            st.subheader("YouTube")
            st.button("🔐 Connect YT (Coming Soon)", disabled=True, use_container_width=True)

        st.divider()
        st.subheader("Final Review & Blast")
        st.info("Once connected, your generated scripts will appear here for instant publishing.")

# --- TAB 5: SEO PRO (LOCKED) ---
with t5:
    if not st.session_state.seo_pro_unlocked:
        st.markdown("""
        <div style="background: rgba(0, 255, 136, 0.1); border: 2px solid #00ff88; padding: 20px; border-radius: 10px; text-align: center;">
            <h3 style='color: #00ff88;'>🔍 SEO PRO SUITE</h3>
            <p>Keyword extraction & competitor analysis. <b>Price: £49.99</b></p>
            <a href="https://buy.stripe.com/00w9AT03I3x7epJbh04F202" target="_blank"><button style="background: #00ff88; color: black; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">BUY SEO PRO KEY</button></a>
        </div>
        """, unsafe_allow_html=True)
        
        seo_key = st.text_input("Enter SEO Pro Key", type="password", key="seo_input")
        if seo_key == "SEO49":
            st.session_state.seo_pro_unlocked = True
            st.success("SEO Pro Unlocked!")
            st.rerun()
    else:
        st.header("🔍 SEO Intelligence")
        st.text_input("Enter URL to analyze")
