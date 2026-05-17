const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

async function fileExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function runTests() {
  const indexPath = path.join(dist, "index.html");
  if (!(await fileExists(indexPath))) {
    throw new Error("dist/index.html was not generated.");
  }

  const indexContent = await fs.readFile(indexPath, "utf8");
  if (!indexContent.includes("<title")) {
    throw new Error("index.html is missing a <title> tag.");
  }

  const forbiddenPaths = ["../css/", "../js/", "../assets/", "../photos/"];
  for (const needle of forbiddenPaths) {
    if (indexContent.includes(needle)) {
      throw new Error(`index.html still contains ${needle} references.`);
    }
  }

  const requiredPaths = [
    path.join(dist, "css"),
    path.join(dist, "js"),
    path.join(dist, "assets"),
  ];

  for (const requiredPath of requiredPaths) {
    if (!(await fileExists(requiredPath))) {
      throw new Error(`Missing required folder: ${requiredPath}`);
    }
  }

  const dataFile = path.join(dist, "data.xml");
  if (!(await fileExists(dataFile))) {
    throw new Error("dist/data.xml is missing. Check data/profile.xml.");
  }

  console.log("All tests passed.");
}

runTests().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});