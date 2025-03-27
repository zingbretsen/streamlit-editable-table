# streamlit-custom-component

Streamlit component that allows you to do X

## Installation instructions

```sh
pip install git+https://github.com/zingbretsen/streamlit-editable-table.git
```

## Usage instructions

```python
import pandas as pd
import streamlit as st

from editable_table import editable_table


table = pd.DataFrame({
    'A': [1, 2, 3],
    'B': [4, 5, 6],
    'C': [7, 8, 9]
})
value = editable_table(table, editable_columns=['A', 'B'], key='my_table_1')

st.write(value)
```
