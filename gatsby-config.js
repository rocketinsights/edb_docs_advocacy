require('dotenv').config({
  path: `.env.${process.env.NODE_ENV}`,
});
const gracefulFs = require('graceful-fs');

const algoliaTransformer = require('./src/constants/algolia-indexing.js');

const ANSI_BLUE = '\033[34m';
const ANSI_GREEN = '\033[32m';
const ANSI_STOP = '\033[0m';

const isBuild = process.env.NODE_ENV === 'production';
const isProduction = process.env.APP_ENV === 'production';
const algoliaIndex = process.env.ALGOLIA_INDEX_NAME || 'edb-docs-staging';

/******** Sourcing *********/
const sourceFilename = isBuild ? 'build-sources.json' : 'dev-sources.json';
const sourceToPluginConfig = {
  ark: { name: 'ark', path: 'product_docs/docs/ark' },
  bart: { name: 'bart', path: 'product_docs/docs/bart' },
  bdr: { name: 'bdr', path: 'product_docs/docs/bdr' },
  harp: { name: 'harp', path: 'product_docs/docs/harp' },
  edbcloud: { name: 'edbcloud', path: 'product_docs/docs/edbcloud' },
  efm: { name: 'efm', path: 'product_docs/docs/efm' },
  epas: { name: 'epas', path: 'product_docs/docs/epas' },
  eprs: { name: 'eprs', path: 'product_docs/docs/eprs' },
  hadoop_data_adapter: {
    name: 'hadoop_data_adapter',
    path: 'product_docs/docs/hadoop_data_adapter',
  },
  jdbc_connector: {
    name: 'jdbc_connector',
    path: 'product_docs/docs/jdbc_connector',
  },
  migration_portal: {
    name: 'migration_portal',
    path: 'product_docs/docs/migration_portal',
  },
  migration_toolkit: {
    name: 'migration_toolkit',
    path: 'product_docs/docs/migration_toolkit',
  },
  mysql_data_adapter: {
    name: 'mysql_data_adapter',
    path: 'product_docs/docs/mysql_data_adapter',
  },
  mongo_data_adapter: {
    name: 'mongo_data_adapter',
    path: 'product_docs/docs/mongo_data_adapter',
  },
  net_connector: {
    name: 'net_connector',
    path: 'product_docs/docs/net_connector',
  },
  ocl_connector: {
    name: 'ocl_connector',
    path: 'product_docs/docs/ocl_connector',
  },
  odbc_connector: {
    name: 'odbc_connector',
    path: 'product_docs/docs/odbc_connector',
  },
  pem: { name: 'pem', path: 'product_docs/docs/pem' },
  pgbouncer: { name: 'pgbouncer', path: 'product_docs/docs/pgbouncer' },
  pgpool: { name: 'pgpool', path: 'product_docs/docs/pgpool' },
  postgis: { name: 'postgis', path: 'product_docs/docs/postgis' },
  repmgr: { name: 'repmgr', path: 'product_docs/docs/repmgr' },
  slony: { name: 'slony', path: 'product_docs/docs/slony' },
};

const externalSourcePlugins = () => {
  const sourcePlugins = [];

  if (!process.env.SKIP_SOURCING) {
    // default to full set of sources
    let sources = Object.keys(sourceToPluginConfig).reduce((result, source) => {
      result[source] = true;
      return result;
    }, {});

    if (gracefulFs.existsSync(sourceFilename)) {
      console.log(
        `${ANSI_BLUE}###### Sourcing from ${sourceFilename} #######${ANSI_STOP}`,
      );
      console.log(
        `${ANSI_GREEN}Note: ${sourceFilename} is no longer required; delete it to load the full set of docs.${ANSI_STOP}`,
      );
      sources = JSON.parse(gracefulFs.readFileSync(sourceFilename));
    }

    for (const [source, enabled] of Object.entries(sources)) {
      const config = sourceToPluginConfig[source];
      if (enabled && config) {
        sourcePlugins.push({
          resolve: 'gatsby-source-filesystem',
          options: {
            name: config.name,
            path: config.path,
          },
        });
      }
    }
  }

  return sourcePlugins;
};

