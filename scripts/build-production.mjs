import { spawnSync } from 'node:child_process'

function run(command, args) {
  const executable = process.platform === 'win32' ? `${command}.cmd` : command
  const result = spawnSync(executable, args, {
    env: process.env,
    stdio: 'inherit',
  })

  if (result.error) {
    console.error(result.error)
    process.exit(1)
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

run('npx', ['--no-install', 'prisma', 'generate'])

if (process.env.VERCEL_ENV === 'production') {
  console.log('Applying production database migrations...')
  run('npx', ['--no-install', 'prisma', 'migrate', 'deploy'])

  // Seed is opt-in so normal production deployments never rewrite test data.
  if (process.env.SEED_PRODUCTION_DATA === 'true') {
    console.log('Loading production seed data...')
    run('npm', ['run', 'db:seed'])
  }
}

run('npx', ['--no-install', 'next', 'build'])
