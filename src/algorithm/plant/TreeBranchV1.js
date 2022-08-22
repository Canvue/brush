import {fabric} from "fabric";

// 配置项
let _options = {
    maxLevels: 5,
    maxDistance: 20,
    branchColor: 'black',
    branchSize: 3,
    leafFn: (obj) => {
    }
}

let _points = [] // 点集
let _objects = [] // 对象池

/**
 * 树枝
 */
export class TreeBranchV1 {
    type = 'tree'
    nBranches = 0
    maxBranches = 200
    moveDistance = 0

    constructor(points, options) {
        if (points.length < 3) {
            return false;
        }
        options = options || {};
        _options = Object.assign(_options, options)
        _points = points;
        _objects = [];

        // 创建起始点
        this.root = new Branch(false, _options.maxLevels, points[0].x, points[0].y);
        this.current = this.root;

        this.run()

        return _objects
    }

    run() {
        for (let i = 1; i < _points.length; i++) {

            this.current.p1.x = _points[i].x;
            this.current.p1.y = _points[i].y;
            this.moveDistance += _points[i].moveDistance

            // 生长
            this.root.grow();

            // 通过随机数创建枝杈
            if ((Math.random() > 0.8) || this.moveDistance > _options.maxDistance) {
                this.moveDistance = 0;
                const branch = new Branch(this.current, this.current.level, this.current.p1.x, this.current.p1.y);
                this.current.branches.push(branch);

                if (Math.random() > 0.8) this.current.branches.push(Branch.newBranch(this.current));

                this.current = branch;
                this.nBranches++;
            }

            if (_points.length === i + 1) {
                this.current.branches.push(Branch.newBranch(this.current));
            }

            // 限制分支增长
            if (this.nBranches > this.maxBranches) {
                this.root = this.root.branches[0];
                this.nBranches--;
            }
        }
    }

}

class Branch {

    constructor(parent, level, x, y) {
        this.parent = parent;
        this.branches = [];
        this.p0 = parent ? parent.p1 : new fabric.Point(x, y);
        this.p1 = new fabric.Point(x, y);
        this.level = level;
        this.life = 20;
        this.angle = 0;
        this.vx = 0;
        this.vy = 0;
    }

    grow() {
        // 促进枝杈生长
        for (let i = 0; i < this.branches.length; i++) {
            this.branches[i].grow();
        }

        if (this.life > 1) {
            this.p1.x += this.vx;
            this.p1.y += this.vy;

            if (this.level) {
                if (this.parent) {
                    // 绘制枝干 Q表示二次贝塞尔曲线
                    let pathString = 'M' + this.parent.p0.x + ',' + this.parent.p0.y + 'Q' + this.p0.x + ',' + this.p0.y + ',' + this.p1.x + ',' + this.p1.y;
                    let line = new fabric.Path(pathString, {
                        stroke: _options.branchColor,
                        strokeWidth: this.level * _options.branchSize - 1,
                        strokeLineCap: 'round',
                        strokeLineJoin: 'round',
                    });
                    _objects.push(line)
                }
            } else {
                // 绘制叶片节点
                let ep = _options.leafFn(this)
                _objects.push(ep)
            }
        }

        if (this.life === 1 && this.level > 0 && this.level < _options.maxLevels) {
            this.branches.push(Branch.newBranch(this));
            this.branches.push(Branch.newBranch(this));
        }

        this.life--;

        if (this.life >= 0) {
            this.grow()
        }
    }

    static newBranch(parent) {
        const branch = new Branch(parent, parent.level - 1, parent.p1.x, parent.p1.y);

        // branch.angle = (parent.level > _options.maxLevels) ? Math.random() * 2 * Math.PI :
        //     Math.atan2(parent.p1.y - parent.p0.y, parent.p1.x - parent.p0.x) + (Math.random() * 1.4 - 0.7);
        branch.angle = Math.atan2(parent.p1.y - parent.p0.y, parent.p1.x - parent.p0.x) + (Math.random() * 1.4 - 0.7);
        branch.vx = Math.cos(branch.angle) * 8;
        branch.vy = Math.sin(branch.angle) * 8;
        branch.life = branch.level === 1 ? 5 : Math.round(Math.random() * (branch.level * 2)) + 2;
        return branch;
    }
}

