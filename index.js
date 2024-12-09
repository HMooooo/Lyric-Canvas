//TextAlive App APIのキー
const APP_TOKEN = "[your APIkey]";

//曲のURL
let songUrl = "https://piapro.jp/t/hZ35/20240130103028";
//音楽地図訂正履歴
let beatId = 4592293;
let ChirdId = 2727635;
let repetitivesegmentId = 2824326;
//歌詞タイミング訂正履歴
let lyricId = 59415;
let lyricDiffId = 13962;

//次のフレーズを取得するために使う変数
let nowPosition = 0;
let nextText = '';
let nextNextText = '';
let beforeNextText = '';
let beforeNextNextText = '';

//文字の初期カラー
const DEFAULTCOLOR = '#ffffff';

//フォント設定
let fontFamily = 'Dela Gothic One';
let fontWeight = 400;
let fontStyle = 'nomal';

//アニメーションの設定
let animationName = 'anime';
let animationDuration = '3s';
let backgroundName = 'box';

//マウス座標を記録するためのグローバル変数
let mouseX = 0;
let mouseY = 0;

let beforeWord = ''; //前回取得した単語を記録しておく
let beforeText = "";  //前回表示した歌詞を記録しておく
let beforeBeat = 0;  //前回取得したビート値を保存する
let boxSize = 0;  //背景の正方形のサイズを入れる

//DOM要素取得
let playBtn = document.querySelector("#play");
let pauseBtn = document.querySelector("#pause");
const rewindBtn = document.querySelector("#rewind");
const positionEl = document.querySelector("#position strong");
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");
const canvas = document.getElementById('canvas1');
const musicVideoBackground = document.getElementById('musicVideoBackground');
const nextWordSpace = document.getElementById("nextWord");
const nextNextWordSpace = document.getElementById("nextNextWord");

// マウスの最後の位置を記録するための変数
let lastX = null;
let lastY = null;
let lines = [];

// 背景用
const boxes = []; //各boxの情報を格納する配列
const numBoxes = 10; // boxの数
const duration = 1500; // ★アニメーションの継続時間（ミリ秒）
let sizeOfBackgroundWidth = document.getElementById('backGroundSpace').clientWidth;
let sizeOfBackgroundHeight = document.getElementById('backGroundSpace').clientHeight;
const ctx = canvas.getContext('2d'); // 2D描画コンテキストの取得
let musicStatus = 'stop';
let flag = true;


// 単語が発声されていたら画面に表示する
const animateWord = function (now, unit) {
    if (unit.contains(now)) {
        //前回の文字と違う文字を取得した場合のみ表示する
        if (beforeText != unit.text) {
            //textDisplaySpaceの子要素にspanタグを追加して文字を表示
            textDisplaySpace = document.querySelector("#textDisplaySpace");
            writeText = document.createElement('span');
            writeText.classList.add('text');
            //フォントの設定を反映する
            writeText.style.fontFamily = fontFamily;
            writeText.style.fontWeight = fontWeight;
            writeText.style.fontStyle = fontStyle;
            writeText.style.animationDuration = animationDuration;
            nowPosition = unit.startTime;
            let word = player.video.findWord(nowPosition);
            let language = word.language;
            if (language == 'en' && word.text != beforeWord) {
                writeText.textContent = word.text;
                beforeWord = word.text;
            } else if (word.text == 'ここ' && word.text != beforeWord) {
                writeText.textContent = word.text;
                beforeWord = word.text;
            }
            else if (language != 'en') {
                writeText.textContent = unit.text;
                beforeWord = '';
            }
            // writeText.textContent = unit.text;
            //マウスの座標に文字を表示する
            writeText.style.marginLeft = mouseX + 'px';
            writeText.style.paddingTop = mouseY + 'px';
            //アニメーションの設定を反映する
            writeText.style.animationName = animationName;
            // writeTExt.style.animationDuration = '3s';
            textDisplaySpace.appendChild(writeText);
        }
        //次回の文字と比べるために保存しておく
        beforeText = unit.text;

        //次のフレーズを取得して表示する
        nowPosition = unit.startTime;
        nextText = player.video.findPhrase(nowPosition).next.text;
        nextNextText = player.video.findPhrase(nowPosition).next.next.text;
        if (nextText != beforeNextText) {
            nextWordSpace.textContent = nextText;
            nextNextWordSpace.textContent = nextNextText;
            beforeNextText = nextText;
        }
    }
};

