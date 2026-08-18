import { danger, warn, schedule } from 'danger'

const SKIP_PATTERNS = [
  /node_modules\//,
  /coverage\//,
  /package-lock\.json$/,
  /\.md$/,
  /dangerfile\.js$/,
]

const DEBUG_PATTERN = /\b(console\.(log|debug)|debugger)\b/

schedule(async () => {
  const changedFiles = [...danger.git.modified_files, ...danger.git.created_files]

  const filesToScan = changedFiles.filter(
    file => !SKIP_PATTERNS.some(pattern => pattern.test(file))
  )

  for (const file of filesToScan) {
    const diff = await danger.git.diffForFile(file)
    if (!diff) continue

    const addedLines = diff.added
      .split('\n')
      .filter(line => line.startsWith('+') && !line.startsWith('+++'))

    const hasDebugCode = addedLines.some(line => DEBUG_PATTERN.test(line))

    if (hasDebugCode) {
      warn(`Leftover \`console.log\`/\`debugger\` found in **${file}** — please remove before merging.`)
    }
  }
})
