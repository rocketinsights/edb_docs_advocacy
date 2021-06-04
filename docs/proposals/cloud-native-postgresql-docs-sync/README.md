# Sync Cloud-Native-Postgresql Documentation to Docs Repo

## Current State

- [Cloud native PostgreSQL documentation][cpn-docs] is built using [MkDocs][]
  and published at
  <https://docs.enterprisedb.io/cloud-native-postgresql/1.0.0/>.
- The next generation documentation is [hosted in a different repo][docs],
  built using [Gatsby][], and deployed to <https://www.enterprisedb.com/docs/>.

## Goals

- Publish all EDB documentation at <https://www.enterprisedb.com/docs/>.
- Have documentation live as close to the source code as possible.
- When there's a new `cloud-native-postgresql` release, the updated
  documentation is published at <https://www.enterprisedb.com/docs/>.

## Proposed Solution

- "Upstream": [Cloud native PostgreSQL documentation repo][cpn-docs]
- "Docs": [Docs repo][docs]

### Steps

1. Upstream tags a new release, e.g. `v1.0.1`.
1. Upstream event handler copies `docs/` to Docs
   `pushed-content/src/cloud-native-postgres/[release tag]/`.
1. Upstream commits new documentation to a new Docs branch `docs/cnp/[release tag]`
1. Upstream event handler opens a new Docs pull request ("PR").
1. Docs event handler:
   1. Transpiles source documentation into Gatsby MDX format.
   1. Commits the transpiled artifacts into the `docs/cnp/[release tag]`
      branch, updating the PR.
1. The PR undergoes normal review process and continues the rest of development
   and release process as any other feature PRs.

[cpn-docs]: https://github.com/EnterpriseDB/cloud-native-postgresql/tree/main/docs
[docs]: https://github.com/EnterpriseDB/docs
[gatsby]: https://www.gatsbyjs.com
[mkdocs]: https://www.mkdocs.org
