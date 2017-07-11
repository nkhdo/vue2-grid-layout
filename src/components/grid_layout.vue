<template>
  <div class="grid-container" v-resize:debounce="handleResize" :style="gridStyle" :class="gridClass">
    <div v-for="r in layoutManager.rows" v-show="layoutManager.isWorking">
      <div v-for="c in layoutManager.cols" class="cell" :style="cellStyle(r, c)"></div>
    </div>
    <div class="items">
      <slot></slot>
    </div>
  </div>
</template>

<script>
  import resize from 'vue-resize-directive';

  export default {
    name: 'gridLayout',
    props: {
      spacing: {
        type: Number,
        required: false,
        'default': 10
      },
      layoutManager: {
        type: Object,
        required: true
      }
    },
    directives: {
      resize
    },
    provide () {
      const gridSettings = {};
      Object.defineProperty(gridSettings, 'spacing', {
        enumerable: true,
        get: () => this.spacing
      });
      Object.defineProperty(gridSettings, 'cellSize', {
        enumerable: true,
        get: () => this.cellSize
      });
      Object.defineProperty(gridSettings, 'layout', {
        enumerable: true,
        get: () => this.layoutManager
      });
      return { gridSettings }
    },
    data () {
      return {
        cellSize: 50
      }
    },
    computed: {
      gridStyle () {
        const rows = this.layoutManager.rows;
        return {
          height: rows * this.cellSize + (rows + 1) * this.spacing + 'px',
          width: '100%'
        };
      },
      gridClass () {
        return {
          edit: this.layoutManager.editMode
        }
      }
    },
    methods: {
      handleResize () {
        this.calcCellSize();
      },
      calcCellSize () {
        this.cellSize = (this.$el.clientWidth - this.spacing * (this.layoutManager.cols +1)) / this.layoutManager.cols;
      },
      cellStyle (r, c) {
        const wh = this.cellSize + 'px';
        const top = (r - 1) * (this.cellSize + this.spacing) + this.spacing + 'px';
        const left = (c - 1) * (this.cellSize + this.spacing) + this.spacing + 'px';
        return {
          width: wh,
          height: wh,
          top,
          left
        };
      }
    },
    mounted () {
      this.calcCellSize();
    }
  }
</script>

<style scoped lang="scss">
  .grid-container {
    background-color: #eee;
    position: relative;
    .cell {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid #ccc;
    }
  }
</style>
