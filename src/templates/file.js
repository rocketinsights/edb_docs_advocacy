import React from "react";
import { graphql } from "gatsby";

export const query = graphql`
  query($nodeId: String!) {
    file(id: { eq: $nodeId }) {
      internal {
        content
      }
    }
  }
`;

const FileTemplate = ({ data }) => {
  return <pre className="p-3">{data.file.internal.content}</pre>;
};

export default FileTemplate;
