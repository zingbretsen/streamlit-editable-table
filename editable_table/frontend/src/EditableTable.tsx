import {
  Streamlit,
  withStreamlitConnection,
  ComponentProps,
} from "streamlit-component-lib"
import React, { useCallback, useEffect, useState, ReactElement, useMemo } from "react"

/**
 * This is a React-based component template. The passed props are coming from the 
 * Streamlit library. Your custom args can be accessed via the `args` props.
 */

const adjustTextareaHeight = (element: HTMLTextAreaElement) => {
  element.style.height = '0'
  element.style.height = `${element.scrollHeight}px`
}

// If the last cell is the one with text, you can set the width to be larger than the others
const lastCellWidth: string = 'auto';

// Create a memoized cell component to prevent unnecessary re-renders
const TableCell = React.memo(({
  value,
  disabled,
  textareaStyle,
  cellStyle,
  onCellChange,
  rowIndex,
  colIndex,
  isLastColumn
}: {
  value: string
  disabled: boolean
  textareaStyle: React.CSSProperties
  cellStyle: React.CSSProperties
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void
  rowIndex: number
  colIndex: number
  isLastColumn: boolean
}) => {
  const finalCellStyle = {
    ...cellStyle,
    ...(isLastColumn ? { width: lastCellWidth } : { width: 'auto' })
  }

  return (
    <td style={finalCellStyle}>
      {disabled ? (
        <p style={{
          margin: '0',
          whiteSpace: 'pre-wrap'
        }}>
          {value}
        </p>
      ) : (
        <textarea
          value={value}
          onChange={(e) => {
            onCellChange(rowIndex, colIndex, e.target.value)
            adjustTextareaHeight(e.target)
          }}
          onFocus={(e) => adjustTextareaHeight(e.target)}
          style={textareaStyle}
          rows={1}
        />
      )}
    </td>
  )
})

const TableRow = React.memo(({
  row,
  rowIndex,
  disabled,
  textareaStyle,
  cellStyle,
  onCellChange,
  editableColumns,
  columns
}: {
  row: string[]
  rowIndex: number
  disabled: boolean
  textareaStyle: React.CSSProperties
  cellStyle: React.CSSProperties
  onCellChange: (rowIndex: number, colIndex: number, value: string) => void
  editableColumns: string[],
  columns: string[]
}) => {
  return (
    <tr>
      {row.map((cell, colIndex) => (
        <TableCell
          key={`${rowIndex}-${colIndex}`}
          value={cell}
          disabled={disabled || !editableColumns.includes(columns[colIndex])}
          textareaStyle={textareaStyle}
          cellStyle={cellStyle}
          onCellChange={onCellChange}
          rowIndex={rowIndex}
          colIndex={colIndex}
          isLastColumn={colIndex === row.length - 1}
        />
      ))}
    </tr>
  )
})

function EditableTable({ args, disabled, theme }: ComponentProps): ReactElement {
  // Expect data to be passed as a 2D array from Python
  const initialData: string[][] = args.data || [["", ""], ["", ""]]
  const editableColumns: string[] = args.editable_columns
  const [tableData, setTableData] = useState<string[][]>(initialData)
  // Use a Map to track only changed cells
  const [changedCells, setChangedCells] = useState<Map<string, string>>(new Map())

  const style: React.CSSProperties = {
    borderCollapse: 'collapse',
    width: '100%',
    color: 'white'
  }

  const cellStyle: React.CSSProperties = {
    padding: '8px',
    border: `1px solid ${theme?.secondaryBackgroundColor || '#ddd'}`,
  }

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: theme?.textColor || 'inherit',
    resize: 'vertical',
    minHeight: '24px',
    height: 'auto',
    minWidth: '100px',
    overflow: 'hidden',
    fontFamily: 'inherit',
    padding: '0',
    margin: '0',
  }

  // Add effect to adjust all textareas on initial render and data changes
  useEffect(() => {
    const textareas = document.querySelectorAll('textarea')
    textareas.forEach(textarea => {
      adjustTextareaHeight(textarea as HTMLTextAreaElement)
    })
  }, [tableData])

  useEffect(() => {
    // Only send table data back to Streamlit when tableData changes
    // (which will only happen on save)
    Streamlit.setComponentValue(tableData)
  }, [tableData])

  useEffect(() => {
    Streamlit.setFrameHeight()
  }, [tableData])

  const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
    const key = `${rowIndex}-${colIndex}`
    setChangedCells(prev => {
      const newMap = new Map(prev)
      newMap.set(key, value)
      return newMap
    })
  }, [])

  const handleSave = useCallback(() => {
    setTableData(prevData => {
      const newData = prevData.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const key = `${rowIndex}-${colIndex}`
          return changedCells.get(key) || cell
        })
      )
      return newData
    })
    setChangedCells(new Map())
  }, [changedCells])

  // Create a memoized version of the table data that includes changes
  const currentTableData = useMemo(() => {
    return tableData.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        const key = `${rowIndex}-${colIndex}`
        return changedCells.get(key) || cell
      })
    )
  }, [tableData, changedCells])

  return (
    <div style={{ overflow: 'auto', height: '100%' }}>
      <button
        onClick={handleSave}
        disabled={disabled}
        style={{
          marginBottom: '10px',
          padding: '5px 10px',
          background: theme?.primaryColor || '#ff4b4b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        Save Changes
      </button>
      <table style={style}>
        <tbody>
          {currentTableData.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              row={row}
              rowIndex={rowIndex}
              disabled={disabled || rowIndex === 0}
              textareaStyle={textareaStyle}
              cellStyle={cellStyle}
              onCellChange={handleCellChange}
              editableColumns={editableColumns}
              columns={args.data[0]}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

// "withStreamlitConnection" is a wrapper function. It bootstraps the
// connection between your component and the Streamlit app, and handles
// passing arguments from Python -> Component.
//
// You don't need to edit withStreamlitConnection (but you're welcome to!).
export default withStreamlitConnection(EditableTable)