// TextAlive Player を作る
const player = new Player({
    app: {
        token: APP_TOKEN, //自分のアプリトークン
    },
    mediaElement: document.querySelector("#media"),
});

// TextAlive Player のイベントリスナを登録する
player.addListener({
    onAppReady,
    onVideoReady,
    onTimerReady,
    onThrottledTimeUpdate,
    onPlay,
    onPause,
    onStop,
    onTimeUpdate,
});

//マウス座標取得
canvas.addEventListener('mousemove', function (m) {
    var rect = m.target.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    var mx = Math.round(m.clientX - rect.left);
    var my = Math.round(m.clientY - rect.top);
    //文字の表示のため座標を微調整
    mouseX = mx - 6;
    mouseY = my - 13;
});


/**
 * TextAlive App が初期化されたときに呼ばれる
 *
 * @param {IPlayerApp} app - https://developer.textalive.jp/packages/textalive-app-api/interfaces/iplayerapp.html
 */
function onAppReady(app) {
    // TextAlive ホストと接続されていなければ再生コントロールを表示する
    if (!app.managed) {
        // 再生ボタン
        playBtn.addEventListener(
            "click",
            () =>
                player.video && player.requestPlay(),
            flag = false
        );
    }
    //曲を読み込む
    if (!app.songUrl) {
        player.createFromSongUrl(songUrl), {
            video: {
                beatId: beatId,
                ChirdId: ChirdId,
                repetitivesegmentId: repetitivesegmentId,
                lyricId: lyricId,
                lyricDiffId: lyricDiffId
            }
        };
    }
}

/**
 * 動画オブジェクトの準備が整ったとき（楽曲に関する情報を読み込み終わったとき）に呼ばれる
 *
 * @param {IVideo} v - https://developer.textalive.jp/packages/textalive-app-api/interfaces/ivideo.html
 */
function onVideoReady(v) {
    // 定期的に呼ばれる各単語の "animate" 関数をセットする
    let w = player.video.firstChar;
    while (w) {
        w.animate = animateWord;
        w = w.next;
    }


}

/**
 * 音源の再生準備が完了した時に呼ばれる
 *
 * @param {Timer} t - https://developer.textalive.jp/packages/textalive-app-api/interfaces/timer.html
 */
function onTimerReady(t) {
    // ボタンを有効化する
    if (!player.app.managed) {
        document
            .querySelectorAll("button")
            .forEach((btn) => (btn.disabled = false));
    }

    // 楽曲情報を表示
    document.querySelector("#musicName").textContent = player.data.song.name;
    document.querySelector("#songWriter").textContent = player.data.song.artist.name;
}

/**
 * 動画の再生位置が変更されたときに呼ばれる（あまりに頻繁な発火を防ぐため一定間隔に間引かれる）
 *
 * @param {number} position - https://developer.textalive.jp/packages/textalive-app-api/interfaces/playereventlistener.html#onthrottledtimeupdate
 */
function onThrottledTimeUpdate(position) {
    //処理なし
}

// 再生が始まったら #overlay を非表示に
function onPlay() {
    flag = true;
    playBtn.id = "pause";
    pauseBtn = document.querySelector("#pause");
    pauseBtn.addEventListener(
        "click",
        () => player.video && player.requestPause()
    );
    pauseBtn.class = "material-icons-sharp";
    pauseBtn.textContent = "pause";
    musicStatus = 'play';
}

