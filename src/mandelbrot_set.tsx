import { useWorker } from "@koale/useworker";
import React, { useEffect } from 'react';
import { rainColors } from "./const";
import { useUpdate } from '@vikadata/components';


const ZOOM_FACTOR = 0.05;

// 画布相关
class Painter {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  realSet: {
    start: number,
    end: number,
  };
  imaginarySet: {
    start: number,
    end: number,
  };
  zoomCb: any;
  constructor(canvasId: string, width: number, height: number, zoomCb: any) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!
    this.ctx.canvas.width = width;
    this.ctx.canvas.height = height;
    this.width = width;
    this.height = height;
    this.realSet = { start: -2, end: 1 }
    this.imaginarySet = { start: -1, end: 1 }
    this.zoomCb = zoomCb;
    this.initZoom();
  }
  drawPoint(x, y, color) {
    this.ctx.fillStyle = color
    this.ctx.fillRect(x, y, 1, 1)
  }

  initZoom() {
    const getRelativePoint = (pixel, length, set) => set.start + (pixel / length) * (set.end - set.start)
    this.canvas.addEventListener('click', e => {
      const zfw = (this.width * ZOOM_FACTOR)
      const zfh = (this.height * ZOOM_FACTOR)
      this.realSet = {
        start: getRelativePoint(e.pageX - this.canvas.offsetLeft - zfw, this.width, this.realSet),
        end: getRelativePoint(e.pageX - this.canvas.offsetLeft + zfw, this.width, this.realSet)
      }
      this.imaginarySet = {
        start: getRelativePoint(e.pageY - this.canvas.offsetTop - zfh, this.height, this.imaginarySet),
        end: getRelativePoint(e.pageY - this.canvas.offsetTop + zfh, this.height, this.imaginarySet)
      }
      this.zoomCb();
    })
  }
}

const getMandelbrotSet = (props: {
  width: number,
  height: number,
  rowLines?: {
    start: number,
    end: number,
  },
  colors: string[],
  realSet: {
    start: number,
    end: number,
  },
  imaginarySet: {
    start: number,
    end: number,
  }
}) => {
  const { width, height, rowLines, colors, realSet, imaginarySet } = props;
  const yStart = rowLines ? rowLines.start : 0;
  const yEnd = rowLines ? rowLines.end : height;
  const MAX_ITER_COUNT = 80
  const mandelbrotSet = new Array<{ color: string, x: number, y: number }>(width * height);

  for (let x = 0; x < width; x++) {
    for (let y = yStart; y < yEnd; y++) {
      const c = {
        x: realSet.start + (x / width) * (realSet.end - realSet.start),
        y: imaginarySet.start + (y / height) * (imaginarySet.end - imaginarySet.start)
      }
      let iter_count = 0;
      let length = 0;
      let z = {
        x: 0,
        y: 0
      }
      do {
        // z1 = z0^2 + c
        const zSquare = {
          x: z.x * z.x - z.y * z.y,
          y: 2 * z.x * z.y
        };
        z = {
          x: zSquare.x + c.x,
          y: zSquare.y + c.y
        }
        length = Math.sqrt(z.x * z.x + z.y * z.y)
        // length = z[0] * z[0] + z[1] * z[1]
        iter_count++;
        // 如果迭代 80 次都没有变成无穷大，那么理解为是收敛的
      } while (iter_count < MAX_ITER_COUNT && length <= 2)
      const color = colors[length <= 2 ? 0 : ((iter_count as number) % colors.length - 1) + 1]
      mandelbrotSet[x + y * width] = { color, x, y }
    }
  }
  return mandelbrotSet
}


const MandelbrotSetRenderWorker = (props: {
  width: number,
  height: number,
  workerIndex: number,
  allWorkerCount: number,
  painter: Painter,
  colors: string[],
  realSet: {
    start: number,
    end: number,
  },
  imaginarySet: {
    start: number,
    end: number,
  }
}) => {
  const { width, height, workerIndex, allWorkerCount, painter, colors, realSet, imaginarySet } = props;
  console.log(imaginarySet, realSet)
  const [_getMandelbrotSet] = useWorker(getMandelbrotSet);
  const shouldRenderRowCount = height / allWorkerCount;


  useEffect(() => {
    _getMandelbrotSet({
      width,
      height,
      rowLines: {
        start: workerIndex * shouldRenderRowCount,
        end: (workerIndex + 1) * shouldRenderRowCount
      },
      colors,
      realSet,
      imaginarySet
    }).then(res => {
      res.forEach(item => {
        item && painter.drawPoint(item.x, item.y, item.color)
      })
    })
  }, [imaginarySet, realSet])
  return <></>;
}


export function MandelbrotSet(props: {
  width: number,
  height: number,
  workerCount?: number,
}) {
  const { width, height, workerCount = 8 } = props;
  const updateCanvas = useUpdate();
  const [painter, setPainter] = React.useState<Painter | null>(null);
  // const colors = new Array(16).fill(0).map((_, i) => i === 0 ? '#000000' : `#${((1 << 24) * Math.random() | 0).toString(16)}`)

  useEffect(() => {
    if (painter) {
      return;
    }
    setPainter(new Painter('mandelbrot_set_canvas', width, height, updateCanvas))
  }, [])
  console.log('update')
  return (
    <div>
      <canvas id="mandelbrot_set_canvas" />
      {
        painter && Array(workerCount).fill(0).map((_, i) => {
          return <MandelbrotSetRenderWorker
            width={width}
            height={height}
            workerIndex={i}
            allWorkerCount={workerCount}
            painter={painter}
            realSet={painter.realSet}
            imaginarySet={painter.imaginarySet}
            colors={['#000', ...rainColors]}
          />
        })
      }
    </div>
  )
}
