// PWA install banner — loaded separately to avoid any inline script issues
(function(){
  var _dp = null;

  // Android/Chrome install prompt
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    _dp = e;
    setTimeout(function(){
      if(_dp && !window.matchMedia('(display-mode: standalone)').matches){
        showBanner();
      }
    }, 3000);
  });

  window.addEventListener('appinstalled', function(){
    _dp = null;
    hideBanner();
  });

  function showBanner(){
    if(document.getElementById('pwaBanner')) return;
    var b = document.createElement('div');
    b.id = 'pwaBanner';
    b.style.cssText = [
      'position:fixed',
      'bottom:calc(16px + env(safe-area-inset-bottom,0px))',
      'left:12px',
      'right:12px',
      'background:linear-gradient(135deg,rgba(99,102,241,.97),rgba(56,189,248,.97))',
      'border-radius:14px',
      'padding:12px 14px',
      'z-index:9990',
      'display:flex',
      'align-items:center',
      'gap:10px',
      'box-shadow:0 8px 32px rgba(0,0,0,.5)',
      'animation:slideUp .3s ease'
    ].join(';');
    b.innerHTML = [
      '<div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;',
      'display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px">',
      String.fromCodePoint(128230),
      '</div>',
      '<div style="flex:1;min-width:0">',
        '<div style="font-size:13px;font-weight:700;color:#fff">\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c ESEP Sklad</div>',
        '<div style="font-size:11px;color:rgba(255,255,255,.8);margin-top:1px">',
          '\u0420\u0430\u0431\u043e\u0442\u0430\u0435\u0442 \u043e\u0444\u043b\u0430\u0439\u043d \u2022 \u041d\u0430 \u0433\u043b\u0430\u0432\u043d\u044b\u0439 \u044d\u043a\u0440\u0430\u043d',
        '</div>',
      '</div>',
      '<button onclick="document.getElementById(\'pwaBanner\').remove()" ',
        'style="background:rgba(255,255,255,.15);border:none;color:#fff;',
        'border-radius:8px;padding:5px 8px;cursor:pointer;font-size:18px;flex-shrink:0">\u00d7</button>',
      '<button onclick="window._pwaInstall()" ',
        'style="background:#fff;border:none;color:#6366f1;border-radius:8px;',
        'padding:7px 14px;cursor:pointer;font-size:12px;font-weight:700;flex-shrink:0">',
        '\u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c',
      '</button>'
    ].join('');
    document.body.appendChild(b);
  }

  function hideBanner(){
    var b = document.getElementById('pwaBanner');
    if(b) b.remove();
  }

  window._pwaInstall = function(){
    if(!_dp) return;
    _dp.prompt();
    _dp.userChoice.then(function(r){
      if(r.outcome === 'accepted') hideBanner();
      _dp = null;
    });
  };

  // iOS Safari hint
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  var isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                     || !!window.navigator.standalone;

  if(isIOS && isSafari && !isStandalone){
    setTimeout(function(){
      if(document.getElementById('iosHint')) return;
      var h = document.createElement('div');
      h.id = 'iosHint';
      h.style.cssText = [
        'position:fixed',
        'bottom:calc(16px + env(safe-area-inset-bottom,0px))',
        'left:12px',
        'right:12px',
        'background:rgba(17,24,39,.97)',
        'border:1px solid rgba(99,102,241,.3)',
        'border-radius:14px',
        'padding:14px',
        'z-index:9990',
        'text-align:center',
        'box-shadow:0 8px 32px rgba(0,0,0,.6)',
        'animation:slideUp .3s ease'
      ].join(';');
      h.innerHTML = [
        '<button onclick="this.parentNode.remove()" ',
          'style="position:absolute;top:8px;right:10px;background:none;border:none;',
          'color:#64748b;font-size:18px;cursor:pointer">\u00d7</button>',
        '<div style="font-size:13px;font-weight:700;color:#e2e8f0;margin-bottom:8px">',
          String.fromCodePoint(128230),
          ' \u0423\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u044c ESEP Sklad',
        '</div>',
        '<div style="font-size:12px;color:#94a3b8;line-height:1.6">',
          '\u041d\u0430\u0436\u043c\u0438\u0442\u0435 ',
          '<span style="color:#38bdf8;font-weight:700">\u2b06 \u041f\u043e\u0434\u0435\u043b\u0438\u0442\u044c\u0441\u044f</span>',
          ' \u0432\u043d\u0438\u0437\u0443 \u044d\u043a\u0440\u0430\u043d\u0430,<br>',
          '\u0437\u0430\u0442\u0435\u043c \u00ab',
          '<span style="color:#38bdf8;font-weight:700">\u041d\u0430 \u044d\u043a\u0440\u0430\u043d \u0414\u043e\u043c\u043e\u0439</span>',
          '\u00bb',
        '</div>',
        '<div style="margin-top:8px;font-size:24px">\u2b06\ufe0f</div>'
      ].join('');
      document.body.appendChild(h);
      setTimeout(function(){ if(h.parentNode) h.remove(); }, 12000);
    }, 4000);
  }
})();
