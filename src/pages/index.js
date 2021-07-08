import React from 'react';
import { Container } from 'react-bootstrap';
import Icon, { iconNames } from '../components/icon/';
import cliImg from '../images/screen-demo.gif';
import {
  Footer,
  IndexSubNav,
  Layout,
  Link,
  MainContent,
  TopBar,
} from '../components';

const IndexCard = ({ iconName, headingText, children }) => (
  <div className="card rounded shadow-sm mb-4">
    <div className="card-body">
      <div className="d-flex align-items-center mb-3">
        <div className="d-inline-block mr-3">
          <Icon
            iconName={iconName}
            className="fill-orange"
            width="24"
            height="24"
          />
        </div>
        <h4 className="d-inline-block card-title m-0">{headingText}</h4>
      </div>
      <ul className="list-unstyled mb-0">{children}</ul>
    </div>
  </div>
);

const IndexCardLink = ({ to, className, children }) => (
  <li>
    <Link to={to} className={`d-block py-2 pl-1 ${className}`}>
      {children}
    </Link>
  </li>
);

const Page = () => (
  <Layout
    pageMeta={{
      description:
        'EDB supercharges Postgres with products, services, and support to help you control database risk, manage costs, and scale efficiently.',
    }}
    background="white"
  >
    <TopBar />
    <Container fluid className="p-0 d-flex bg-white">
      <MainContent searchNavLogo={true}>
        {/* Sign Post */}

        <div className="new-thing-header" aria-roledescription="badge">
          <span className="badge-text font-weight-bold">Interactive Demo</span>
        </div>

        <div className="full-width mt-3 mb-5">
          <div className="pt-0">
            <div className="d-flex pb-0 align-items-center">
              <div className="mr-3">
                <Link to="/kubernetes/cloud_native_postgresql/interactive_demo/">
                  <img
                    src={cliImg}
                    alt="Illustration of a Kubernetes Terminal Command"
                    className="img-fluid shadow rounded card"
                  />
                </Link>
              </div>
              <div className="flex-fill pl-3">
                <h2 className="card-title mb-2 font-weight-bold">
                  <span className="text-muted font-weight-normal">
                    Cloud Native Postgres
                  </span>
                  <br />
                  Install, Configure and Deploy PostgreSQL with Kubernetes
                </h2>

                <p className="pt-2 pb-1 balance-text">
                  Test drive Cloud Native Postgres in the browser.
                </p>

                <div className="d-flex align-items-center">
                  <p>
                    <Link
                      className="btn btn-info"
                      to="/kubernetes/cloud_native_postgresql/interactive_demo/"
                    >
                      Try the Interactive Demo &rarr;
                    </Link>
                  </p>
                  <p className="ml-3">
                    <Link
                      to="/kubernetes/cloud_native_postgresql/"
                      className="border-bottom"
                    >
                      Learn More
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sign Post */}

        <div className="card-columns mb-4">
          <IndexCard iconName="BigData" headingText="Databases">
            <IndexCardLink to="/epas/latest">
              EDB Postgres Advanced Server
            </IndexCardLink>
            <IndexCardLink to="/supported-open-source/postgresql/">
              PostgreSQL
            </IndexCardLink>
          </IndexCard>

          <IndexCard
            iconName={iconNames.CONTROL}
            headingText="Monitoring & Admin Tools"
          >
            <IndexCardLink to="/pem/latest">
              Postgres Enterprise Manager
            </IndexCardLink>
            <IndexCardLink to="/supported-open-source/pgadmin/">
              pgAdmin
            </IndexCardLink>
          </IndexCard>

          <IndexCard
            iconName="HighAvailability"
            headingText="High Availability Tools"
          >
            <span className="font-weight-bold text-muted text-uppercase small">
              Replication
            </span>
            <IndexCardLink to="/bdr/latest">
              BDR (Bi-Directional Replication)
            </IndexCardLink>
            <IndexCardLink to="/eprs/latest">Replication Server</IndexCardLink>
            <IndexCardLink to="/slony/latest">Slony</IndexCardLink>
            <span className="font-weight-bold mt-4 text-muted text-uppercase small d-block">
              Cluster Management
            </span>
            <IndexCardLink to="/harp/latest">
              High Availability Routing for Postgres (HARP)
            </IndexCardLink>
            <IndexCardLink to="/efm/latest">Failover Manager</IndexCardLink>
            <IndexCardLink to="/repmgr/latest">
              repmgr (Replication Manager)
            </IndexCardLink>

            <span className="font-weight-bold mt-4 text-muted text-uppercase small d-block">
              Connection Poolers
            </span>
            <IndexCardLink to="/pgbouncer/latest">pgBouncer</IndexCardLink>
            <IndexCardLink to="/pgpool/latest">pgPool-II</IndexCardLink>
          </IndexCard>

          <IndexCard iconName={iconNames.CONVERT} headingText="Migration Tools">
            <IndexCardLink to="/migration_portal/latest">
              Migration Portal
            </IndexCardLink>
            <IndexCardLink to="/migration_toolkit/latest">
              Migration Toolkit
            </IndexCardLink>
          </IndexCard>

          <IndexCard
            iconName={iconNames.DRIVES}
            headingText="Backup & Recovery Tools"
          >
            <IndexCardLink to="/supported-open-source/barman/">
              Barman
            </IndexCardLink>

            <IndexCardLink
              to="/supported-open-source/barman/single-server-streaming/"
              className="nested-link"
            >
              Single Server Streaming
              <span
                className="new-thing"
                title="Walk through an interactive demo in Katacoda"
              >
                Demo
              </span>
            </IndexCardLink>
            <IndexCardLink to="/supported-open-source/pgbackrest/">
              pgBackRest
            </IndexCardLink>
            <IndexCardLink to="/bart/latest">
              Backup &amp; Recovery Tool
            </IndexCardLink>
          </IndexCard>

          <IndexCard iconName={iconNames.KUBERNETES} headingText="Kubernetes">
            <IndexCardLink to="/kubernetes/cloud_native_postgresql/">
              Cloud Native PostgreSQL Operator
            </IndexCardLink>
            <IndexCardLink
              to="/kubernetes/cloud_native_postgresql/interactive_demo/"
              className="nested-link"
            >
              Install, Configure, Deploy
              <span
                className="new-thing"
                title="Walk through an interactive demo in Katacoda"
              >
                Demo
              </span>
            </IndexCardLink>
          </IndexCard>

          <IndexCard
            iconName={iconNames.CODE_WRITING}
            headingText="Integration"
          >
            <span className="font-weight-bold text-muted text-uppercase small">
              Foreign Data Wrappers
            </span>
            <IndexCardLink to="/hadoop_data_adapter/latest">
              Hadoop Foreign Data Wrapper
            </IndexCardLink>
            <IndexCardLink to="/mongo_data_adapter/latest">
              Mongo Foreign Data Wrapper
            </IndexCardLink>
            <IndexCardLink to="/mysql_data_adapter/latest">
              MySQL Foreign Data Wrapper
            </IndexCardLink>
            <span className="font-weight-bold text-muted text-uppercase small mt-4 d-block">
              Connectors
            </span>
            <IndexCardLink to="/jdbc_connector/latest">
              JDBC Connector
            </IndexCardLink>
            <IndexCardLink to="/net_connector/latest">
              .NET Connector
            </IndexCardLink>
            <IndexCardLink to="/ocl_connector/latest">
              OCL Connector
            </IndexCardLink>
            <IndexCardLink to="/odbc_connector/latest">
              ODBC Connector
            </IndexCardLink>
          </IndexCard>

          <IndexCard iconName={iconNames.MODULE} headingText="Extensions">
            <IndexCardLink to="/postgis/latest">PostGIS</IndexCardLink>
          </IndexCard>
        </div>

        <hr />
        <IndexSubNav />
        <Footer />
      </MainContent>
    </Container>
  </Layout>
);

export default Page;
