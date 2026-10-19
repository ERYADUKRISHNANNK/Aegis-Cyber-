const { spawn } = require("child_process");
const path = require("path");

const rootDir = path.resolve(__dirname, "../..");
const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

console.log("\x1b[36m=====================================================\x1b[0m");
console.log("\x1b[36m   AEGIS CYBER DEFENSE PLATFORM - DEV RUNNER         \x1b[0m");
console.log("\x1b[36m=====================================================\x1b[0m\n");

const children = [];

function startProcess(name, cwd, color) {
  console.log(`${color}[${name}]\x1b[0m Launching development service in ${cwd}...`);
  const proc = spawn(npmCmd, ["run", "dev"], {
    cwd,
    shell: true,
    stdio: "pipe"
  });

  proc.stdout.on("data", (data) => {
    process.stdout.write(`${color}[${name}]\x1b[0m ${data}`);
  });

  proc.stderr.on("data", (data) => {
    process.stderr.write(`${color}[${name} ERR]\x1b[0m ${data}`);
  });

  proc.on("close", (code) => {
    console.log(`${color}[${name}]\x1b[0m Exited with code ${code}`);
  });

  children.push(proc);
  return proc;
}

const backend = startProcess("BACKEND", path.join(rootDir, "backend"), "\x1b[32m");
setTimeout(() => {
  const frontend = startProcess("FRONTEND", path.join(rootDir, "frontend"), "\x1b[34m");
}, 2000);

function cleanup() {
  console.log("\n\x1b[33mStopping all Aegis-Cyber development services...\x1b[0m");
  for (const child of children) {
    if (child && !child.killed) {
      if (isWin) {
        spawn("taskkill", ["/pid", child.pid.toString(), "/f", "/t"]);
      } else {
        child.kill("SIGTERM");
      }
    }
  }
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);
