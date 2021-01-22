import assert from "assert";
import path from "path";
import glob from "glob";
import { createLogger } from "reg-suit-util";
import { Octokit } from "@octokit/rest";
import { GithubPagesPublisherPlugin } from "../src/github-pages-publisher-plugin";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN!,
});
const logger = createLogger();
logger.setLevel("verbose");

const baseConfig = {
  coreConfig: { actualDir: "", workingDir: "" },
  logger,
  noEmit: false,
};
const basePluginConfig = {
  repository: "Leko/reg-publish-github-pages-plugin",
  token: process.env.GITHUB_TOKEN!,
};

const dirsA = {
  base: path.join(__dirname, "..", "e2e", "report-fixture"),
  actualDir: path.join(__dirname, "..", "e2e", "report-fixture', 'dir_a"),
  expectedDir: path.join(__dirname, "..", "e2e", "report-fixture', 'dir_b"),
  diffDir: "",
};

const dirsB = {
  base: path.join(__dirname, "..", "e2e", "report-fixture-expected"),
  actualDir: path.join(__dirname, "..", "e2e", "report-fixture-expected", "dir_a"),
  expectedDir: path.join(__dirname, "..", "e2e", "report-fixture-expected", "dir_b"),
  diffDir: "",
};

async function tearDown(branchName: string) {
  const [owner, repo] = basePluginConfig.repository.split("/");
  await octokit.request("DELETE /repos/{owner}/{repo}/git/refs/{ref}", {
    owner,
    repo,
    ref: branchName,
  });
}

async function case1(branchName: string) {
  const plugin = new GithubPagesPublisherPlugin();
  plugin.init({
    ...baseConfig,
    options: {
      ...basePluginConfig,
      branchName,
    },
    workingDirs: dirsA,
  });
  await plugin.publish("abcdef12345");

  plugin.init({
    ...baseConfig,
    options: {
      ...basePluginConfig,
      branchName,
    },
    workingDirs: dirsB,
  });
  await plugin.fetch("abcdef12345");

  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");
}

async function case2(branchName: string) {
  const plugin = new GithubPagesPublisherPlugin();
  plugin.init({
    ...baseConfig,
    options: {
      ...basePluginConfig,
      branchName,
      pathPrefix: "artifacts",
    },
    workingDirs: dirsA,
  });
  await plugin.publish("abcdef12345");

  plugin.init({
    ...baseConfig,
    options: {
      ...basePluginConfig,
      branchName,
      pathPrefix: "artifacts",
    },
    workingDirs: dirsB,
  });
  await plugin.fetch("abcdef12345");

  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");
}

async function main() {
  const timestamp = Date.now();
  const branch1 = `__e2e-${timestamp}-1`;
  const branch2 = `__e2e-${timestamp}-2`;

  try {
    await case1(branch1);
    await case2(branch2);
  } finally {
    await tearDown(branch1);
    await tearDown(branch2);
  }
}

main();
