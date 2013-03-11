
enchant();

var C = {
    GAME : {
        COLOR  : '#42424a',
        WIDTH  : 320,
        HEIGHT : 320,
        FPS    : 60
    },
    BALL : {
        WIDTH  : 10,
        HEIGHT : 10,
        SPEED  : 2,
        COLOR  : '#e4df61'
    },
    SIDE_WALL : {
        WIDTH  : 10,
        HEIGHT : 150,
        COLOR  : '#2e2f31'
    },
    LEVER : {
        WIDTH  : 50,
        HEIGHT : 15,
        COLOR  : '#51cb44',
        ADJUST : 10,
        LEFT   : {
            X       : 100,
            Y       : 270,
            DEGREES : -30
        },
        RIGHT  : {
            X       : 170,
            Y       : 270,
            DEGREES : 30
        }
    },
    HANDLE : {
        WIDTH  : 150,
        HEIGHT : 50,
        COLOR  : '#2e2f31',
        LEFT   : {
            X       : -50,
            Y       : 270,
        },
        RIGHT  : {
            X       : 220,
            Y       : 270,
        }
    }
};

var game = null;
window.onload = function() {
    game = new Game(C.GAME.WIDTH, C.GAME.HEIGHT);
    game.fps = C.GAME.FPS;

    game.side_wall = {
        left  : new LeftSideWall(),
        right : new RightSideWall()
    };

    game.lever = {
        left  : new LeftLever(),
        right : new RightLever(),
        collision : {
            left  : new LeftLeverCollisionDetector(),
            right : new RightLeverCollisionDetector()
        }
    };

    game.handle = {
        left  : new LeftHandle(),
        right : new RightHandle()
    };

    game.onload = function() {
        var scene = game.rootScene;
        scene.backgroundColor = C.GAME.COLOR;

        scene.addChild(game.lever.left);
        scene.addChild(game.lever.collision.left);

        scene.addChild(game.lever.right);
        scene.addChild(game.lever.collision.right);

        scene.addChild(game.handle.left);
        scene.addChild(game.handle.right);

        scene.addChild(game.side_wall.left);
        scene.addChild(game.side_wall.right);

        scene.onenterframe = function() {
            if (game.frame % 5 == 0) {
                var ball = new Ball();
                var x = Math.random() * ( game.width - ball.width );
                var y = -5;
                ball.moveTo(x, y);
                scene.addChild(ball);
            }

            // unko
            var input = game.input;
            if ( input.left && !game.lever.left.on_input ) {
                game.lever.left.hit();
                game.lever.collision.left.hit();
            }
            else if( !input.left && game.lever.left.on_input ) {
                game.lever.left.stay();
                game.lever.collision.left.stay();
            }
            else if ( input.right && !game.lever.right.on_input ) {
                game.lever.right.hit();
                game.lever.collision.right.hit();
            }
            else if( !input.right && game.lever.right.on_input ) {
                game.lever.right.stay();
                game.lever.collision.right.stay();
            }
        }
    };

    game.start();
};