// 再生が一時停止・停止したら歌詞表示をリセット
function onPause() {
    flag = false;
    pauseBtn.id = "play";
    playBtn = document.querySelector("#play");
    playBtn.addEventListener(
        "click",
        () => player.video && player.requestPlay()
    );
    playBtn.class = "material-icons-outlined";
    playBtn.textContent = "play_arrow";
    musicStatus = 'stop';
}
function onStop() {
    document.querySelector("#text").textContent = "-";
}
function onTimeUpdate(position) {
    // シークバーの表示を更新
    paintedSeekbar.style.width = `${parseInt((position * 1000) / player.video.duration) / 10}%`;


    let beat = player.findBeat(position);
    // console.log(beat);
    if (beat !== beforeBeat) {
        if (beat) {
            requestAnimationFrame(() => {
                boxSize = 100;

            });
        }
    }
    // console.log(boxSize);
    beforeBeat = beat;
}

/* シークバー */
seekbar.addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestMediaSeek(
            (player.video.duration * e.offsetX) / seekbar.clientWidth
        );
    }
    return false;
});

//背景
let backgroundColor = 0; // 初期背景色
const backgroundColorPicker = document.getElementById("background-color-picker");
backgroundColorPicker.value = backgroundColor; // カラーピッカーの初期値を設定

let boxsSketch = function (p) {

    p.setup = function () {
        const myCanvas = p.createCanvas(p.sizeOfBackgroundWidth, p.sizeOfBackgroundHeight, p.WEBGL);
        myCanvas.parent("backGroundSpace");
        // frameRate(60); // ★

        p.strokeWeight(3);
        for (let i = 0; i < numBoxes; i++) {
            // 各ボックスの初期位置・回転角度・移動距離・色をランダムに設定
            //　＋　★サイズ・アニメーションタイムを初期化
            boxes.push({
                x: p.random(-sizeOfBackgroundWidth / 2, sizeOfBackgroundWidth / 2), //x座標
                y: p.random(-sizeOfBackgroundHeight / 2, sizeOfBackgroundHeight / 2), //y座標
                z: p.random(-sizeOfBackgroundWidth / 2, sizeOfBackgroundWidth / 2), //z座標
                angleX: p.random(p.TWO_PI), //回転角度(x軸)
                angleY: p.random(p.TWO_PI), //回転角度(y軸)
                dx: p.random(0, 0.1), //移動距離(x軸)
                dy: p.random(0, 0.1), //移動距離(y軸)
                dz: p.random(0, 0.1), //移動距離(z軸)
                color: [p.random(255), p.random(255), p.random(255)], // 色
                size: 100, // ★初期サイズを100に設定
                animationTime: 0 // ★アニメーションタイムを初期化
            });
        }
        // x: p.random(-p.width / 2, p.width / 2), //x座標
        // y: p.random(-p.height / 2, p.height / 2), //y座標
        // z: p.random(-p.width / 2, p.width / 2), //z座標

    }

    //     // ページ読み込み時に初期背景色を設定
    // window.addEventListener("load", () => {
    //     background(backgroundColor);
    // });

    // カラーピッカーの値が変更されたときに色を更新
    backgroundColorPicker.addEventListener("input", function () {
        backgroundColor = backgroundColorPicker.value;
        background(backgroundColor);
    });

    p.draw = function () {
        p.background(backgroundColor);
        for (let i = 0; i < boxes.length; i++) {
            const boxObj = boxes[i];


            p.push(); // 現在の座標系を保存

            //　色設定
            p.noFill();
            p.stroke(boxObj.color[0], boxObj.color[1], boxObj.color[2]);

            // 自転処理
            boxObj.angleX += 0.01;
            boxObj.angleY += 0.01;
            p.rotateX(boxObj.angleX);
            p.rotateY(boxObj.angleY);

            // box座標を更新
            boxObj.x += boxObj.dx;
            boxObj.y += boxObj.dy;
            boxObj.z += boxObj.dz;


            // Canvas の範囲外に出たら再びCanvas内へランダムな位置をリセット
            if (p.abs(boxObj.x) > p.width / 2 || p.abs(boxObj.y) > p.height / 2 || p.abs(boxObj.z) > p.width / 2) {
                boxObj.x = p.random(-p.width / 2, p.width / 2);
                boxObj.y = p.random(-p.height / 2, p.height / 2);
                boxObj.z = p.random(-p.width / 2, p.width / 2);
                // boxObj.size = random(30, 100); // サイズもリセット

            }

            // ★アニメーションの進行度を計算
            // let t = (boxObj.animationTime % duration) / duration;
            boxObj.size = boxSize;

            // 座標指定
            p.translate(boxObj.x, boxObj.y, boxObj.z);

            // ★boxの表示
            p.box(boxObj.size);


            if (boxSize >= 0) {
                boxSize -= 0.1;
            } else if (boxSize < 0) {
                boxSize = 0;
            }


            p.pop(); // 座標系を元に戻す

            // ★アニメーションタイムを更新
            // boxObj.animationTime += deltaTime;
        }

        sizeOfBackgroundWidth = document.getElementById('backGroundSpace').clientWidth;
        sizeOfBackgroundHeight = document.getElementById('backGroundSpace').clientHeight;

        //　ブラウザの大きさを変更されるたびにCanvasの大きさも調整
        p.resizeCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);

    }

}

