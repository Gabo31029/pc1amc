import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export async function exportToXlsx(
  filename: string,
  sheetName: string,
  columns: { header: string; key: string; width?: number }[],
  rows: Record<string, unknown>[],
) {
  const wb = new ExcelJS.Workbook()
  wb.created = new Date()
  const ws = wb.addWorksheet(sheetName)

  ws.columns = columns.map((c) => ({
    header: c.header,
    key: c.key,
    width: c.width ?? 18,
  }))

  rows.forEach((r) => ws.addRow(r))

  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buf = await wb.xlsx.writeBuffer()
  saveAs(new Blob([buf]), filename)
}

