import streamlit as st
import requests
import uuid
import boto3
from botocore.client import Config
import json

# ---------------------------------------------------------
# PAGE CONFIG
# ---------------------------------------------------------
st.set_page_config(
    page_title="GoCopy AI – TikTok & Shorts Engine",
    page_icon="🎬",
    layout="wide",
)

# ---------------------------------------------------------
# CONFIG — pulled from Streamlit Secrets
# ---------------------------------------------------------
TIKTOK_CLIENT_KEY = st.secrets["TIKTOK_CLIENT_KEY"]
TIKTOK_CLIENT_SECRET = st.secrets["TIKTOK_CLIENT_SECRET"]
TIKTOK_REDIRECT_URI = st.secrets["TIKTOK_REDIRECT_URI"]
TIKTOK_SCOPES = st.secrets["TIKTOK_SCOPES"]  # e.g. "user.info.basic,video.publish"

R2_ACCOUNT_ID = st.secrets["R2_ACCOUNT_ID"]
R2_ACCESS_KEY_ID = st.secrets["R2_ACCESS_KEY_ID"]
R2_SECRET_ACCESS_KEY = st.secrets["R2_SECRET_ACCESS_KEY"]
R2_BUCKET_NAME = st.secrets["R2_BUCKET_NAME"]
R2_PUBLIC_DOMAIN = "https://pub-9fb90bf1cfc49bb9876390bc254d1"  # your actual public bucket URL

OPENAI_API_KEY = st.secrets["OPENAI_API_KEY"]

# ---------------------------------------------------------
# SESSION STATE
# ---------------------------------------------------------
if "tiktok_access_token" not in st.session_state:
    st.session_state.tiktok_access_token = None

if "tiktok_refresh_token" not in st.session_state:
    st.session_state.tiktok_refresh_token = None

if "oauth_state" not in st.session_state:
    st.session_state.oauth_state = None

if "last_video_url" not in st.session_state:
    st.session_state.last_video_url = None

if "last_title" not in st.session_state:
    st.session_state.last_title = None

if "last_caption" not in st.session_state:
    st.session_state.last_caption = None

if "last_hashtags" not in st.session_state:
    st.session_state.last_hashtags = None

# ---------------------------------------------------------
# HELPERS
# ---------------------------------------------------------
def generate_state() -> str:
    return str(uuid.uuid4())


def get_r2_client():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY,
        config=Config(signature_version="s3v4"),
        region_name="auto",
    )


def call_openai_chat(system_prompt: str, user_prompt: str) -> str:
    url = "https://api.openai.com/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.7,
    }
    r = requests.post(url, headers=headers, json=payload)
    r.raise_for_status()
    data = r.json()
    return data["choices"][0]["message"]["content"].strip()


# ---------------------------------------------------------
# AI COPY GENERATION
# ---------------------------------------------------------
def generate_title(description: str) -> str:
    system = "You write short, high-converting titles for TikTok/Shorts/Reels."
    user = f"Write a punchy title (max 60 characters) for this video: {description}"
    return call_openai_chat(system, user)


def generate_caption(description: str) -> str:
    system = "You write engaging, conversion-focused social video captions."
    user = (
        "Write a compelling caption (2–4 short lines) for this short-form video. "
        "Make it conversational and hooky. Video description: " + description
    )
    return call_openai_chat(system, user)


def generate_hashtags(description: str, niche: str = "business, marketing, creators") -> str:
    system = "You generate optimized hashtags for TikTok, YouTube Shorts, and Instagram Reels."
    user = (
        "Based on this video description, generate 10–15 hashtags. "
        "Mix broad and niche tags. Return them as a single line, space-separated.\n\n"
        f"Video description: {description}\nNiche: {niche}"
    )
    return call_openai_chat(system, user)


def generate_capcut_template_notes(description: str) -> str:
    system = "You design simple CapCut template instructions for editors."
    user = (
        "Create a simple CapCut template plan for this video. "
        "Include: scene beats, text overlays, B-roll ideas, and transitions. "
        f"Video description: {description}"
    )
    return call_openai_chat(system, user)


# ---------------------------------------------------------
# TIKTOK OAUTH — STEP 1: LOGIN URL
# ---------------------------------------------------------
def get_tiktok_login_url() -> str:
    state = generate_state()
    st.session_state.oauth_state = state

    return (
        "https://www.tiktok.com/v2/auth/authorize/"
        f"?client_key={TIKTOK_CLIENT_KEY}"
        f"&response_type=code"
        f"&scope={TIKTOK_SCOPES}"
        f"&redirect_uri={TIKTOK_REDIRECT_URI}"
        f"&state={state}"
    )