let starsSketch = function (p) {
    let stars = [];

    p.setup = function () {
        const myCanvas = p.createCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
        myCanvas.parent("backGroundSpace");
        // for (let i = 0; i < 100; i++) {
        //     stars.push(new Star(p, p.random(sizeOfBackgroundWidth), p.random(sizeOfBackgroundHeight)));
        // }
    }

    backgroundColorPicker.addEventListener("input", function () {
        backgroundColor = backgroundColorPicker.value;
        background(backgroundColor);
    });

    p.draw = function () {
        p.background(backgroundColor);
        if (flag) {
            if (stars.length < 200) {
                stars.push(new Star(p, p.random(sizeOfBackgroundWidth), p.random(sizeOfBackgroundHeight)));
            }
            for (let i = stars.length - 1; i >= 0; i--) {
                stars[i].update();
                stars[i].display();
                if (stars[i].isFinished()) {
                    stars.splice(i, 1);
                }
            }
        }
    }

    class Star {
        constructor(p, x, y) {
            this.p = p;
            this.pos = p.createVector(x, y);
            this.vel = p.createVector(p.random(-0.5, 0.5), p.random(-0.5, 0.5));
            this.lifespan = 255;
            this.size = p.random(5, 10);
            this.color = p.color(255, 255, 255);
        }

        update() {
            this.pos.add(this.vel);
            this.lifespan -= 1;
        }

        display() {
            this.p.noStroke();
            this.p.fill(this.color, this.lifespan);
            this.p.ellipse(this.pos.x, this.pos.y, this.size);
        }

        isFinished() {
            return this.lifespan < 0;
        }
    }

    p.windowResized = function () {
        sizeOfBackgroundWidth = document.getElementById('backGroundSpace').clientWidth;
        sizeOfBackgroundHeight = document.getElementById('backGroundSpace').clientHeight;
        p.resizeCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
    }
};

let bubblesSketch = function (p) {
    let bubbles = [];

    p.setup = function () {
        const myCanvas = p.createCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
        myCanvas.parent("backGroundSpace"); for (let i = 0; i < 20; i++) {
            bubbles.push(new Bubble(p));
        }
    }

    backgroundColorPicker.addEventListener("input", function () {
        backgroundColor = backgroundColorPicker.value;
        p.background(backgroundColor);
    });


    p.draw = function () {
        p.background(backgroundColor);
        if (flag) {
            drawWaves();

            for (let bubble of bubbles) {
                bubble.move();
                bubble.display();
            }
        }
    }

    function drawWaves() {
        p.noFill();
        p.stroke(255, 150);
        p.strokeWeight(2);
        for (let y = 0; y < p.height; y += 20) {
            p.beginShape();
            for (let x = 0; x < p.width; x += 10) {
                let offset = p.sin((x * 0.02 + y * 0.02 + p.frameCount * 0.03)) * 10;
                p.vertex(x, y + offset);
            }
            p.endShape();
        }
    }

    class Bubble {
        constructor(p) {
            this.p = p;
            this.x = p.random(p.width);
            this.y = p.random(p.height);
            this.diameter = p.random(10, 30);
            this.speed = p.random(1, 3);
        }

        move() {
            this.y -= this.speed;
            if (this.y < 0) {
                this.y = p.height + this.diameter;
                this.x = p.random(p.width);
            }
        }

        display() {
            this.p.noStroke();
            this.p.fill(255, 150);
            this.p.ellipse(this.x, this.y, this.diameter);
        }
    }

    p.windowResized = function () {
        sizeOfBackgroundWidth = document.getElementById('backGroundSpace').clientWidth;
        sizeOfBackgroundHeight = document.getElementById('backGroundSpace').clientHeight;
        p.resizeCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
    }
};

