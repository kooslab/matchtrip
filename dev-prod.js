#!/usr/bin/env bun
import { spawn } from 'child_process';
import { config } from 'dotenv';

// Load .env.prod with override
config({ path: '.env.prod', override: true });

// Start Vite with Bun runtime
const vite = spawn('bunx', ['--bun', 'vite', 'dev', '--mode', 'production'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  }
});

vite.on('exit', (code) => {
  process.exit(code);
});