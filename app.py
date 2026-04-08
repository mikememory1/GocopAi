import streamlit as st
import time

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
        (https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200)
        st.markdown("[🚀 UPGRADE TO AGENCY (£350)](https://buy.stripe.com/your-link-here)")

# --- THE APP TABS ---
t1, t2, t3 = st.tabs(["🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS", "🤖 BUSINESS AGENT"])

with t1:
    st.subheader("Generate High-Conversion Ads")
    prod = st.text_input("Product Name", placeholder="e.g. Luxury Watch")
    if st.button("RUN AI STRATEGY"):
        with st.status("Analyzing Market Psychology..."):
            time.sleep(2)
        st.success("Ad Script Generated!")
        st.code(f"HOOK: Why {prod} is the #1 choice in 2026. \nCTA: Link in Bio.")

with t3:
    if st.session_state.tier != "Agency":
        st.markdown("""
        <div class="tier-box">
            <h2>🔒 BUSINESS MANAGER AGENT LOCKED</h2>
            <p>The Agency Tier Agent manages your WarriorPlus affiliates and automates your sales 24/7.</p>
            <p style="font-size: 24px; color: #00f2ff;"><b>Price: £350.00</b></p>
        </div>
        """, unsafe_allow_html=True)
    else:
        st.subheader("🤖 AGENT COMMAND CENTER")
        st.info("Agent Status: ACTIVE & MONITORING SALES")
        st.metric("Total Revenue", "£1,450", "+£350 today")
        st.text_area("Live Log", "12:10 - Sent License Key to buyer@email.com...")
