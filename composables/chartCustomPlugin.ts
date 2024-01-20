export const borderPlugin = {
  id: 'chartAreaBorder',
  beforeDraw(chart: any, args: any, options: any) {
    const {ctx, chartArea: {left, top, width, height}} = chart;
    if (chart.options.plugins.zoom.zoom.wheel.enabled) {
      ctx.save();
      ctx.strokeStyle = 'rgb(255,34,99)';
      ctx.lineWidth = 2;
      ctx.strokeRect(left, top, width, height);
      ctx.restore();
    }
  }
};