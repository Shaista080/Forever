import fs from 'fs'
import https from 'https'

const lcovFile = process.env.LCOV_FILE
const title = process.env.REPORT_TITLE || 'Coverage Report'
const token = process.env.GITHUB_TOKEN
const repo = process.env.GITHUB_REPOSITORY
const prNumber = process.env.PR_NUMBER

function emoji(pct) {
  if (pct === 0) return '⚫'
  if (pct >= 80) return '🟢'
  if (pct >= 60) return '🟡'
  return '🔴'
}

function fmt(hit, total) {
  if (total === 0) return '➖'
  const pct = Math.round((hit / total) * 100)
  return `${emoji(pct)} ${pct}%`
}

function shortPath(p) {
  return p.replace(
    /^.*?(src|controllers|middleware|models|routes|hooks|pages|components|context)\//,
    '$1/'
  )
}

function parseLcov(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const records = content.split('end_of_record')
  const files = []
  let totals = { lf: 0, lh: 0, brf: 0, brh: 0, fnf: 0, fnh: 0 }

  for (const record of records) {
    if (!record.trim()) continue
    let sf = '',
      lf = 0,
      lh = 0,
      brf = 0,
      brh = 0,
      fnf = 0,
      fnh = 0

    for (const line of record.trim().split('\n')) {
      if (line.startsWith('SF:')) sf = line.slice(3)
      else if (line.startsWith('LF:')) lf = parseInt(line.slice(3)) || 0
      else if (line.startsWith('LH:')) lh = parseInt(line.slice(3)) || 0
      else if (line.startsWith('BRF:')) brf = parseInt(line.slice(4)) || 0
      else if (line.startsWith('BRH:')) brh = parseInt(line.slice(4)) || 0
      else if (line.startsWith('FNF:')) fnf = parseInt(line.slice(4)) || 0
      else if (line.startsWith('FNH:')) fnh = parseInt(line.slice(4)) || 0
    }

    if (sf) {
      files.push({ sf, lf, lh, brf, brh, fnf, fnh })
      totals.lf += lf
      totals.lh += lh
      totals.brf += brf
      totals.brh += brh
      totals.fnf += fnf
      totals.fnh += fnh
    }
  }

  return { files, totals }
}

function buildComment({ files, totals }) {
  let md = `### ${title}\n\n`
  md += '| File | Lines | Branches | Functions |\n'
  md += '|------|-------|----------|-----------|\n'

  for (const f of files) {
    md += `| \`${shortPath(f.sf)}\` | ${fmt(f.lh, f.lf)} | ${fmt(f.brh, f.brf)} | ${fmt(f.fnh, f.fnf)} |\n`
  }

  md += `| **Total** | ${fmt(totals.lh, totals.lf)} | ${fmt(totals.brh, totals.brf)} | ${fmt(totals.fnh, totals.fnf)} |\n`
  md +=
    '\n> 🟢 ≥80% &nbsp; 🟡 ≥60% &nbsp; 🔴 <60% &nbsp; ⚫ 0% &nbsp; ➖ no branches'

  return md
}

function request(options, payload) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => resolve({ status: res.statusCode, body: data }))
    })
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function upsertComment(body) {
  const [owner, repoName] = repo.split('/')
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'coverage-reporter',
  }

  // Find existing comment matching this report title
  const listRes = await request({
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repoName}/issues/${prNumber}/comments?per_page=100`,
    method: 'GET',
    headers: baseHeaders,
  })

  const comments = JSON.parse(listRes.body)
  const marker = `### ${title}`
  const existing = comments.find?.(
    (c) => c.user?.type === 'Bot' && c.body?.startsWith(marker)
  )

  const payload = JSON.stringify({ body })
  const isUpdate = !!existing
  const path = isUpdate
    ? `/repos/${owner}/${repoName}/issues/comments/${existing.id}`
    : `/repos/${owner}/${repoName}/issues/${prNumber}/comments`

  const res = await request({
    hostname: 'api.github.com',
    path,
    method: isUpdate ? 'PATCH' : 'POST',
    headers: { ...baseHeaders, 'Content-Length': Buffer.byteLength(payload) },
  }, payload)

  if (res.status >= 200 && res.status < 300) {
    console.log(`Coverage comment ${isUpdate ? 'updated' : 'posted'} (HTTP ${res.status})`)
  } else {
    console.error(`Failed: HTTP ${res.status} — ${res.body}`)
    process.exit(1)
  }
}

const parsed = parseLcov(lcovFile)
const comment = buildComment(parsed)
upsertComment(comment)
