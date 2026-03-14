// Entry point for Railway — runs the TypeScript worker via tsx
import { createRequire } from 'module';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const tsx = join(__dirname, 'node_modules', '.bin', 'tsx');
const worker = join(__dirname, 'src', 'worker.ts');

const child = spawn(tsx, [worker], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
