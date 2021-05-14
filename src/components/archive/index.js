import React from 'react';
import Icon from '../icon';

import OldDocsLink from './old-docs-link';
import FullDocsLink from './full-docs-link';

export default function Archive({
  title,
  product,
  version,
  fileName = '',
  ...props
}) {
  return (
    <>
      {fileName === '' ? (
        <FullDocsLink
          {...{ title, product, version }}
          fileIcon={PdfIcon}
          {...props}
        />
      ) : (
        <OldDocsLink
          {...{ title, product, version, fileName }}
          fileIcon={PdfIcon}
          {...props}
        />
      )}
    </>
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
