import streamlit as st
import pandas as pd
import plotly.express as px
import json
from pathlib import Path

st.set_page_config(
    page_title="Simulasi Federated Learning - Flower",
    page_icon="🌸",
    layout="wide",
)

st.title("🌸 Simulasi Federated Learning")
st.markdown("Visualisasi hasil simulasi **1 Server + 3 Klien** menggunakan Flower (strategi FedAvg)")

HISTORY_FILE = Path("results/history.json")


def load_history():
    if HISTORY_FILE.exists():
        with open(HISTORY_FILE, "r") as f:
            return json.load(f)
    return None


history = load_history()

if history:
    df = pd.DataFrame(history)

    # Pastikan tipe data numerik
    df["round"] = pd.to_numeric(df["round"], errors="coerce")
    df["loss"] = pd.to_numeric(df["loss"], errors="coerce")
    df["accuracy"] = pd.to_numeric(df["accuracy"], errors="coerce")

    # Kartu metrik
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("Total Ronde", int(df["round"].max()))
    with col2:
        st.metric("Loss Terakhir", f"{df['loss'].iloc[-1]:.4f}")
    with col3:
        st.metric("Akurasi Terakhir", f"{df['accuracy'].iloc[-1]:.4f}")
    with col4:
        st.metric("Jumlah Klien", "3")

    st.divider()

    # Grafik
    col_left, col_right = st.columns(2)

    with col_left:
        st.subheader("📉 Loss Global per Ronde")
        fig_loss = px.line(df, x="round", y="loss", markers=True, title="Loss Global")
        fig_loss.update_layout(xaxis_title="Ronde", yaxis_title="Loss")
        st.plotly_chart(fig_loss, use_container_width=True)

    with col_right:
        st.subheader("📈 Akurasi Global per Ronde")
        fig_acc = px.line(df, x="round", y="accuracy", markers=True, title="Akurasi Global")
        fig_acc.update_layout(xaxis_title="Ronde", yaxis_title="Akurasi")
        st.plotly_chart(fig_acc, use_container_width=True)

    st.divider()

    # Tabel
    st.subheader("📋 Tabel Hasil Simulasi")
    st.dataframe(df, use_container_width=True, hide_index=True)

    # Unduh CSV
    csv = df.to_csv(index=False).encode("utf-8")
    st.download_button(
        label="⬇️ Unduh Hasil (CSV)",
        data=csv,
        file_name="flower_fl_history.csv",
        mime="text/csv",
    )

else:
    st.warning("⚠️ Belum ada file hasil simulasi (`results/history.json`).")
    st.info("""
    **Cara mendapatkan hasil simulasi:**

    1. Jalankan simulasi di komputer lokal:
       ```bash
       cd D:\\federatedlearning\\flwr-sim-visual
       python run_simulation.py
       ```

    2. Setelah selesai, file `results/history.json` akan terbentuk otomatis.

    3. Commit dan push file `results/history.json` ke GitHub, lalu redeploy di Streamlit Cloud.

    4. Atau unggah file JSON di sini:
    """)

    uploaded_file = st.file_uploader("Unggah history.json", type=["json"])
    if uploaded_file:
        history = json.load(uploaded_file)
        df = pd.DataFrame(history)
        st.success("✅ File berhasil dimuat!")
        st.dataframe(df)