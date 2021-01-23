# reg-publish-github-pages-plugin

A reg-suit plugin to fetch and publish assets to the GitHub pages.

## Install

```sh
npm i -D reg-publish-github-pages-plugin
reg-suit prepare -p publish-github-pages
```

## Setup

You need to configure GitHub pages before using this plugin.  
[See the official documentation](https://docs.github.com/en/github/working-with-github-pages)

## Configure

```ts
{
  repository: string;
  branchName: string;
  token: string;
  customDomain?: string;
  pathPrefix?: string;
}
```

- `repository` - _Required_ - A repository name in the form of `owner/name` such as `Leko/reg-publish-github-pages-plugin`.
- `branchName` - _Required_ - A branch name for the GitHub pages.
- `token` - _Required_ - A GitHub token. You can pass the value via [Embed environment values](https://github.com/reg-viz/reg-suit#embed-environment-values)
- `customDomain` - _Optional_ - A custom domain when you set it to the GitHub pages.
- `pathPrefix` - _Optional_ - Specify paths. For example, when you set `some_dir` as this property, this plugin will publish with URL such as `https://{TODO}/some_dir/index.html`.
