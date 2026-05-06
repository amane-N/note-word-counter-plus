// note Word Counter+ - コンテンツスクリプト エントリーポイント
// note.com のページに読み込まれ、ウィジェットを起動する
// ※ widget.js が先に評価されているため window.NWCWidget が使用可能

(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // 定数
  // -----------------------------------------------------------------------

  /** 執筆領域を探すセレクタ（優先順位順） */
  var EDITOR_SELECTORS = [
    '.ProseMirror[contenteditable="true"]',
    '[contenteditable="true"][data-slate-editor="true"]',
    '[contenteditable="true"]',
    // 'article [contenteditable]' は閲覧ページの contenteditable="false" 要素に誤マッチするため削除
  ];

  /**
   * 閲覧本文を探すセレクタ（優先順位順）
   * note.com 記事閲覧ページ (/{user}/n/{id}) 向け
   */
  var VIEWER_SELECTORS = [
    'article .note-common-styles__textnote-body',
    'article [class*="textnote-body"]',
    'article .note-common-styles__textnote-body-wrapper',
    'article [class*="textnote"]',
    'main article',
    'article',
  ];

  /** リトライ間隔 (ms) */
  var RETRY_INTERVAL = 500;

  /** リトライ最大回数 (500ms × 10 = 5秒) */
  var RETRY_MAX = 10;

  /** MutationObserver debounce 待機時間 (ms) */
  var DEBOUNCE_MS = 200;

  // -----------------------------------------------------------------------
  // 内部状態
  // -----------------------------------------------------------------------

  /**
   * 現在のモード
   * 'editor'  : 執筆モード（editor.note.com など）
   * 'viewer'  : 閲覧モード（note.com/{user}/n/{id}）
   * 'waiting' : 検出待ち・失敗
   */
  var currentMode = 'waiting';

  /** 現在監視中のエディタノード */
  var currentEditorNode = null;

  /** エディタ監視用 MutationObserver */
  var editorObserver = null;

  /** SPA ルーティング監視用 MutationObserver */
  var routingObserver = null;

  /** リトライ用 setInterval ID */
  var retryTimer = null;

  /** リトライ残回数 */
  var retryCount = 0;

  /** debounce 用タイマー ID */
  var debounceTimer = null;

  // -----------------------------------------------------------------------
  // 執筆領域検出
  // -----------------------------------------------------------------------

  /**
   * 執筆領域の DOM ノードを返す。
   * EDITOR_SELECTORS を順に試し、最初にヒットした要素を返す。
   * どれも見つからない場合は「文字数が最大の contenteditable 要素」を返す。
   * 何もなければ null を返す。
   *
   * @returns {Element|null}
   */
  function detectEditor() {
    // 優先セレクタを順に試す
    for (var i = 0; i < EDITOR_SELECTORS.length; i++) {
      var sel = EDITOR_SELECTORS[i];
      var el = document.querySelector(sel);
      if (el) {
        console.log('[NWC] 執筆領域検出成功 セレクタ:', sel, el);
        return el;
      }
    }

    // フォールバック: 文字数が最大の contenteditable="true" 要素
    // contenteditable="false" な figure 等への誤マッチを防ぐため true のみに限定する
    var allEditable = document.querySelectorAll('[contenteditable="true"]');
    if (allEditable.length === 0) {
      return null;
    }

    var best = null;
    var bestLen = -1;
    for (var j = 0; j < allEditable.length; j++) {
      var node = allEditable[j];
      var len = (node.innerText || '').length;
      if (len > bestLen) {
        bestLen = len;
        best = node;
      }
    }

    if (best) {
      console.log('[NWC] 執筆領域検出成功 フォールバック(最大文字数 contenteditable):', best);
    }
    return best;
  }

  // -----------------------------------------------------------------------
  // 閲覧本文検出
  // -----------------------------------------------------------------------

  /**
   * 記事閲覧ページの本文 DOM ノードを返す。
   * VIEWER_SELECTORS を順に試し、最初にヒットした要素を返す。
   * VIEWER_SELECTORS の末尾は article 要素そのもの（最大文字数フォールバック）。
   * 何もなければ null を返す。
   *
   * @returns {Element|null}
   */
  function detectViewer() {
    // 優先セレクタを順に試す（末尾の 'article' 以外）
    for (var i = 0; i < VIEWER_SELECTORS.length - 1; i++) {
      var sel = VIEWER_SELECTORS[i];
      var el = document.querySelector(sel);
      if (el && (el.innerText || '').trim().length > 0) {
        console.log('[NWC] 閲覧本文検出成功 セレクタ:', sel);
        return el;
      }
    }

    // フォールバック: article 要素内で文字数が最大のブロック要素
    var articles = document.querySelectorAll('article');
    if (articles.length > 0) {
      // 最も文字数が多い article 直下のブロック or article 自身を返す
      var bestArticle = null;
      var bestLen = -1;
      for (var j = 0; j < articles.length; j++) {
        var art = articles[j];
        var len = (art.innerText || '').trim().length;
        if (len > bestLen) {
          bestLen = len;
          bestArticle = art;
        }
      }
      if (bestArticle && bestLen > 0) {
        console.log('[NWC] 閲覧本文検出成功 セレクタ: article (フォールバック)');
        return bestArticle;
      }
    }

    return null;
  }

  // -----------------------------------------------------------------------
  // テキスト取得
  // -----------------------------------------------------------------------

  /**
   * エディタノードから純粋なテキストを取得する。
   *
   * @param {Element} editorNode
   * @returns {string}
   */
  function getEditorText(editorNode) {
    if (!editorNode) {
      return '';
    }
    return editorNode.innerText || '';
  }

  // -----------------------------------------------------------------------
  // 文字数カウント
  // -----------------------------------------------------------------------

  /**
   * テキストから純粋な文字数を計算して返す。
   * - 先頭・末尾の空白を trim する
   * - 改行文字は文字数にカウントしない（改行だけでは文字数が増えない）
   * - 空白文字（スペース・タブ）のみの行は文字数にカウントしない
   *
   * @param {string} text
   * @returns {number}
   */
  function countCharacters(text) {
    if (!text) {
      return 0;
    }
    // 改行で行に分割し、各行から改行文字を除いた文字を数える
    // trim() で先頭・末尾の空白除去後に空文字になる行はスキップ（空白のみ行を除外）
    var lines = text.split('\n');
    var total = 0;
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // 空白・タブのみの行は文字数 0（改行や空白だけでは文字数が増えない）
      if (line.trim().length === 0) {
        continue;
      }
      // 改行文字は除いて文字数をカウント（行内の空白は本文の一部としてカウント）
      total += line.length;
    }
    return total;
  }

  /**
   * 文字数から読了時間（分）を計算して返す。
   * 400字/分換算で切り上げ。0字の場合は 0 を返す。
   *
   * @param {number} charCount
   * @returns {number}
   */
  function calculateReadingTime(charCount) {
    if (charCount <= 0) {
      return 0;
    }
    return Math.ceil(charCount / 400);
  }

  // -----------------------------------------------------------------------
  // 構造カウント（Sprint 5）
  // -----------------------------------------------------------------------

  /**
   * エディタノード内の H2 / H3 見出しの個数を返す。
   * 執筆モード: ProseMirror は h2/h3 タグを直接使用する。
   * 閲覧モード: 記事本文コンテナ内の h2/h3 タグを数える。
   *
   * 閲覧ページでは note.com の目次ウィジェット（.o-tableOfContents）が
   * 本文コンテナ内に埋め込まれており、その中の h2（「目次」ラベル）が
   * 本文見出しとして余分にカウントされる問題を除外する。
   *
   * @param {Element} editorNode
   * @returns {{ h2: number, h3: number }}
   */
  function countHeadings(editorNode) {
    if (!editorNode) {
      return { h2: 0, h3: 0 };
    }
    var h2Els = editorNode.querySelectorAll('h2');
    var h3Els = editorNode.querySelectorAll('h3');

    // 目次ウィジェット内の見出しを除外するフィルター
    // note.com の .o-tableOfContents 要素は本文コンテナ内に存在するが、
    // ユーザーが書いた見出しではないため除外する
    function isInToc(el) {
      return !!el.closest('[class*="tableOfContents"]');
    }

    var h2Count = 0;
    for (var i = 0; i < h2Els.length; i++) {
      if (!isInToc(h2Els[i])) {
        h2Count++;
      }
    }

    var h3Count = 0;
    for (var j = 0; j < h3Els.length; j++) {
      if (!isInToc(h3Els[j])) {
        h3Count++;
      }
    }

    return {
      h2: h2Count,
      h3: h3Count,
    };
  }

  /**
   * エディタノード内の段落（p タグ）の個数を返す。
   * 空の p タグ（改行のみ）は含まない。
   *
   * @param {Element} editorNode
   * @returns {number}
   */
  function countParagraphs(editorNode) {
    if (!editorNode) {
      return 0;
    }
    var pEls = editorNode.querySelectorAll('p');
    var count = 0;
    for (var i = 0; i < pEls.length; i++) {
      // innerText が空文字（改行のみ・空白のみ）は段落としてカウントしない
      if ((pEls[i].innerText || '').trim().length > 0) {
        count++;
      }
    }
    return count;
  }

  /**
   * テキスト中のハッシュタグ（#から始まり空白・#以外で続く）の個数を返す。
   *
   * @param {string} text
   * @returns {number}
   */
  function countHashtags(text) {
    if (!text) {
      return 0;
    }
    var matches = text.match(/#[^\s#]+/g);
    return matches ? matches.length : 0;
  }

  /**
   * エディタノード内の画像（img タグ）の個数を返す。
   * figure 内に埋め込まれた img も含む。
   *
   * @param {Element} editorNode
   * @returns {number}
   */
  function countImages(editorNode) {
    if (!editorNode) {
      return 0;
    }
    return editorNode.querySelectorAll('img').length;
  }

  /**
   * テキストから文字数・読了時間を計算し、
   * エディタノードから構造カウントを取得してウィジェットを更新する。
   * editorNode が null の場合は構造カウントを 0 にする。
   *
   * @param {string} text
   * @param {Element|null} [editorNode]
   */
  function updateWidgetWithText(text, editorNode) {
    var chars = countCharacters(text);
    var readMinutes = calculateReadingTime(chars);

    // 構造カウント（Sprint 5）
    var node = editorNode || null;
    var headings = countHeadings(node);
    var paragraphs = countParagraphs(node);
    var hashtags = countHashtags(text);
    var images = countImages(node);

    if (window.NWCWidget && typeof window.NWCWidget.updateStats === 'function') {
      window.NWCWidget.updateStats({
        chars: chars,
        readMinutes: readMinutes,
        h2: headings.h2,
        h3: headings.h3,
        paragraphs: paragraphs,
        hashtags: hashtags,
        images: images,
      });
    }
  }

  // -----------------------------------------------------------------------
  // MutationObserver によるエディタ監視
  // -----------------------------------------------------------------------

  /**
   * エディタノードの変更を MutationObserver で監視する。
   * コールバックは 200ms debounce される。
   *
   * @param {Element} editorNode
   * @param {function(string, Element):void} callback  テキストとノードを引数に取るコールバック
   */
  function observeEditor(editorNode, callback) {
    // 既存オブザーバーがあれば切断
    if (editorObserver) {
      editorObserver.disconnect();
      editorObserver = null;
    }

    editorObserver = new MutationObserver(function () {
      // debounce
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(function () {
        debounceTimer = null;
        callback(getEditorText(editorNode), editorNode);
      }, DEBOUNCE_MS);
    });

    editorObserver.observe(editorNode, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  // -----------------------------------------------------------------------
  // 待機表示
  // -----------------------------------------------------------------------

  /**
   * 執筆領域が見つからない場合にウィジェットへ待機状態を表示する。
   */
  function showWaitingState() {
    currentMode = 'waiting';
    if (window.NWCWidget && typeof window.NWCWidget.setStatus === 'function') {
      window.NWCWidget.setStatus('waiting');
    }
    // setStatus が未実装のスプリントでも文字数 0 表示にしておく
    // 構造カウント（h2/h3/paragraphs/hashtags）も明示的に 0 を渡す。
    // updateStats は Object.assign でマージするため、省略すると前ページの値が残る。
    if (window.NWCWidget && typeof window.NWCWidget.updateStats === 'function') {
      window.NWCWidget.updateStats({
        chars: 0,
        readMinutes: 0,
        h2: 0,
        h3: 0,
        paragraphs: 0,
        hashtags: 0,
        images: 0,
      });
    }
  }

  // -----------------------------------------------------------------------
  // リトライ管理
  // -----------------------------------------------------------------------

  /**
   * リトライタイマーを停止する。
   */
  function stopRetry() {
    if (retryTimer !== null) {
      clearInterval(retryTimer);
      retryTimer = null;
    }
    retryCount = 0;
  }

  /**
   * エディタを検出して監視を開始する。
   * 見つからない場合は閲覧本文を検出する。
   * どちらも失敗した場合は retryTimer を設定してリトライする。
   */
  function startDetection() {
    // 既存の監視をリセット
    if (editorObserver) {
      editorObserver.disconnect();
      editorObserver = null;
    }
    currentEditorNode = null;
    currentMode = 'waiting';
    stopRetry();

    // まず執筆領域を検出する
    var editorNode = detectEditor();
    if (editorNode) {
      currentMode = 'editor';
      currentEditorNode = editorNode;
      // 初回テキストを即座に反映（ノード参照も渡して構造カウントを取得）
      updateWidgetWithText(getEditorText(editorNode), editorNode);
      // 変更監視開始
      observeEditor(editorNode, updateWidgetWithText);
      return;
    }

    // 執筆領域がなければ閲覧本文を検出する
    var viewerNode = detectViewer();
    if (viewerNode) {
      currentMode = 'viewer';
      currentEditorNode = viewerNode;
      // 初回テキストを即座に反映（ノード参照も渡して構造カウントを取得）
      updateWidgetWithText(getEditorText(viewerNode), viewerNode);
      // SPA 遷移で React が同じ article 要素を再利用してコンテンツを差し替える
      // ケースに備え、閲覧モードでも MutationObserver で監視する
      observeEditor(viewerNode, updateWidgetWithText);
      return;
    }

    // 見つからない場合: 待機表示 + リトライ開始
    showWaitingState();
    retryCount = 0;

    retryTimer = setInterval(function () {
      retryCount++;

      // 執筆領域を優先して再検出
      var foundEditor = detectEditor();
      if (foundEditor) {
        stopRetry();
        currentMode = 'editor';
        currentEditorNode = foundEditor;
        updateWidgetWithText(getEditorText(foundEditor), foundEditor);
        observeEditor(foundEditor, updateWidgetWithText);
        return;
      }

      // 閲覧本文を再検出
      var foundViewer = detectViewer();
      if (foundViewer) {
        stopRetry();
        currentMode = 'viewer';
        currentEditorNode = foundViewer;
        updateWidgetWithText(getEditorText(foundViewer), foundViewer);
        observeEditor(foundViewer, updateWidgetWithText);
        return;
      }

      if (retryCount >= RETRY_MAX) {
        stopRetry();
        // 執筆/閲覧領域が無いページ（TOPなど）では正常な状態。
        // Chrome 拡張機能管理ページは console.warn をエラー扱いするため info を使う。
        console.info('[NWC] 対象領域が見つかりませんでした（5秒タイムアウト、待機状態に移行）');
        // ウィジェットには待機表示を維持
        showWaitingState();
      }
    }, RETRY_INTERVAL);
  }

  // -----------------------------------------------------------------------
  // SPA ルーティング対応
  // -----------------------------------------------------------------------

  /**
   * ページ URL の変更を検知するため body に MutationObserver をかける。
   * note.com は SPA であり、editor.note.com は ProseMirror ベースのエディタ。
   * content_scripts に editor.note.com を追加したため、各ページロード時に
   * このスクリプトが新たに初期化される。同一ページ内での遷移（下書き保存→
   * 別記事編集など）は History API ラップと body MutationObserver で検知する。
   * 閲覧モード時は SPA 遷移で別記事へ移動した場合も再検出が動作する。
   */
  function watchRouting() {
    var lastHref = location.href;

    // -- History API ラップ --
    function onNavigation() {
      if (location.href !== lastHref) {
        lastHref = location.href;
        console.log('[NWC] ページ遷移検知:', lastHref);
        // 古い記事のカウントが残らないよう即座に 0字 にリセット
        // (React が同じ article 要素を再利用してコンテンツを差し替えるケース対応)
        if (editorObserver) {
          editorObserver.disconnect();
          editorObserver = null;
        }
        currentEditorNode = null;
        showWaitingState();
        // SPA 描画を待ってから再検出
        setTimeout(startDetection, 300);
      }
    }

    // -- 安全網: location.href の変化を一定間隔でポーリング --
    // pushState/replaceState/popstate を経由しない遷移にも対応する
    setInterval(onNavigation, 500);

    var origPush = history.pushState;
    history.pushState = function () {
      origPush.apply(history, arguments);
      onNavigation();
    };

    var origReplace = history.replaceState;
    history.replaceState = function () {
      origReplace.apply(history, arguments);
      onNavigation();
    };

    window.addEventListener('popstate', onNavigation);

    // -- body DOM 変化監視（React アンマウント→マウントを検知） --
    if (routingObserver) {
      routingObserver.disconnect();
    }

    routingObserver = new MutationObserver(function () {
      // 監視中のノードが DOM から消えた場合は再検出
      // 執筆モード・閲覧モードどちらでも対応
      if (currentEditorNode && !document.contains(currentEditorNode)) {
        console.log('[NWC] 監視ノードが DOM から消えました（モード: ' + currentMode + '）。再検出を開始します');
        startDetection();
      }
    });

    routingObserver.observe(document.body, {
      childList: true,
      subtree: false, // body 直下の変更だけ見れば十分
    });
  }

  // -----------------------------------------------------------------------
  // ウィジェット初期化
  // -----------------------------------------------------------------------

  /**
   * ウィジェットを初期化する。
   * widget.js で定義された window.NWCWidget.createWidget() を呼び出す。
   */
  function initWidget() {
    window.NWCWidget.createWidget();
    console.log('[NWC] note Word Counter+ loaded');
  }

  // -----------------------------------------------------------------------
  // エントリーポイント
  // -----------------------------------------------------------------------

  function main() {
    initWidget();
    watchRouting();
    startDetection();
  }

  // DOMContentLoaded 済みならすぐ実行、そうでなければイベント待ち
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})();
