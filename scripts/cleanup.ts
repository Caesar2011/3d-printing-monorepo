import { rm, readdir } from 'fs/promises'
import { join } from 'path'

async function cleanup() {
  // get all folders in ./packages
  const packages = await readdir('packages', { withFileTypes: true })

  // filter to only directories and remove their dist folders
  await Promise.all(
    packages
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => rm(join('packages', dirent.name, 'dist'), { recursive: true, force: true })),
  )
}

// @ts-ignore
await cleanup().catch(console.error)