# ---------------------------------------------------------
# TIKTOK OAUTH — STEP 2: EXCHANGE CODE FOR TOKEN
# ---------------------------------------------------------
def exchange_code_for_token(code: str) -> bool:
    url = "https://open.tiktokapis.com/v2/oauth/token/"

    payload = {
        "client_key": TIKTOK_CLIENT_KEY,
        "client_secret": TIKTOK_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": TIKTOK_REDIRECT_URI,
    }

    r = requests.post(url, data=payload)
    data = r.json()

    if "access_token" in data:
        st.session_state.tiktok_access_token = data["access_token"]
        st.session_state.tiktok_refresh_token = data.get("refresh_token")
        return True

    st.error("Failed to exchange TikTok OAuth code.")
    st.json(data)
    return False


# ---------------------------------------------------------
# R2 UPLOAD — DIRECT UPLOAD
# ---------------------------------------------------------
def upload_to_r2(file) -> str:
    r2 = get_r2_client()
    key = f"uploads/{uuid.uuid4()}_{file.name}"

    r2.upload_fileobj(
        Fileobj=file,
        Bucket=R2_BUCKET_NAME,
        Key=key,
        ExtraArgs={"ContentType": file.type},
    )

    public_url = f"{R2_PUBLIC_DOMAIN}/{key}"
    return public_url


# ---------------------------------------------------------
# TIKTOK DRAFT UPLOAD
# ---------------------------------------------------------
def upload_to_tiktok_draft(video_url: str, title: str) -> dict:
    url = "https://open.tiktokapis.com/v2/post/publish/video/init/"

    headers = {
        "Authorization": f"Bearer {st.session_state.tiktok_access_token}",
        "Content-Type": "application/json",
    }

    payload = {
        "post_info": {
            "title": title or "Uploaded via GoCopy AI",
            "privacy_level": "SELF",  # draft
        },
        "source_info": {
            "source": "PULL_FROM_URL",
            "video_url": video_url,
        },
    }

    r = requests.post(url, headers=headers, json=payload)
    try:
        return r.json()
    except Exception:
        return {"status_code": r.status_code, "text": r.text}


# ---------------------------------------------------------
# TAB 0 — DASHBOARD
# ---------------------------------------------------------
def dashboard_tab():
    st.header("GoCopy AI – Short‑Form Content Engine")
    st.markdown(
        """
Welcome to **GoCopy AI** — your pipeline for:

- 🎬 Uploading videos to **R2** and pushing them to **TikTok Drafts**
- ✍️ Generating **titles, captions, and hashtags** with AI
- 🎨 Getting **CapCut template notes** for editors
- 📦 Reusing the same asset across **TikTok, Shorts, and Reels**

Use the tabs above to move through the workflow.
"""
    )

    if st.session_state.last_video_url:
        st.subheader("Latest uploaded video")
        st.code(st.session_state.last_video_url, language="text")
        if st.session_state.last_title:
            st.write("**Title:**", st.session_state.last_title)
        if st.session_state.last_caption:
            st.write("**Caption:**")
            st.write(st.session_state.last_caption)
        if st.session_state.last_hashtags:
            st.write("**Hashtags:**")
            st.code(st.session_state.last_hashtags, language="text")


# ---------------------------------------------------------
# TAB 1 — TIKTOK UPLOADER
# ---------------------------------------------------------
def tiktok_uploader_tab():
    st.header("🎬 TikTok Uploader")

    # Handle OAuth callback
    try:
        query_params = st.query_params  # new API
    except Exception:
        query_params = st.experimental_get_query_params()  # fallback

    if "code" in query_params and not st.session_state.tiktok_access_token:
        code = query_params["code"]
        if isinstance(code, list):
            code = code[0]

        state = query_params.get("state", "")
        if isinstance(state, list):
            state = state[0]

        if state != st.session_state.oauth_state:
            st.error("OAuth state mismatch. Please try logging in again.")
            st.stop()

        if exchange_code_for_token(code):
            st.success("TikTok login successful!")

    # If not logged in
    if not st.session_state.tiktok_access_token:
        st.info("Connect your TikTok account to start uploading drafts.")
        login_url = get_tiktok_login_url()
        st.link_button("Login with TikTok", login_url)
        return

    st.success("Connected to TikTok")

    col1, col2 = st.columns([2, 1])

    with col1:
        uploaded_file = st.file_uploader("Upload a video", type=["mp4", "mov", "m4v"])
        description = st.text_area(
            "Describe your video (for AI copy)",
            placeholder="e.g. 30-second tip about how to get more clients using short-form content…",
        )

        auto_copy = st.checkbox("Generate AI title, caption & hashtags", value=True)

        manual_title = st.text_input("Custom title (optional)")
        manual_caption = st.text_area("Custom caption (optional)")
        manual_hashtags = st.text_input("Custom hashtags (optional, space-separated)")

        if uploaded_file and st.button("Upload to R2 and send to TikTok Drafts"):
            if auto_copy and not description:
                st.warning("Add a short description so AI can generate copy.")
                st.stop()

            with st.spinner("Uploading video to R2…"):
                video_url = upload_to_r2(uploaded_file)

            st.success("Uploaded to R2")
            st.write("R2 URL:")
            st.code(video_url, language="text")

            # AI copy
            if auto_copy:
                with st.spinner("Generating AI title, caption, and hashtags…"):
                    title = generate_title(description)
                    caption = generate_caption(description)
                    hashtags = generate_hashtags(description)
            else:
                title = manual_title or "Uploaded via GoCopy AI"
                caption = manual_caption or ""
                hashtags = manual_hashtags or ""

            # Save to session
            st.session_state.last_video_url = video_url
            st.session_state.last_title = title
            st.session_state.last_caption = caption
            st.session_state.last_hashtags = hashtags

            st.subheader("Final copy for TikTok")
            st.write("**Title:**", title)
            st.write("**Caption:**")
            st.write(caption)
            if hashtags:
                st.write("**Hashtags:**")
                st.code(hashtags, language="text")

            with st.spinner("Sending video to TikTok Drafts…"):
                result = upload_to_tiktok_draft(video_url, title)

            st.write("TikTok API Response:")
            st.json(result)

    with col2:
        st.subheader("Tips")
        st.markdown(
            """
- Use **short, punchy descriptions** for better AI copy.
- Keep videos under **60 seconds** for best TikTok performance.
- You can reuse the same R2 URL in the **Multi‑Platform Export** tab.
"""
        )


