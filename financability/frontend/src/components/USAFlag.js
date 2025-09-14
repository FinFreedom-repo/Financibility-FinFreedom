import React from 'react';
import waveNarrow from '../imgs/wave_narrow.png';

// USA Flag Image Component
const USAFlag = ({ width = 50, height = 35, style = {} }) => (
  <img 
    src={waveNarrow}
    alt="USA Flag"
    width={width} 
    height={height} 
    style={{ 
      display: 'inline-block', 
      marginLeft: '0px', 
      verticalAlign: 'middle',
      ...style
    }}
  />
);

export default USAFlag; 