let spaceSketch = function (p) {
    let stars = [];

    p.setup = function () {
        const myCanvas = p.createCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
        myCanvas.parent("backGroundSpace");
        for (let i = 0; i < 200; i++) {
            stars.push(new Star());
        }
    }

    backgroundColorPicker.addEventListener("input", function () {
        backgroundColor = backgroundColorPicker.value;
        p.background(backgroundColor);
    });

    p.draw = function () {
        p.background(backgroundColor);
        if (flag) {
            p.translate(p.width / 2, p.height / 2);
            for (let star of stars) {
                star.update();
                star.show();
            }
        }
    }

    class Star {
        constructor() {
            this.x = p.random(-p.width, p.width);
            this.y = p.random(-p.height, p.height);
            this.z = p.random(p.width);
            this.pz = this.z;
        }

        update() {
            this.z -= 10;
            if (this.z < 1) {
                this.z = p.width;
                this.x = p.random(-p.width, p.width);
                this.y = p.random(-p.height, p.height);
                this.pz = this.z;
            }
        }

        show() {
            p.fill(255);
            p.noStroke();

            let sx = p.map(this.x / this.z, 0, 1, 0, p.width);
            let sy = p.map(this.y / this.z, 0, 1, 0, p.height);

            let r = p.map(this.z, 0, p.width, 8, 0);
            p.ellipse(sx, sy, r, r);

            let px = p.map(this.x / this.pz, 0, 1, 0, p.width);
            let py = p.map(this.y / this.pz, 0, 1, 0, p.height);

            this.pz = this.z;

            p.stroke(255);
            p.line(px, py, sx, sy);
        }
    }

    p.windowResized = function () {
        sizeOfBackgroundWidth = document.getElementById('backGroundSpace').clientWidth;
        sizeOfBackgroundHeight = document.getElementById('backGroundSpace').clientHeight;
        p.resizeCanvas(sizeOfBackgroundWidth, sizeOfBackgroundHeight);
    }
};
let sketchInstance = new p5(boxsSketch);


// 色を選択
colorPicker = document.getElementById("color-picker");
colorPicker.value = DEFAULTCOLOR;


// 色を変更する関数
function changeTextColor() {
    textDisplaySpace.style.color = colorPicker.value;
}

// カラーピッカーの値が変更されたときに色を更新
colorPicker.addEventListener("input", changeTextColor);

// ページ読み込み時に初期色を設定
window.addEventListener("load", () => {
    changeTextColor();
}, false);

//フォント
const font = document.getElementsByClassName('text');

//フォントが変更されたときに設定を反映させる
const fontSelect = document.getElementById('selectFont');
fontSelect.addEventListener('change', function () {
    if (fontSelect.value == 'fonts1') {
        fontFamily = 'Dela Gothic One';
        fontWeight = 400;
        fontStyle = 'nomal';
    } else if (fontSelect.value == 'fonts2') {
        fontFamily = "DotGothic16";
    } else if (fontSelect.value == 'fonts3') {
        fontFamily = 'Rampart One';
    } else if (fontSelect.value == 'fonts4') {
        fontFamily = 'Kaisei Decol';
    } else if (fontSelect.value == 'fonts5') {
        fontFamily = 'New Tegomin';
    }
});

