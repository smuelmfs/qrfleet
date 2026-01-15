import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const excelPath = path.join(process.cwd(), 'Classeur1.xlsx')

if (!fs.existsSync(excelPath)) {
  console.error('Arquivo Excel não encontrado:', excelPath)
  process.exit(1)
}

const workbook = XLSX.readFile(excelPath)
const sheetName = workbook.SheetNames[0]
const worksheet = workbook.Sheets[sheetName]

console.log('Nome da planilha:', sheetName)
console.log('\n=== ESTRUTURA DA PLANILHA ===\n')

const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })
console.log('Total de linhas:', jsonData.length)
console.log('\nPrimeiras 10 linhas:')
jsonData.slice(0, 10).forEach((row: any, index: number) => {
  console.log(`Linha ${index + 1}:`, row)
})

const headers = jsonData[0] as string[]
console.log('\n=== CABEÇALHOS ===')
headers.forEach((header, index) => {
  console.log(`Coluna ${index + 1}: "${header}"`)
})

console.log('\n=== DADOS DE EXEMPLO (primeiras 3 linhas de dados) ===')
jsonData.slice(1, 4).forEach((row: any, index: number) => {
  console.log(`\nLinha ${index + 2}:`)
  headers.forEach((header, colIndex) => {
    console.log(`  ${header}: ${row[colIndex] || '(vazio)'}`)
  })
})

