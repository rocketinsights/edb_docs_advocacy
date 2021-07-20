import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { graphql } from "gatsby";
import { MDXRenderer } from "gatsby-plugin-mdx";
import {
  CardDecks,
  DevFrontmatter,
  Footer,
  Layout,
  LeftNav,
  MainContent,
  PrevNext,
  SideNavigation,
  TableOfContents,
  TopBar,
} from "../components";

export const query = graphql`
  query($nodeId: String!) {
    mdx(id: { eq: $nodeId }) {
      fields {
        path
        depth
        mtime
      }
      body
      tableOfContents
    }
  }
`;

const ContentRow = ({ children }) => (
  <div className="container p-0 mt-4">
    <Row>{children}</Row>
  </div>
);

const getChildren = (parentNode, navLinks) => {
  return navLinks
    .filter(
      (node) =>
        node.fields.path.includes(parentNode.fields.path) &&
        node.fields.depth === parentNode.fields.depth + 1,
    )
    .sort((a, b) => a.fields.path.localeCompare(b.fields.path));
};

const TileModes = {
  None: "none",
  Simple: "simple",
  Full: "full",
};
const Tiles = ({ mode, mdx, navLinks }) => {
  if (mode === TileModes.None) return null;

  if (!mode) {
    if (mdx.fields.depth === 2) mode = TileModes.Full;
    else if (mdx.fields.depth >= 3) mode = TileModes.Simple;
  }

  if (Object.values(TileModes).includes(mode)) {
    const tiles = getChildren(mdx, navLinks).map((child) => {
      if (mode === "simple") return child;

      return {
        ...child,
        children: getChildren(child, navLinks),
      };
    });

    return <CardDecks cards={tiles} cardType={mode} />;
  }
  return null;
};

const EditButton = ({ githubEditLink }) => (
  <a
    href={githubEditLink || "#"}
    className="btn btn-sm btn-primary px-4 text-nowrap"
  >
    Edit this page
  </a>
);

const FeedbackButton = ({ githubIssuesLink }) => (
  <a
    href={githubIssuesLink + "&template=product-feedback.md&labels=feedback"}
    target="_blank"
    rel="noreferrer"
    className="btn btn-sm btn-primary px-4 text-nowrap"
  >
    Feedback
  </a>
);

const LearnDocTemplate = ({ data, pageContext }) => {
  const { mdx } = data;
  const { mtime, path, depth } = mdx.fields;
  const {
    frontmatter,
    pagePath,
    navLinks,
    githubFileLink,
    githubEditLink,
    githubIssuesLink,
    isIndexPage,
    navTree,
    prevNext,
  } = pageContext;
  const {
    iconName,
    title,
    description,
    katacodaPanel,
    indexCards,
    prevNext: showPrevNext,
  } = frontmatter;
  const pageMeta = {
    title: title,
    description: description,
    path: pagePath,
    isIndexPage: isIndexPage,
  };

  const showToc = !!mdx.tableOfContents.items;
  const showInteractiveBadge =
    frontmatter.showInteractiveBadge != null
      ? frontmatter.showInteractiveBadge
      : !!katacodaPanel;

  // CNO isn't editable
  // TODO unify docs/advo to share one smart component that knows what to show
  const editOrFeedbackButton = path.includes("/cloud_native_postgresql/") ? (
    <FeedbackButton githubIssuesLink={githubIssuesLink} />
  ) : (
    <EditButton githubEditLink={githubEditLink} />
  );

  return (
    <Layout pageMeta={pageMeta} katacodaPanelData={katacodaPanel}>
      <TopBar />
      <Container fluid className="p-0 d-flex bg-white">
        <SideNavigation>
          <LeftNav
            navTree={navTree}
            navLinks={navLinks}
            path={mdx.fields.path}
            pagePath={pagePath}
            iconName={iconName}
          />
        </SideNavigation>
        <MainContent>
          {showInteractiveBadge && (
            <div className="new-thing-header" aria-roledescription="badge">
              <span className="badge-text">Interactive Demo</span>
            </div>
          )}
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="balance-text">{title}</h1>
            {editOrFeedbackButton}
          </div>

          <ContentRow>
            <Col xs={showToc ? 9 : 12}>
              <MDXRenderer>{mdx.body}</MDXRenderer>
              <Tiles mode={indexCards} mdx={mdx} navLinks={navLinks} />
            </Col>

            {showToc && (
              <Col xs={3}>
                <TableOfContents toc={mdx.tableOfContents.items} />
              </Col>
            )}
          </ContentRow>
          {showPrevNext && depth > 1 && (
            <PrevNext
              prevNext={prevNext}
              path={path}
              depth={depth}
              depthLimit={2}
            />
          )}

          <DevFrontmatter frontmatter={frontmatter} />

          <hr />
          <p>
            Could this page could be better?{" "}
            <a
              href={
                githubIssuesLink + "&template=problem-with-topic.md&labels=bug"
              }
            >
              Report a problem
            </a>{" "}
            or{" "}
            <a
              href={
                githubIssuesLink +
                "&template=suggest-addition-to-topic.md&labels=enhancement"
              }
            >
              suggest an addition
            </a>
            !
          </p>

          <Footer timestamp={mtime} githubFileLink={githubFileLink} />
        </MainContent>
      </Container>
    </Layout>
  );
};

export default LearnDocTemplate;
