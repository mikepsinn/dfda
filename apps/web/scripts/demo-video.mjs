/**
 * Records the clinic demo's videos: runs the tour (tests/e2e/tour.test.ts),
 * which follows content/clinic-demo/script.md, with DEMO_VIDEO=1, and copies
 * each journey's video to demo-videos/ as a .webm file, and as an .mp4 file
 * when ffmpeg is installed.
 *
 * Needs the same setup as the browser tests (playwright.config.ts): a
 * database with the demo data, and the app at E2E_BASE_URL or started by
 * Playwright.
 *
 * Usage: pnpm demo:video
 */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'

const results = 'test-results/demo-video'
const out = 'demo-videos'

rmSync(results, { recursive: true, force: true })
const run = spawnSync('pnpm', ['exec', 'playwright', 'test', 'tests/e2e/tour.test.ts', '--project=chromium', '--workers=1', `--output=${results}`], {
  stdio: 'inherit',
  env: { ...process.env, DEMO_VIDEO: '1' },
})
if (run.status !== 0) {
  console.error('The tour failed; the videos may be incomplete. See the Playwright report.')
  process.exit(run.status ?? 1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out)
const hasFfmpeg = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore' }).status === 0
// Each journey saves its video as <number>-<journey>.webm in its test's output folder (tests/e2e/tour.test.ts).
const videos = existsSync(results)
  ? readdirSync(results).flatMap((folder) =>
      statSync(join(results, folder)).isDirectory()
        ? readdirSync(join(results, folder))
            .filter((file) => /^\d+-[a-z-]+\.webm$/.test(file))
            .map((file) => join(results, folder, file))
        : [],
    )
  : []
for (const video of videos) {
  const name = video.split('/').pop().replace(/\.webm$/, '')
  const webm = join(out, `${name}.webm`)
  copyFileSync(video, webm)
  if (hasFfmpeg) {
    spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webm, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', join(out, `${name}.mp4`)], {
      stdio: 'inherit',
    })
  }
  console.log(`${out}/${name}.${hasFfmpeg ? 'mp4' : 'webm'}`)
}
if (videos.length === 0) {
  console.error('No videos were recorded.')
  process.exit(1)
}
