// engine.ts — Process execution and terminal streaming helpers
import { colors } from 'jsr:@cliffy/ansi@1.2.1/colors';
import { Select } from 'jsr:@cliffy/prompt@1.2.1/select';
import { TextLineStream } from 'jsr:@std/streams@1.0.8';

export { colors, Select };

export interface ProcessResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly combined: string;
  readonly exitCode: number;
  readonly elapsedMs: number;
}

export interface SpawnStreamingOptions {
  readonly cmd: readonly string[];
  readonly cwd?: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
  readonly onLine?: (line: string, type: 'stdout' | 'stderr') => void;
}

/**
 * Spawns a child process and streams unbuffered logs through Web Streams in RAM.
 */
export async function spawnStreamingProcess(
  options: SpawnStreamingOptions,
): Promise<ProcessResult> {
  const [executable, ...args] = options.cmd;
  if (!executable) {
    return {
      stdout: '',
      stderr: 'No executable specified in command',
      combined: 'No executable specified in command',
      exitCode: 1,
      elapsedMs: 0,
    };
  }

  const startMs = Date.now();

  const command = new Deno.Command(executable, {
    args,
    cwd: options.cwd,
    env: {
      FORCE_COLOR: '1',
      CLICOLOR_FORCE: '1',
      DENO_NO_PROMPT: '1',
      ...options.env,
    },
    stdout: 'piped',
    stderr: 'piped',
    signal: options.signal,
  });

  const child = command.spawn();

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];
  const combinedLines: string[] = [];

  const readStream = async (
    stream: ReadableStream<Uint8Array>,
    type: 'stdout' | 'stderr',
    targetLines: string[],
  ): Promise<void> => {
    try {
      const lineStream = stream
        .pipeThrough(new TextDecoderStream() as unknown as TransformStream<Uint8Array, string>)
        .pipeThrough(new TextLineStream({ allowCR: true }));

      for await (const line of lineStream) {
        targetLines.push(line);
        combinedLines.push(line);
        options.onLine?.(line, type);
      }
    } catch {
      // Stream reading might be interrupted if process was aborted
    }
  };

  const [status] = await Promise.all([
    child.status,
    readStream(child.stdout, 'stdout', stdoutLines),
    readStream(child.stderr, 'stderr', stderrLines),
  ]);

  const elapsedMs = Date.now() - startMs;

  return {
    stdout: stdoutLines.join('\n'),
    stderr: stderrLines.join('\n'),
    combined: combinedLines.join('\n'),
    exitCode: status.code,
    elapsedMs,
  };
}

let signalTrapsInstalled = false;

export function installSignalTraps(): void {
  if (signalTrapsInstalled) return;
  signalTrapsInstalled = true;
  try {
    Deno.addSignalListener('SIGINT', () => {
      Deno.exit(130);
    });
    Deno.addSignalListener('SIGTERM', () => {
      Deno.exit(143);
    });
  } catch {
    // Signal listeners might not be supported in some sandboxes
  }
}

export function banner(
  text: string,
  color: 'magenta' | 'cyan' | 'green' | 'yellow' = 'magenta',
): string {
  return colors.bold[color](text);
}

const APP_COLOR_FNS = [
  colors.bold.cyan,
  colors.bold.green,
  colors.bold.yellow,
  colors.bold.magenta,
  colors.bold.blue,
];

export function formatAppTag(name: string, index: number, maxLen = 7): string {
  const colorFn = APP_COLOR_FNS[index % APP_COLOR_FNS.length];
  const padded = name.padEnd(maxLen, ' ');
  return colorFn(`[${padded}]`);
}