var Ball = Class.create(Sprite, {
    initialize: function() {
        Sprite.call(this, C.BALL.WIDTH, C.BALL.HEIGHT);

        this.image = new BallImage();

        this.vx = Math.random() * 10 - 5;
        this.vy = Math.random() * 5 + 2;
        this.speed = C.BALL.SPEED;
    },
    onenterframe : function() {
        this.x += this.vx * this.speed;
        this.y += this.vy * this.speed;

        if( this.is_out_of_area() ) {
            this.parentNode.removeChild(this);
        }

        this.process_collision();
    },
    reflect_vector : function(n) {
        var d = dot({ x: this.vx, y: this.vy }, n) * 2.0;
        return {
            vx: this.vx - d * n.x,
            vy: this.vy - d * n.y
        };
    },
    is_out_of_area : function() {
        if( this.x < ( 0 - this.width ) || this.x > ( C.GAME.WIDTH + this.width ) ) {
            return true;
        } else if( this.y < ( 0 - this.height ) || this.y > ( C.GAME.HEIGHT + this.height ) ) {
            return true;
        } else {
            return false;
        }
    },
    process_collision : function() {
        var v = { vx : this.vx, vy : this.vy };
        if (this.collisionWithRotate(game.side_wall.left) == true) {
            v = this.reflect_vector( game.side_wall.left.normal_vector() );
        }
        else if (this.collisionWithRotate(game.side_wall.right) == true) {
            v = this.reflect_vector( game.side_wall.right.normal_vector() );
        }
        else if (this.collisionWithRotate(game.lever.collision.left) == true) {
            v = this.reflect_vector( game.lever.collision.left.normal_vector() );
        }
        else if (this.collisionWithRotate(game.lever.collision.right) == true) {
            v = this.reflect_vector( game.lever.collision.right.normal_vector() );
        }
        this.vx = v.vx;
        this.vy = v.vy;
    },
    // http://smallomega.com/?p=397
    collisionWithRotate: function(other) {
        //aはthis,bはother
        var a = new Array(9);
        var b = new Array(9);

        //回転してないときの４点を格納+各辺の中点4点([0]=[4],[5][6][7][8]はすり抜けがひどいので追加)
        a[0] = { X: this.x             , Y: this.y               };
        a[1] = { X: this.x + this.width, Y: this.y               };
        a[2] = { X: this.x + this.width, Y: this.y + this.height };
        a[3] = { X: this.x             , Y: this.y + this.height };
        a[4] = { X: this.x             , Y: this.y               };
        a[5] = { X: this.x + this.width / 2, Y: this.y               };
        a[6] = { X: this.x + this.width / 2, Y: this.y + this.height };
        a[7] = { X: this.x             , Y: this.y + this.height / 2 };
        a[8] = { X: this.x + this.width, Y: this.y + this.height / 2 };
        b[0] = { X: other.x              , Y: other.y                };
        b[1] = { X: other.x + other.width, Y: other.y                };
        b[2] = { X: other.x + other.width, Y: other.y + other.height };
        b[3] = { X: other.x              , Y: other.y + other.height };
        b[4] = { X: other.x              , Y: other.y                };
        b[5] = { X: other.x + other.width / 2, Y: other.y                    };
        b[6] = { X: other.x + other.width / 2, Y: other.y + other.height     };
        b[7] = { X: other.x                  , Y: other.y + other.height / 2 };
        b[8] = { X: other.x + other.width    , Y: other.y + other.height / 2 };

        //スプライトの中心を原点に平行移動
        for (var i in a) {
            a[i].X -= (this.x + this.width / 2);
            a[i].Y -= (this.y + this.height / 2);
        }
        for (var i in b) {
            b[i].X -= (other.x + other.width / 2);
            b[i].Y -= (other.y + other.height / 2);
        }

        //スプライトを回転させる
        for (var i in a) {
            var tmpX = a[i].X;
            var tmpY = a[i].Y;
            a[i].X = tmpX * Math.cos(this.rotation * Math.PI / 180) - tmpY * Math.sin(this.rotation * Math.PI / 180);
            a[i].Y = tmpX * Math.sin(this.rotation * Math.PI / 180) + tmpY * Math.cos(this.rotation * Math.PI / 180);
        }
        for (var i in b) {
            var tmpX = b[i].X;
            var tmpY = b[i].Y;
            b[i].X = tmpX * Math.cos(other.rotation * Math.PI / 180) - tmpY * Math.sin(other.rotation * Math.PI / 180);
            b[i].Y = tmpX * Math.sin(other.rotation * Math.PI / 180) + tmpY * Math.cos(other.rotation * Math.PI / 180);
        }

        //元の位置に平行移動
        for (var i in a) {
            a[i].X += (this.x + this.width / 2);
            a[i].Y += (this.y + this.height / 2);
        }
        for (var i in b) {
            b[i].X += (other.x + other.width / 2);
            b[i].Y += (other.y + other.height / 2);
        }

        //それぞれの線分で交差判定
        for (var i = 0; i < a.length-1; i++) for (var j = 0; j < b.length-1; j++) {
            var penetrate1 = (a[i + 1].X - a[i].X) * (b[    j].Y - a[i].Y) - (a[i + 1].Y - a[i].Y) * (b[    j].X - a[i].X);
            var penetrate2 = (a[i + 1].X - a[i].X) * (b[j + 1].Y - a[i].Y) - (a[i + 1].Y - a[i].Y) * (b[j + 1].X - a[i].X);
            var penetrate3 = (b[j + 1].X - b[j].X) * (a[    i].Y - b[j].Y) - (b[j + 1].Y - b[j].Y) * (a[    i].X - b[j].X);
            var penetrate4 = (b[j + 1].X - b[j].X) * (a[i + 1].Y - b[j].Y) - (b[j + 1].Y - b[j].Y) * (a[i + 1].X - b[j].X);
            if (penetrate1 * penetrate2 < 0 && penetrate3 * penetrate4 < 0)
                return true;
        }
        return false;
    }
});

