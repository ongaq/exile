<script>
import { Line, mixins } from 'vue-chartjs';

export default {
  extends: Line,
  mixins: [mixins.reactiveProp],
  props: {
    chartData: Object
  },
  data(){
    return {
      options: {
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: false
            },
            gridLines: { display: true }
          }],
          xAxes: [{
            gridLines: { display: false }
          }]
        },
        legend: {
          display: true
        },
      }
    };
  },
  mounted(){
    this.renderChart(this.chartData, this.options);
  }
};
</script>
