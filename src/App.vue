<template>
  <div id="app">
    <div class="controls">
      <input type="checkbox" v-model="layoutManager.editMode" id="edit-mode"/>
      <label for="edit-mode">Edit Mode</label>
      <button @click="addItem()">Add item</button>
      <button @click="removeItem()">Remove item</button>
    </div>
    <grid-layout :layout-manager="layoutManager">
      <grid-item v-for="item in layoutManager.items"
                 :key="item.id"
                 :item="item"
                 @layout:updated="handleMouseEnd">
        {{item.id}}
      </grid-item>
    </grid-layout>
  </div>
</template>

<script>
  import { LayoutManager, gridLayout, gridItem } from '../index';

  export default {
    name: 'app',
    components: {
      gridLayout,
      gridItem
    },
    data () {
      return {
        items: [],
        layoutManager: null
      }
    },
    methods: {
      handleMouseEnd (data) {
        // console.log(data);
      },
      addItem () {
        this.layoutManager.addItem({
          id: Date.now(),
          x: 0,
          y: 0,
          w: 0,
          h: 0
        });
      },
      removeItem () {
        const id = parseInt(window.prompt('Item id:'));
        this.layoutManager.removeItem(id);
      }
    },
    created () {
      this.layoutManager = new LayoutManager(this.items, {
        cols: 24,
        minW: 3,
        minH: 2,
        hideOnWork: true
      });
    }
  }
</script>

<style scoped lang="scss">
  .controls {
    margin: 15px;
  }
</style>
