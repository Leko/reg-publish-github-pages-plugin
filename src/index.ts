import { PublisherPluginFactory } from "reg-suit-interface";
import { GithubPagesPublisherPlugin } from "./github-pages-publisher-plugin";
// import { S3BucketPreparer } from "./s3-bucket-preparer";

const pluginFactory: PublisherPluginFactory = () => {
  return {
    // preparer: new S3BucketPreparer(),
    publisher: new GithubPagesPublisherPlugin(),
  };
};

export = pluginFactory;
