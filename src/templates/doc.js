import React from 'react';
import { Container, Row, Col, Dropdown, DropdownButton } from 'react-bootstrap';
import { graphql, Link } from 'gatsby';
import { MDXRenderer } from 'gatsby-plugin-mdx';
import {
  CardDecks,
  DevOnly,
  DevFrontmatter,
  Footer,
  Layout,
  LeftNav,
  MainContent,
  PrevNext,
  SideNavigation,
  TableOfContents,
  TopBar,
} from '../components';
import { products } from '../constants/products';
import Icon from '../components/icon';

export const query = graphql`
  query($nodeId: String!, $potentialLatestNodePath: String) {
    mdx(id: { eq: $nodeId }) {
      fields {
        path
        mtime
        depth
      }
      body
      tableOfContents
    }
    potentialLatest: mdx(fields: { path: { eq: $potentialLatestNodePath } }) {
      id
    }
  }
`;

const getProductUrlBase = (path) => {
  return path.split('/').slice(0, 2).join('/');
};

const getProductAndVersion = (path) => {
  return {
    product: path.split('/')[1],
    version: path.split('/')[2],
  };
};

const makeVersionArray = (versions, path) => {
  return versions.map((version, i) => ({
    version: version,
    url: `${getProductUrlBase(path)}/${i === 0 ? 'latest' : version}`,
  }));
};

const determineCanonicalPath = (hasLatest, latestPath) => {
  if (hasLatest) {
    return latestPath;
  } // latest will also have hasLatest=true
  return null;
};

const buildSections = (navTree) => {
  const sections = [];
  let nextSection;

  navTree.items.forEach((navEntry) => {
    if (navEntry.path) {
      if (!nextSection) return;
      nextSection.guides.push(navEntry);
    } else {
      // new section
      if (nextSection) sections.push(nextSection);
      nextSection = {
        title: navEntry.title,
        guides: [],
      };
    }
  });
  if (nextSection) sections.push(nextSection);

  return sections;
};

const ContentRow = ({ children }) => (
  <div className="container p-0 mt-4">
    <Row>{children}</Row>
  </div>
);

const findDescendent = (root, predicate) => {
  if (predicate(root)) return root;

  for (let node of root.items)
  {
    const result = findDescendent(node, predicate);
    if (result) return result;    
  }
  return null;
};

const getCards = (node, searchDepth) => {
  const card = {
    fields: {
      path: node.path,
      depth: node.depth,

    },
    frontmatter: {
      navTitle: node.navTitle,
      title: node.title,
      description: node.description,
      iconName: node.iconName,
      interactive: node.interactive,
    },
    children: searchDepth && node.items ? node.items.map(n => getCards(n, searchDepth-1)) : [],
  };
  return card;
};

const TileModes = {
  None: 'none',
  Simple: 'simple',
  Full: 'full',
};
const Tiles = ({ mode, node }) => {
  if (!node || !node.items) return null;
  if (mode === TileModes.None) return null;

  if (!mode) {
    if (node.depth === 2) mode = TileModes.Full;
    else if (node.depth >= 3) mode = TileModes.Simple;
  }

  if (Object.values(TileModes).includes(mode)) {
    const tiles = node.items.map(n => getCards(n, mode === 'simple' ? 0 : 1));

    return <CardDecks cards={tiles} cardType={mode} />;
  }
  return null;
};

const Sections = ({ sections }) => (
  <>
    {sections.map((section) => (
      <Section section={section} key={section.title} />
    ))}
  </>
);

const Section = ({ section }) => (
  <div className="card-deck my-4" key={section.title}>
    <div className="card rounded shadow-sm p-2">
      <div className="card-body">
        <h3 className="card-title balance-text">{section.title}</h3>
        {section.guides.map((guide) =>
          guide ? (
            <p className="card-text" key={`${guide.title}`}>
              <Link
                to={guide.path}
                className="btn btn-link btn-block text-left p-0"
              >
                {guide.navTitle || guide.title}
              </Link>
              {/* <div className="text-small">
                <span>{guide.frontmatter.description || guide.excerpt}
                </span>
              </div> */}
            </p>
          ) : (
            <DevOnly key={Math.random()}>
              <span className="badge badge-light">Link Missing!</span>
            </DevOnly>
          ),
        )}
      </div>
    </div>
  </div>
);

