<template>
  <div class="grid-container" v-resize:debounce="handleResize" :style="gridStyle" :class="gridClass">
    <div class="cells" v-show="layoutManager.isWorking">
      <template v-for="r in layoutManager.rows">
        <div v-for="c in layoutManager.cols" class="cell" :style="cellStyle(r, c)"></div>
      </template>
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
      layoutManager: {
        type: Object,
        required: true
      }
    },
    directives: {
      resize
    },
    provide () {
      const grid = {};
      Object.defineProperty(grid, 'cellSize', {
        enumerable: true,
        get: () => this.cellSize
      });
      Object.defineProperty(grid, 'layout', {
        enumerable: true,
        get: () => this.layoutManager
      });
      return { grid }
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
          height: rows * this.cellSize + (rows + 1) * this.layoutManager.margin + 'px',
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
        this.cellSize = (this.$el.clientWidth - this.layoutManager.margin * (this.layoutManager.cols +1)) / this.layoutManager.cols;
      },
      cellStyle (r, c) {
        const wh = this.cellSize + 'px';
        const top = (r - 1) * (this.cellSize + this.layoutManager.margin) + this.layoutManager.margin + 'px';
        const left = (c - 1) * (this.cellSize + this.layoutManager.margin) + this.layoutManager.margin + 'px';
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
    overflow-anchor: none;
    .cells, .items {
      width: 100%;
      height: 100%;
    }
    .cell {
      position: absolute;
      box-sizing: border-box;
      border: 1px solid #ccc;
    }
  }
</style>
