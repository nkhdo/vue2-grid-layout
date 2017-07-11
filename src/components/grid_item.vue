<template>
  <div>
    <div class="ghost" v-show="working" :style="ghostBoxStyle"></div>
    <div class="grid-item"
         :class="itemClass"
         :style="itemStyle"
         @mousedown="handleMouseDown">
      <div v-show="!gridSettings.layout.hideOnWork || !resizing" class="grid-item-content">
        <slot></slot>
      </div>
      <div class="__resize-handle" v-show="gridSettings.layout.editMode"></div>
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
    inject: ['gridSettings'],
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
        }
      }
    },
    methods: {
      resetMouseData (e) {
        this.mouseData.startX = e.x + this.gridSettings.layout.scrollX;
        this.mouseData.startY = e.y + this.gridSettings.layout.scrollY;
        this.mouseData.currentX = e.x + this.gridSettings.layout.scrollX;
        this.mouseData.currentY = e.y + this.gridSettings.layout.scrollY;
      },
      handleMouseDown (e) {
        if (!this.gridSettings.layout.editMode) {
          return;
        }
        const targetClassList = e.target.classList;
        if (_.includes(targetClassList, '__resize-handle')) {
          this.resizing = true;
          this.gridSettings.layout.startWorking();
          this.resetMouseData(e);
          return;
        }
        if (!this.dragHandleClass || _.includes(targetClassList, this.dragHandleClass)) {
          this.dragging = true;
          this.gridSettings.layout.startWorking();
          this.resetMouseData(e);
        }
      },
      handleMouseUp () {
        if (!this.gridSettings.layout.editMode || !(this.dragging || this.resizing)) {
          return;
        }
        this.dragging = false;
        this.resizing = false;
        this.gridSettings.layout.setLayout(this.item.id, this.ghost);
        this.gridSettings.layout.stopWorking();
        this.$emit('layout:updated', {
          id: this.item.id,
          layout: this.ghost
        });
      },
      handleMouseMove (e) {
        if (e.stopPropagation) {
          e.stopPropagation();
        }
        if (e.preventDefault) {
          e.preventDefault();
        }
        if (!this.gridSettings.layout.editMode) {
          return;
        }
        if (this.resizing) {
          this.mouseData.currentX = e.x + this.gridSettings.layout.scrollX;
          this.mouseData.currentY = e.y + this.gridSettings.layout.scrollY;
          const deltaX = Math.round((this.mouseData.currentX - this.mouseData.startX) / (this.gridSettings.cellSize + this.gridSettings.spacing));
          const deltaY = Math.round((this.mouseData.currentY - this.mouseData.startY) / (this.gridSettings.cellSize + this.gridSettings.spacing));
          const suggested = this.gridSettings.layout.suggestResizePos(this.item.id, {
            w: this.item.w + deltaX,
            h: this.item.h + deltaY
          });
          if (!!suggested) {
            this.ghost = suggested;
          }
        } else if (this.dragging) {
          this.mouseData.currentX = e.x + this.gridSettings.layout.scrollX;
          this.mouseData.currentY = e.y + this.gridSettings.layout.scrollY;
          const deltaX = Math.round((this.mouseData.currentX - this.mouseData.startX) / (this.gridSettings.cellSize + this.gridSettings.spacing));
          const deltaY = Math.round((this.mouseData.currentY - this.mouseData.startY) / (this.gridSettings.cellSize + this.gridSettings.spacing));
          const suggested = this.gridSettings.layout.suggestDragPos(this.item.id, {
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
        return this.item.y * (this.gridSettings.cellSize + this.gridSettings.spacing) + this.gridSettings.spacing;
      },
      left () {
        return this.item.x * (this.gridSettings.cellSize + this.gridSettings.spacing) + this.gridSettings.spacing;
      },
      width () {
        return this.item.w * (this.gridSettings.cellSize + this.gridSettings.spacing) - this.gridSettings.spacing;
      },
      height () {
        return this.item.h * (this.gridSettings.cellSize + this.gridSettings.spacing) - this.gridSettings.spacing;
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
        return {
          top: this.top + 'px',
          left: this.left + 'px',
          width: this.width + this.mouseData.currentX - this.mouseData.startX + 'px',
          height: this.height + this.mouseData.currentY - this.mouseData.startY + 'px',
          'z-index': 11
        }
      },
      ghostBoxStyle () {
        return {
          top: this.ghost.y * (this.gridSettings.cellSize + this.gridSettings.spacing) + this.gridSettings.spacing + 'px',
          left: this.ghost.x * (this.gridSettings.cellSize + this.gridSettings.spacing) + this.gridSettings.spacing + 'px',
          width: this.ghost.w * (this.gridSettings.cellSize + this.gridSettings.spacing) - this.gridSettings.spacing + 'px',
          height: this.ghost.h * (this.gridSettings.cellSize + this.gridSettings.spacing) - this.gridSettings.spacing + 'px'
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
          edit: this.gridSettings.layout.editMode
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
      width: 20px;
      height: 20px;
      bottom: -7px;
      right: -7px;
      background: url('data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pg08IS0tIEdlbmVyYXRvcjogQWRvYmUgRmlyZXdvcmtzIENTNiwgRXhwb3J0IFNWRyBFeHRlbnNpb24gYnkgQWFyb24gQmVhbGwgKGh0dHA6Ly9maXJld29ya3MuYWJlYWxsLmNvbSkgLiBWZXJzaW9uOiAwLjYuMSAgLS0+DTwhRE9DVFlQRSBzdmcgUFVCTElDICItLy9XM0MvL0RURCBTVkcgMS4xLy9FTiIgImh0dHA6Ly93d3cudzMub3JnL0dyYXBoaWNzL1NWRy8xLjEvRFREL3N2ZzExLmR0ZCI+DTxzdmcgaWQ9IlVudGl0bGVkLVBhZ2UlMjAxIiB2aWV3Qm94PSIwIDAgNiA2IiBzdHlsZT0iYmFja2dyb3VuZC1jb2xvcjojZmZmZmZmMDAiIHZlcnNpb249IjEuMSINCXhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHhtbDpzcGFjZT0icHJlc2VydmUiDQl4PSIwcHgiIHk9IjBweCIgd2lkdGg9IjZweCIgaGVpZ2h0PSI2cHgiDT4NCTxnIG9wYWNpdHk9IjAuMzAyIj4NCQk8cGF0aCBkPSJNIDYgNiBMIDAgNiBMIDAgNC4yIEwgNCA0LjIgTCA0LjIgNC4yIEwgNC4yIDAgTCA2IDAgTCA2IDYgTCA2IDYgWiIgZmlsbD0iIzAwMDAwMCIvPg0JPC9nPg08L3N2Zz4=');
      background-position: bottom right;
      padding: 0 10px 10px 0;
      background-repeat: no-repeat;
      background-origin: content-box;
      box-sizing: border-box;
      cursor: se-resize;
      z-index: 100;
      visibility: hidden;
    }
    &:hover {
      .__resize-handle {
        visibility: visible;
      }
    }
  }
  .ghost {
    position: absolute;
    background-color: #ddd;
  }
</style>