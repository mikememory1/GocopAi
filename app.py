import os
import time
import io
from typing import List, Dict

import streamlit as st
from fpdf import FPDF

import google.genai as genai
from google.genai import types as gtypes

# =========================
# CONFIG & CONSTANTS
# =========================

APP_NAME = "GocopAi Agency Pro"
PRIMARY_MODEL = "models/gemini-1.5-flash-001"

# License tiers
TIER_FREE = "Free"
TIER_PRO = "Pro"
TIER_AGENCY = "Agency"
TIER_ADMIN = "Admin"

# Hard-coded license keys for demo
LICENSE_MAP = {
    "FREE123": TIER_FREE,
    "PRO123": TIER_PRO,
    "AGENCY123": TIER_AGENCY,
    "ADMIN123": TIER_ADMIN,
}

# =========================
# GEMINI CLIENT
# =========================

def get_gemini_client(api_key: str):
    if not api_key:
        return None
    try:
        client = genai.Client(api_key=api_key)
        return client
    except Exception:
        return None

def gemini_generate_text(client, prompt: str, system_instruction: str = "") -> str:
    if client is None:
        return "⚠️ No valid Gemini client configured."
    try:
        contents = prompt
        if system_instruction:
            contents = f"{system_instruction}\n\n{prompt}"

        resp = client.models.generate_content(
            model=PRIMARY_MODEL,
            contents=contents,
            config=gtypes.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=1024,
            ),
        )
        return resp.text or ""
    except Exception as e:
        return f"⚠️ Gemini error: {e}"

# =========================
# SESSION STATE HELPERS
# =========================

