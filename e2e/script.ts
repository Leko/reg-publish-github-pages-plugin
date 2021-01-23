import assert from "assert";
import path from "path";
import glob from "glob";
import { createLogger } from "reg-suit-util";
import { Octokit } from "@octokit/rest";
import { GithubPagesPublisherPlugin } from "../src/github-pages-publisher-plugin";
import { GithubRepositoryPreparer } from "../src/github-repository-preparer";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN!,
});
const preparer = new GithubRepositoryPreparer();
const logger = createLogger();

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
    ref: `heads/${branchName}`,
  });
}

async function case1(branchName: string) {
  const pluginConfig = await preparer.prepare({
    ...baseConfig,
    options: { createOrphanBranch: true, branchName, ...basePluginConfig },
    workingDirs: dirsA,
  });
  const plugin = new GithubPagesPublisherPlugin();
  plugin.init({
    ...baseConfig,
    options: pluginConfig,
    workingDirs: dirsA,
  });
  await plugin.publish("abcdef12345");

  plugin.init({
    ...baseConfig,
    options: pluginConfig,
    workingDirs: dirsB,
  });
  await plugin.fetch("abcdef12345");

  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");
}

async function case2(branchName: string) {
  const pluginConfig = await preparer.prepare({
    ...baseConfig,
    options: { createOrphanBranch: true, branchName, ...basePluginConfig },
    workingDirs: dirsA,
  });
  const plugin = new GithubPagesPublisherPlugin();
  plugin.init({
    ...baseConfig,
    options: {
      ...pluginConfig,
      pathPrefix: "artifacts",
    },
    workingDirs: dirsA,
  });
  await plugin.publish("abcdef12345");

  plugin.init({
    ...baseConfig,
    options: {
      ...pluginConfig,
      pathPrefix: "artifacts",
    },
    workingDirs: dirsB,
  });
  await plugin.fetch("abcdef12345");

  const list = glob.sync("dir_b/sample01.png", { cwd: dirsB.base });
  assert.equal(list[0], "dir_b/sample01.png");
}

async function main() {
  logger.setLevel("verbose");

  const timestamp = Date.now();
  const branch1 = `__e2e-${timestamp}-1`;
  const branch2 = `__e2e-${timestamp}-2`;

  try {
    logger.verbose("START tests:" + [branch1, branch2].join(", "));
    await case1(branch1);
    await case2(branch2);
    logger.verbose("SUCCESS");
  } catch (e) {
    logger.error(e.stack);
    throw e;
  } finally {
    logger.verbose("START tear down");
    await tearDown(branch1);
    await tearDown(branch2);
    logger.verbose("END tear down");
  }
}

main();
