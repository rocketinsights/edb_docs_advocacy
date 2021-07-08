import React from 'react';
import IconType from './iconType';
import iconNames from './iconNames';

import * as icons from '@enterprisedb/icons';

function Icon({
  circle,
  circleClassName,
  circleDiameter,
  circleAutoMargin,
  iconName,
  ...props
}) {
  const SelectedIcon = icons[iconName] || 'span';

  if (circle && circleDiameter) {
    return (
      <div
        className={`hpx-${circleDiameter} wpx-${circleDiameter} rounded-circle
        ${
          circleAutoMargin && 'mx-auto'
        } d-flex justify-content-center align-items-center ${circleClassName}`}
      >
        <SelectedIcon {...props} />
      </div>
    );
  } else {
    return <SelectedIcon {...props} />;
  }
}

Icon.defaultProps = {
  className: 'dottedbox',
  circleClassName: '',
  circleDiameter: 100,
  circleAutoMargin: true,
  circle: false,
  width: 100,
  height: 100,
};

export { iconNames };

export default Icon;