def init_session_state():
    defaults = {
        "tier": TIER_FREE,
        "license_key": "",
        "clients": [],
        "selected_client": None,
        "brand_dna": {},
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v

def set_tier_from_license(license_key: str):
    tier = LICENSE_MAP.get(license_key.strip(), TIER_FREE)
    st.session_state.tier = tier
    st.session_state.license_key = license_key.strip()

def tier_at_least(required: str) -> bool:
    order = [TIER_FREE, TIER_PRO, TIER_AGENCY, TIER_ADMIN]
    return order.index(st.session_state.tier) >= order.index(required)

# =========================
# UI: PAGE & STYLES
# =========================

def setup_page():
    st.set_page_config(page_title=APP_NAME, layout="wide")
    st.markdown(
        """
        <style>
        .main { background-color: #050505; color: #ffffff; }
        h1, h2, h3, h4 {
            color: #02f2ff !important;
            font-family: 'Inter', sans-serif;
            text-transform: uppercase;
        }
        .stButton>button {
            background: linear-gradient(90deg, #00f2ff, #0072ff);
            color: white;
            border-radius: 12px;
            font-weight: 600;
            border: none;
            height: 3rem;
        }
        .locked-badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            background: #ff006e;
            color: white;
            font-size: 0.7rem;
            margin-left: 6px;
        }
        .tier-pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: #111;
            border: 1px solid #02f2ff55;
            font-size: 0.75rem;
            margin-left: 8px;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )

# =========================
# SIDEBAR: ACCESS & KEYS
# =========================

def sidebar_access():
    with st.sidebar:
        st.title("★ MEMBER ACCESS")

        # License key
        license_key = st.text_input("Enter License Key", type="password")
        if st.button("Unlock / Update License"):
            set_tier_from_license(license_key)
            st.success(f"Tier set to: {st.session_state.tier}")

        st.markdown(
            f"**Current Tier:** `{st.session_state.tier}`"
            f" <span class='tier-pill'>{st.session_state.tier}</span>",
            unsafe_allow_html=True,
        )

        # Gemini API key
        st.markdown("---")
        st.subheader("🔑 Gemini API")
        gemini_key = st.text_input(
            "Gemini API Key",
            type="password",
            help="Your Google AI Studio / Gemini API key.",
        )

        # Stripe / upgrade
        st.markdown("---")
        st.subheader("🚀 Upgrade")
        st.markdown(
            "- **Pro / Agency**: Unlock Brand DNA, Clients, Video Studio, Autopilot, Strategist, SEO.\n"
            "- **Admin**: Unlock Admin Panel."
        )
        st.markdown(
            "[Upgrade via Stripe](https://your-stripe-checkout-link.com)",
            unsafe_allow_html=True,
        )

    return gemini_key

# =========================
# FEATURE LOCK WRAPPER
# =========================

def require_tier(required_tier: str, feature_name: str):
    if not tier_at_least(required_tier):
        st.warning(
            f"🔒 **{feature_name}** is locked. "
            f"Requires **{required_tier}** tier or higher."
        )
        st.stop()

# =========================
# MODULES
# =========================

# --- Ads Engine ---
def render_ads_tab(client):
    st.header("Ad Generator")
    col1, col2 = st.columns(2)
    with col1:
        product = st.text_input("Product / Service", "1-on-1 Fitness Coaching")
        offer = st.text_area("Offer / Angle", "12-week transformation for busy executives over 40.")
    with col2:
        audience = st.text_input("Target Audience", "Busy executives over 40")
        platform = st.selectbox("Platform", ["Facebook", "Instagram", "YouTube", "Google Ads"])

    if st.button("Generate Ad Copy"):
        prompt = f"""
        You are a world-class direct response copywriter.

        Create 3 high-conversion ad variations for:
        - Product: {product}
        - Offer: {offer}
        - Audience: {audience}
        - Platform: {platform}

        Each ad should include:
        - Hook
        - Body
        - Call to action
        - Optional emoji usage (tasteful)
        """
        with st.spinner("Generating ad copy..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Generated Ads")
        st.write(text)

# --- Video Scripts ---
def render_video_scripts_tab(client):
    st.header("Video Script Generator")
    topic = st.text_input("Video Topic", "High-conversion ads for coaches")
    length = st.selectbox("Script Length", ["Short (30-60s)", "Medium (2-3 min)", "Long (5+ min)"])
    style = st.selectbox("Style", ["TikTok / Reels", "YouTube Tutorial", "Webinar Intro", "VSL"])

    if st.button("Generate Video Script"):
        prompt = f"""
        You are a senior video scriptwriter.

        Create a {length} script in the style of {style}.

        Topic: {topic}

        Include:
        - Hook
        - Story / context
        - Value / teaching
        - CTA
        - Stage directions (brief)
        """
        with st.spinner("Writing script..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Script")
        st.write(text)

# --- Business Strategist ---
def render_strategist_tab(client):
    require_tier(TIER_PRO, "Business Strategist Agent")
    st.header("Business Strategist Agent")
    niche = st.text_input("Niche / Industry", "Fitness coaches for executives")
    goal = st.text_area("Primary Goal", "Generate 20 high-ticket clients in 90 days.")
    constraints = st.text_area("Constraints", "Low ad budget, small email list.")

    if st.button("Generate Strategy"):
        prompt = f"""
        You are a senior marketing strategist.

        Niche: {niche}
        Goal: {goal}
        Constraints: {constraints}

        Deliver:
        - 3 core growth pillars
        - Acquisition strategy
        - Nurture strategy
        - Offer strategy
        - 90-day action plan (weekly breakdown)
        """
        with st.spinner("Designing strategy..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Strategy")
        st.write(text)

# --- SEO Engine ---
def render_seo_tab(client):
    require_tier(TIER_PRO, "SEO Engine")
    st.header("SEO Engine")
    website = st.text_input("Website / Brand", "example.com")
    topic = st.text_input("Primary Topic", "High-ticket coaching")
    if st.button("Generate SEO Plan"):
        prompt = f"""
        You are an SEO strategist.

        Brand website: {website}
        Topic: {topic}

        Deliver:
        - 10 primary keywords
        - 10 long-tail keywords
        - 5 content pillars
        - 10 blog post ideas with titles
        - Internal linking strategy
        """
        with st.spinner("Building SEO plan..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### SEO Plan")
        st.write(text)

# --- Autopilot Agent ---
def render_autopilot_tab(client):
    require_tier(TIER_AGENCY, "Autopilot Agent")
    st.header("Autopilot Agent")
    system_desc = st.text_area(
        "Describe your current marketing system",
        "We run some ads, have a basic funnel, and send occasional emails."
    )
    if st.button("Generate Autopilot Blueprint"):
        prompt = f"""
        You are a systems architect for marketing automation.

        Current system:
        {system_desc}

        Design an 'autopilot' system that:
        - Captures leads
        - Nurtures them
        - Books calls
        - Follows up automatically
        - Uses email + SMS + retargeting

        Deliver:
        - System diagram (described in text)
        - Tools stack recommendation
        - Implementation steps
        """
        with st.spinner("Designing autopilot system..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Autopilot Blueprint")
        st.write(text)

# --- Brand DNA ---
def render_brand_dna_tab(client):
    require_tier(TIER_PRO, "Brand DNA Engine")
    st.header("Brand DNA Engine")
    url = st.text_input("Client Website URL", "https://example.com")
    brand_notes = st.text_area("Brand Notes (optional)", "")

    if st.button("Extract Brand DNA"):
        prompt = f"""
        You are a brand strategist.

        Analyze this brand:
        Website: {url}
        Extra notes: {brand_notes}

        Deliver a 'Brand DNA' summary:
        - Core promise
        - Ideal client
        - Voice & tone
        - Values
        - Differentiators
        - Big idea
        """
        with st.spinner("Extracting Brand DNA..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Brand DNA")
        st.write(text)

        # Save last DNA in session for PDF export
        st.session_state.brand_dna = {
            "url": url,
            "notes": brand_notes,
            "dna_text": text,
        }

    if st.session_state.get("brand_dna", {}).get("dna_text"):
        if st.button("Download Brand DNA PDF"):
            pdf_bytes = create_brand_dna_pdf(st.session_state.brand_dna)
            st.download_button(
                "Download PDF",
                data=pdf_bytes,
                file_name="brand_dna.pdf",
                mime="application/pdf",
            )

def create_brand_dna_pdf(dna: Dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.set_font("Arial", "B", 16)
    pdf.cell(0, 10, "Brand DNA Report", ln=True)
    pdf.ln(5)

    pdf.set_font("Arial", "", 12)
    pdf.multi_cell(0, 8, f"Website: {dna.get('url', '')}")
    pdf.ln(3)
    if dna.get("notes"):
        pdf.multi_cell(0, 8, f"Notes: {dna.get('notes', '')}")
        pdf.ln(3)

    pdf.multi_cell(0, 8, dna.get("dna_text", ""))

    buffer = io.BytesIO()
    pdf.output(buffer)
    return buffer.getvalue()

# --- Clients ---
def render_clients_tab():
    require_tier(TIER_PRO, "Client Manager")
    st.header("Client Manager")

    with st.expander("Add New Client"):
        name = st.text_input("Client Name")
        niche = st.text_input("Niche")
        notes = st.text_area("Notes")
        if st.button("Save Client"):
            if name:
                st.session_state.clients.append(
                    {"name": name, "niche": niche, "notes": notes}
                )
                st.success("Client added.")
            else:
                st.error("Client name is required.")

    if not st.session_state.clients:
        st.info("No clients yet. Add one above.")
        return

    names = [c["name"] for c in st.session_state.clients]
    selected = st.selectbox("Select Client", names)
    st.session_state.selected_client = selected

    client = next((c for c in st.session_state.clients if c["name"] == selected), None)
    if client:
        st.subheader("Client Details")
        st.write(f"**Name:** {client['name']}")
        st.write(f"**Niche:** {client['niche']}")
        st.write(f"**Notes:** {client['notes']}")

# --- Video Studio ---
def render_video_studio_tab(client):
    require_tier(TIER_AGENCY, "Video Studio")
    st.header("Video Studio")
    idea = st.text_input("Video Idea", "Why your ads aren't converting")
    format_ = st.selectbox("Format", ["Short-form", "Long-form", "Webinar", "VSL"])

    if st.button("Generate Video Outline"):
        prompt = f"""
        You are a video content strategist.

        Idea: {idea}
        Format: {format_}

        Deliver:
        - Hook ideas
        - Segment breakdown
        - CTA suggestions
        - Visual / B-roll suggestions
        """
        with st.spinner("Building video outline..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Video Outline")
        st.write(text)

# --- TTS (placeholder) ---
def render_tts_tab(client):
    require_tier(TIER_AGENCY, "TTS Engine")
    st.header("TTS Engine (Concept)")
    st.info("This demo version only generates scripts. You can connect a real TTS API later.")
    script_topic = st.text_input("Script Topic", "Welcome to GocopAi Agency Pro")
    if st.button("Generate Voiceover Script"):
        prompt = f"""
        Write a concise, friendly voiceover script about:
        {script_topic}

        Tone: confident, warm, expert.
        Length: 30-45 seconds.
        """
        with st.spinner("Writing script..."):
            text = gemini_generate_text(client, prompt)
        st.markdown("### Voiceover Script")
        st.write(text)

# --- Admin ---
def render_admin_tab():
    require_tier(TIER_ADMIN, "Admin Panel")
    st.header("Admin Panel")
    st.write("Manage tiers, licenses, and system settings (demo).")
    st.json(
        {
            "current_tier": st.session_state.tier,
            "license_key": st.session_state.license_key,
            "clients_count": len(st.session_state.clients),
        }
    )

# =========================
# MAIN APP
# =========================

def main():
    init_session_state()
    setup_page()

    gemini_key = sidebar_access()
    client = get_gemini_client(gemini_key)

    st.title(APP_NAME)

    tabs = st.tabs(
        [
            "Ads",
            "Video Scripts",
            "Strategist",
            "SEO",
            "Autopilot",
            "Brand DNA",
            "Clients",
            "Video Studio",
            "TTS",
            "Admin",
        ]
    )

    with tabs[0]:
        render_ads_tab(client)

    with tabs[1]:
        render_video_scripts_tab(client)

    with tabs[2]:
        render_strategist_tab(client)

    with tabs[3]:
        render_seo_tab(client)

    with tabs[4]:
        render_autopilot_tab(client)

    with tabs[5]:
        render_brand_dna_tab(client)

    with tabs[6]:
        render_clients_tab()

    with tabs[7]:
        render_video_studio_tab(client)

    with tabs[8]:
        render_tts_tab(client)

    with tabs[9]:
        render_admin_tab()


if __name__ == "__main__":
    main()
