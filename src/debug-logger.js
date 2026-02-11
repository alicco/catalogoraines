
(function () {
    var oldLog = console.log;
    var oldError = console.error;
    var oldWarn = console.warn;

    var container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.bottom = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '200px';
    container.style.overflow = 'auto';
    container.style.backgroundColor = 'rgba(0,0,0,0.8)';
    container.style.color = '#0f0';
    container.style.zIndex = '99999';
    container.style.fontFamily = 'monospace';
    container.style.fontSize = '12px';
    container.style.pointerEvents = 'none'; // Click through
    document.body.appendChild(container);

    function logToScreen(args, color) {
        var msg = Array.from(args).map(a => {
            if (typeof a === 'object') {
                try { return JSON.stringify(a); } catch (e) { return String(a); }
            }
            return String(a);
        }).join(' ');

        var div = document.createElement('div');
        div.style.borderBottom = '1px solid #333';
        div.style.padding = '2px';
        div.style.color = color || '#0f0';
        div.textContent = msg;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    console.log = function () {
        logToScreen(arguments, '#0f0');
        oldLog.apply(console, arguments);
    };

    console.error = function () {
        logToScreen(arguments, '#f00');
        oldError.apply(console, arguments);
    };

    console.warn = function () {
        logToScreen(arguments, '#ff0');
        oldWarn.apply(console, arguments);
    };

    window.addEventListener('error', function (e) {
        logToScreen([e.message, e.filename, e.lineno], '#f00');
    });

    window.addEventListener('unhandledrejection', function (e) {
        logToScreen(['Unhandled Rejection:', e.reason], '#f00');
    });

})();