var BallImage = Class.create(Surface, {
    initialize: function() {
        Surface.call(this, C.BALL.WIDTH, C.BALL.HEIGHT);
        this.context.beginPath();
        this.context.arc(this.width/2, this.height/2, 4, 0, Math.PI*2, false);
        this.context.fillStyle = C.BALL.COLOR;
        this.context.fill();
    }
});

var SideWall = Class.create(Sprite, {
    degrees: 0,
    initialize: function() {
        Sprite.call(this, C.SIDE_WALL.WIDTH, C.SIDE_WALL.HEIGHT);
        this.image = new SideWallImage();
        this.rotate( this.degrees );
        this.moveTo(this.x, this.y);
    },
    radian: function() {
        return this.degrees * (Math.PI / 180);
    },
    normal_vector: function() {
        var base = { x: -1, y: 0 };
        return {
            x: base.x * Math.cos(this.radian()) - base.y * Math.sin(this.radian()),
            y: base.x * Math.sin(this.radian()) + base.y * Math.cos(this.radian())
        };
    }
});

var LeftSideWall = Class.create(SideWall, {
    degrees : 135,
    x       : 45,
    y       : 150
});

var RightSideWall = Class.create(SideWall, {
    degrees : 45,
    x       : 265,
    y       : 150
});

var SideWallImage = Class.create(Surface, {
    initialize: function() {
        Surface.call(this, C.SIDE_WALL.WIDTH, C.SIDE_WALL.HEIGHT);
        this.context.beginPath();
        this.context.fillStyle = C.SIDE_WALL.COLOR;
        this.context.fillRect(0, 0, C.SIDE_WALL.WIDTH, C.SIDE_WALL.HEIGHT);
    }
});

var Lever = Class.create(Sprite, {
    initialize: function() {
        Sprite.call(this, C.LEVER.WIDTH, C.LEVER.HEIGHT);
        this.image = new LeverImage();
    }
});

var LeftLever = Class.create(Lever, {
    initialize: function() {
        Lever.call(this);
        this.moveTo(C.LEVER.LEFT.X, C.LEVER.LEFT.Y);
    },
    on_input : false,
    hit : function() {
        this.on_input = true;
        this.moveBy(0, -C.LEVER.ADJUST);
        this.rotate( C.LEVER.LEFT.DEGREES );
    },
    stay : function() {
        this.on_input = false;
        this.moveBy(0, C.LEVER.ADJUST);
        this.rotate( -C.LEVER.LEFT.DEGREES );
    }
});

var RightLever = Class.create(Lever, {
    initialize: function() {
        Lever.call(this);
        this.moveTo(C.LEVER.RIGHT.X, C.LEVER.RIGHT.Y);
        this.scaleX *= -1;
    },
    on_input : false,
    hit : function() {
        this.on_input = true;
        this.moveBy(0, -C.LEVER.ADJUST);
        this.rotate( C.LEVER.RIGHT.DEGREES );
    },
    stay : function() {
        this.on_input = false;
        this.moveBy(0, C.LEVER.ADJUST);
        this.rotate( -C.LEVER.RIGHT.DEGREES );
    }
});

