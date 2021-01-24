import { PublisherPluginFactory } from "reg-suit-interface";
import { GithubPagesPublisherPlugin } from "./github-pages-publisher-plugin";
import { GithubRepositoryPreparer } from "./github-repository-preparer";

const pluginFactory: PublisherPluginFactory = () => {
  return {
    preparer: new GithubRepositoryPreparer(),
    publisher: new GithubPagesPublisherPlugin(),
  };
};

export = pluginFactory;
