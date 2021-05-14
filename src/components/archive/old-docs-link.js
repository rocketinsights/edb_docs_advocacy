import React from 'react';
import { Link } from '..';

const OldDocsLink = ({
  title,
  product,
  version,
  fileName,
  fileIcon: FileIcon,
  ...props
}) => {
  const url = `https://www.enterprisedb.com/edb-docs/static/docs/${product}/${version}/${fileName}`;
  return (
    <Link to={url} title={title} className="w-100 d-block" {...props}>
      <FileIcon /> {title}
    </Link>
  );
};

export default OldDocsLink;
