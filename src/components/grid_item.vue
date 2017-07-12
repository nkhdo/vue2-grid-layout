<template>
  <div>
    <div class="ghost" v-show="working" :style="ghostBoxStyle"></div>
    <div class="grid-item"
         :class="itemClass"
         :style="itemStyle"
         @mousedown.prevent="handleMouseDown">
      <div v-show="!grid.layout.hideOnWork || !working" class="grid-item-content">
        <slot></slot>
      </div>
      <div class="__resize-handles" v-show="grid.layout.editMode">
        <div class="__resize-handle n t"></div>
        <div class="__resize-handle s b"></div>
        <div class="__resize-handle e r"></div>
        <div class="__resize-handle w l"></div>
        <div class="__resize-handle nw t l"></div>
        <div class="__resize-handle ne t r"></div>
        <div class="__resize-handle sw b l"></div>
        <div class="__resize-handle se b r"></div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';

  export default {
    name: 'gridItem',
    props: {
      item: {
        type: Object,
        required: true,
        validator (val) {
          return _.isNumber(val.x) && _.isNumber(val.y) && _.isNumber(val.w) && _.isNumber(val.h) && !_.isNil(val.id);
        }
      },
      dragHandleClass: {
        type: String,
        required: false
      }
    },
    inject: ['grid'],
    data () {
      return {
        dragging: false,
        resizing: false,
        ghost: {
          x: this.item.x,
          y: this.item.y,
          w: this.item.w,
          h: this.item.h
        },
        mouseData: {
          startX: null,
          startY: null,
          currentX: null,
          currentY: null
        },
        resizeData: {
          top: false,
          bottom: false,
          left: false,
          right: false
        }
      }
    },
    methods: {
      resetMouseData (e) {
        this.mouseData.startX = e.clientX + this.grid.layout.scrollX;
        this.mouseData.startY = e.clientY + this.grid.layout.scrollY;
        this.mouseData.currentX = e.clientX + this.grid.layout.scrollX;
        this.mouseData.currentY = e.clientY + this.grid.layout.scrollY;
      },
      handleMouseDown (e) {
        if (!this.grid.layout.editMode) {
          return;
        }
        const targetClassList = e.target.classList;
        if (_.includes(targetClassList, '__resize-handle')) {
          this.resizing = true;
          if (_.includes(targetClassList, 't')) {
            this.resizeData.top = true;
          }
          if (_.includes(targetClassList, 'b')) {
            this.resizeData.bottom = true;
          }
          if (_.includes(targetClassList, 'l')) {
            this.resizeData.left = true;
          }
          if (_.includes(targetClassList, 'r')) {
            this.resizeData.right = true;
          }
          this.grid.layout.startWorking();
          this.resetMouseData(e);
          return;
        }
        if (!this.dragHandleClass || _.includes(targetClassList, this.dragHandleClass)) {
          this.dragging = true;
          this.grid.layout.startWorking();
          this.resetMouseData(e);
        }
      },
      handleMouseUp () {
        if (!this.grid.layout.editMode || !(this.dragging || this.resizing)) {
          return;
        }
        this.dragging = false;
        this.resizing = false;
        this.resizeData = {
          top: false,
          bottom: false,
          left: false,
          right: false
        };
        this.grid.layout.stopWorking();
        if (this.isLayoutChanged) {
          this.grid.layout.setLayout(this.item.id, this.ghost);
          this.$emit('layout:updated', {
            id: this.item.id,
            layout: this.ghost
          });
        }
      },
      handleMouseMove (e) {
        if (e.preventDefault) {
          e.preventDefault();
        }
        if (!this.grid.layout.editMode) {
          return;
        }
        if (this.resizing) {
          this.mouseData.currentX = e.clientX + this.grid.layout.scrollX;
          this.mouseData.currentY = e.clientY + this.grid.layout.scrollY;

          let deltaX = Math.round((this.mouseData.currentX - this.mouseData.startX) / (this.grid.cellSize + this.grid.layout.margin));
          let deltaY = Math.round((this.mouseData.currentY - this.mouseData.startY) / (this.grid.cellSize + this.grid.layout.margin));

          let { x, y, w, h } = this.item;
          if (this.resizeData.top) {
            if (deltaY > h) {
              y += h;
              h = 0
            } else {
              y += deltaY;
              h -= deltaY;
            }
          }
          if (this.resizeData.left) {
            if (deltaX > w) {
              x += w;
              w = 0
            } else {
              x += deltaX;
              w -= deltaX;
            }
          }
          if (this.resizeData.bottom) {
            h += deltaY;
          }
          if (this.resizeData.right) {
            w += deltaX;
          }
          const suggested = this.grid.layout.suggestResizePos(this.item.id, { x, y, w, h });
          if (!!suggested) {
            this.ghost = suggested;
          }
        } else if (this.dragging) {
          this.mouseData.currentX = e.clientX + this.grid.layout.scrollX;
          this.mouseData.currentY = e.clientY + this.grid.layout.scrollY;
          const deltaX = Math.round((this.mouseData.currentX - this.mouseData.startX) / (this.grid.cellSize + this.grid.layout.margin));
          const deltaY = Math.round((this.mouseData.currentY - this.mouseData.startY) / (this.grid.cellSize + this.grid.layout.margin));
          const suggested = this.grid.layout.suggestDragPos(this.item.id, {
            x: this.item.x + deltaX,
            y: this.item.y + deltaY
          });
          if (!!suggested) {
            this.ghost = suggested;
          }
        }
      },
      addEventHandler (event, handler) {
        const el = document.documentElement;
        if (el.attachEvent) {
          el.attachEvent('on' + event, handler);
        } else if (el.addEventListener) {
          el.addEventListener(event, handler, true);
        } else {
          el['on' + event] = handler;
        }
      },
      removeEventHandler (event, handler) {
        const el = document.documentElement;
        if (el.detachEvent) {
          el.detachEvent('on' + event, handler);
        } else if (el.removeEventListener) {
          el.removeEventListener(event, handler, true);
        } else {
          delete el['on' + event];
        }
      },
      isLayoutChanged () {
        return !(this.item.x === this.ghost.x && this.item.y === this.ghost.y && this.item.w === this.ghost.w && this.item.h === this.ghost.h);
      }
    },
    mounted () {
      this.addEventHandler('mousemove', this.handleMouseMove);
      this.addEventHandler('mouseup', this.handleMouseUp);
    },
    destroyed () {
      this.removeEventHandler('mousemove', this.handleMouseMove);
      this.removeEventHandler('mouseup', this.handleMouseUp);
    },
    computed: {
      working () {
        return this.dragging || this.resizing;
      },
      top () {
        return this.item.y * (this.grid.cellSize + this.grid.layout.margin) + this.grid.layout.margin;
      },
      left () {
        return this.item.x * (this.grid.cellSize + this.grid.layout.margin) + this.grid.layout.margin;
      },
      width () {
        return this.item.w * (this.grid.cellSize + this.grid.layout.margin) - this.grid.layout.margin;
      },
      height () {
        return this.item.h * (this.grid.cellSize + this.grid.layout.margin) - this.grid.layout.margin;
      },
      boxStyle () {
        return {
          top: this.top + 'px',
          left: this.left + 'px',
          width: this.width + 'px',
          height: this.height + 'px'
        }
      },
      draggingBoxStyle() {
        return {
          top: this.top + this.mouseData.currentY - this.mouseData.startY + 'px',
          left: this.left + this.mouseData.currentX - this.mouseData.startX + 'px',
          width: this.width + 'px',
          height: this.height + 'px',
          'z-index': 11
        }
      },
      resizingBoxStyle () {
        const deltaX = this.mouseData.currentX - this.mouseData.startX;
        const deltaY = this.mouseData.currentY - this.mouseData.startY;

        let top = this.top,
            left = this.left,
            width = this.width,
            height = this.height;

        if (this.resizeData.top) {
          if (deltaY > height) {
            top += height;
            height = 0;
          } else {
            top += deltaY;
            height -= deltaY;
          }
        }
        if (this.resizeData.left) {
          if (deltaX > width) {
            left += width;
            width = 0;
          } else {
            left += deltaX;
            width -= deltaX;
          }
        }
        if (this.resizeData.bottom) {
          height += deltaY;
        }
        if (this.resizeData.right) {
          width += deltaX;
        }

        return {
          top: top + 'px',
          left: left + 'px',
          width: width + 'px',
          height: height + 'px',
          'z-index': 11
        }
      },
      ghostBoxStyle () {
        return {
          top: this.ghost.y * (this.grid.cellSize + this.grid.layout.margin) + this.grid.layout.margin + 'px',
          left: this.ghost.x * (this.grid.cellSize + this.grid.layout.margin) + this.grid.layout.margin + 'px',
          width: this.ghost.w * (this.grid.cellSize + this.grid.layout.margin) - this.grid.layout.margin + 'px',
          height: this.ghost.h * (this.grid.cellSize + this.grid.layout.margin) - this.grid.layout.margin + 'px'
        }
      },
      itemStyle () {
        if (this.resizing) {
          return this.resizingBoxStyle;
        } else if (this.dragging) {
          return this.draggingBoxStyle;
        } else {
          return this.boxStyle;
        }
      },
      itemClass () {
        return {
          edit: this.grid.layout.editMode,
          working: this.working
        }
      }
    }
  }
