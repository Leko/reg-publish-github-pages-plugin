// import fs from "fs";
import assert from "assert";
import { Octokit } from "@octokit/rest";
// import git from "isomorphic-git";
// import http from "isomorphic-git/http/node";
import type { ObjectListResult } from "reg-suit-util";
// import type { FileItem, ObjectListResult } from "reg-suit-util";

export async function listRemoteFiles({
  owner,
  repo,
  prefix,
  token,
}: {
  owner: string;
  repo: string;
  prefix: string;
  token: string;
}): Promise<ObjectListResult> {
  const octokit = new Octokit({
    auth: token,
  });
  const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
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
}

export async function getDownloadUrl({
  owner,
  repo,
  path,
  token,
}: {
  owner: string;
  repo: string;
  path: string;
  token: string;
}): Promise<string> {
  const octokit = new Octokit({
    auth: token,
  });
  const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
  });
  assert(!Array.isArray(res.data) && res.data.type === "file", `${path} must be a file`);
  assert(res.data.download_url, `${path} must have download_url`);

  return res.data.download_url;
}

// export async function commitAndPush({
//   owner,
//   repo,
//   branchName,
//   key,
//   files,
//   token,
// }: {
//   owner: string;
//   repo: string;
//   branchName: string;
//   key: string;
//   files: FileItem[];
//   token: string;
// }): Promise<void> {
//   // Get head SHA
//   // Create tree
//   // Commit (and push)
// }

// function clone({
//   repository,
//   distDir,
// }: {
//   repository: string; // "owner/name"
//   distDir: string;
// }) {
//   return git.clone({
//     fs,
//     http,
//     dir: distDir,
//     depth: 1,
//     url: `https://github.com/${repository}`,
//   });
// }
