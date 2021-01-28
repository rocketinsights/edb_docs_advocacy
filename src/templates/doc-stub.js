import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { graphql } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import {
  Footer,
  IndexSubNav,
  Layout,
  MainContent,
  TableOfContents,
  TopBar,
  VersionDropdown,
} from '../components';

export const query = graphql`
  query($nodePath: String!, $potentialLatestNodePath: String) {
    mdx(fields: { path: { eq: $nodePath } }) {
      frontmatter {
        title
        navTitle
        description
        redirects
      }
      fields {
        path
        mtime
      }
      body
      tableOfContents
    }
    potentialLatest: mdx(fields: { path: { eq: $potentialLatestNodePath } }) {
      id
    }
  }
`;

const getProductUrlBase = path => {
  return path
    .split('/')
    .slice(0, 2)
    .join('/');
};

const makeVersionArray = (versions, path) => {
  return versions.map((version, i) => ({
    version: version,
    url: `${getProductUrlBase(path)}/${i === 0 ? 'latest' : version}`,
  }));
};

const ContentRow = ({ children }) => (
  <div className="container p-0 mt-4">
    <Row>{children}</Row>
  </div>
);

const determineCanonicalPath = (hasLatest, latestPath) => {
  if (hasLatest) {
    return latestPath;
  } // latest will also have hasLatest=true
  return null;
};

const DocTemplate = ({ data, pageContext }) => {
  const { fields, frontmatter, body, tableOfContents } = data.mdx;
  const { path, mtime } = fields;
  const { pagePath, versions, githubFileLink, isIndexPage } = pageContext;
  const versionArray = makeVersionArray(versions, path);
  const pageMeta = {
    title: frontmatter.title,
    description: frontmatter.description,
    path: pagePath,
    isIndexPage: isIndexPage,
    canonicalPath: determineCanonicalPath(
      !!data.potentialLatest,
      pageContext.potentialLatestPath,
    ),
  };

  const showToc = !!tableOfContents.items;

  return (
    <Layout pageMeta={pageMeta} background="white">
      <TopBar />
      <Container fluid className="p-0 d-flex bg-white">
        <MainContent searchNavLogo={true}>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="balance-text">{frontmatter.title} </h1>
          </div>
          <VersionDropdown versionArray={versionArray} path={path} />

          <h4 className="text-muted mt-3 mb-3 font-weight-normal">
            The product version you have requested hasn't been migrated. The
            links below will direct you to the content on our old site:
          </h4>

          <ContentRow>
            <Col xs={showToc ? 9 : 12}>
              <MDXRenderer>{body}</MDXRenderer>
            </Col>

            {showToc && (
              <Col xs={3}>
                <TableOfContents toc={tableOfContents.items} />
              </Col>
            )}
          </ContentRow>

          <hr />
          <IndexSubNav />
          <Footer timestamp={mtime} githubFileLink={githubFileLink} />
        </MainContent>
      </Container>
    </Layout>
  );
};

export default DocTemplate;
