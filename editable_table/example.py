import pandas as pd
import streamlit as st
from editable_table import editable_table

# Set the page to wide mode
st.set_page_config(layout="wide")

st.subheader("Editable Table Component Demo")
uploaded_file = st.file_uploader("Upload a CSV file", type="csv")
if not uploaded_file:
    st.stop()

# Add a session state key to track the previous file
if "previous_file" not in st.session_state:
    st.session_state["previous_file"] = uploaded_file

# Check if a new file was uploaded
if uploaded_file and uploaded_file != st.session_state["previous_file"]:
    # Reset the initial data and update the previous file
    initial_data = pd.read_csv(uploaded_file).head(150)
    st.session_state["initial_data"] = initial_data
    st.session_state["previous_file"] = uploaded_file
    st.session_state["updated_data"] = initial_data
elif "initial_data" not in st.session_state:
    initial_data = pd.read_csv(uploaded_file).head(150)
    st.session_state["initial_data"] = initial_data
    st.session_state["updated_data"] = initial_data

initial_data = st.session_state["initial_data"]

# Create tabs with more descriptive names and better organization
tab_table, tab_data = st.tabs(["Interactive Table", "Raw Data Preview"])

with tab_table:
    kwargs = {}
    if "PAYMENT_STATUS" in initial_data.columns:
        kwargs["editable_columns"] = ["PAYMENT_STATUS"]
    st.session_state["updated_data"] = editable_table(
        data=initial_data, key=f"file_{uploaded_file.name}", **kwargs
    )
with tab_data:
    # Display data in a more structured way
    st.subheader("Raw Data Preview")
    st.dataframe(st.session_state["updated_data"])

