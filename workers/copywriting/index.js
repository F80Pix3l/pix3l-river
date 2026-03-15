import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const worker = join(__dirname, 'lib', 'worker.js');

const child = spawn('node', [worker], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