const FeedbackDropdown = ({ githubIssuesLink }) => (
  <DropdownButton
    className="ml-3"
    size="sm"
    variant="outline-info"
    id="page-actions-button"
    title={
      //this seems absolutely buck wild to me, but it's what StackOverflow suggests 🤷🏻‍♂️
      <Icon
        iconName="ellipsis"
        className="fill-orange mr-2"
        width="15"
        height="15"
      />
    }
  >
    <Dropdown.Item
      href={githubIssuesLink + '&template=documentation-feedback.md'}
      target="_blank"
      rel="noreferrer"
    >
      Report a problem
    </Dropdown.Item>
    <Dropdown.Item
      href={githubIssuesLink + '&template=product-feedback.md&labels=feedback'}
      target="_blank"
      rel="noreferrer"
    >
      Give product feedback
    </Dropdown.Item>
  </DropdownButton>
);

const DocTemplate = ({ data, pageContext }) => {
  const { fields, body, tableOfContents } = data.mdx;
  const { path, mtime, depth } = fields;
  const {
    frontmatter,
    pagePath,
    versions,
    githubFileLink,
    githubEditLink,
    githubIssuesLink,
    isIndexPage,
    navTree,
    prevNext,
  } = pageContext;
  const navRoot = findDescendent(navTree, n => n.path === path);
  const versionArray = makeVersionArray(versions, path);
  const { product, version } = getProductAndVersion(path);

  const {
    iconName,
    description,
    indexCards
  } = frontmatter;
  
  const sections = depth === 2 ? buildSections(navTree) : null;

  let title = frontmatter.title;
  if (depth === 2) {
    // product version root
    title += ` v${version}`;
  } else if (depth > 2) {
    const prettyProductName = (
      products[product] || { name: product.toUpperCase() }
    ).name;
    title = `${prettyProductName} v${version} - ${title}`;
  }

  const pageMeta = {
    title: title,
    description: description,
    path: pagePath,
    isIndexPage: isIndexPage,
    canonicalPath: determineCanonicalPath(
      !!data.potentialLatest,
      pageContext.potentialLatestPath,
    ),
  };

  const showToc = !!tableOfContents.items;

  return (
    <Layout pageMeta={pageMeta}>
      <TopBar />
      <Container fluid className="p-0 d-flex bg-white">
        <SideNavigation>
          <LeftNav
            navTree={navTree}
            path={path}
            pagePath={pagePath}
            versionArray={versionArray}
            iconName={iconName}
          />
        </SideNavigation>
        <MainContent>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="balance-text">
              {frontmatter.title}{' '}
              <span className="font-weight-light ml-2 text-muted badge-light px-2 rounded text-smaller position-relative lh-1 top-minus-3">
                v{version}
              </span>
            </h1>
            <div className="d-flex">
              <a
                href={githubEditLink || '#'}
                className="btn btn-sm btn-primary px-4 text-nowrap"
              >
                Edit this page
              </a>
              <FeedbackDropdown githubIssuesLink={githubIssuesLink} />
            </div>
          </div>

          <ContentRow>
            <Col xs={showToc ? 9 : 12}>
              <MDXRenderer>{body}</MDXRenderer>
              <Tiles mode={indexCards} node={navRoot} />
            </Col>

            {showToc && (
              <Col xs={3}>
                <TableOfContents toc={tableOfContents.items} />
              </Col>
            )}
          </ContentRow>
          {sections && <Sections sections={sections} />}
          {depth > 2 && (
            <PrevNext prevNext={prevNext} path={path} depth={depth} />
          )}
          <DevFrontmatter frontmatter={frontmatter} />

          <Footer timestamp={mtime} githubFileLink={githubFileLink} />
        </MainContent>
      </Container>
    </Layout>
  );
};

export default DocTemplate;
