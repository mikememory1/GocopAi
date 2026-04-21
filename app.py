import streamlit as st
from google import genai
from fpdf import FPDF
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
import json

# --- 0. CONFIG / CONSTANTS ---
STRIPE_AGENCY_URL = "https://buy.stripe.com/28E3cv2bQ0kV95p98S4F200"
STRIPE_SEO_URL = "https://buy.stripe.com/test_seo_upgrade_link"       # replace with real
STRIPE_AUTOPILOT_URL = "https://buy.stripe.com/test_autopilot_link"   # replace with real

ADMIN_CODE = "280964"  # your admin code

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
.upsell-box { padding: 15px; border-radius: 12px; background: #1a1a1a; border: 1px solid #333; }
</style>
""", unsafe_allow_html=True)

# --- 3. SESSION STATE ---
if 'tier' not in st.session_state:
    st.session_state.tier = "Standard"
if 'generated_script' not in st.session_state:
    st.session_state.generated_script = ""
if 'brand_context' not in st.session_state:
    st.session_state.brand_context = ""
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'last_seo_result' not in st.session_state:
    st.session_state.last_seo_result = None
if 'clients' not in st.session_state:
    st.session_state.clients = {}  # {client_name: {brand_context, ads, scripts, seo_reports}}
if 'active_client' not in st.session_state:
    st.session_state.active_client = None
if 'logged_in' not in st.session_state:
    st.session_state.logged_in = False
if 'client_codes' not in st.session_state:
    # Map login codes to client names (edit these for your real clients)
    st.session_state.client_codes = {
        "ACME4921": "Acme Corp",
        "FIT2024": "FitPro Coaching",
        "LUXE555": "Luxe Beauty"
    }
if 'admin_logged_in' not in st.session_state:
    st.session_state.admin_logged_in = False

# --- 4. LOGIN GATE ---
st.title("GocopAi Agency Pro")
st.subheader("🔐 Client Login")

if not st.session_state.logged_in and not st.session_state.admin_logged_in:
    login_code = st.text_input("Enter your client login code").strip()

    if st.button("Login"):
        code = login_code.upper()
        if code in st.session_state.client_codes:
            client_name = st.session_state.client_codes[code]
            st.session_state.active_client = client_name
            if client_name not in st.session_state.clients:
                st.session_state.clients[client_name] = {
                    "brand_context": "",
                    "ads": [],
                    "scripts": [],
                    "seo_reports": []
                }
            st.session_state.logged_in = True
            st.success(f"Welcome, {client_name}!")
            st.experimental_rerun()
        else:
            st.error("Invalid login code. Please try again.")

    st.markdown("### Admin Access")
    admin_code_input = st.text_input("Admin Code", type="password")

    if st.button("Admin Login"):
        if admin_code_input.strip() == ADMIN_CODE:
            st.session_state.admin_logged_in = True
            st.success("Admin access granted")
            st.experimental_rerun()
        else:
            st.error("Invalid admin code")

    st.stop()

# If admin is logged in but no active client, we still allow admin panel
if st.session_state.logged_in:
    client_name = st.session_state.active_client
    if client_name not in st.session_state.clients:
        st.session_state.clients[client_name] = {
            "brand_context": "",
            "ads": [],
            "scripts": [],
            "seo_reports": []
        }

# --- 5. SIDEBAR / MEMBER ACCESS ---
with st.sidebar:
    st.title("⚡ MEMBER ACCESS")

    if st.session_state.admin_logged_in and not st.session_state.logged_in:
        st.write("**Admin Mode**")
    elif st.session_state.logged_in:
        st.write(f"**Client:** {st.session_state.active_client}")

    # Logout buttons
    if st.session_state.logged_in:
        if st.button("Logout"):
            st.session_state.logged_in = False
            st.session_state.active_client = None
            st.experimental_rerun()

    if st.session_state.admin_logged_in:
        if st.button("Admin Logout"):
            st.session_state.admin_logged_in = False
            st.experimental_rerun()

    st.markdown("---")

    api_key = st.text_input("Gemini API Key", type="password", key="master_key").strip()
    openai_key = st.text_input("OpenAI API Key (for TTS, optional)", type="password").strip()

    license_key = st.text_input("Enter License Key", type="password")

    # Simple license logic
    if license_key == "BOSS350":
        st.session_state.tier = "Agency"
        st.success("👑 AGENCY MASTER ACCESS")
    elif license_key in ["SEO49", "POST69"]:
        st.info("✅ Feature-specific license applied.")
    else:
        if license_key:
            st.warning("License key not recognized. Using Standard tier.")

    # Only show Brand DNA tools when a client is active
    if st.session_state.logged_in:
        st.subheader("🧬 Brand DNA Specialist")
        brand_url = st.text_input("Enter Client Website URL", placeholder="https://example.com")

        if brand_url and st.button("Extract Brand DNA"):
            client_name = st.session_state.active_client
            with st.spinner("Analyzing brand voice..."):
                try:
                    res = requests.get(brand_url, timeout=10)
                    soup = BeautifulSoup(res.text, 'html.parser')
                    for s in soup(["script", "style"]):
                        s.decompose()
                    text = soup.get_text(separator=' ', strip=True)[:3000]
                    st.session_state.brand_context = text
                    st.session_state.clients[client_name]["brand_context"] = text
                    st.success(f"DNA Extracted and saved for {client_name}!")
                except Exception as e:
                    st.error(f"Error: {e}")

    if st.session_state.tier != "Agency":
        st.markdown(
            f"""
            <div class='upsell-box'>
                <h3>Upgrade to Agency</h3>
                <p>Unlock the Strategist Agent, SEO Pro, Video Studio, and Auto-Pilot modules.</p>
                <p><b>Launch Offer:</b> 40% OFF with code <code>LAUNCH40</code></p>
                <a href="{STRIPE_AGENCY_URL}" target="_blank">
                    <button style="margin-top:10px;padding:10px 18px;border-radius:8px;border:none;background:linear-gradient(90deg,#00f2ff,#0072ff);color:white;font-weight:bold;cursor:pointer;">
                        🚀 UPGRADE TO AGENCY (£300)
                    </button>
                </a>
            </div>
            """,
            unsafe_allow_html=True
        )

# --- 6. AI CLIENT SETUP ---
gemini_client = None
if api_key:
    try:
        gemini_client = genai.Client(
            api_key=api_key,
            http_options={'api_version': 'v1beta'}
        )
    except Exception as e:
        st.sidebar.error(f"Gemini client error: {e}")

openai_client = None
if openai_key:
    try:
        openai_client = OpenAI(api_key=openai_key)
    except Exception as e:
        st.sidebar.error(f"OpenAI client error: {e}")

# --- 7. MAIN TABS ---
t_admin, t0, t1, t2, t3, t4, t5, t6 = st.tabs(
    ["🛠 Admin Panel", "🏢 Client Dashboard", "🎯 AD GENERATOR", "🎬 VIDEO SCRIPTS",
     "🤖 AGENCY AGENT", "📲 AUTO-PILOT", "🔎 SEO PRO", "🎥 VIDEO STUDIO"]
)

# ---------------- TAB ADMIN: ADMIN PANEL ----------------
with t_admin:
    if not st.session_state.admin_logged_in:
        st.warning("Admin access required")
        st.stop()

    st.title("🛠 Admin Control Panel")

    st.subheader("Client Login Codes")
    st.write(st.session_state.client_codes)

    st.markdown("---")

    st.subheader("Add New Client + Login Code")
    new_client = st.text_input("Client Name")
    new_code = st.text_input("Login Code (e.g., ACME4921)")

    if st.button("Create Client"):
        if new_client and new_code:
            st.session_state.client_codes[new_code.upper()] = new_client
            if new_client not in st.session_state.clients:
                st.session_state.clients[new_client] = {
                    "brand_context": "",
                    "ads": [],
                    "scripts": [],
                    "seo_reports": []
                }
            st.success(f"Client '{new_client}' created with code {new_code.upper()}")
        else:
            st.error("Enter both a client name and a login code")

    st.markdown("---")

    st.subheader("Manage Existing Clients")

    all_clients = list(st.session_state.clients.keys())
    if all_clients:
        selected = st.selectbox("Select Client", all_clients)

        st.write("### Client Data Preview")
        st.json(st.session_state.clients[selected])

        col1, col2, col3 = st.columns(3)

        with col1:
            if st.button("Impersonate Client"):
                st.session_state.active_client = selected
                st.session_state.logged_in = True
                st.success(f"Now impersonating {selected}")
                st.experimental_rerun()

        with col2:
            if st.button("Reset Client Workspace"):
                st.session_state.clients[selected] = {
                    "brand_context": "",
                    "ads": [],
                    "scripts": [],
                    "seo_reports": []
                }
                st.success("Client workspace reset")

        with col3:
            if st.button("Delete Client"):
                del st.session_state.clients[selected]
                for code, name in list(st.session_state.client_codes.items()):
                    if name == selected:
                        del st.session_state.client_codes[code]
                st.success("Client deleted")
                st.experimental_rerun()
    else:
        st.info("No clients found")

    st.markdown("---")

    st.subheader("Export All Client Data")
    if st.button("Download JSON Backup"):
        st.download_button(
            label="Download",
            data=json.dumps(st.session_state.clients, indent=2),
            file_name="client_backup.json",
            mime="application/json"
        )

# If not logged in as client, skip client tabs
if not st.session_state.logged_in:
    st.stop()

client_name = st.session_state.active_client
client_data = st.session_state.clients[client_name]

# ---------------- TAB 0: CLIENT DASHBOARD ----------------
with t0:
    st.subheader(f"🏢 Client Workspace: {client_name}")

    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.metric("Saved Ads", len(client_data.get("ads", [])))
    with col_b:
        st.metric("Video Scripts", len(client_data.get("scripts", [])))
    with col_c:
        st.metric("SEO Reports", len(client_data.get("seo_reports", [])))

    st.markdown("---")

    st.subheader("Brand DNA")
    bc = client_data.get("brand_context", "")
    if bc:
        st.write(bc[:800] + ("..." if len(bc) > 800 else ""))
    else:
        st.info("No brand DNA saved yet. Use the sidebar Brand DNA Specialist for this client.")

    st.markdown("---")

    st.subheader("Saved Assets")

    with st.expander("📢 Ad Library"):
        ads = client_data.get("ads", [])
        if not ads:
            st.write("No ads saved yet.")
        else:
            for i, ad in enumerate(ads, start=1):
                st.markdown(f"**Ad {i}: {ad.get('platform')} – {ad.get('tone')}**")
                st.write(f"Product: {ad.get('product')}")
                st.write(f"Target: {ad.get('target')}")
                st.code(ad.get("text", ""), language="markdown")
                st.markdown("---")

    with st.expander("🎬 Video Scripts"):
        scripts = client_data.get("scripts", [])
        if not scripts:
            st.write("No scripts saved yet.")
        else:
            for i, s in enumerate(scripts, start=1):
                st.markdown(f"**Script {i}: {s.get('style')} – {s.get('duration')}**")
                st.write(f"Topic: {s.get('topic')}")
                st.code(s.get("text", ""), language="markdown")
                st.markdown("---")

    with st.expander("📈 SEO Reports"):
        reports = client_data.get("seo_reports", [])
        if not reports:
            st.write("No SEO reports saved yet.")
        else:
            for i, r in enumerate(reports, start=1):
                st.markdown(f"**Report {i}: {r.get('title','Untitled')}**")
                st.write(f"Score: {r.get('score')}")
                st.write(f"Keywords: {r.get('keywords')}")
                st.write(f"Summary: {r.get('summary')}")
                st.write(f"Recommendations: {r.get('recommendations')}")
                with st.expander("View Content"):
                    st.write(r.get("content", ""))
                st.markdown("---")

# ---------------- TAB 1: AD GENERATOR ----------------
with t1:
    st.subheader("🎯 PRO AD COPY GENERATOR")
    prod = st.text_input("Product/Service Name", placeholder="e.g. 1-on-1 Fitness Coaching")
    target = st.text_input("Target Audience", placeholder="e.g. Busy executives over 40")

    col1, col2 = st.columns([2, 1])
    with col1:
        tone = st.selectbox("Ad Tone", ["Direct Response", "Story-Driven", "Authority", "Humorous"])
    with col2:
        platform = st.selectbox("Platform", ["Facebook", "Instagram", "YouTube", "TikTok"])

    if st.button("Generate Ad"):
        if gemini_client and prod and target:
            with st.spinner("Writing high-converting ad copy..."):
                try:
                    prompt = (
                        "You are an expert direct-response copywriter.\n"
                        f"Write a high-converting {platform} ad for {prod} targeting {target}.\n"
                        f"Tone: {tone}.\n"
                        "Include:\n"
                        "- A powerful scroll-stopping hook\n"
                        "- 3–5 bullet benefits\n"
                        "- Social proof or authority\n"
                        "- Strong call to action\n"
                        "Return the ad as ready-to-paste copy."
                    )

                    response = gemini_client.models.generate_content(
                        model="models/gemini-1.5-flash-001",
                        contents=prompt
                    )

                    ad_text = response.text
                    st.success("Ad Copy Generated!")
                    st.write(ad_text)

                    st.session_state.clients[client_name]["ads"].append({
                        "product": prod,
                        "target": target,
                        "tone": tone,
                        "platform": platform,
                        "text": ad_text
                    })

                except Exception as e:
                    st.error(f"Ad Generation Error: {e}")
        else:
            st.warning("Please enter your API Key, Product Name, and Target Audience.")

    if st.session_state.tier != "Agency":
        st.markdown(
            """
            <div class='upsell-box'>
                <b>Want multi-angle ad campaigns, A/B variants, and offer testing?</b><br>
                Unlock the full Ad Lab inside the Agency tier.
            </div>
            """,
            unsafe_allow_html=True
        )

# ---------------- TAB 2: VIDEO SCRIPTS ----------------
with t2:
    st.subheader("🎬 VIRAL VIDEO SCRIPTWRITER")
    v_topic = st.text_input("What is the video about?", key="v_topic_input")
    v_style = st.selectbox("Video Style", ["Educational", "Hype/Motivational", "Storytelling"], key="v_style_input")
    duration = st.selectbox("Approx. Length", ["30 seconds", "60 seconds", "90 seconds", "3 minutes"])

    if st.button("GENERATE FULL SCRIPT"):
        if gemini_client and v_topic:
            with st.status("Connecting via Google v1beta...", expanded=True):
                try:
                    base_prompt = (
                        f"Write a viral {v_style} video script about {v_topic}.\n"
                        f"Target duration: {duration}.\n"
                        "Structure it with:\n"
                        "- Hook\n"
                        "- Pattern interrupt\n"
                        "- Value delivery\n"
                        "- Soft pitch or CTA\n"
                        "Write it as spoken dialogue with scene directions where helpful."
                    )
                    client_bc = st.session_state.clients[client_name].get("brand_context", "")
                    if client_bc:
                        base_prompt += (
                            "\n\nMatch the tone and style of this brand context:\n"
                            f"{client_bc}"
                        )

                    response = gemini_client.models.generate_content(
                        model="models/gemini-1.5-flash-001",
                        contents=base_prompt
                    )

                    script_text = response.text
                    st.session_state.generated_script = script_text
                    st.success("Script Ready!")
                    st.markdown(script_text)

                    st.session_state.clients[client_name]["scripts"].append({
                        "topic": v_topic,
                        "style": v_style,
                        "duration": duration,
                        "text": script_text
                    })

                except Exception as e:
                    st.error(f"Script Generation Error: {e}")
        else:
            st.warning("Please ensure API Key and Topic are filled!")

    if st.session_state.generated_script:
        st.divider()
        st.subheader("🎙️ AI Voiceover Studio")

        if openai_client:
            if st.button("Generate Voiceover (OpenAI TTS)"):
                with st.spinner("Converting script to speech..."):
                    try:
                        audio_response = openai_client.audio.speech.create(
                            model="tts-1",
                            voice="onyx",
                            input=st.session_state.generated_script
                        )
                        st.audio(audio_response.content, format="audio/mp3")
                    except Exception as e:
                        st.error(f"TTS Error: {e}")
        else:
            st.info("Add an OpenAI API key in the sidebar to enable voiceover generation.")

# ---------------- TAB 3: AGENCY AGENT ----------------
with t3:
    if st.session_state.tier != "Agency":
        st.markdown(
            f"""
            <div class='tier-box'>
                <h2>🔓 AGENT LOCKED</h2>
                <p>The GoCopyAI Master Strategist gives you full-funnel plans, offer stacks, and launch calendars.</p>
                <p>Upgrade to Agency to unlock this module.</p>
                <a href="{STRIPE_AGENCY_URL}" target="_blank">
                    <button style="margin-top:10px;padding:10px 18px;border-radius:8px;border:none;background:linear-gradient(90deg,#00f2ff,#0072ff);color:white;font-weight:bold;cursor:pointer;">
                        👑 Unlock Master Strategist
                    </button>
                </a>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        st.subheader("🤖 GOCOPYAI MASTER STRATEGIST")

        for msg in st.session_state.messages:
            with st.chat_message(msg["role"]):
                st.markdown(msg["content"])

        if prompt := st.chat_input("Ask your strategist..."):
            st.chat_message("user").markdown(prompt)
            st.session_state.messages.append({"role": "user", "content": prompt})

            if gemini_client:
                try:
                    history_text = ""
                    for m in st.session_state.messages:
                        role = "User" if m["role"] == "user" else "Assistant"
                        history_text += f"{role}: {m['content']}\n"

                    full_prompt = (
                        "You are a senior marketing strategist and funnel architect. "
                        "You design offers, upsells, launch plans, and content calendars.\n\n"
                        f"{history_text}\nAssistant:"
                    )

                    response = gemini_client.models.generate_content(
                        model="models/gemini-1.5-flash-001",
                        contents=full_prompt
                    )

                    answer = response.text
                    st.chat_message("assistant").markdown(answer)
                    st.session_state.messages.append({"role": "assistant", "content": answer})
                except Exception as e:
                    st.error(f"Agent Error: {e}")
            else:
                st.error("Gemini client not initialized. Check your API key.")

# ---------------- TAB 4: AUTO-PILOT ----------------
with t4:
    st.subheader("🚀 Social Media Auto-Pilot")

    if license_key != "POST69" and st.session_state.tier != "Agency":
        st.info("🔒 Auto-Pilot is locked. Enter POST69 or upgrade to Agency to unlock automated posting workflows.")
        st.markdown(
            f"""
            <div class='upsell-box'>
                <b>Auto-Pilot Module</b><br>
                - Auto-generate daily posts<br>
                - Hook + caption + CTA templates<br>
                - Platform-specific variations<br><br>
                <a href="{STRIPE_AUTOPILOT_URL}" target="_blank">
                    <button style="margin-top:5px;padding:8px 14px;border-radius:8px;border:none;background:linear-gradient(90deg,#00f2ff,#0072ff);color:white;font-weight:bold;cursor:pointer;">
                        🔓 Unlock Auto-Pilot
                    </button>
                </a>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        st.success("✅ Auto-Pilot Active")
        st.write("This is where you'd connect TikTok, IG, etc. and push scheduled content.")
        st.button("Connect TikTok")

# ---------------- TAB 5: SEO PRO ----------------
with t5:
    st.header("🔍 SEO Content Optimizer")

    seo_unlocked = (st.session_state.tier == "Agency") or (license_key == "SEO49")

    if not seo_unlocked:
        st.info("🔒 SEO Pro is locked. Enter SEO49 or upgrade to Agency to unlock full SEO reports.")
        st.markdown(
            f"""
            <div class='upsell-box'>
                <b>SEO Pro Module</b><br>
                - On-page SEO scoring<br>
                - Keyword extraction & clustering<br>
                - PDF client reports<br><br>
                <a href="{STRIPE_SEO_URL}" target="_blank">
                    <button style="margin-top:5px;padding:8px 14px;border-radius:8px;border:none;background:linear-gradient(90deg,#00f2ff,#0072ff);color:white;font-weight:bold;cursor:pointer;">
                        📈 Unlock SEO Pro
                    </button>
                </a>
            </div>
            """,
            unsafe_allow_html=True
        )
    else:
        st.success("SEO Tools Unlocked")

        page_title = st.text_input("Page / Article Title")
        seo_content = st.text_area("Paste your content here", height=250)

        if st.button("Analyze SEO & Generate Report"):
            if gemini_client and seo_content:
                with st.spinner("Analyzing SEO performance..."):
                    try:
                        prompt = (
                            "You are an SEO expert. Analyze the following content and return a strict JSON object "
                            "with the following keys: score (0-100), keywords (comma-separated string), "
                            "summary (short string), recommendations (short string).\n\n"
                            f"TITLE:\n{page_title}\n\nCONTENT:\n{seo_content}"
                        )

                        response = gemini_client.models.generate_content(
                            model="models/gemini-1.5-flash-001",
                            contents=prompt
                        )

                        raw = response.text
                        try:
                            data = json.loads(raw)
                        except Exception:
                            try:
                                start = raw.index("{")
                                end = raw.rindex("}") + 1
                                data = json.loads(raw[start:end])
                            except Exception:
                                data = None

                        if data:
                            score = data.get("score", "N/A")
                            keywords = data.get("keywords", "")
                            summary = data.get("summary", "")
                            recommendations = data.get("recommendations", "")

                            st.session_state.last_seo_result = {
                                "score": score,
                                "keywords": keywords,
                                "summary": summary,
                                "recommendations": recommendations,
                                "content": seo_content
                            }

                            st.subheader("SEO Score")
                            st.metric("Score (0-100)", score)
                            st.write("**Summary:**", summary)
                            st.write("**Keywords:**", keywords)
                            st.write("**Recommendations:**", recommendations)

                            pdf_bytes = create_pdf(
                                script=seo_content,
                                score=score,
                                keywords=keywords
                            )

                            st.download_button(
                                label="📄 Download Client PDF Report",
                                data=pdf_bytes,
                                file_name="gocopyai_seo_report.pdf",
                                mime="application/pdf"
                            )

                            st.session_state.clients[client_name]["seo_reports"].append({
                                "title": page_title,
                                "score": score,
                                "keywords": keywords,
                                "summary": summary,
                                "recommendations": recommendations,
                                "content": seo_content
                            })
                        else:
                            st.error("Could not parse SEO JSON. Here is the raw analysis:")
                            st.code(raw)

                    except Exception as e:
                        st.error(f"SEO Analysis Error: {e}")
            else:
                st.warning("Please enter your API key and content to analyze.")

# ---------------- TAB 6: VIDEO STUDIO ----------------
with t6:
    st.header("🎥 AI Cinematic Video Studio")
    if st.session_state.tier == "Agency":
        st.write("Ready to render cinematic scenes. This is where you'd plug in your video engine (Runway, Pika, etc.).")
        st.info("Future upgrade: scene-by-scene storyboard + shot prompts generated from your script.")
    else:
        st.error("🔒 STUDIO TIER LOCKED. Upgrade to Agency to unlock cinematic video workflows.")

