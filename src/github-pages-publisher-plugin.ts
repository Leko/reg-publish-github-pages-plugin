import os from "os";
import fs, { promises as fsPromise } from "fs";
import path from "path";
import download from "download";
import type { PublisherPlugin, PluginCreateOptions, WorkingDirectoryInfo } from "reg-suit-interface";
import { AbstractPublisher, RemoteFileItem, FileItem, ObjectListResult } from "reg-suit-util";
import { GitUtil } from "./git";

export interface PluginConfig {
  repository: string;
  branchName: string;
  token: string;
  pattern?: string;
  customDomain?: string;
  pathPrefix?: string;
}

export class GithubPagesPublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-github-pages-plugin";

  private _options!: PluginCreateOptions<any>;
  private _pluginConfig!: PluginConfig;
  private _repositoryDir!: string;
  private _gitUtil!: GitUtil;

  init(config: PluginCreateOptions<PluginConfig>) {
    this.noEmit = config.noEmit;
    this.logger = config.logger;
    this._options = config;
    this._pluginConfig = {
      ...config.options,
    };

    const [owner, repo] = this._pluginConfig.repository.split("/");
    this._gitUtil = new GitUtil({
      owner,
      repo,
      branchName: this._pluginConfig.branchName,
      token: this._pluginConfig.token,
      logger: this.logger,
    });
  }

  async publish(key: string) {
    const reportUrl = `https://${this.getBaseUrl()}/${key}`;
    this._repositoryDir = await fsPromise.mkdtemp(path.join(os.tmpdir(), "reg-publish-github-pages-plugin"));

    await this._gitUtil.clone({
      distDir: this._repositoryDir,
    });
    await this.publishInternal(key);
    await this._gitUtil.commitAndPush({
      key,
      repositoryDir: this._repositoryDir,
    });
    this.logger.info(`reportUrl is ${reportUrl}`);

    return { reportUrl };
  }

  fetch(key: string): Promise<any> {
    return this.fetchInternal(key);
  }

  protected getBaseUrl() {
    if (this._pluginConfig.customDomain) {
      return this._pluginConfig.customDomain;
    } else {
      const [owner, name] = this._pluginConfig.repository.trim().split("/");
      return `${owner}.github.io/${name}`;
    }
  }

  protected getBucketRootDir(): string | undefined {
    return this._pluginConfig.pathPrefix;
  }

  protected getBucketName(): string {
    return this._pluginConfig.repository;
  }

  protected getLocalGlobPattern(): string | undefined {
    return this._pluginConfig.pattern;
  }

  protected getWorkingDirs(): WorkingDirectoryInfo {
    return this._options.workingDirs;
  }

  protected async downloadItem(remoteItem: RemoteFileItem, item: FileItem): Promise<FileItem> {
    const downloadUrl = await this._gitUtil.getDownloadUrl({
      path: remoteItem.remotePath,
    });
    if (!fs.existsSync(path.dirname(item.absPath))) {
      fs.mkdirSync(path.dirname(item.absPath), { recursive: true });
    }
    const stream = fs.createWriteStream(item.absPath);
    await download(downloadUrl).pipe(stream);
    return new Promise((resolve, reject) => {
      stream.on("error", reject);
      stream.on("finish", () => {
        resolve(item);
      });
    });
  }

  protected async listItems(_lastKey: string, prefix: string): Promise<ObjectListResult> {
    this.logger.verbose(
      `Listing files on the repository: ${this._pluginConfig.repository} (${this._pluginConfig.branchName})`,
    );
    const result = await this._gitUtil.listRemoteFiles({
      prefix,
    });
    this.logger.verbose(`There're ${result.contents.length} items`);
    return result;
  }

  protected async uploadItem(key: string, item: FileItem) {
    await this._gitUtil.add({
      repositoryDir: this._repositoryDir,
      sourcePath: item.absPath,
      asPath: path.join(key, item.path),
    });
    return item;
  }
}
