const fs = require("fs/promises");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const htmlDir = path.join(root, "html");

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await copyDir(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    })
  );
}

async function build() {
  await fs.rm(dist, { recursive: true, force: true });
  await fs.mkdir(dist, { recursive: true });

  const assetDirs = ["css", "js", "assets", "photos"];
  for (const dir of assetDirs) {
    const src = path.join(root, dir);
    if (await pathExists(src)) {
      await copyDir(src, path.join(dist, dir));
    }
  }

  const dataFile = path.join(root, "data", "profile.xml");
  if (await pathExists(dataFile)) {
    await fs.copyFile(dataFile, path.join(dist, "data.xml"));
  }

  if (!(await pathExists(htmlDir))) {
    throw new Error("html directory not found.");
  }

  const htmlFiles = (await fs.readdir(htmlDir)).filter((name) => name.endsWith(".html"));
  for (const file of htmlFiles) {
    const srcPath = path.join(htmlDir, file);
    const destPath = path.join(dist, file);
    let content = await fs.readFile(srcPath, "utf8");

    content = content
      .replaceAll("../css/", "./css/")
      .replaceAll("../js/", "./js/")
      .replaceAll("../assets/", "./assets/")
      .replaceAll("../photos/", "./photos/")
      .replaceAll("../data/", "./data/");

    await fs.writeFile(destPath, content, "utf8");
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});