import fs from "fs/promises";
import type { PublisherPlugin, PluginCreateOptions, WorkingDirectoryInfo } from "reg-suit-interface";
import { AbstractPublisher, RemoteFileItem, FileItem, ObjectListResult } from "reg-suit-util";
import fetch from "node-fetch";
import { listRemoteFiles, getDownloadUrl } from "./git";

export interface PluginConfig {
  repository: string;
  token: string;
  branchName?: string;
  pattern?: string;
  customDomain?: string;
  pathPrefix?: string;
}

export class GithubPagesPublisherPlugin extends AbstractPublisher implements PublisherPlugin<PluginConfig> {
  name = "reg-publish-github-pages-plugin";

  private _options!: PluginCreateOptions<any>;
  private _pluginConfig!: PluginConfig;

  init(config: PluginCreateOptions<PluginConfig>) {
    this.noEmit = config.noEmit;
    this.logger = config.logger;
    this._options = config;
    this._pluginConfig = {
      ...config.options,
    };
  }

  async publish(key: string) {
    // TODO: publish items
    return {
      reportUrl: `https://${this.getBaseUrl()}/${key}`,
    };
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
    const [owner, repo] = this._pluginConfig.repository.split("/");
    const downloadUrl = await getDownloadUrl({
      owner,
      repo,
      path: remoteItem.remotePath,
      token: this._pluginConfig.token,
    });
    return fetch(downloadUrl).then(async res => {
      await fs.writeFile(item.absPath, await res.buffer());
      return {
        ...item,
        mimeType: res.headers.get("content-type") ?? "application/octet-stream",
      };
    });
  }

  protected listItems(_lastKey: string, prefix: string): Promise<ObjectListResult> {
    const [owner, repo] = this._pluginConfig.repository.split("/");
    return listRemoteFiles({ owner, repo, prefix, token: this._pluginConfig.token });
  }

  // @ts-expect-error A tree of commit must be created at once.
  protected uploadItem() {}
}
