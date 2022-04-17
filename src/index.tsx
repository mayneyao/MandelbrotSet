import { initializeWidget } from '@vikadata/widget-sdk';
import React from 'react';
import { MandelbrotSet } from './mandelbrot_set';
import { Setting } from './setting';

export const MandelBrotSet: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <div style={{
        flexGrow: 1,
        overflow: 'auto',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <MandelbrotSet width={800} height={600} />
      </div>
      <Setting />
    </div >
  );
};

initializeWidget(MandelBrotSet, process.env.WIDGET_PACKAGE_ID);
