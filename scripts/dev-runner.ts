import { spawn } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// @ts-ignore
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const target = process.argv[2]
if (!target) {
  console.error('Usage: node scripts/dev-runner.ts <paleo|skull-king|anno>')
  process.exit(1)
}

const packageDirs = readdirSync(join(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

const nameToDir = new Map<string, string>()
for (const dir of packageDirs) {
  const pkg = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
  nameToDir.set(pkg.name, dir)
}

const depsOf = (dir: string): string[] => {
  const pkg = JSON.parse(readFileSync(join(root, 'packages', dir, 'package.json'), 'utf8'))
  return Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })
    .filter(([, version]) => version === 'workspace:*')
    .map(([name]) => nameToDir.get(name))
    .filter((dir): dir is string => dir !== undefined)
}

const closure = new Set<string>()
const visit = (dir: string): void => {
  if (closure.has(dir)) return
  closure.add(dir)
  for (const dep of depsOf(dir)) visit(dep)
}

const targetDir = nameToDir.get(`@jsxcad/${target}`)
if (!targetDir) {
  console.error(`Unknown package: @jsxcad/${target}`)
  process.exit(1)
}

visit(targetDir)

// @ts-ignore
const watched = [...closure]
console.log(`[dev-runner] ${target} watches dist of: ${watched.join(', ')}`)

const watchArgs = watched.flatMap((dir) => ['--watch', `packages/${dir}/dist`])
const nodemonBin = join(root, 'node_modules', 'nodemon', 'bin', 'nodemon.js')
const child = spawn(
  'node',
  [nodemonBin, '-q', ...watchArgs, '-e', 'js', '--delay', '500ms', '--exec', `yarn workspace @jsxcad/${target} start`],
  { cwd: root, stdio: 'inherit' },
)

child.on('error', (error) => {
  console.error(`[dev-runner] failed to start nodemon: ${error.message}`)
  process.exit(1)
})
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  process.exit(code ?? 1)
})

process.on('SIGINT', () => child.kill('SIGINT'))
process.on('SIGTERM', () => child.kill('SIGTERM'))
