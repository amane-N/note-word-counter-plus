// note Word Counter+ - ポップアップ設定画面スクリプト (Sprint 7)
// chrome.storage.local のキー "settings" に保存する

(function () {
  'use strict';

  // -----------------------------------------------------------------------
  // デフォルト設定
  // -----------------------------------------------------------------------

  /** @type {NWCSettings} */
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

  var STORAGE_KEY = 'settings';

  // -----------------------------------------------------------------------
  // DOM 参照
  // -----------------------------------------------------------------------

  var saveBtn = document.getElementById('save-btn');
  var resetBtn = document.getElementById('reset-btn');
  var feedbackEl = document.getElementById('feedback');

  // フィードバックタイマー
  var feedbackTimer = null;

  // -----------------------------------------------------------------------
  // フィードバック表示
  // -----------------------------------------------------------------------

  /**
   * フィードバックメッセージを一時表示する。
   * @param {string} message
   * @param {'ok'|'error'} type
   */
  function showFeedback(message, type) {
    if (feedbackTimer !== null) {
      clearTimeout(feedbackTimer);
      feedbackTimer = null;
    }
    feedbackEl.textContent = message;
    feedbackEl.className = 'feedback ' + (type === 'ok' ? 'show-ok' : 'show-error');
    feedbackTimer = setTimeout(function () {
      feedbackEl.textContent = '';
      feedbackEl.className = 'feedback';
      feedbackTimer = null;
    }, 2000);
  }

  // -----------------------------------------------------------------------
  // UI への設定反映
  // -----------------------------------------------------------------------

  /**
   * 設定オブジェクトをフォームUIに反映する。
   * @param {object} settings
   */
  function applySettingsToUI(settings) {
    // 表示位置ラジオボタン
    var posRadios = document.querySelectorAll('input[name="position"]');
    for (var i = 0; i < posRadios.length; i++) {
      posRadios[i].checked = (posRadios[i].value === settings.position);
    }

    // フォントサイズラジオボタン
    var fsRadios = document.querySelectorAll('input[name="fontSize"]');
    for (var j = 0; j < fsRadios.length; j++) {
      fsRadios[j].checked = (fsRadios[j].value === settings.fontSize);
    }

    // チェックボックス
    var checkboxMap = {
      showChars: 'showChars',
      showReadTime: 'showReadTime',
      showHeadings: 'showHeadings',
      showParagraphs: 'showParagraphs',
      showHashtags: 'showHashtags',
      showImages: 'showImages',
    };

    var keys = Object.keys(checkboxMap);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var cbEl = document.querySelector('input[name="' + key + '"]');
      if (cbEl) {
        cbEl.checked = (settings[key] !== false); // デフォルト true
      }
    }
  }

  // -----------------------------------------------------------------------
  // フォームから設定オブジェクトを収集
  // -----------------------------------------------------------------------

  /**
   * フォームの現在値から設定オブジェクトを構築して返す。
   * @returns {object}
   */
  function collectSettingsFromUI() {
    var settings = {};

    // 表示位置
    var posRadios = document.querySelectorAll('input[name="position"]');
    settings.position = DEFAULT_SETTINGS.position;
    for (var i = 0; i < posRadios.length; i++) {
      if (posRadios[i].checked) {
        settings.position = posRadios[i].value;
        break;
      }
    }

    // フォントサイズ
    var fsRadios = document.querySelectorAll('input[name="fontSize"]');
    settings.fontSize = DEFAULT_SETTINGS.fontSize;
    for (var j = 0; j < fsRadios.length; j++) {
      if (fsRadios[j].checked) {
        settings.fontSize = fsRadios[j].value;
        break;
      }
    }

    // チェックボックス
    var cbNames = ['showChars', 'showReadTime', 'showHeadings', 'showParagraphs', 'showHashtags', 'showImages'];
    for (var k = 0; k < cbNames.length; k++) {
      var name = cbNames[k];
      var cbEl = document.querySelector('input[name="' + name + '"]');
      settings[name] = cbEl ? cbEl.checked : true;
    }

    return settings;
  }

  // -----------------------------------------------------------------------
  // ストレージ操作
  // -----------------------------------------------------------------------

  /**
   * ストレージから設定を読み込んでUIに反映する。
   */
  function loadSettings() {
    try {
      chrome.storage.local.get([STORAGE_KEY], function (result) {
        var stored = result[STORAGE_KEY];
        // デフォルトとマージ（新しいキーが追加された場合のフォールバック）
        var settings = Object.assign({}, DEFAULT_SETTINGS, stored || {});
        applySettingsToUI(settings);
      });
    } catch (e) {
      console.error('[NWC Popup] loadSettings エラー:', e);
      applySettingsToUI(DEFAULT_SETTINGS);
    }
  }

  /**
   * 現在のUI状態をストレージに保存する。
   */
  function saveSettings() {
    var settings = collectSettingsFromUI();
    try {
      var data = {};
      data[STORAGE_KEY] = settings;
      chrome.storage.local.set(data, function () {
        showFeedback('設定を保存しました', 'ok');
      });
    } catch (e) {
      console.error('[NWC Popup] saveSettings エラー:', e);
      showFeedback('保存に失敗しました', 'error');
    }
  }

  /**
   * 設定をデフォルトに戻してストレージに保存する。
   */
  function resetSettings() {
    try {
      var data = {};
      data[STORAGE_KEY] = DEFAULT_SETTINGS;
      chrome.storage.local.set(data, function () {
        applySettingsToUI(DEFAULT_SETTINGS);
        showFeedback('初期設定に戻しました', 'ok');
      });
    } catch (e) {
      console.error('[NWC Popup] resetSettings エラー:', e);
      showFeedback('リセットに失敗しました', 'error');
    }
  }

  // -----------------------------------------------------------------------
  // イベントリスナー
  // -----------------------------------------------------------------------

  saveBtn.addEventListener('click', saveSettings);
  resetBtn.addEventListener('click', resetSettings);

  // -----------------------------------------------------------------------
  // 初期化
  // -----------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', function () {
    loadSettings();
  });

  // DOMContentLoaded が既に発火済みの場合の安全網
  if (document.readyState !== 'loading') {
    loadSettings();
  }
})();
