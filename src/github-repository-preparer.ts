import type { PluginPreparer, PluginCreateOptions } from "reg-suit-interface";
import { PluginConfig } from "./github-pages-publisher-plugin";
import { GitUtil } from "./git";

export type SetupInquireResult = {
  createOrphanBranch: boolean;
  branchName: string;
  repository: string;
  token: string;
};

export class GithubRepositoryPreparer implements PluginPreparer<SetupInquireResult, PluginConfig> {
  inquire() {
    return [
      {
        name: "repository",
        type: "input",
        message: "Existing repository name ('owner/name')",
      },
      {
        name: "createOrphanBranch",
        type: "confirm",
        message: "Create an orphan branch in the repository",
        default: true,
      },
      {
        name: "branchName",
        type: "input",
        message: "New branch name",
        when: (ctx: any) => (ctx as { createOrphanBranch: boolean }).createOrphanBranch,
      },
      {
        name: "branchName",
        type: "input",
        message: "Existing branch name",
        when: (ctx: any) => !(ctx as { createOrphanBranch: boolean }).createOrphanBranch,
      },
    ];
  }

  async prepare(config: PluginCreateOptions<SetupInquireResult>) {
    const { logger, options } = config;
    logger.verbose(
      JSON.stringify({
        ...options,
        token: "*".repeat(options.token.length) || "N/A",
      }),
    );
    if (!options.createOrphanBranch) {
      logger.verbose("createOrphanBranch=false");
      return { ...options, token: process.env.GITHUB_TOKEN! };
    }

    logger.verbose(`createOrphanBranch=true`);
    const [owner, repo] = options.repository.split("/");
    const gitUtil = new GitUtil({
      owner,
      repo,
      logger,
      branchName: options.branchName,
      // FIXME: How to receive the token
      token: process.env.GITHUB_TOKEN!,
    });
    await gitUtil.createOrphanBranchIfNotExists();
    logger.verbose("An orphan branch was created");
    return { ...options, token: process.env.GITHUB_TOKEN! };
  }
}
