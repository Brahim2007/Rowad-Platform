import { readdir } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import path from 'node:path'

async function findTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(entries.map(async entry => {
    const entryPath = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      return findTestFiles(entryPath)
    }

    return entry.isFile() && entry.name.endsWith('.test.ts') ? [entryPath] : []
  }))

  return files.flat()
}

const testFiles = (await findTestFiles('src')).sort()

if (testFiles.length === 0) {
  console.error('No TypeScript test files were found under src.')
  process.exit(1)
}

const testProcess = spawn(
  process.execPath,
  ['--import', 'tsx', '--test', ...testFiles],
  { stdio: 'inherit' },
)

testProcess.on('error', error => {
  console.error(error)
  process.exit(1)
})

testProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