# ---------------------------------------------------------
# TAB 2 — AI COPY LAB
# ---------------------------------------------------------
def ai_copy_lab_tab():
    st.header("✍️ AI Copy Lab")

    description = st.text_area(
        "Describe your video or hook",
        placeholder="e.g. A 45-second rant about why most creators overthink their first video…",
    )
    niche = st.text_input(
        "Niche (for hashtags)",
        value="business, marketing, creators",
    )

    if st.button("Generate copy"):
        if not description:
            st.warning("Please describe your video first.")
            st.stop()

        with st.spinner("Generating title…"):
            title = generate_title(description)

        with st.spinner("Generating caption…"):
            caption = generate_caption(description)

        with st.spinner("Generating hashtags…"):
            hashtags = generate_hashtags(description, niche)

        st.subheader("Title")
        st.write(title)

        st.subheader("Caption")
        st.write(caption)

        st.subheader("Hashtags")
        st.code(hashtags, language="text")

        st.session_state.last_title = title
        st.session_state.last_caption = caption
        st.session_state.last_hashtags = hashtags


# ---------------------------------------------------------
# TAB 3 — MULTI‑PLATFORM EXPORT
# ---------------------------------------------------------
def multi_platform_tab():
    st.header("📦 Multi‑Platform Export")

    if not st.session_state.last_video_url:
        st.info("Upload a video in the TikTok Uploader tab first.")
        return

    video_url = st.session_state.last_video_url
    title = st.session_state.last_title or "Your short-form video"
    caption = st.session_state.last_caption or ""
    hashtags = st.session_state.last_hashtags or ""

    st.subheader("Core Asset")
    st.write("**R2 Video URL:**")
    st.code(video_url, language="text")

    st.subheader("TikTok")
    st.write("**Title:**", title)
    st.write("**Caption:**")
    st.write(caption)
    if hashtags:
        st.write("**Hashtags:**")
        st.code(hashtags, language="text")

    st.subheader("YouTube Shorts")
    yt_title = f"{title} #shorts"
    st.write("**Title:**", yt_title)
    st.write("**Description:**")
    st.write(caption + "\n\n" + hashtags)

    st.subheader("Instagram Reels")
    st.write("**Caption:**")
    st.write(caption + "\n\n" + hashtags)

    st.markdown("---")
    st.subheader("CapCut Template Notes")
    if st.button("Generate CapCut template notes"):
        description = (
            caption if caption else "Short-form vertical video for TikTok/Shorts/Reels."
        )
        with st.spinner("Generating CapCut template notes…"):
            notes = generate_capcut_template_notes(description)
        st.text_area("CapCut template plan", value=notes, height=250)


# ---------------------------------------------------------
# MAIN APP
# ---------------------------------------------------------
def main():
    st.title("GoCopy AI – Short‑Form Content Engine")

    tabs = st.tabs(
        [
            "Dashboard",
            "TikTok Uploader",
            "AI Copy Lab",
            "Multi‑Platform Export",
        ]
    )

    with tabs[0]:
        dashboard_tab()
    with tabs[1]:
        tiktok_uploader_tab()
    with tabs[2]:
        ai_copy_lab_tab()
    with tabs[3]:
        multi_platform_tab()


if __name__ == "__main__":
    main()
