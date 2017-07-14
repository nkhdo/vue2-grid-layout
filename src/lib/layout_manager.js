import _ from 'lodash';

export default class LayoutManager {
  constructor (items, {
    cols = 12,
    editModeRows = 12,
    minW = 1,
    minH = 1,
    margin = 10,
    hideOnWork = false,
    scrollBody = null,
    map = null 
  }) {
    this.items = [];
    this.editMode = false;

    this.cols = cols;
    this.minW = minW;
    this.minH = minH;
    this.margin = margin;
    this.hideOnWork = hideOnWork;
    this.scrollBody = scrollBody;

    if (!_.isNil(this.scrollBody) && !_.isElement(this.scrollBody)) {
       throw new Error('scrollBody must be a DOM element');
    }

    this.editModeRows = editModeRows;

    this._working = false;
    this._workingPeak = 0;

    _.forEach(items, item => this.addItem(item));
  }

  addItem (item) {
    if (_.isNil(item.id)) {
      throw new Error('\'id\' is missing');
    }
    if (_.some(this.items, i => i.id === item.id)) {
      console.warn('\'id\' should be unique');
    }
    if (!_.isNumber(item.x)) {
      item.x = 0;
    }
    if (!_.isNumber(item.y)) {
      item.y = 0;
    }
    if (!_.isNumber(item.w)) {
      item.w = this.minW;
    }
    if (!_.isNumber(item.h)) {
      item.h = this.minH;
    }

    const suggestedPosition = this.suggestNewPosition(item);
    item.x = suggestedPosition.x;
    item.y = suggestedPosition.y;
    item.w = suggestedPosition.w;
    item.h = suggestedPosition.h; 

    this.items.push(item);
  }

  removeItem (id) {
    const index = _.findIndex(this.items, item => item.id === id);
    if (this.items[index]) {
      this.items.splice(index, 1);
    }
  }

  // Helpers
  startWorking () {
    this._working = true;
    this._workingPeak = 0;
  }

  stopWorking () {
    this._working = false;
    this._workingPeak = 0;
  }

  setWorkingPeak (val, forced = false) {
    if (forced || val > this._workingPeak) {
      this._workingPeak = val;
    }
  }

  getItemById (id) {
    return _.find(this.items, item => item.id === id);
  }

  // suggestNewPos ({ x, y, w, h }) {
  //   const suggested = {
  //     y: Math.max(0, y),
  //     w: Math.max(this.minW, Math.min(w, this.cols)),
  //     h: Math.max(this.minH, h)
  //   };
  //   // Set 'x' after 'w' is properly set
  //   suggested.x = Math.max(0, Math.min(x, this.cols - suggested.w));
  //   if (_.some(this.items, item => LayoutManager.checkCollision(item, suggested))) {
  //     // todo: find a better position (to fit in spaces between current items)
  //     suggested.y = this.maxRows;
  //   }
  //   return suggested;
  // }

  isValid(ret) {
    for (let i = 0; i < this.items.length; i++) {
      if (LayoutManager.checkCollision(ret, this.items[i])) 
        return false; 
    }
    return true; 
  }

  suggestNewPosition({x, y, w, h}) {
    const suggested = {
      y: Math.max(0, y),
      w: Math.max(this.minW, Math.min(w, this.cols)),
      h: Math.max(this.minH, h)
    };
    // Set 'x' after 'w' is properly set
    suggested.x = Math.max(0, Math.min(x, this.cols - suggested.w));
    const n = this.maxRows;
    for (y = 0; y < n; y++) {
      for (x = 0; x < this.cols - suggested.w + 1; x++) {
        suggested.y = y;
        suggested.x = x;
        if (this.isValid(suggested))
          return suggested;
      }
    }
    suggested.x = 0;
    suggested.y = n;
    return suggested;
  }

  suggestResizePos (itemId, { x, y, w, h }) {
    const item = this.getItemById(itemId);
    if (!item) return;

    const suggested = {};

    if (item.x === x) {
      suggested.x = x;
      suggested.w = Math.max(this.minW, Math.min(w, this.cols - suggested.x));
    } else {
      const maxX = item.x + item.w - this.minW;
      suggested.x = Math.max(0, Math.min(x, maxX));
      suggested.w = Math.max(this.minW, Math.min(w, item.x + item.w));
    }

    if (item.y === y) {
      suggested.y = y;
      suggested.h = Math.max(this.minH, h);
    } else {
      const maxY = item.y + item.h - this.minH;
      suggested.y = Math.max(0, Math.min(y, maxY));
      suggested.h = Math.max(this.minH, Math.min(h, item.y + item.h));

    }

    if (_.some(this.items, item => item.id !== itemId && LayoutManager.checkCollision(item, suggested))) {
      return null;
    }
    this.setWorkingPeak(suggested.y + suggested.h);
    return suggested;
  }

  suggestDragPos (itemId, { x, y }) {
    const item = this.getItemById(itemId);
    if (!item) return;

    const suggested = {
      x: Math.max(0, Math.min(x, this.cols - item.w)),
      y: Math.max(0, y),
      w: item.w,
      h: item.h
    };

    if (_.some(this.items, item => item.id !== itemId && LayoutManager.checkCollision(item, suggested))) {
      return null;
    }
    this.setWorkingPeak(suggested.y + suggested.h);
    return suggested;
  }

  setLayout (itemId, layout) {
    const item = this.getItemById(itemId);
    if (!item) return;
    item.x = layout.x;
    item.y = layout.y;
    item.w = layout.w;
    item.h = layout.h;
  }

  get maxRows () {
    return _.max(_.map(this.items, item => item.y + item.h)) || 0;
  }

  get rows () {
    let rs = this.maxRows;
    if (this.editMode) {
      rs = Math.max(rs, this.editModeRows);
    }
    if (this._working) {
      return Math.max(rs, this._workingPeak) + 3;
    }
    return rs || 1;
  }

  get isWorking () {
    return this._working;
  }

  get scrollX () {
    return this.scrollBody ? this.scrollBody.scrollLeft : window.scrollX;
  }

  get scrollY () {
    return this.scrollBody ? this.scrollBody.scrollTop : window.scrollY;
  }

  static checkCollision (rect1, rect2) {
    return (rect1.x < rect2.x + rect2.w &&
    rect1.x + rect1.w > rect2.x &&
    rect1.y < rect2.y + rect2.h &&
    rect1.h + rect1.y > rect2.y);
  }
}
