import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';

const FullDocsLink = ({
  title,
  product,
  version,
  fileIcon: FileIcon,
  ...props
}) => {
  const data = useStaticQuery(graphql`
    {
      allFile(filter: { ext: { eq: ".pdf" } }) {
        nodes {
          publicURL
          absolutePath
        }
      }
    }
  `);

  const file = data.allFile.nodes.find((pdf) => {
    const productVersionPath = pdf.absolutePath
      .split('/')
      .slice(-3, -1)
      .join('/');
    return `/${productVersionPath}` === `/${product}/${version}`;
  });

  if (file) {
    return (
      <a href={file.publicURL} className="w-100 d-block" {...props}>
        <FileIcon /> {title}
      </a>
    );
  }
  return null;
};

export default FullDocsLink;
