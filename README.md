# reg-publish-github-pages-plugin

![version](https://img.shields.io/npm/v/reg-publish-github-pages-plugin)
![LICENSE](https://img.shields.io/npm/l/reg-publish-github-pages-plugin)

A reg-suit plugin to fetch and publish assets to the GitHub pages.

## How it works

![overview](./docs/overview.png)

The plugin will create [orphan branch](https://git-scm.com/docs/git-checkout#Documentation/git-checkout.txt---orphanltnewbranchgt) when you run `reg-suit prepare -p publish-github-pages`. Then the plugin will commit report pages and images to the branch whenever you run `reg-suit run`. The branch has completely different tree from your branches. It doesn't affect any existing branches. So you can use it in the same repository you want to introduce reg-suit.

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
- `token` - _Required_ - A GitHub token. The token must have `user:email` and `public_repo` permission. When the repository is private, the token requires `repo` permission instead of `public_repo`.
- `customDomain` - _Optional_ - A custom domain when you set it to the GitHub pages.
- `pathPrefix` - _Optional_ - Specify paths. For example, when you set `some_dir` as this property, this plugin will publish with URL such as `https://{TODO}/some_dir/index.html`.

## See also

- [Embed environment values](https://github.com/reg-viz/reg-suit#embed-environment-values)

## LICENSE

This repository is under [MIT](./LICENSE) license.