var LeverCollisionDetector = Class.create(Sprite, {
    degrees : 0,
    initialize: function() {
        Sprite.call(this, C.LEVER.WIDTH, C.LEVER.HEIGHT);
        var surface =new Surface(C.LEVER.WIDTH, C.LEVER.HEIGHT);
        surface.context.beginPath();
        surface.context.clearRect(0, 0, C.LEVER.WIDTH, 1);
        this.image = surface;
    },
    radian: function() {
        return this.degrees * (Math.PI / 180);
    },
    normal_vector: function() {
        var base = { x: 0, y: -1 };
        return {
            x: base.x * Math.cos(this.radian()) - base.y * Math.sin(this.radian()),
            y: base.x * Math.sin(this.radian()) + base.y * Math.cos(this.radian())
        };
    }
});

var LeftLeverCollisionDetector = Class.create(LeverCollisionDetector, {
    degrees : Math.atan( C.LEVER.HEIGHT/C.LEVER.WIDTH ) * ( 180/Math.PI ),
    initialize: function() {
        LeverCollisionDetector.call(this);
        this.moveTo(C.LEVER.LEFT.X, C.LEVER.LEFT.Y);
        this.rotate( this.degrees );
        this.moveBy(0, C.LEVER.HEIGHT/2);
    },
    hit : function() {
        this.moveBy(0, -C.LEVER.ADJUST);
        this.rotate( C.LEVER.LEFT.DEGREES );
        this.degrees += C.LEVER.LEFT.DEGREES;
    },
    stay : function() {
        this.moveBy(0, C.LEVER.ADJUST);
        this.rotate( -C.LEVER.LEFT.DEGREES );
        this.degrees -= C.LEVER.LEFT.DEGREES;
    }
});

var RightLeverCollisionDetector = Class.create(LeverCollisionDetector, {
    degrees : Math.atan( -C.LEVER.HEIGHT/C.LEVER.WIDTH ) * ( 180/Math.PI ),
    initialize: function() {
        LeverCollisionDetector.call(this);
        this.moveTo(C.LEVER.RIGHT.X, C.LEVER.RIGHT.Y);
        this.rotate( this.degrees );
        this.moveBy(0, C.LEVER.HEIGHT/2);
    },
    hit : function() {
        this.moveBy(0, -C.LEVER.ADJUST);
        this.rotate( C.LEVER.RIGHT.DEGREES );
        this.degrees += C.LEVER.RIGHT.DEGREES;
    },
    stay : function() {
        this.moveBy(0, C.LEVER.ADJUST);
        this.rotate( -C.LEVER.RIGHT.DEGREES );
        this.degrees -= C.LEVER.RIGHT.DEGREES;
    }
});

var LeverImage = Class.create(Surface, {
    initialize: function() {
        Surface.call(this, C.LEVER.WIDTH, C.LEVER.HEIGHT);
        this.context.beginPath();
        this.context.moveTo(0, 0);
        this.context.lineTo(0, C.LEVER.HEIGHT);
        this.context.lineTo(C.LEVER.WIDTH, C.LEVER.HEIGHT);
        this.context.fillStyle = C.LEVER.COLOR;
        this.context.fill();
    }
});

var Handle = Class.create(Sprite, {
    initialize: function() {
        Sprite.call(this, C.HANDLE.WIDTH, C.HANDLE.HEIGHT);
        this.image = new HandleImage();
        this.moveTo(C.HANDLE.LEFT.X, C.HANDLE.LEFT.Y);
    }
});

var LeftHandle = Class.create(Handle, {
    initialize: function() {
        Handle.call(this);
        this.scaleX *= -1;
        this.moveTo(C.HANDLE.LEFT.X, C.HANDLE.LEFT.Y);
    }
});

var RightHandle = Class.create(Handle, {
    initialize: function() {
        Handle.call(this);
        this.moveTo(C.HANDLE.RIGHT.X, C.HANDLE.RIGHT.Y);
    }
});

var HandleImage = Class.create(Surface, {
    initialize: function() {
        Surface.call(this, C.HANDLE.WIDTH, C.HANDLE.HEIGHT);
        this.context.beginPath();
        this.context.moveTo(0, 0);
        this.context.lineTo(0, C.HANDLE.HEIGHT);
        this.context.lineTo(C.HANDLE.WIDTH, C.HANDLE.HEIGHT);
        this.context.fillStyle = C.HANDLE.COLOR;
        this.context.fill();
    }
});

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

