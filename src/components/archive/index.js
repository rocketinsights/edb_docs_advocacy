import React from 'react';
import { Link } from '..';

import Icon from '../icon';

const environment = process.env.GATSBY_ENVIRONMENT_BRANCH;

export default function Archive({ title, path, ...props }) {
  const url = `https://github.com/EnterpriseDB/x-docs-archive-test/raw/${environment}/${path}`;

  return (
    <Link to={url} title={title} className="w-100 d-block" {...props}>
      <PdfIcon /> {title}
    </Link>
  );
}

const PdfIcon = ({ className }) => (
  <Icon
    iconName="PDF"
    className={`fill-orange position-relative top-minus-1 ${className}`}
    width="16"
    height="auto"
  />
);
