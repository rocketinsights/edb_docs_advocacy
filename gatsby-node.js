// this patch is required to consistently load all the doc files
const realFs = require('fs');
const gracefulFs = require('graceful-fs');
gracefulFs.gracefulify(realFs);

const { createFilePath } = require(`gatsby-source-filesystem`);
const { exec, execSync } = require('child_process');

const {
  replacePathVersion,
  filePathToDocType,
  removeTrailingSlash,
  isPathAnIndexPage,
  pathToDepth,
  mdxNodesToTree,
  computeFrontmatterForTreeNode,
  buildProductVersions,
  reportMissingIndex,
  treeToNavigation,
  treeNodeToNavNode,
  findPrevNextNavNodes,
  configureRedirects,
  configureLegacyRedirects,
  readFile,
  writeFile,
} = require('./src/constants/gatsby-utils.js');

const isBuild = process.env.NODE_ENV === 'production';
const isProduction = process.env.APP_ENV === 'production';

const currentBranchName = (() => {
  // if this build was triggered by a GH action in response to a PR,
  // use the head ref (the branch that someone is requesting be merged)
  let branch = process.env.GITHUB_HEAD_REF;
  // if this process was otherwise triggered by a GH action, use the current branch name
  if (!branch) branch = process.env.GITHUB_REF;
  // non-GH Action build? Try actually running Git for the name...
  if (!branch) {
    try {
      branch = execSync('git rev-parse --abbrev-ref HEAD').toString();
    } catch {}
  }
  if (!branch) branch = isProduction ? 'main' : 'develop';

  return branch.replace(/^refs\/heads\//, '').replace(/^refs\/tags\//, '');
})();

exports.onCreateNode = async ({ node, getNode, actions, loadNodeContent }) => {
  const { createNodeField } = actions;

  if (node.internal.mediaType === 'text/yaml') loadNodeContent(node);
  if (node.internal.type !== 'Mdx') return;

  const fileNode = getNode(node.parent);
  const nodeFields = {
    docType: filePathToDocType(node.fileAbsolutePath),
    mtime: fileNode.mtime,
  };

  let relativeFilePath = createFilePath({ node, getNode });
  if (nodeFields.docType === 'doc') {
    relativeFilePath = `/${fileNode.sourceInstanceName}${relativeFilePath}`;
  }

  Object.assign(nodeFields, {
    path: relativeFilePath,
    depth: pathToDepth(relativeFilePath),
  });

  if (nodeFields.docType === 'doc') {
    Object.assign(nodeFields, {
      product: relativeFilePath.split('/')[1],
      version: relativeFilePath.split('/')[2],
      topic: 'null',
    });
  } else if (nodeFields.docType === 'advocacy') {
    Object.assign(nodeFields, {
      product: 'null',
      version: '0',
      topic: relativeFilePath.split('/')[2],
    });
  }

  for (const [name, value] of Object.entries(nodeFields)) {
    createNodeField({ node, name: name, value: value });
  }
};

exports.createPages = async ({ actions, graphql, reporter }) => {
  const result = await graphql(`
    query {
      allMdx {
        nodes {
          id
          frontmatter {
            title
            navTitle
            description
            redirects
            iconName
            originalFilePath
            productStub
            indexCards
            navigation
            legacyRedirects
            legacyRedirectsGenerated
            navigation
            showInteractiveBadge
            katacodaPages {
              scenario
              account
            }
            katacodaPanel {
              scenario
              account
              initializeCommand
              codelanguages
            }
            directoryDefaults {
              description
              prevNext
              iconName
              product
              platform
            }
          }
          fields {
            docType
            path
            depth
            product
            version
            topic
          }
          fileAbsolutePath
        }
      }
      allFile(filter: { extension: { eq: "yaml" } }) {
        nodes {
          id
          relativePath
        }
      }
    }
  `);

  if (result.errors) {
    reporter.panic('createPages graphql query has errors!', result.errors);
  }

  processFileNodes(result.data.allFile.nodes, actions);

  const { nodes } = result.data.allMdx;

  const productVersions = buildProductVersions(nodes);

  // it should be possible to remove these in the future,
  // they are only used for navLinks generation
  const learn = nodes.filter((file) => file.fields.docType === 'advocacy');

  // perform depth first preorder traversal
  const treeRoot = mdxNodesToTree(nodes);
  const navStack = [treeRoot];
  let curr = null;

  while (navStack.length > 0) {
    curr = navStack.pop();
    curr.children.forEach((child) => navStack.push(child));

    // build ordered navigation for immediate children
    // treeToNavigation will use this data
    const addedChildPaths = {};
    curr.navigationNodes = [];
    (curr.mdxNode?.frontmatter?.navigation || []).forEach((navEntry) => {
      if (navEntry.startsWith('#')) {
        curr.navigationNodes.push({
          path: null,
          title: navEntry.replace('#', '').trim(),
        });
        return;
      }

      const navChild = curr.children.find((child) => {
        if (addedChildPaths[child.path]) return false;
        const navName = child.path.split('/').slice(-2)[0];
        return navName.toLowerCase() === navEntry.toLowerCase();
      });
      if (!navChild?.mdxNode) return;

      addedChildPaths[navChild.path] = true;
      curr.navigationNodes.push(treeNodeToNavNode(navChild));
    });

    curr.children
      .filter((child) => !addedChildPaths[child.path])
      .map((child) => treeNodeToNavNode(child))
      .sort((a, b) => a.path.localeCompare(b.path))
      .forEach((child) => curr.navigationNodes.push(child));

    // exit here if we're not dealing with an actual page
    if (!curr.mdxNode) {
      reportMissingIndex(reporter, curr);
      continue;
    }

    const node = curr.mdxNode;

    // set computed frontmatter
    node.frontmatter = computeFrontmatterForTreeNode(curr);

    configureRedirects(node.fields.path, node.frontmatter.redirects, actions);

    // build navigation tree
    const navigationDepth = 2;
    let navRoot = curr;
    while (navRoot.depth > navigationDepth) navRoot = navRoot.parent;
    const navTree = treeToNavigation(navRoot, node);

    // determine next and previous nodes
    const prevNext = findPrevNextNavNodes(navTree, curr);

    const { docType } = node.fields;
    if (docType === 'doc') {
      createDoc(navTree, prevNext, node, productVersions, actions);
    } else if (docType === 'advocacy') {
      createAdvocacy(navTree, prevNext, node, learn, actions);
    }
  }
};

const createDoc = (navTree, prevNext, doc, productVersions, actions) => {
  const isLatest =
    productVersions[doc.fields.product][0] === doc.fields.version;
  if (isLatest) {
    actions.createRedirect({
      fromPath: doc.fields.path,
      toPath: replacePathVersion(doc.fields.path),
      redirectInBrowser: true,
      isPermanent: false,
      force: true,
    });
  }

  // configure legacy redirects
  if (!doc.frontmatter.productStub) {
    configureLegacyRedirects({
      toPath: doc.fields.path,
      toLatestPath: replacePathVersion(doc.fields.path),
      redirects: (doc.frontmatter.legacyRedirects || []).concat(
        doc.frontmatter.legacyRedirectsGenerated || [],
      ),
      actions,
    });
  }

  const isIndexPage = isPathAnIndexPage(doc.fileAbsolutePath);
  const docsRepoUrl = 'https://github.com/EnterpriseDB/docs';
  const fileUrlSegment =
    removeTrailingSlash(doc.fields.path) +
    (isIndexPage ? '/index.mdx' : '.mdx');
  const githubFileLink = `${docsRepoUrl}/commits/${currentBranchName}/product_docs/docs${fileUrlSegment}`;
  const githubEditLink = `${docsRepoUrl}/edit/${currentBranchName}/product_docs/docs${fileUrlSegment}`;
  const githubIssuesLink = `${docsRepoUrl}/issues/new?title=Feedback%20on%20${encodeURIComponent(
    fileUrlSegment,
  )}`;

  const template = doc.frontmatter.productStub ? 'doc-stub.js' : 'doc.js';
  const path = isLatest ? replacePathVersion(doc.fields.path) : doc.fields.path;

  // workaround for https://github.com/gatsbyjs/gatsby/issues/26520
  actions.createPage({
    path: path,
    component: require.resolve(`./src/templates/${template}`),
    context: {},
  });

  actions.createPage({
    path: path,
    component: require.resolve(`./src/templates/${template}`),
    context: {
      frontmatter: doc.frontmatter,
      pagePath: path,
      navTree,
      prevNext,
      versions: productVersions[doc.fields.product],
      nodeId: doc.id,
      githubFileLink: githubFileLink,
      githubEditLink: githubEditLink,
      githubIssuesLink: githubIssuesLink,
      isIndexPage: isIndexPage,
      potentialLatestPath: replacePathVersion(doc.fields.path), // the latest url for this path (may not exist!)
      potentialLatestNodePath: replacePathVersion(
        doc.fields.path,
        productVersions[doc.fields.product][0],
      ), // the latest version number path (may not exist!), needed for query
    },
  });
};

const createAdvocacy = (navTree, prevNext, doc, learn, actions) => {
  // configure legacy redirects
  configureLegacyRedirects({
    toPath: doc.fields.path,
    toLatestPath: doc.fields.path,
    redirects: (doc.frontmatter.legacyRedirects || []).concat(
      doc.frontmatter.legacyRedirectsGenerated || [],
    ),
    actions,
  });

  const navLinks = learn.filter(
    (node) => node.fields.topic === doc.fields.topic,
  );

  const advocacyDocsRepoUrl = 'https://github.com/EnterpriseDB/docs';
  const isIndexPage = isPathAnIndexPage(doc.fileAbsolutePath);
  const fileUrlSegment =
    removeTrailingSlash(doc.fields.path) +
    (isIndexPage ? '/index.mdx' : '.mdx');
  const githubFileLink = `${advocacyDocsRepoUrl}/commits/${currentBranchName}/advocacy_docs${fileUrlSegment}`;
  const githubEditLink = `${advocacyDocsRepoUrl}/edit/${currentBranchName}/advocacy_docs${fileUrlSegment}`;
  const githubIssuesLink = `${advocacyDocsRepoUrl}/issues/new?title=Regarding%20${encodeURIComponent(
    fileUrlSegment,
  )}`;

  // workaround for https://github.com/gatsbyjs/gatsby/issues/26520
  actions.createPage({
    path: doc.fields.path,
    component: require.resolve('./src/templates/learn-doc.js'),
    context: {},
  });

  actions.createPage({
    path: doc.fields.path,
    component: require.resolve('./src/templates/learn-doc.js'),
    context: {
      nodeId: doc.id,
      frontmatter: doc.frontmatter,
      pagePath: doc.fields.path,
      navLinks: navLinks,
      prevNext,
      navTree,
      githubFileLink: githubFileLink,
      githubEditLink: githubEditLink,
      githubIssuesLink: githubIssuesLink,
      isIndexPage: isIndexPage,
    },
  });

  (doc.frontmatter.katacodaPages || []).forEach((katacodaPage) => {
    if (!katacodaPage.scenario || !katacodaPage.account) {
      throw new Error(
        `katacoda scenario or account missing for ${doc.fields.path}`,
      );
    }

    const path = `${doc.fields.path}${katacodaPage.scenario}`;
    actions.createPage({
      path: path,
      component: require.resolve('./src/templates/katacoda-page.js'),
      context: {
        ...katacodaPage,
        pagePath: path,
        learn: {
          title: doc.frontmatter.title,
          description: doc.frontmatter.description,
        },
      },
    });
  });
};

const processFileNodes = (fileNodes, actions) => {
  fileNodes.forEach((node) => {
    actions.createPage({
      path: node.relativePath,
      component: require.resolve('./src/templates/file.js'),
      context: {
        nodeId: node.id,
      },
    });
  });
};

exports.sourceNodes = async ({
  actions: { createNode },
  createNodeId,
  createContentDigest,
}) => {
  // create edb-git node
  const sha = (
    await new Promise((resolve, reject) => {
      exec('git rev-parse HEAD', (error, stdout, stderr) => resolve(stdout));
    })
  ).trim();

  const branch = (
    await new Promise((resolve, reject) => {
      exec('git branch --show-current', (error, stdout, stderr) =>
        resolve(stdout),
      );
    })
  ).trim();

  const gitData = { sha, branch };
  createNode({
    ...gitData,
    id: createNodeId('edb-git'),
    internal: {
      type: 'edbGit',
      contentDigest: createContentDigest(gitData),
    },
  });
};

exports.createSchemaCustomization = ({ actions }) => {
  const { createTypes } = actions;
  const typeDefs = `
    type Mdx implements Node {
      frontmatter: Frontmatter
    }

    type Frontmatter {
      originalFilePath: String
      indexCards: TileModes
      legacyRedirects: [String]
      legacyRedirectsGenerated: [String]
      showInteractiveBadge: Boolean
    }

    enum TileModes {
      none
      simple
      full
    }
  `;
  createTypes(typeDefs);
};

exports.onPreBootstrap = () => {
  console.log(`
 _____  ____   _____    ____                 
|   __||    \\ | __  |  |    \\  ___  ___  ___ 
|   __||  |  || __ -|  |  |  || . ||  _||_ -|
|_____||____/ |_____|  |____/ |___||___||___|
                                                                                                                   
  `);
};

exports.onPostBuild = async ({ reporter, pathPrefix }) => {
  const originalRedirects = await readFile('public/_redirects');

  // filter out legacyRedirects that are loaded via nginx, not netlify
  let filteredRedirects = originalRedirects
    .split('\n')
    .filter((line) => !line.startsWith(`${pathPrefix}/edb-docs/`))
    .join('\n');

  if (filteredRedirects.length === originalRedirects.length) {
    reporter.warn('no redirects were filtered out, did something change?');
  }

  await writeFile(
    'public/_redirects',
    `${filteredRedirects}\n\n# Netlify pathPrefix path rewrite\n${pathPrefix}/*  /:splat  200`,
  );
};
