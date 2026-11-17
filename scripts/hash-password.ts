import bcrypt from "bcryptjs";
import { createInterface } from "node:readline";

async function readPassword(): Promise<string> {
  const arg = process.argv[2];
  if (arg) return arg;
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => rl.question("Admin password (min 12 chars): ", (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
  const password = await readPassword();
  if (password.length < 12) {
    console.error("Password must be at least 12 characters.");
    process.exit(1);
  }
  const hash = await bcrypt.hash(password, 12);
  console.log("\nVercel / host dashboard (raw):\n" + hash);
  console.log("\nLocal .env file (dollar signs escaped):\nADMIN_PASSWORD_HASH=\"" + hash.replace(/\$/g, "\\$") + "\"\n");
}

main();
