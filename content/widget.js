// note Word Counter+ - ウィジェット UI モジュール
// IIFE で window スコープ汚染を避け、window.NWCWidget に公開する

(function () {
  'use strict';

  // ウィジェット DOM への参照（createWidget 後にセット）
  let widgetEl = null;

  // 現在の統計データ（後続スプリントで updateStats から更新される）
  let stats = {
    chars: 0,
    readMinutes: 0,
    h2: 0,
    h3: 0,
    paragraphs: 0,
    hashtags: 0,
    images: 0,
  };

  // 目標文字数（0 = 未設定）
  let targetChars = 0;

  // ストレージキー
  var STORAGE_KEY_TARGET = 'target_char_count';

  // -----------------------------------------------------------------------
  // Sprint 7: 表示設定
  // -----------------------------------------------------------------------

  var STORAGE_KEY_SETTINGS = 'settings';
  var STORAGE_KEY_SETTINGS_VERSION = 'settings_version';

  /**
   * 設定スキーマのバージョン番号。
   * デフォルト値の変更などストレージ既存値に影響する変更時にインクリメントし、
   * migrateSettings() の中で旧バージョンからの差分処理を追加する。
   * v2: デフォルト位置を 'bottom-right' → 'top-right' に変更。
   */
  var SETTINGS_VERSION = 2;

  /** デフォルト設定 */
  var DEFAULT_SETTINGS = {
    position: 'top-right',
    fontSize: 'medium',
    showChars: true,
    showReadTime: true,
    showHeadings: true,
    showParagraphs: true,
    showHashtags: true,
    showImages: true,
  };

  /** 現在の設定（ストレージから読み込む） */
  var currentSettings = Object.assign({}, DEFAULT_SETTINGS);

  /**
   * フォントサイズ設定値を CSS px 値に変換する。
   * UI 全体を視認しやすいサイズに引き上げ、small/medium/large の相対関係を保つ。
   * @param {string} size 'small'|'medium'|'large'
   * @returns {string} CSS font-size 値
   */
  function fontSizeToCss(size) {
    if (size === 'small') return '13px';
    if (size === 'large') return '17px';
    return '15px'; // medium (デフォルト)
  }

  /**
   * 位置設定値からウィジェットに適用する CSS を生成して返す。
   * @param {string} position 'bottom-right'|'bottom-left'|'top-right'|'top-left'
   */
  function applyPosition(position) {
    if (!widgetEl) return;
    // CSS 既定の right/bottom が残ると top+bottom や left+right が同時指定され
    // 要素が引き伸ばされるため、4辺すべてを明示的に設定する。
    if (position === 'bottom-left') {
      widgetEl.style.left = '20px';
      widgetEl.style.right = 'auto';
      widgetEl.style.top = 'auto';
      widgetEl.style.bottom = '20px';
    } else if (position === 'top-right') {
      // note のヘッダー（投稿ボタン等）に被らないよう top は 80px
      widgetEl.style.left = 'auto';
      widgetEl.style.right = '20px';
      widgetEl.style.top = '80px';
      widgetEl.style.bottom = 'auto';
    } else if (position === 'top-left') {
      // ヘッダー高さの目安に合わせて top-right と同じ 80px
      widgetEl.style.left = '20px';
      widgetEl.style.right = 'auto';
      widgetEl.style.top = '80px';
      widgetEl.style.bottom = 'auto';
    } else if (position === 'bottom-right') {
      widgetEl.style.left = 'auto';
      widgetEl.style.right = '20px';
      widgetEl.style.top = 'auto';
      widgetEl.style.bottom = '20px';
    } else {
      // top-right (デフォルト)
      widgetEl.style.left = 'auto';
      widgetEl.style.right = '20px';
      widgetEl.style.top = '80px';
      widgetEl.style.bottom = 'auto';
    }
  }

  /**
   * フォントサイズ設定をウィジェットに適用する。
   * @param {string} fontSize
   */
  function applyFontSize(fontSize) {
    if (!widgetEl) return;
    widgetEl.style.fontSize = fontSizeToCss(fontSize);
  }

  /**
   * 表示項目設定をウィジェットの展開ビューに反映する。
   * 展開状態のときのみ DOM 操作を行う。折りたたみ時は再構築時に反映される。
   */
  function applyVisibility() {
    if (!widgetEl) return;
    var expanded = widgetEl.querySelector('[data-nwc-view="expanded"]');
    if (!expanded) return;

    // 文字数行
    var charsRow = expanded.querySelector('[data-nwc-item-row="chars"]');
    if (charsRow) {
      charsRow.style.display = currentSettings.showChars ? '' : 'none';
    }

    // 読了時間行
    var readRow = expanded.querySelector('[data-nwc-item-row="read"]');
    if (readRow) {
      readRow.style.display = currentSettings.showReadTime ? '' : 'none';
    }

    // 見出し行
    var headingsRow = expanded.querySelector('[data-nwc-item-row="headings"]');
    if (headingsRow) {
      headingsRow.style.display = currentSettings.showHeadings ? '' : 'none';
    }

    // 段落・ハッシュタグ行（各項目を個別制御）
    var paraGroup = expanded.querySelector('[data-nwc-item-group="paragraphs"]');
    if (paraGroup) {
      paraGroup.style.display = currentSettings.showParagraphs ? '' : 'none';
    }

    var hashGroup = expanded.querySelector('[data-nwc-item-group="hashtags"]');
    if (hashGroup) {
      hashGroup.style.display = currentSettings.showHashtags ? '' : 'none';
    }

    // 画像数行
    var imagesRow = expanded.querySelector('[data-nwc-item-row="images"]');
    if (imagesRow) {
      imagesRow.style.display = currentSettings.showImages ? '' : 'none';
    }
  }

  /**
   * 設定オブジェクト全体をウィジェットに適用する。
   * @param {object} settings
   */
  function applySettings(settings) {
    currentSettings = Object.assign({}, DEFAULT_SETTINGS, settings);
    applyPosition(currentSettings.position);
    applyFontSize(currentSettings.fontSize);
    applyVisibility();
  }

  /**
   * 設定スキーマのワンタイム・マイグレーション。
   * - settings_version が SETTINGS_VERSION 未満の場合のみ実行。
   * - v1 → v2: 旧デフォルト position 'bottom-right' のまま保存されている場合のみ
   *   新デフォルト 'top-right' に置き換える。ユーザーが他の位置を明示的に選択して
   *   いた場合（'top-left' / 'bottom-left' / 'top-right'）はそのまま保持する。
   * @param {function():void} [callback]
   */
  function migrateSettings(callback) {
    try {
      chrome.storage.local.get(
        [STORAGE_KEY_SETTINGS, STORAGE_KEY_SETTINGS_VERSION],
        function (result) {
          var currentVersion = result[STORAGE_KEY_SETTINGS_VERSION] || 1;

          if (currentVersion >= SETTINGS_VERSION) {
            if (typeof callback === 'function') callback();
            return;
          }

          var stored = result[STORAGE_KEY_SETTINGS];
          var updates = {};
          updates[STORAGE_KEY_SETTINGS_VERSION] = SETTINGS_VERSION;

          // v1 → v2: 旧デフォルト 'bottom-right' を新デフォルト 'top-right' に
          if (stored && stored.position === 'bottom-right') {
            var migrated = Object.assign({}, stored, { position: 'top-right' });
            updates[STORAGE_KEY_SETTINGS] = migrated;
          }

          chrome.storage.local.set(updates, function () {
            if (typeof callback === 'function') callback();
          });
        }
      );
    } catch (e) {
      console.error('[NWCWidget] migrateSettings エラー:', e);
      if (typeof callback === 'function') callback();
    }
  }

  /**
   * ストレージから表示設定を読み込んで適用する。
   * @param {function():void} [callback]
   */
  function loadSettings(callback) {
    try {
      chrome.storage.local.get([STORAGE_KEY_SETTINGS], function (result) {
        var stored = result[STORAGE_KEY_SETTINGS];
        applySettings(Object.assign({}, DEFAULT_SETTINGS, stored || {}));
        if (typeof callback === 'function') callback();
      });
    } catch (e) {
      console.error('[NWCWidget] loadSettings エラー:', e);
      applySettings(DEFAULT_SETTINGS);
      if (typeof callback === 'function') callback();
    }
  }

  /**
   * chrome.storage.onChanged をリッスンして設定の即時反映を行う。
   */
  function watchSettings() {
    try {
      chrome.storage.onChanged.addListener(function (changes, areaName) {
        if (areaName !== 'local') return;
        if (!changes[STORAGE_KEY_SETTINGS]) return;
        var newValue = changes[STORAGE_KEY_SETTINGS].newValue;
        if (newValue) {
          applySettings(newValue);
        }
      });
    } catch (e) {
      console.error('[NWCWidget] watchSettings エラー:', e);
    }
  }

  /**
   * chrome.storage.local から目標文字数を読み込む。
   * 読み込み完了後にコールバックを呼ぶ。
   * @param {function(number):void} callback
   */
  function loadTarget(callback) {
    try {
      chrome.storage.local.get([STORAGE_KEY_TARGET], function (result) {
        var val = result[STORAGE_KEY_TARGET];
        targetChars = (typeof val === 'number' && val > 0) ? val : 0;
        if (typeof callback === 'function') {
          callback(targetChars);
        }
      });
    } catch (e) {
      console.error('[NWCWidget] loadTarget エラー:', e);
      targetChars = 0;
      if (typeof callback === 'function') {
        callback(0);
      }
    }
  }

  /**
   * chrome.storage.local から目標文字数を削除する（リセット）。
   * @param {function():void} [callback]
   */
  function removeTarget(callback) {
    try {
      chrome.storage.local.remove([STORAGE_KEY_TARGET], function () {
        targetChars = 0;
        if (typeof callback === 'function') {
          callback();
        }
      });
    } catch (e) {
      console.error('[NWCWidget] removeTarget エラー:', e);
      targetChars = 0;
      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  /**
   * chrome.storage.local に目標文字数を保存する。
   * @param {number} value
   * @param {function():void} [callback]
   */
  function saveTarget(value, callback) {
    try {
      var data = {};
      data[STORAGE_KEY_TARGET] = value;
      chrome.storage.local.set(data, function () {
        if (typeof callback === 'function') {
          callback();
        }
      });
    } catch (e) {
      console.error('[NWCWidget] saveTarget エラー:', e);
      if (typeof callback === 'function') {
        callback();
      }
    }
  }

  /**
   * 達成率(%)から進捗バーの色クラス名を返す。
   * 0〜50%  : nwc-progress-blue
   * 50〜90% : nwc-progress-orange
   * 90〜100%: nwc-progress-green
   * 100%超  : nwc-progress-purple
   * @param {number} pct
   * @returns {string}
   */
  function progressColorClass(pct) {
    if (pct > 100) {
      return 'nwc-progress-purple';
    } else if (pct >= 90) {
      return 'nwc-progress-green';
    } else if (pct >= 50) {
      return 'nwc-progress-orange';
    } else {
      return 'nwc-progress-blue';
    }
  }

  /**
   * 進捗バーセクションを構築して返す。
   * targetChars が 0 の場合は目標未設定テキストのみを返す。
   * @returns {HTMLElement}
   */
  function buildProgressSection() {
    var section = document.createElement('div');
    section.className = 'nwc-progress-section';
    section.setAttribute('data-nwc-progress-section', '');

    if (targetChars <= 0) {
      // 目標未設定状態
      var unsetLabel = document.createElement('span');
      unsetLabel.className = 'nwc-progress-unset';
      unsetLabel.textContent = '目標未設定';
      section.appendChild(unsetLabel);
      return section;
    }

    // 達成率を計算（上限なし: 100%超も表示）
    var rawPct = Math.round((stats.chars / targetChars) * 100);
    var displayPct = rawPct; // 表示用（100%超もそのまま表示）
    var barPct = Math.min(rawPct, 100); // バー幅は最大100%

    // テキスト行: 「🎯 目標: 3,000字 (94%)」
    var labelRow = document.createElement('div');
    labelRow.className = 'nwc-progress-label-row';

    var labelText = document.createElement('span');
    labelText.className = 'nwc-progress-label';
    labelText.setAttribute('data-nwc-progress-label', '');
    labelText.textContent = '🎯 目標: ' + targetChars.toLocaleString() + '字 (' + displayPct + '%)';

    labelRow.appendChild(labelText);
    section.appendChild(labelRow);

    // プログレスバー本体
    var barTrack = document.createElement('div');
    barTrack.className = 'nwc-progress-track';

    var barFill = document.createElement('div');
    barFill.className = 'nwc-progress-fill ' + progressColorClass(rawPct);
    barFill.setAttribute('data-nwc-progress-fill', '');
    barFill.style.width = barPct + '%';

    barTrack.appendChild(barFill);
    section.appendChild(barTrack);

    return section;
  }

  /**
   * 目標設定フォームを構築して返す。
   * 入力値を保存後に目標セクションを再描画する。
   * @param {HTMLElement} widget
   * @returns {HTMLElement}
   */
  function buildTargetForm(widget) {
    var form = document.createElement('div');
    form.className = 'nwc-target-form';
    form.setAttribute('data-nwc-target-form', '');

    var input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '999999';
    input.placeholder = '例: 3000';
    input.className = 'nwc-target-input';
    input.value = targetChars > 0 ? String(targetChars) : '';

    var saveBtn = document.createElement('button');
    saveBtn.className = 'nwc-target-save-btn';
    saveBtn.textContent = '設定';

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'nwc-target-cancel-btn';
    cancelBtn.textContent = 'キャンセル';

    var resetBtn = document.createElement('button');
    resetBtn.className = 'nwc-target-reset-btn';
    resetBtn.setAttribute('data-nwc-target-reset-btn', '');
    resetBtn.textContent = 'リセット';
    // 目標未設定の場合はリセットボタンを無効化
    if (targetChars <= 0) {
      resetBtn.disabled = true;
    }

    // 保存ボタン
    saveBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var val = parseInt(input.value, 10);
      if (!isNaN(val) && val > 0) {
        targetChars = val;
        saveTarget(val, function () {
          // フォームを閉じて進捗セクションを再描画
          refreshProgressSection(widget);
        });
      } else {
        input.focus();
      }
    });

    // キャンセルボタン
    cancelBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      refreshProgressSection(widget);
    });

    // リセットボタン: 目標を削除して未設定状態に戻す
    resetBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      removeTarget(function () {
        refreshProgressSection(widget);
      });
    });

    // Enter キーで保存
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        saveBtn.click();
      } else if (e.key === 'Escape') {
        cancelBtn.click();
      }
      e.stopPropagation();
    });

    // input クリックがドラッグに流れないようにする
    input.addEventListener('mousedown', function (e) {
      e.stopPropagation();
    });

    form.appendChild(input);
    form.appendChild(saveBtn);
    form.appendChild(cancelBtn);
    form.appendChild(resetBtn);
    return form;
  }

  /**
   * 展開ビュー内の進捗セクションを再描画する。
   * フォーム表示→閉じる際も使用する。
   * @param {HTMLElement} widget
   */
  function refreshProgressSection(widget) {
    // 既存のフォームを除去
    var existingForm = widget.querySelector('[data-nwc-target-form]');
    if (existingForm) {
      existingForm.parentNode.removeChild(existingForm);
    }

    // 進捗セクションを再描画
    var existingSection = widget.querySelector('[data-nwc-progress-section]');
    var expanded = widget.querySelector('[data-nwc-view="expanded"]');
    if (!expanded) {
      return;
    }

    var newSection = buildProgressSection();

    if (existingSection) {
      expanded.replaceChild(newSection, existingSection);
    } else {
      // 目標設定ボタンの前に挿入
      var targetBtn = expanded.querySelector('[data-nwc-target-btn]');
      if (targetBtn) {
        expanded.insertBefore(newSection, targetBtn);
      } else {
        expanded.appendChild(newSection);
      }
    }
  }

  /**
   * 進捗バーのラベルと幅を更新する（DOM 再構築なし）。
   * @param {HTMLElement} widget
   */
  function updateProgressDisplay(widget) {
    var section = widget.querySelector('[data-nwc-progress-section]');
    if (!section) {
      return;
    }

    if (targetChars <= 0) {
      // 未設定 → 再描画
      refreshProgressSection(widget);
      return;
    }

    var rawPct = Math.round((stats.chars / targetChars) * 100);
    var barPct = Math.min(rawPct, 100);

    var labelEl = section.querySelector('[data-nwc-progress-label]');
    if (labelEl) {
      labelEl.textContent = '🎯 目標: ' + targetChars.toLocaleString() + '字 (' + rawPct + '%)';
    } else {
      // 未設定状態から目標設定された場合は再描画
      refreshProgressSection(widget);
      return;
    }

    var fillEl = section.querySelector('[data-nwc-progress-fill]');
    if (fillEl) {
      fillEl.style.width = barPct + '%';
      // 色クラスを更新
      fillEl.className = 'nwc-progress-fill ' + progressColorClass(rawPct);
    }
  }

  // ドラッグ状態管理
  // moved: 閾値以上動いた場合に true（クリック判定の抑制に使用）
  // suppressClick: mouseup 後に発火する click を一度だけ無視するためのフラグ
  let drag = {
    active: false,
    moved: false,
    suppressClick: false,
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
  };

  /**
   * 統計表示を更新するユーティリティ。
   * 要素が存在する場合のみ textContent を書き換える。
   */
  function setFieldText(widget, selector, text) {
    const el = widget.querySelector(selector);
    if (el) {
      el.textContent = text;
    }
  }

  /**
   * 折りたたみ状態の DOM を構築して返す。
   * クリックで展開に切り替える。
   */
  function buildCollapsedView(widget) {
    // ラッパー
    const collapsed = document.createElement('div');
    collapsed.className = 'nwc-collapsed';
    collapsed.setAttribute('data-nwc-view', 'collapsed');

    // 「📝 0字」ラベル
    const label = document.createElement('span');
    label.className = 'nwc-collapsed-label';
    label.setAttribute('data-nwc-chars-collapsed', '');
    label.textContent = '📝 ' + stats.chars + '字';

    collapsed.appendChild(label);
    return collapsed;
  }

  /**
   * 展開状態の DOM を構築して返す。
   * 「⚙️ 折りたたむ」ボタンで折りたたみに切り替える。
   */
  function buildExpandedView(widget) {
    const expanded = document.createElement('div');
    expanded.className = 'nwc-expanded';
    expanded.setAttribute('data-nwc-view', 'expanded');

    // ---- 各統計行を生成するヘルパー ----
    function makeRow(iconText, labelText, valueAttr, valueText) {
      const row = document.createElement('div');
      row.className = 'nwc-row';

      const icon = document.createElement('span');
      icon.className = 'nwc-row-icon';
      icon.textContent = iconText;

      const lbl = document.createElement('span');
      lbl.className = 'nwc-row-label';
      lbl.textContent = labelText;

      const val = document.createElement('span');
      val.className = 'nwc-row-value';
      if (valueAttr) {
        val.setAttribute(valueAttr, '');
      }
      val.textContent = valueText;

      row.appendChild(icon);
      row.appendChild(lbl);
      row.appendChild(val);
      return row;
    }

    // 文字数
    const charsRow = makeRow('📝', '文字数:', 'data-nwc-chars', String(stats.chars));
    charsRow.setAttribute('data-nwc-item-row', 'chars');
    if (!currentSettings.showChars) charsRow.style.display = 'none';
    expanded.appendChild(charsRow);

    // 読了時間
    const readRow = makeRow('⏱', '読了:', 'data-nwc-read', '約' + stats.readMinutes + '分');
    readRow.setAttribute('data-nwc-item-row', 'read');
    if (!currentSettings.showReadTime) readRow.style.display = 'none';
    expanded.appendChild(readRow);

    // 区切り線
    const sep1 = document.createElement('hr');
    sep1.className = 'nwc-sep';
    expanded.appendChild(sep1);

    // H2 / H3 行（2列まとめて表示）
    const headingRow = document.createElement('div');
    headingRow.className = 'nwc-row nwc-row-dual';
    headingRow.setAttribute('data-nwc-item-row', 'headings');
    if (!currentSettings.showHeadings) headingRow.style.display = 'none';

    const h2Group = document.createElement('span');
    h2Group.className = 'nwc-dual-item';
    const h2Label = document.createElement('span');
    h2Label.className = 'nwc-row-label';
    h2Label.textContent = 'H2見出し:';
    const h2Val = document.createElement('span');
    h2Val.className = 'nwc-row-value';
    h2Val.setAttribute('data-nwc-h2', '');
    h2Val.textContent = String(stats.h2);
    h2Group.appendChild(h2Label);
    h2Group.appendChild(h2Val);

    const h3Group = document.createElement('span');
    h3Group.className = 'nwc-dual-item';
    const h3Label = document.createElement('span');
    h3Label.className = 'nwc-row-label';
    h3Label.textContent = 'H3見出し:';
    const h3Val = document.createElement('span');
    h3Val.className = 'nwc-row-value';
    h3Val.setAttribute('data-nwc-h3', '');
    h3Val.textContent = String(stats.h3);
    h3Group.appendChild(h3Label);
    h3Group.appendChild(h3Val);

    headingRow.appendChild(h2Group);
    headingRow.appendChild(h3Group);
    expanded.appendChild(headingRow);

    // 段落 / ハッシュタグ行（2列まとめて表示）
    const paraRow = document.createElement('div');
    paraRow.className = 'nwc-row nwc-row-dual';

    const paraGroup = document.createElement('span');
    paraGroup.className = 'nwc-dual-item';
    paraGroup.setAttribute('data-nwc-item-group', 'paragraphs');
    if (!currentSettings.showParagraphs) paraGroup.style.display = 'none';
    const paraLabel = document.createElement('span');
    paraLabel.className = 'nwc-row-label';
    paraLabel.textContent = '段落:';
    const paraVal = document.createElement('span');
    paraVal.className = 'nwc-row-value';
    paraVal.setAttribute('data-nwc-paragraphs', '');
    paraVal.textContent = String(stats.paragraphs);
    paraGroup.appendChild(paraLabel);
    paraGroup.appendChild(paraVal);

    const hashGroup = document.createElement('span');
    hashGroup.className = 'nwc-dual-item';
    hashGroup.setAttribute('data-nwc-item-group', 'hashtags');
    if (!currentSettings.showHashtags) hashGroup.style.display = 'none';
    const hashLabel = document.createElement('span');
    hashLabel.className = 'nwc-row-label';
    hashLabel.textContent = 'ハッシュタグ:';
    const hashVal = document.createElement('span');
    hashVal.className = 'nwc-row-value';
    hashVal.setAttribute('data-nwc-hashtags', '');
    hashVal.textContent = String(stats.hashtags);
    // 展開直後の初期描画でも正しい色を表示する（updateStats() 未呼び出し時の対策）
    if (stats.hashtags >= 6) {
      hashVal.classList.add('nwc-hashtag-warn');
    } else if (stats.hashtags >= 3) {
      hashVal.classList.add('nwc-hashtag-ok');
    }
    hashGroup.appendChild(hashLabel);
    hashGroup.appendChild(hashVal);

    paraRow.appendChild(paraGroup);
    paraRow.appendChild(hashGroup);
    expanded.appendChild(paraRow);

    // 画像数行（Sprint 7）
    const imagesRow = makeRow('🖼', '画像数:', 'data-nwc-images', String(stats.images));
    imagesRow.setAttribute('data-nwc-item-row', 'images');
    if (!currentSettings.showImages) imagesRow.style.display = 'none';
    expanded.appendChild(imagesRow);

    // 区切り線
    const sep2 = document.createElement('hr');
    sep2.className = 'nwc-sep';
    expanded.appendChild(sep2);

    // 進捗セクション（Sprint 6）
    const progressSection = buildProgressSection();
    expanded.appendChild(progressSection);

    // 「🎯 目標設定」ボタン（Sprint 6）
    const targetBtn = document.createElement('button');
    targetBtn.className = 'nwc-target-btn';
    targetBtn.setAttribute('data-nwc-target-btn', '');
    targetBtn.textContent = '🎯 目標設定';

    targetBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      // 既にフォームが開いていれば閉じる
      const existingForm = widget.querySelector('[data-nwc-target-form]');
      if (existingForm) {
        existingForm.parentNode.removeChild(existingForm);
        return;
      }
      // フォームをボタンの直前に挿入
      const form = buildTargetForm(widget);
      expanded.insertBefore(form, targetBtn);
      // input にフォーカス
      const inp = form.querySelector('.nwc-target-input');
      if (inp) {
        setTimeout(function () { inp.focus(); }, 0);
      }
    });

    expanded.appendChild(targetBtn);

    // 区切り線
    const sep3 = document.createElement('hr');
    sep3.className = 'nwc-sep';
    expanded.appendChild(sep3);

    // 「⚙️ 折りたたむ」ボタン
    const collapseBtn = document.createElement('button');
    collapseBtn.className = 'nwc-collapse-btn';
    collapseBtn.setAttribute('data-nwc-collapse-btn', '');
    collapseBtn.textContent = '⚙️ 折りたたむ';

    // ボタンクリックで折りたたみに切り替え（ドラッグ判定が不要なためここで直接）
    collapseBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      switchToCollapsed(widget);
    });

    expanded.appendChild(collapseBtn);
    return expanded;
  }

  /**
   * ウィジェットを折りたたみ表示に切り替える
   */
  function switchToCollapsed(widget) {
    // 既存の view を除去
    const old = widget.querySelector('[data-nwc-view]');
    if (old) {
      widget.removeChild(old);
    }
    widget.classList.remove('nwc-state-expanded');
    widget.classList.add('nwc-state-collapsed');

    const view = buildCollapsedView(widget);
    widget.appendChild(view);

    // 折りたたみ時は本体クリックで展開する
    // 一度だけ登録するため、古いリスナーを退避させる代わりに
    // data 属性でフラグ管理して展開ハンドラを付け替える
    widget.setAttribute('data-nwc-mode', 'collapsed');
  }

  /**
   * ウィジェットを展開表示に切り替える
   */
  function switchToExpanded(widget) {
    const old = widget.querySelector('[data-nwc-view]');
    if (old) {
      widget.removeChild(old);
    }
    widget.classList.remove('nwc-state-collapsed');
    widget.classList.add('nwc-state-expanded');

    const view = buildExpandedView(widget);
    widget.appendChild(view);

    widget.setAttribute('data-nwc-mode', 'expanded');

    // Sprint 7: 展開時に表示設定を再適用する
    applyVisibility();
  }

  /**
   * ドラッグ開始ハンドラ
   * ボタン上でのドラッグは無視する（ボタン操作を優先）
   */
  function onMouseDown(e) {
    // ボタン・入力フィールドはドラッグ対象外
    if (
      e.target.closest('.nwc-collapse-btn') ||
      e.target.closest('.nwc-target-btn') ||
      e.target.closest('.nwc-target-save-btn') ||
      e.target.closest('.nwc-target-cancel-btn') ||
      e.target.closest('.nwc-target-reset-btn') ||
      e.target.closest('.nwc-target-input')
    ) {
      return;
    }

    drag.active = true;
    drag.moved = false;
    drag.suppressClick = false;
    drag.startX = e.clientX;
    drag.startY = e.clientY;

    // 現在の left/top を取得（スタイルが未設定の場合は getBoundingClientRect から計算）
    const rect = widgetEl.getBoundingClientRect();
    drag.startLeft = rect.left;
    drag.startTop = rect.top;

    // ドラッグ開始時に right/bottom 指定を left/top に切り替える
    widgetEl.style.right = 'auto';
    widgetEl.style.bottom = 'auto';
    widgetEl.style.left = drag.startLeft + 'px';
    widgetEl.style.top = drag.startTop + 'px';

    // ドラッグ中のテキスト選択を防止
    e.preventDefault();
  }

  /**
   * ドラッグ移動ハンドラ（document に登録）
   */
  function onMouseMove(e) {
    if (!drag.active) {
      return;
    }

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;

    // 3px 以上動いたらドラッグとみなして mouseup 後の click を抑制する
    if (!drag.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      drag.moved = true;
    }

    let newLeft = drag.startLeft + dx;
    let newTop = drag.startTop + dy;

    // ビューポート外に出ないようにクランプ
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    const wW = widgetEl.offsetWidth;
    const wH = widgetEl.offsetHeight;

    newLeft = Math.max(0, Math.min(newLeft, vpW - wW));
    newTop = Math.max(0, Math.min(newTop, vpH - wH));

    widgetEl.style.left = newLeft + 'px';
    widgetEl.style.top = newTop + 'px';
  }

  /**
   * ドラッグ終了ハンドラ（document に登録）
   */
  function onMouseUp(e) {
    if (drag.active && drag.moved) {
      // mouseup 直後に同じ要素で click が発火するため、1回だけ抑制する
      drag.suppressClick = true;
    }
    drag.active = false;
  }

  /**
   * ウィジェット本体クリックハンドラ。
   * - ドラッグ直後の誤クリックは抑制
   * - ボタン・入力フィールド・目標設定フォーム上のクリックは個別ハンドラに委譲
   * - それ以外の本体クリックで折りたたみ⇄展開をトグルする
   */
  function onWidgetClick(e) {
    // ドラッグ直後の click は 1 回だけ無視する
    if (drag.suppressClick) {
      drag.suppressClick = false;
      return;
    }

    // 内部のインタラクティブ要素上のクリックは個別ハンドラに任せる
    if (
      e.target.closest('.nwc-collapse-btn') ||
      e.target.closest('.nwc-target-btn') ||
      e.target.closest('.nwc-target-save-btn') ||
      e.target.closest('.nwc-target-cancel-btn') ||
      e.target.closest('.nwc-target-reset-btn') ||
      e.target.closest('.nwc-target-input') ||
      e.target.closest('[data-nwc-target-form]')
    ) {
      return;
    }

    // 折りたたみ⇄展開をトグル
    if (widgetEl.getAttribute('data-nwc-mode') === 'expanded') {
      switchToCollapsed(widgetEl);
    } else {
      switchToExpanded(widgetEl);
    }
  }

  /**
   * ウィジェット DOM を生成して body に挿入する。
   * 既に挿入済みの場合はスキップする。
   */
  function createWidget() {
    // 二重挿入防止
    if (document.querySelector('[data-nwc-widget]')) {
      widgetEl = document.querySelector('[data-nwc-widget]');
      return;
    }

    // ウィジェット本体
    widgetEl = document.createElement('div');
    widgetEl.setAttribute('data-nwc-widget', '');

    // 初期状態は折りたたみ
    widgetEl.classList.add('nwc-state-collapsed');
    widgetEl.setAttribute('data-nwc-mode', 'collapsed');

    // 折りたたみビューを構築して挿入
    const collapsedView = buildCollapsedView(widgetEl);
    widgetEl.appendChild(collapsedView);

    // クリックイベント（折りたたみ展開切り替え）
    widgetEl.addEventListener('click', onWidgetClick);

    // ドラッグイベント
    widgetEl.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    document.body.appendChild(widgetEl);

    // Sprint 7+: 設定スキーマをマイグレーション(旧デフォルト bottom-right を top-right に)
    // してから表示設定を読み込んで即時適用する
    migrateSettings(function () {
      loadSettings(function () {
        // フォントサイズ・位置を確実に反映
        applyPosition(currentSettings.position);
        applyFontSize(currentSettings.fontSize);
      });
    });

    // Sprint 7: storage.onChanged で即時反映
    watchSettings();

    // ストレージから目標文字数を読み込む（Sprint 6）
    loadTarget(function () {
      // 展開状態なら進捗セクションを再描画（非同期タイミング対策）
      if (widgetEl && widgetEl.getAttribute('data-nwc-mode') === 'expanded') {
        refreshProgressSection(widgetEl);
      }
    });
  }

  /**
   * 統計データを更新してウィジェット表示に反映する。
   * Sprint 3 以降で DOM 監視結果を渡すために使用する。
   * @param {{ chars?: number, readMinutes?: number, h2?: number, h3?: number, paragraphs?: number, hashtags?: number }} newStats
   */
  function updateStats(newStats) {
    if (!widgetEl) {
      console.error('[NWCWidget] updateStats: ウィジェットが初期化されていません');
      return;
    }

    // 部分更新をサポートするため Object.assign でマージ
    Object.assign(stats, newStats);

    // 折りたたみ表示の文字数ラベル
    const collapsedLabel = widgetEl.querySelector('[data-nwc-chars-collapsed]');
    if (collapsedLabel) {
      collapsedLabel.textContent = '📝 ' + stats.chars + '字';
    }

    // 展開表示の各フィールド
    const charsEl = widgetEl.querySelector('[data-nwc-chars]');
    if (charsEl) {
      charsEl.textContent = String(stats.chars);
    }

    const readEl = widgetEl.querySelector('[data-nwc-read]');
    if (readEl) {
      readEl.textContent = '約' + stats.readMinutes + '分';
    }

    const h2El = widgetEl.querySelector('[data-nwc-h2]');
    if (h2El) {
      h2El.textContent = String(stats.h2);
    }

    const h3El = widgetEl.querySelector('[data-nwc-h3]');
    if (h3El) {
      h3El.textContent = String(stats.h3);
    }

    const paraEl = widgetEl.querySelector('[data-nwc-paragraphs]');
    if (paraEl) {
      paraEl.textContent = String(stats.paragraphs);
    }

    const hashEl = widgetEl.querySelector('[data-nwc-hashtags]');
    if (hashEl) {
      hashEl.textContent = String(stats.hashtags);
      // ハッシュタグ数に応じた色変化（Sprint 5）
      // 0〜2: グレー（デフォルト）/ 3〜5: 緑（推奨）/ 6以上: 赤（警告）
      hashEl.classList.remove('nwc-hashtag-ok', 'nwc-hashtag-warn');
      if (stats.hashtags >= 6) {
        hashEl.classList.add('nwc-hashtag-warn');
      } else if (stats.hashtags >= 3) {
        hashEl.classList.add('nwc-hashtag-ok');
      }
    }

    // 画像数（Sprint 7）
    const imagesEl = widgetEl.querySelector('[data-nwc-images]');
    if (imagesEl) {
      imagesEl.textContent = String(stats.images);
    }

    // 進捗バー更新（Sprint 6）
    if (widgetEl.getAttribute('data-nwc-mode') === 'expanded') {
      updateProgressDisplay(widgetEl);
    }
  }

  // window.NWCWidget 名前空間に公開
  window.NWCWidget = {
    createWidget: createWidget,
    updateStats: updateStats,
  };
})();
