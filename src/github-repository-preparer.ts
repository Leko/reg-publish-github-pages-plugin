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
        message: "GitHub repository name (ex. owner/name)",
      },
      {
        name: "branchName",
        type: "input",
        message: "Branch name",
      },
      {
        name: "createOrphanBranch",
        type: "confirm",
        message: "Do you want to create branch in the repository?",
        default: true,
      },
      {
        name: "token",
        type: "input",
        message: "GitHub access token",
      },
    ];
  }

  async prepare(config: PluginCreateOptions<SetupInquireResult>) {
    const { logger, options } = config;
    const { createOrphanBranch, ...pluginConfig } = options;
    logger.verbose(
      JSON.stringify({
        ...options,
        token: "*".repeat(options.token.length) || "N/A",
      }),
    );
    if (!createOrphanBranch) {
      logger.verbose("createOrphanBranch=false");
      return pluginConfig;
    }

    logger.verbose(`createOrphanBranch=true`);
    const [owner, repo] = options.repository.split("/");
    const gitUtil = new GitUtil({
      owner,
      repo,
      logger,
      branchName: options.branchName,
      token: options.token,
    });
    await gitUtil.createOrphanBranchIfNotExists();
    logger.verbose("An orphan branch was created");
    return pluginConfig;
  }
}
