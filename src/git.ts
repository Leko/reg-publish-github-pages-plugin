import fs, { promises as fsPromise } from "fs";
import path from "path";
import assert from "assert";
import { Octokit } from "@octokit/rest";
import git from "isomorphic-git";
import http from "isomorphic-git/http/node";
import type { PluginLogger } from "reg-suit-interface";
import type { ObjectListResult } from "reg-suit-util";

// > Git has a well-known, or at least sort-of-well-known, empty tree whose SHA1 ...
// > You can see this in any repo, even a newly created one, ...
// https://stackoverflow.com/questions/9765453
const SHA1_EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

const getIsomorphicGitOptions = (token: string) => ({
  fs,
  http,
  onAuth: () => ({ username: token }),
  headers: {
    // GitHub uses user-agent sniffing for git/* and changes its behavior which is frustrating
    "user-agent": "git/reg-publish-github-pages-plugin",
  },
});

export class GitUtil {
  private _owner: string;
  private _repo: string;
  private _branchName: string;
  private _token: string;
  private _logger: PluginLogger;
  private _octokit: Octokit;

  constructor({
    owner,
    repo,
    branchName,
    token,
    logger,
  }: {
    owner: string;
    repo: string;
    branchName: string;
    token: string;
    logger: PluginLogger;
  }) {
    this._owner = owner;
    this._repo = repo;
    this._branchName = branchName;
    this._token = token;
    this._logger = logger;

    this._octokit = new Octokit({
      auth: token,
      log: {
        debug: msg => logger.verbose(msg),
        info: msg => logger.info(msg),
        warn: msg => logger.warn(msg),
        error: msg => logger.error(msg),
      },
    });
  }

  async clone({ distDir }: { distDir: string }) {
    const repo = getIsomorphicGitOptions(this._token);
    await git.clone({
      ...repo,
      dir: distDir,
      ref: this._branchName,
      url: `https://github.com/${this._owner}/${this._repo}`,
      // Performance optimization
      depth: 1,
      singleBranch: true,
      noTags: true,
      noCheckout: true,
    });
    // We need to run `git reset .` not to overwrite existing tree when we use --no-checkout.
    const matrix = await git.statusMatrix({ fs, dir: distDir, ref: this._branchName, filepaths: ["."] });
    await Promise.all(matrix.map(([filepath]) => git.resetIndex({ ...repo, dir: distDir, filepath })));
  }

  async add({ sourcePath, asPath, repositoryDir }: { sourcePath: string; asPath: string; repositoryDir: string }) {
    const distPath = path.join(repositoryDir, asPath);
    const distDir = path.dirname(distPath);

    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    await fsPromise.copyFile(sourcePath, distPath);
    await git.add({
      ...getIsomorphicGitOptions(""),
      dir: repositoryDir,
      filepath: asPath,
    });
    this._logger.verbose(`Added ${sourcePath} -> ${asPath}`);
  }

  async listRemoteFiles({ prefix }: { prefix: string }): Promise<ObjectListResult> {
    try {
      const res = await this._octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
        owner: this._owner,
        repo: this._repo,
        ref: this._branchName,
        path: prefix,
      });
      if (!Array.isArray(res.data)) {
        throw new Error(`${prefix} must be a directory`);
      }

      return {
        isTruncated: false,
        contents: res.data
          .filter(f => f.type === "file")
          .map(f => ({
            key: f.path,
          })),
      };
    } catch (e) {
      if (e.status === 404) {
        return {
          isTruncated: false,
          contents: [],
        };
      }

      throw e;
    }
  }

  async getDownloadUrl({ path }: { path: string }): Promise<string> {
    const res = await this._octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner: this._owner,
      repo: this._repo,
      ref: this._branchName,
      path,
    });
    assert(!Array.isArray(res.data) && res.data.type === "file", `${path} must be a file`);
    assert(res.data.download_url, `${path} must have download_url`);

    return res.data.download_url;
  }

  async commitAndPush({ repositoryDir, key }: { repositoryDir: string; key: string }): Promise<void> {
    const repo = {
      ...getIsomorphicGitOptions(this._token),
      dir: repositoryDir,
    };

    const me = await this.getMe();
    const author = { email: me.email ?? undefined, name: me.login };
    const message = `Add ${key}`;
    await git.commit({
      ...repo,
      author,
      committer: author,
      message,
    });
    this._logger.verbose(`Commited: ${message}`);

    await git.push({
      ...repo,
      ref: this._branchName,
    });
    this._logger.verbose(`Pushed: ${this._branchName}`);
  }

  async createOrphanBranchIfNotExists() {
    const res = await this._octokit.request("POST /repos/{owner}/{repo}/git/commits", {
      owner: this._owner,
      repo: this._repo,
      message: "Initial commit",
      tree: SHA1_EMPTY_TREE,
      parents: [],
    });
    await this._octokit.request("POST /repos/{owner}/{repo}/git/refs", {
      owner: this._owner,
      repo: this._repo,
      // If it doesn't start with 'refs' and have at least two slashes, it will be rejected.
      ref: `refs/heads/${this._branchName}`,
      sha: res.data.sha,
    });
  }

  async getMe() {
    const { data } = await this._octokit.request("GET /user");
    return data;
  }
}
