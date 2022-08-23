import {fabric} from "fabric";

/**
 * 轨迹笔刷
 *   ：根据绘制轨迹生成图案
 */
export const TrackBrush = fabric.util.createClass(fabric.BaseBrush, {
    _options: {
        minPoints: 10,
        stepPathWidth: 2,
        stepPathColor: 'gray',
        generateObjectFn: () => {
        }
    },

    _points: [],

    initialize: function (canvas, options = {}) {
        if (typeof options === 'object') {
            this._options = Object.assign(this._options, options)
        }
        if (typeof this._options.generateObjectFn != 'function') {
            console.warn('generateObjectFn must be function')
            return false
        }
        this.canvas = canvas;

        this.canvas.contextTop.lineJoin = "round";
        this.canvas.contextTop.lineCap = "round";
    },

    onMouseDown: function (pointer, options) {
        if (!this.canvas._isMainEvent(options.e)) {
            return;
        }

        this._reset();
        this._setShadow()
        this._track(pointer)
        this.canvas.contextTop.moveTo(pointer.x, pointer.y);
    },

    onMouseMove: function (pointer, options) {
        if (!this.canvas._isMainEvent(options.e)) {
            return;
        }
        this._track(pointer)
    },

    onMouseUp: function (pointer) {
        if (this._points.length < this._options.minPoints) return
        let originalRenderOnAddRemove = this.canvas.renderOnAddRemove;
        this.canvas.renderOnAddRemove = false;

        // 保存轨迹笔刷对象内容
        this._save(this._options.generateObjectFn(this._points));

        this._resetShadow();
        this.canvas.renderOnAddRemove = originalRenderOnAddRemove;
        this.canvas.requestRenderAll();
        this._reset();
    },

    /**
     * 清理前景画布缓存数据
     * @private
     */
    _reset: function () {
        this.canvas.clearContext(this.canvas.contextTop);
        this._points = [];
    },

    /**
     * 保存通过路径点生成的对象
     * @param objects
     * @private
     */
    _save: function (objects) {
        this.canvas.fire('before:path:created', {path: objects});
        this.canvas.add(objects);
        this.canvas.fire('path:created', {path: objects});
        this.canvas.clearContext(this.canvas.contextTop);
    },

    /**
     * 绘制临时轨迹
     * @param pointer
     * @private
     */
    _track: function (pointer) {
        let point = this.addPoint(pointer);
        let ctx = this.canvas.contextTop;
        this._saveAndTransform(ctx);
        this.dot(ctx, point);
        ctx.restore();
    },

    /**
     * 添加坐标点
     * @param pointer
     * @returns {fabric.Point}
     */
    addPoint: function (pointer) {
        const pointerPoint = new fabric.Point(pointer.x, pointer.y)

        let index = this._points.length - 1;
        pointerPoint.px = index > 0 ? this._points[index].x : pointer.x; // 上一个点的x坐标
        pointerPoint.py = index > 0 ? this._points[index].y : pointer.y; // 上一个点的y坐标

        let dx = pointerPoint.x - pointerPoint.px;
        let dy = pointerPoint.y - pointerPoint.py;

        // 计算与前一个点之间的距离
        pointerPoint.moveDistance = Math.sqrt(dx * dx + dy * dy);

        this._points.push(pointerPoint);
        return pointerPoint;
    },

    /**
     * 绘制点路径
     * @param ctx
     * @param point
     */
    dot: function (ctx, point) {
        ctx.fillStyle = this._options.stepPathColor;
        ctx.beginPath();
        ctx.arc(point.x, point.y, this._options.stepPathWidth, 0, Math.PI * 2, false);
        ctx.closePath();
        ctx.fill();
    },

})