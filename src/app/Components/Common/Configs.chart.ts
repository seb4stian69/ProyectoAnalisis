
const DISPLAY = true;
const BORDER = true;
const CHART_AREA = true;
const TICKS = true;

export const getConfigs=(data:any, array:any[]):any =>{

  return {
    type: 'line',
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Polinomio de interpolacion de newton'
        },
      },
      interaction: {
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          border: {
            display: BORDER
          },
          grid: {
            display: DISPLAY,
            drawOnChartArea: CHART_AREA,
            drawTicks: TICKS,
          },
        },
        y: {
          display: true,
          border: {
            display: false
          },
          grid: {
            color: 'gray'
          },
          suggestedMin: 0,
          suggestedMax: Math.max(...array)
        }
      }
    },
  };


}


export const getTension=():number=>0.4