</script>

<style scoped lang="scss">
  .grid-item {
    position: absolute;
    background-color: #fff;
    box-sizing: border-box;
    .grid-item-content {
      width: 100%;
      height: 100%;
    }
    .__resize-handle {
      position: absolute;
      z-index: 100;
      box-sizing: border-box;
      visibility: hidden;
      &.se {
        width: 15px;
        height: 15px;
        bottom: -3px;
        right: -3px;
        background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
        background-position: bottom right;
        padding: 0 6px 6px 0;
        background-repeat: no-repeat;
        background-origin: content-box;
        cursor: se-resize;
      }
      &.ne {
        width: 15px;
        height: 15px;
        top: -3px;
        right: -3px;
        cursor: ne-resize;
      }
      &.nw {
        width: 15px;
        height: 15px;
        top: -3px;
        left: -3px;
        cursor: nw-resize;
      }
      &.sw {
        width: 15px;
        height: 15px;
        bottom: -3px;
        left: -3px;
        cursor: sw-resize;
      }
      &.n {
        width: 100%;
        height: 15px;
        top: -3px;
        left: 0;
        cursor: n-resize;
      }
      &.s {
        width: 100%;
        height: 15px;
        bottom: -3px;
        left: 0;
        cursor: s-resize;
      }
      &.e {
        width: 15px;
        height: 100%;
        top: 0;
        right: -3px;
        cursor: e-resize;
      }
      &.w {
        width: 15px;
        height: 100%;
        top: 0;
        left: -3px;
        cursor: w-resize;
      }
    }
    &:hover {
      .__resize-handle {
        visibility: visible;
      }
    }
    &.working {
      border: 1px dashed #ccc;
    }
  }
  .ghost {
    position: absolute;
    background-color: #ccc;
    opacity: 0.6;
  }
</style>