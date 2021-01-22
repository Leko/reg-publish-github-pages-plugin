# reg-publish-github-pages-plugin

A reg-suit plugin to fetch and publish assets to the GitHub pages.

## Install

```sh
npm i -D reg-publish-github-pages-plugin
reg-suit prepare -p publish-github-pages
```

## Configure

```ts
{
  branchName: string;
  pathPrefix?: string; // '.' by default
}
```

- `branchName` - _Required_ - A branch name for the GitHub pages.
- `pathPrefix` - _Optional_ - Specify paths. For example, when you set `some_dir` as this property, this plugin will publish with URL such as `https://{TODO}/some_dir/index.html`.