//アニメーションが変更されたときに設定を反映させる
const animationSelect = document.getElementById('selectAnimation');
animationSelect.addEventListener('change', function () {
    if (animationSelect.value == 'anime1') {
        animationName = 'anime';
    } else if (animationSelect.value == 'anime2') {
        animationName = "blurAnime";
    } else if (animationSelect.value == 'anime3') {
        animationName = 'slide-in';
    } else if (animationSelect.value == 'anime4') {
        animationName = 'rotateIn';
    } else if (animationSelect.value == 'anime5') {
        animationName = 'flicker';
    }
});

//アニメーションの描画時間が変更されたときに設定を反映させる
const timeSelect = document.getElementById('selectTime');
timeSelect.addEventListener('change', function () {
    if (timeSelect.value == '1s') {
        animationDuration = '1s';
    } else if (timeSelect.value == '2s') {
        animationDuration = '2s';
    } else if (timeSelect.value == '3s') {
        animationDuration = '3s';
    } else if (timeSelect.value == '4s') {
        animationDuration = '4s';
    } else if (timeSelect.value == '5s') {
        animationDuration = '5s';
    }
});

//曲が選択されたときに設定を反映させる
const musicSelect = document.getElementById('selectMusic');

musicSelect.addEventListener('change', function () {
    player.requestStop();
    paintedSeekbar.style.width = 0;
    document.querySelector("#musicName").textContent = 'Now Loading...';
    document.querySelector("#songWriter").textContent = '';
    document.querySelectorAll("button").forEach((btn) => (btn.disabled = false));
    if (musicSelect.value == '1') {
        //SUPER HERO
        songUrl = "https://piapro.jp/t/hZ35/20240130103028";
        beatId = 4592293;
        ChirdId = 2727635;
        repetitivesegmentId = 2824326;
        lyricId = 59415;
        lyricDiffId = 13962;
    } else if (musicSelect.value == '2') {
        //いつか君と話したミライは
        songUrl = "https://piapro.jp/t/--OD/20240202150903";
        beatId = 4592296;
        ChirdId = 2727636;
        repetitivesegmentId = 2824327;
        lyricId = 59416;
        lyricDiffId = 13963;
    } else if (musicSelect.value == '3') {
        //フューチャーノーツ
        songUrl = "https://piapro.jp/t/XiaI/20240201203346";
        beatId = 4592297;
        ChirdId = 2727637;
        repetitivesegmentId = 2824328;
        lyricId = 59417;
        lyricDiffId = 13964;
    } else if (musicSelect.value == '4') {
        //未来交響曲
        songUrl = "https://piapro.jp/t/Rejk/20240202164429";
        beatId = 4592298;
        ChirdId = 2727638;
        repetitivesegmentId = 2824329;
        lyricId = 59418;
        lyricDiffId = 13965;
    } else if (musicSelect.value == '5') {
        //リアリティ
        songUrl = "https://piapro.jp/t/ELIC/20240130010349";
        beatId = 4592299;
        ChirdId = 2727639;
        repetitivesegmentId = 2824330;
        lyricId = 59419;
        lyricDiffId = 13966;
    } else if (musicSelect.value == '6') {
        //The Marks
        songUrl = "https://piapro.jp/t/xEA7/20240202002556";
        beatId = 4592300;
        ChirdId = 2727640;
        repetitivesegmentId = 2824331;
        lyricId = 59420;
        lyricDiffId = 13967;
    }

    player.createFromSongUrl(songUrl), {
        video: {
            beatId: beatId,
            ChirdId: ChirdId,
            repetitivesegmentId: repetitivesegmentId,
            lyricId: lyricId,
            lyricDiffId: lyricDiffId
        }
    };

    nextWordSpace.textContent = '';
    nextNextWordSpace.textContent = '';
});

const backgroundSelect = document.getElementById('selectBackground');
backgroundSelect.addEventListener('change', function () {
    if (sketchInstance) {
        sketchInstance.remove();
    }

    if (backgroundSelect.value == '1') {
        sketchInstance = new p5(boxsSketch);
    } else if (backgroundSelect.value == '2') {
        sketchInstance = new p5(starsSketch);
    } else if (backgroundSelect.value == '3') {
        sketchInstance = new p5(bubblesSketch);
    } else if (backgroundSelect.value == '4') {
        sketchInstance = new p5(spaceSketch);
    }
});