/******** Algolia Index ********/
const indexQuery = `
{
  allMdx {
    nodes {
      frontmatter {
        title
        product
        platform
        tags
        directoryDefaults {
          product
          platform
        }
      }
      id
      fields {
        docType
        product
        path
        version
      }
      mdxAST
    }
  }
}
`;

/********** Gatsby config *********/
module.exports = {
  pathPrefix: '/docs',
  siteMetadata: {
    title: 'EDB Docs',
    baseUrl: 'https://enterprisedb.com/docs',
    imageUrl: 'https://enterprisedb.com/docs/images/social.jpg',
    siteUrl: 'https://enterprisedb.com/docs',
    algoliaIndex: algoliaIndex,
    isDevelopment: !isBuild,
    cacheBuster: 2, // for busting gh actions cache if needed
  },
  plugins: [
    'gatsby-plugin-sass',
    'gatsby-plugin-react-helmet',
    'gatsby-transformer-sharp',
    'gatsby-transformer-json',
    'gatsby-plugin-catch-links',
    'gatsby-plugin-sharp',
    {
      resolve: 'gatsby-plugin-netlify',
      options: {
        headers: {
          '/*': isProduction ? [] : ['X-Robots-Tag: noindex'],
        },
      },
    },
    'gatsby-plugin-sitemap',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'EDB Documentation',
        short_name: 'EDB Docs',
        start_url: '/',
        background_color: '#EBEFF2',
        theme_color: '#EBEFF2',
        // Enables "Add to Homescreen" prompt and disables browser UI (including back button)
        // see https://developers.google.com/web/fundamentals/web-app-manifest/#display
        display: 'standalone',
        icon: 'static/images/favicon.png', // This path is relative to the root of the site.
        // An optional attribute which provides support for CORS check.
        // If you do not provide a crossOrigin option, it will skip CORS for manifest.
        // Any invalid keyword or empty string defaults to `anonymous`
        crossOrigin: `use-credentials`,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'advocacy_docs',
        path: 'advocacy_docs',
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'images',
        path: 'static/images',
      },
    },
    ...externalSourcePlugins(),
    {
      resolve: 'gatsby-plugin-mdx',
      options: {
        defaultLayouts: {
          default: require.resolve('./src/components/layout.js'),
        },
        lessBabel: true,
        gatsbyRemarkPlugins: [
          {
            resolve: 'gatsby-remark-images',
            options: {
              linkImagesToOriginal: false,
              showCaptions: false,
            },
          },
          {
            resolve: `gatsby-remark-autolink-headers`,
            options: {
              isIconAfterHeader: true,
              className: 'ml-1',
            },
          },
          {
            resolve: 'gatsby-remark-prismjs',
            options: {
              noInlineHighlight: true,
            },
          },
        ],
        remarkPlugins: [
          [require('./src/plugins/code-in-tables')],
          [
            require('remark-admonitions'),
            {
              tag: '!!!',
              icons: 'none',
              infima: true,
              customTypes: {
                seealso: 'note',
                hint: 'tip',
                interactive: 'interactive',
              },
            },
          ],
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-react-svg',
      options: {
        rule: {
          include: /static/,
        },
      },
    },
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [
          `source code pro\:400`, // you can also specify font weights and styles
        ],
      },
    },
    {
      resolve: 'gatsby-plugin-google-tagmanager',
      options: {
        id: process.env.GTM_ID,
      },
    },
    {
      resolve: 'gatsby-plugin-nginx-redirect',
      options: {
        inputConfigFile: `${__dirname}/static/nginx_redirects.template`,
        outputConfigFile: `${__dirname}/static/nginx_redirects.generated`,
        whereToIncludeRedirects: '', // defaults to: "server"
      },
    },
    {
      // This plugin must be placed last in your list of plugins to ensure that it can query all the GraphQL data
      resolve: `gatsby-plugin-algolia`,
      options: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
        indexName: algoliaIndex,
        queries: [
          {
            query: indexQuery,
            transformer: algoliaTransformer,
            indexName: algoliaIndex,
          },
        ],
        chunkSize: 1000,
        enablePartialUpdates: false,
        skipIndexing: process.env.INDEX_ON_BUILD !== 'true',
      },
    },
  ],
};
