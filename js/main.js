(function () {
  'use strict';

  // 页头：滚动后显示底边线
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.dataset.scrolled = window.scrollY > 8 ? 'true' : 'false'; };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // 数学公式：页面里有公式时才按需加载 KaTeX
  var KATEX = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/';
  function load(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.onload = cb; document.head.appendChild(s);
  }
  var mathEls = document.querySelectorAll('.math');
  if (mathEls.length) {
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = KATEX + 'katex.min.css';
    document.head.appendChild(css);
    load(KATEX + 'katex.min.js', function () {
      mathEls.forEach(function (el) {
        var tex = el.textContent.replace(/^\\[\(\[]|\\[\)\]]$/g, '');
        try {
          window.katex.render(tex, el, { displayMode: el.classList.contains('display'), throwOnError: false });
        } catch (e) { /* 保留原文 */ }
      });
    });
  }

  var prose = document.getElementById('prose');
  if (prose) {
    // 表格横向滚动容器
    prose.querySelectorAll('table').forEach(function (t) {
      if (t.parentElement.classList.contains('table-wrap')) return;
      var w = document.createElement('div');
      w.className = 'table-wrap';
      t.parentNode.insertBefore(w, t);
      w.appendChild(t);
    });

    // 代码复制按钮
    prose.querySelectorAll('pre').forEach(function (pre) {
      var host = pre.closest('figure.highlight, div.sourceCode') || pre;
      if (host.querySelector('.copy-btn')) return;
      host.classList.add('code-wrap');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        navigator.clipboard.writeText(code.innerText).then(function () {
          btn.textContent = '已复制';
          btn.dataset.copied = 'true';
          setTimeout(function () { btn.textContent = '复制'; btn.dataset.copied = 'false'; }, 1600);
        });
      });
      host.appendChild(btn);
    });

    // 标题锚点 + 目录
    var heads = Array.prototype.slice.call(prose.querySelectorAll('h1, h2, h3'));
    var top = heads.reduce(function (m, h) { return Math.min(m, +h.tagName[1]); }, 6);
    var used = {};
    heads.forEach(function (h, i) {
      if (!h.id) {
        var base = h.textContent.trim().replace(/\s+/g, '-').replace(/[^\w一-鿿-]/g, '') || 'section-' + i;
        var id = base, n = 1;
        while (used[id] || document.getElementById(id)) id = base + '-' + (n++);
        h.id = id;
      }
      used[h.id] = true;
      var a = document.createElement('a');
      a.className = 'heading-link';
      a.href = '#' + h.id;
      a.setAttribute('aria-label', '链接到此标题');
      a.textContent = '#';
      h.insertBefore(a, h.firstChild);
    });

    var lists = document.querySelectorAll('.toc-list');
    if (heads.length >= 2 && lists.length) {
      lists.forEach(function (list) {
        heads.forEach(function (h) {
          var depth = +h.tagName[1] - top + 2;
          if (depth > 3) return;
          var li = document.createElement('li');
          li.dataset.depth = depth;
          var a = document.createElement('a');
          a.href = '#' + h.id;
          a.dataset.target = h.id;
          a.textContent = h.textContent.replace(/^#/, '').trim();
          li.appendChild(a);
          list.appendChild(li);
        });
      });
      document.querySelectorAll('.toc-side, .toc-mobile').forEach(function (el) { el.hidden = false; });

      var links = document.querySelectorAll('.toc-list a');
      var setActive = function (id) {
        links.forEach(function (l) { l.setAttribute('aria-current', l.dataset.target === id ? 'true' : 'false'); });
      };
      var tick = false;
      var update = function () {
        tick = false;
        var cur = heads[0].id;
        for (var i = 0; i < heads.length; i++) {
          if (heads[i].getBoundingClientRect().top < 120) cur = heads[i].id; else break;
        }
        setActive(cur);
      };
      window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
      update();
    }
  }

  // 文章列表：标题搜索 + 系列筛选
  var list = document.getElementById('post-list');
  if (list) {
    var input = document.getElementById('title-search');
    var status = document.getElementById('title-search-status');
    var empty = document.getElementById('post-empty');
    var rows = list.querySelectorAll('.post-row');
    var chips = document.querySelectorAll('.filter-bar .chip');
    var series = '';
    var apply = function () {
      var q = (input.value || '').trim().toLowerCase();
      var shown = 0;
      rows.forEach(function (r) {
        var ok = (!q || r.dataset.title.toLowerCase().indexOf(q) !== -1) && (!series || r.dataset.series === series);
        r.hidden = !ok;
        if (ok) shown++;
      });
      status.textContent = q || series ? shown + ' 篇' : '';
      empty.hidden = shown !== 0;
    };
    input.addEventListener('input', apply);
    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        series = c.dataset.filter;
        chips.forEach(function (x) { x.dataset.active = x === c ? 'true' : 'false'; });
        apply();
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === '/' && document.activeElement !== input && !/input|textarea/i.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      } else if (e.key === 'Escape' && document.activeElement === input) {
        input.value = '';
        apply();
        input.blur();
      }
    });
  }
})();
