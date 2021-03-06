(function() {

(function() {

//  Faster operation analogues:
//  Math.floor(f)  => ~~(a)
//  Math.round(f)  =>  (f + 0.5) | 0
//
function isString(o)  { return typeof o !== "undefined" && o !== null && (typeof o === "string" || o.constructor === String); }
function isNumber(o)  { return typeof o !== "undefined" && o !== null && (typeof o === "number" || o.constructor === Number); }
function isBoolean(o) { return typeof o !== "undefined" && o !== null && (typeof o === "boolean" || o.constructor === Boolean); }

if (!String.prototype.trim) { String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g,'');  }; }

if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement) {
        if (this == null) throw new TypeError();
        var t = Object(this), len = t.length >>> 0;
        if (len === 0) return -1;

        var n = 0;
        if (arguments.length > 0) {
            n = Number(arguments[1]);
            if (n != n) n = 0;
            else if (n !== 0 && n != Infinity && n != -Infinity) {
                n = (n > 0 || -1) * ~~Math.abs(n);
            }
        }
        if (n >= len) return -1;
        var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
        for (; k < len; k++) if (k in t && t[k] === searchElement) return k;
        return -1;
    };
}

if (!Array.isArray) Array.isArray = function(a) { return Object.prototype.toString.call(a) == '[object Array]'; };

var $$$ = 0, namespaces = {}, namespace = function(nsname, dontCreate) {
    if (isString(nsname) === false) throw new Error("Wrong nsname argument");
    if (namespaces.hasOwnProperty(nsname)) return namespaces[nsname];
    if (dontCreate === true) throw new Error("Namespace '" + nsname + "' doesn't exist");

    function Package() {
        this.$url = null;
        if (zebra.isInBrowser) {
            var s = document.getElementsByTagName('script'), ss = s[s.length - 1].getAttribute('src'),
                i = ss == null ? -1 : ss.lastIndexOf("/");
            this.$url = (i > 0) ? new zebra.URL(ss.substring(0, i + 1)) 
                                : new zebra.URL(document.location.toString()).getParentURL() ;
        }
    }

    if (isString(nsname) === false) throw new Error('invalid namespace id');
    if (namespaces.hasOwnProperty(nsname)) throw new Error("Namespace '" + nsname + "' already exists");

    var f = function(name) {
        if (arguments.length === 0) return f.$env;

        if (typeof name === 'function') {
            for(var k in f) if (f[k] instanceof Package) name(k, f[k]);
            return null;
        }

        var b = Array.isArray(name);
        if (isString(name) === false && b === false) {
            for(var k in name) if (name.hasOwnProperty(k)) f.$env[k] = name[k];
            return;
        }

        if (b) {
           for(var i = 0; i < name.length; i++) f(name[i]);
           return null;
        }

        if (f[name] instanceof Package) return f[name];

        var names = name.split('.'), target = f;
        for(var i = 0, k = names[0]; i < names.length; i++, k = [k, '.', names[i]].join('')) {
            var n = names[i], p = target[n];
            if (typeof p === "undefined") {
                p = new Package();
                target[n] = p;
                f[k] = p;
            }
            else
            if ((p instanceof Package) === false) throw new Error("Package '" + name +  "' conflicts with variable '" + n + "'");
            target = p;
        }
        return target;
    };

    f.Import = function() {
        var ns = ["=", nsname, "."].join(''), code = [], packages = arguments.length === 0 ? null : Array.prototype.slice.call(arguments, 0);
        f(function(n, p) {
            if (packages == null || packages.indexOf(n) >= 0) {
                for (var k in p) {
                    if (k[0] != '$' && (p[k] instanceof Package) === false && p.hasOwnProperty(k)) {
                        code.push([k, ns, n, ".", k].join(''));
                    }
                }
                if (packages != null) packages.splice(packages.indexOf(n), 1);
            }
        });
        if (packages != null && packages.length !== 0) throw new Error("Unknown package(s): " + packages.join(","));
        return code.length > 0 ? [ "var ", code.join(","), ";"].join('') : null;
    };

    f.$env = {};
    namespaces[nsname] = f;
    return f;
};

var FN = (typeof namespace.name === "undefined") ? (function(f) { var mt = f.toString().match(/^function ([^(]+)/); return (mt == null) ? '' : mt[1]; })
                                                 : (function(f) { return f.name; });

zebra = namespace('zebra');
var pkg = zebra;
pkg.namespaces = namespaces;
pkg.namespace = namespace;
pkg.FN = FN;
pkg.$global = this;
pkg.isString  = isString;
pkg.isNumber  = isNumber;
pkg.isBoolean = isBoolean;
pkg.version = "1.2.0";
pkg.$caller = null;

function mnf(name, params) {
    throw new ReferenceError("Method '" + (name==='' ? "constructor":name) + "(" + params + ")" + "' not found");
}

function $toString() { return this._hash_; }
function $equals(o) { return this == o; }

function make_template(pt, tf, p)
{
    tf._hash_ = ["$zebra_", $$$++].join('');
    tf.toString = $toString;
    if (pt != null) tf.prototype.getClazz = function() { return tf; };
    tf.getClazz = function() { return pt; };
    tf.prototype.toString = $toString;
    tf.prototype.equals   = $equals;
    tf.prototype.constructor = tf;

    if (p && p.length > 0) {
        tf.parents = {};
        for(var i=0; i < p.length; i++) {
            var l = p[i];
            if (typeof l === 'undefined') throw new ReferenceError("Unknown " + i + " parent");
            tf.parents[l] = true;
            if (l.parents) {
                var pp = l.parents;
                for(var k in pp) if (pp.hasOwnProperty(k)) tf.parents[k] = true;
            }
        }
    }
    return tf;
}

pkg.Interface = make_template(null, function() {
    var $Interface = make_template(pkg.Interface, function() {
        if (arguments.length > 0) return new (pkg.Class($Interface, arguments[0]))();
    }, arguments);
    return $Interface;
});

function ProxyMethod(name, f) {
    if (isString(name) === false) throw new TypeError('Method name has not been defined');

    var a = null;
    if (arguments.length == 1) {
        a = function() {
            var nm = a.methods[arguments.length];
            if (nm) {
                var cm = pkg.$caller;
                pkg.$caller = nm;
                try { return nm.apply(this, arguments); }
                catch(e) { throw e; }
                finally { pkg.$caller = cm; }
            }
            mnf(a.methodName, arguments.length);
        };
        a.methods = {};
    }
    else {
        a = function() {
            var cm = pkg.$caller;
            pkg.$caller = f;
            try { return f.apply(this, arguments); }
            catch(e) { throw e; }
            finally { pkg.$caller = cm; }
        };
        a.f = f;
    }

    a.$clone$ = function() {
        if (a.methodName === '') return null;
        if (a.f) return ProxyMethod(a.methodName, a.f);
        var m = ProxyMethod(a.methodName);
        for(var k in a.methods) m.methods[k] = a.methods[k];
        return m;
    };

    a.methodName = name;
    return a;
}

pkg.Class = make_template(null, function() {
    if (arguments.length === 0) throw new Error("No class definition was found");

    var df = arguments[arguments.length - 1], $parent = null, args = Array.prototype.slice.call(arguments, 0, arguments.length-1);
    if (args.length > 0 && (args[0] == null || args[0].getClazz() == pkg.Class)) $parent = args[0];

    var $template = make_template(pkg.Class, function() {
        this._hash_ = ["$zObj_", $$$++].join('');

        if (arguments.length > 0) {
            var a = arguments[arguments.length - 1];

            // inner is customized class instance if last arguments is array of functions
            if (Array.isArray(a) === true && typeof a[0] === 'function') {
                a = a[0];
                var args = [ $template ], k = arguments.length - 2;
                for(; k >= 0 && pkg.instanceOf(arguments[k], pkg.Interface); k--) args.push(arguments[k]);
                args.push(arguments[arguments.length - 1]);
                var cl = pkg.Class.apply(null, args), f = function() {};
                f.prototype = cl.prototype;
                var o = new f();
                cl.apply(o, Array.prototype.slice.call(arguments, 0, k + 1));
                o.constructor = cl;
                return o;
            }
        }

        this[''] && this[''].apply(this, arguments);
    }, args);

    $template.$parent = $parent;
    if ($parent != null) {
        for (var k in $parent.prototype) {
            var f = $parent.prototype[k];
            if (f && f.$clone$) {
                f = f.$clone$();
                if (f == null) continue;
            }
            $template.prototype[k] = f;
        }
    }

    $template.prototype.Field = function(f) {
        var n = FN(f), pv = this[n];
        if (pv) { if (this.hasOwnProperty(n) === false) pv = pv.$clone$(); }
        else pv = ProxyMethod(n);
        pv.methods[f.length] = f;
        f.boundTo = this.getClazz();
        this[n] = pv;
    };

    $template.prototype.$super = function() {
        if (pkg.$caller) {
            var name = pkg.$caller.methodName, $s = pkg.$caller.boundTo.$parent, args = arguments;
            if (arguments.length > 0 && typeof arguments[0] === 'function') {
                name = arguments[0].methodName;
                args = Array.prototype.slice.call(arguments, 1);
            }

            var params = args.length;
            while($s != null) {
                var m = $s.prototype[name];
                if (m && (typeof m.methods === "undefined" || m.methods[params])) return m.apply(this, args);
                $s = $s.$parent;
            }
            mnf(name, params);
        }
        throw new Error("$super is called outside of class context");
    };

    $template.prototype.getClazz = function() { return $template; };
    $template.prototype.$this = function() {  return pkg.$caller.boundTo.prototype[''].apply(this, arguments);  };

    $template.constructor.prototype.getMethods = function(name)  {
         var m = [];
         for (var n in this.prototype) {
             var f = this.prototype[n];
             if (arguments.length > 0 && name != n) continue;
             if (typeof f === 'function') {
                if (f.$clone$) {
                    for (var mk in f.methods) m.push(f.methods[mk]);
                }
                else m.push(f);
             }
         }
         return m;
    };

    $template.constructor.prototype.getMethod = function(name, params) {
        var m = this.prototype[name];
        if (typeof m === 'function') {
            if (m.$clone$) {
                if (typeof params === "undefined")  {
                    if (m.methods[0]) return m.methods[0];
                    for(var k in m.methods) return m.methods[k];
                    return null;
                }
                m = m.methods[params];
            }
            if (m) return m;
        }
        return null;
    };

    $template.Field = function(f) {
        var n = null;
        if (arguments.length > 1) {
            n = arguments[0];
            f = arguments[1];
        }
        else n = FN(f);

        if (f.boundTo) throw new Error("Method '" + n + "' is bound to other class");
        var sw = null, arity = f.length, vv = this.prototype[n];

        if (typeof vv === 'undefined') {
            // this commented code allow to speed up proxy execution a  little bit for a single method
            // sw = ProxyMethod(n, f);
            // f.boundTo    = this;
            // f.methodName = n;
            // this.prototype[n] = sw;
            // return;
            sw = ProxyMethod(n);
        }
        else {
            if (typeof vv === 'function') {
                if (vv.$clone$) {
                    if (typeof vv.methods === "undefined") {
                        sw = ProxyMethod(n);
                        sw.methods[vv.f.length] = vv.f;
                    }
                    else sw = vv;
                }
                else {
                    sw = ProxyMethod(n);
                    if (vv.length != arity) {
                        vv.methodName = n;
                        vv.boundTo = this;
                    }
                    sw.methods[vv.length] = vv;
                }
            }
            else throw new Error("Method '" + n + "' conflicts to property");
        }

        var pv = sw.methods[arity];
        if (typeof pv !== 'undefined' && pv.boundTo == this) {
            throw new Error("Duplicated method '" + sw.methodName + "(" + arity +")'");
        }

        f.boundTo    = this;
        f.methodName = n;
        sw.methods[arity] = f;
        this.prototype[n] = sw;
    };

    if (typeof df === 'function') df.call($template, function(f) { $template.Field(f); } );
    else {
        if (Array.isArray(df) === false) throw new Error("Wrong class definition format");
        for(var i=0; i < df.length; i++) {
            var ff = df[i], nn = FN(ff);
            if (nn[0] == "$") {
                var ctx = nn == "$prototype" ?  $template.prototype : (nn == "$clazz" ? $template : null);
                if (nn) {
                    ff.call(ctx);
                    continue;
                }
            }
            $template.Field(nn, ff);
        }
    }

    // validate constructor
    if ($template.$parent && $template.$parent.prototype[''] && typeof $template.prototype[''] === "undefined") {
        $template.prototype[''] = $template.$parent.prototype[''];
    }

    return $template;
});

var Class = pkg.Class, $cached = {}, $busy = 1, $f = [];

function $cache(name, clazz) {
    if (($cached[name] && $cached[name] != clazz) || pkg.$global[name]) throw Error("Class name conflict: " + name);
    $cached[name] = clazz;
}

Class.forName = function(name) {
    if (pkg.$global[name]) return pkg.$global[name];
    //!!!!!! infinite cache !!!!
    if ($cached.hasOwnProperty(name) === false) $cache(name, eval(name));
    var cl = $cached[name];
    if (cl == null) throw new Error("Class " + name + " cannot be found");
    return cl;
};

pkg.instanceOf = function(obj, clazz) {
    if (clazz) {
        if (obj == null || typeof obj.getClazz === 'undefined')  return false;
        var c = obj.getClazz();
        return c != null && (c === clazz || (typeof c.parents !== 'undefined' && c.parents.hasOwnProperty(clazz)));
    }
    throw new Error("instanceOf(): unknown class");
};

pkg.ready = function() {
    if (arguments.length === 0) {
        if ($busy > 0) $busy--;
    }
    else {
        if (arguments.length == 1 && $busy === 0 && $f.length === 0) {
            arguments[0]();
            return;
        }
    }

    for(var i = 0; i < arguments.length; i++) $f.push(arguments[i]);
    while($busy === 0 && $f.length > 0) $f.shift()();
};

pkg.busy = function() { $busy++; };

pkg.Output = Class([
    function print(o) { this._p(0, o); },
    function error(o) { this._p(2, o); },
    function warn(o)  { this._p(1, o); },

    function _p(l, o) {
        o = this.format(o);
        if (pkg.isInBrowser) {
            if (pkg.isIE) {
                console.log(o);
                // !!!! should check if IE9+ is used we can use  console.log
                // alert(o);
            }
            else {
                if (l === 0) console.log(o);
                else if (l == 1) console.warn(o);
                     else console.error(o);
            }
        }
        else pkg.$global.print(o);
    },

    function format(o) {
        if (o && o.stack) return [o.toString(), ":",  o.stack.toString()].join("\n");
        return o == null ? "$null" : (typeof o === "undefined" ? "$undefined" : o.toString());
    }
]);

pkg.Dummy = Class([]);

pkg.HtmlOutput = Class(pkg.Output, [
    function() { this.$this(null); },

    function(element) {
        element = element || "zebra.out";
        if (pkg.isString(element)) {
            this.el = document.getElementById(element);
            if (this.el == null) {
                this.el = document.createElement('div');
                this.el.setAttribute("id", element);
                document.body.appendChild(this.el);
            }
        }
        else {
            if (element == null) throw new Error("Unknown HTML output element");
            this.el = element;
        }
    },

    function print(s) { this.out('black', s); },
    function error(s) { this.out('red', s); },
    function warn(s)  { this.out('orange', s); },

    function out(color, msg) {
        var t = ["<div class='zebra.out.print' style='color:", color, "'>", this.format(msg), "</div>" ];
        this.el.innerHTML += t.join('');
    }
]);

pkg.isInBrowser = typeof navigator !== "undefined";
pkg.isIE        = pkg.isInBrowser && /msie/i.test(navigator.userAgent) && !/opera/i.test(navigator.userAgent);
pkg.isOpera     = pkg.isInBrowser && !/opera/i.test(navigator.userAgent);
pkg.isChrome    = pkg.isInBrowser && typeof(window.chrome) !== "undefined";
pkg.isSafari    = pkg.isInBrowser && !pkg.isChrome && /Safari/i.test(navigator.userAgent);
pkg.isFF        = pkg.isInBrowser && window.mozInnerScreenX != null;
pkg.out         = new pkg.Output();

pkg.print = function(s) { pkg.out.print(s); };

function complete() {
    pkg(function(n, p) {
        for(var k in p) {
            var c = p[k];
            if (c && zebra.instanceOf(c, Class)) c.$name = k;
        }
    });
    pkg.ready();
}

if (pkg.isInBrowser) {
    var m = window.location.search.match(/[?&][a-zA-Z0-9_.]+=[^?&=]+/g), env = {};
    for(var i=0; m && i < m.length; i++) {
        var l = m[i].split('=');
        env[l[0].substring(1)] = l[1];
    }
    pkg(env);

    //               protocol[1]        host[2]  path[3]  querystr[4]
    var purl = /^([a-zA-Z_0-9]+\:)\/\/([^\/]*)(\/[^?]*)(\?[^?\/]*)?/;
    pkg.URL = function(url) {
        var a = document.createElement('a');
        a.href = url;
        var m = purl.exec(a.href);

        if (m == null) {
            m = purl.exec(window.location);
            if (m == null) throw Error("Cannot resolve '" + url + "' url");
            var p = m[3];
            a.href = m[1] + "//" + m[2] +  p.substring(0, p.lastIndexOf("/") + 1) + url;
            m = purl.exec(a.href);
        }

        this.path     = m[3];
        this.href     = a.href;
        this.protocol = m[1];
        this.host     = m[2];
        this.path     = this.path.replace(/[\/]+/g, "/");
        this.qs       = m[4];
    };

    pkg.URL.prototype.toString = function() { return this.href; };

    pkg.URL.prototype.getParentURL = function() {
        var i = this.path.lastIndexOf("/");
        if (i <= 0) throw new Error(this.toString() + " has no parent");
        var p = this.path.substring(0, i+1);
        return new pkg.URL([this.protocol, "//", this.host, p].join(''));
    };

    pkg.URL.isAbsolute = function(u) { return /^[a-zA-Z]+\:\/\//i.test(u);  };

    pkg.URL.prototype.join = function(p) {
        if (pkg.URL.isAbsolute(p)) throw new Error();
        return p[0] == '/' ? [ this.protocol, "//", this.host, p ].join('')
                           : [ this.protocol, "//", this.host, this.path, p ].join('');
    };

    if (window.addEventListener) window.addEventListener('DOMContentLoaded', complete, false);
    else window.attachEvent('onload', complete);
}
else complete();

})();




(function(pkg) {

var HEX = "0123456789ABCDEF";
pkg.ID = function UUID(size) {
    if (typeof size === 'undefined') size = 16;
    var id = [];
    for (var i=0; i<36; i++)  id[i] = HEX[~~(Math.random() * 16)];
    return id.join('');
};

pkg.sleep = function() {
    var r = new XMLHttpRequest(), t = (new Date()).getTime().toString(), i = window.location.toString().lastIndexOf("?");
    r.open('GET', window.location + (i > 0 ? "&" : "?") + t, false);
    r.send(null);
};

// !!!
// b64 is supposed to be used with binary stuff, applying it to utf-8 encoded data can bring to error
// !!!
var b64str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

pkg.b64encode = function(input) {
    var out = [], i = 0, len = input.length, c1, c2, c3;
    if (typeof ArrayBuffer !== "undefined") {
        if (input instanceof ArrayBuffer) input = new Uint8Array(input);
        input.charCodeAt = function(i) { return this[i]; };
    }
    if (Array.isArray(input)) input.charCodeAt = function(i) { return this[i]; };

    while(i < len) {
        c1 = input.charCodeAt(i++) & 0xff;
        out.push(b64str.charAt(c1 >> 2));
        if (i == len) {
            out.push(b64str.charAt((c1 & 0x3) << 4), "==");
            break;
        }
        c2 = input.charCodeAt(i++);
        out.push(b64str.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4)));
        if (i == len) {
            out.push(b64str.charAt((c2 & 0xF) << 2), "=");
            break;
        }
        c3 = input.charCodeAt(i++);
        out.push(b64str.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6)), b64str.charAt(c3 & 0x3F));
    }
    return out.join('');
};

pkg.b64decode = function(input) {
    var output = [], chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

    while ((input.length % 4) !== 0) input += "=";

    for(var i=0; i < input.length;) {
        enc1 = b64str.indexOf(input.charAt(i++));
        enc2 = b64str.indexOf(input.charAt(i++));
        enc3 = b64str.indexOf(input.charAt(i++));
        enc4 = b64str.indexOf(input.charAt(i++));

        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output.push(String.fromCharCode(chr1));
        if (enc3 != 64) output.push(String.fromCharCode(chr2));
        if (enc4 != 64) output.push(String.fromCharCode(chr3));
    }
    return output.join('');
};

pkg.dateToISO8601 = function(d) {
    function pad(n) { return n < 10 ? '0'+n : n; }
    return [ d.getUTCFullYear(), '-', pad(d.getUTCMonth()+1), '-', pad(d.getUTCDate()), 'T', pad(d.getUTCHours()), ':',
             pad(d.getUTCMinutes()), ':', pad(d.getUTCSeconds()), 'Z'].join('');
};

// http://webcloud.se/log/JavaScript-and-ISO-8601/
pkg.ISO8601toDate = function(v) {
    var regexp = ["([0-9]{4})(-([0-9]{2})(-([0-9]{2})", "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?",
                  "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?"].join(''), d = v.match(new RegExp(regexp)),
                  offset = 0, date = new Date(d[1], 0, 1);

    if (d[3])  date.setMonth(d[3] - 1);
    if (d[5])  date.setDate(d[5]);
    if (d[7])  date.setHours(d[7]);
    if (d[8])  date.setMinutes(d[8]);
    if (d[10]) date.setSeconds(d[10]);
    if (d[12]) date.setMilliseconds(Number("0." + d[12]) * 1000);
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    date.setTime(Number(date) + (offset * 60 * 1000));
    return date;
};

pkg.parseXML = function(s) {
    function rmws(node) {
        if (node.childNodes !== null) {
            for (var i = node.childNodes.length; i-->0;) {
                var child= node.childNodes[i];
                if (child.nodeType === 3 && child.data.match(/^\s*$/)) node.removeChild(child);
                if (child.nodeType === 1) rmws(child);
            }
        }
        return node;
    }

    if (typeof DOMParser !== "undefined") return rmws((new DOMParser()).parseFromString(s, "text/xml"));
    else {
        for (var n in { "Microsoft.XMLDOM":0, "MSXML2.DOMDocument":1, "MSXML.DOMDocument":2 }) {
            var p = null;
            try {
                p = new ActiveXObject(n);
                p.async = false;
            }  catch (e) { continue; }
            if (p === null) throw new Error("XML parser is not available");
            p.loadXML(s);
            return p;
        }
    }
    throw new Error("No XML parser is available");
};

})(zebra("util"));

(function(pkg, Class, Interface) {

pkg.getPropertySetter = function(clazz, name) {
    if (clazz.$beanInfo) {
        if (clazz.$beanInfo.hasOwnProperty(name)) return clazz.$beanInfo[name];
    }
    else clazz.$beanInfo = {};

    var names = [ ["set", name[0].toUpperCase(), name.substring(1)].join(''), name ];
    for (var i=0; i < names.length; i++) {
        var m = clazz.prototype[names[i]];
        if (typeof m  === "function") {
            if (m.$clone$) {
                for(var k in m.methods) {
                    if (k > 1) {
                        return clazz.$beanInfo[name] = (function(m) {
                            return (function(o, v) { m.apply(o, v && v.$new ? v.$new() : v); });
                        })(m.methods[k]);
                    }
                }
            }

            return clazz.$beanInfo[name] = (function(m) {
                return m.length > 1 ? function(o, v) { m.apply(o, v && v.$new ? v.$new() : v); }
                                    : function(o, v) { m.call(o, v && v.$new ? v.$new() : v); };
            })(m);
        }
    }
    return clazz.$beanInfo[name] = function(o, v) { o[name] = v && v.$new ? v.$new() : v; };
};

//!!! should be in util  or move on zebra core level ?
pkg.newInstance = function(clazz, args) {
    if (args && args.length > 0) {
        var f = function() {};
        f.prototype = clazz.prototype;
        var o = new f();
        o.constructor = clazz;
        clazz.apply(o, args);
        return o;
    }
    return new clazz();
};

function hex(v) { return (v < 16) ? ["0", v.toString(16)].join('') :  v.toString(16); }

pkg.rgb = function (r, g, b, a) {
    if (arguments.length == 1) {
        if (zebra.isString(r)) {
            this.s = r;
            if (r[0] === '#') {
                r = parseInt(r.substring(1), 16);
            }
            else {
                if (r[0] === 'r' && r[1] === 'g' && r[2] === 'b') {
                    var i = r.indexOf('(', 3), p = r.substring(i + 1, r.indexOf(')', i + 1)).split(",");
                    this.r = parseInt(p[0].trim(), 10);
                    this.g = parseInt(p[1].trim(), 10);
                    this.b = parseInt(p[2].trim(), 10);
                    if (p.length > 3) this.D = parseInt(p[2].trim(), 10);
                    return;
                }
            }
        }
        this.r = r >> 16;
        this.g = (r >> 8) & 0xFF;
        this.b = (r & 0xFF);
    }
    else {
        this.r = r;
        this.g = g;
        this.b = b;
        if (arguments.length > 3) this.a = a;
    }

    if (this.s == null) {
        this.s = (typeof this.a !== "undefined") ? ['rgba(', this.r, ",", this.g, ",",
                                                             this.b, ",", this.a, ")"].join('')
                                                 : ['#', hex(this.r), hex(this.g), hex(this.b)].join('');
    }
};

var rgb = pkg.rgb;
rgb.prototype.toString = function() { return this.s; };

rgb.prototype.equals = function(c){
    return c != null && (c === this || (this.r == c.r && this.b == c.b && this.g == c.g && this.a == c.a));
};

rgb.black     = new rgb(0);
rgb.white     = new rgb(0xFFFFFF);
rgb.red       = new rgb(255,0,0);
rgb.blue      = new rgb(0,0,255);
rgb.green     = new rgb(0,255,0);
rgb.gray      = new rgb(128,128,128);
rgb.lightGray = new rgb(211,211,211);
rgb.darkGray  = new rgb(169,169,169);
rgb.orange    = new rgb(255,165,0);
rgb.yellow    = new rgb(255,255,0);
rgb.pink      = new rgb(255,192,203);
rgb.cyan      = new rgb(0,255,255);
rgb.magenta   = new rgb(255,0,255);
rgb.darkBlue  = new rgb(0, 0, 140);

pkg.Actionable = Interface();

pkg.index2point  = function(offset,cols) { return [~~(offset / cols), (offset % cols)]; };
pkg.indexByPoint = function(row,col,cols){ return (cols <= 0) ?  -1 : (row * cols) + col; };

pkg.intersection = function(x1,y1,w1,h1,x2,y2,w2,h2,r){
    r.x = x1 > x2 ? x1 : x2;
    r.width = Math.min(x1 + w1, x2 + w2) - r.x;
    r.y = y1 > y2 ? y1 : y2;
    r.height = Math.min(y1 + h1, y2 + h2) - r.y;
};

pkg.isIntersect = function(x1,y1,w1,h1,x2,y2,w2,h2){
    return (Math.min(x1 + w1, x2 + w2) - (x1 > x2 ? x1 : x2)) > 0 &&
           (Math.min(y1 + h1, y2 + h2) - (y1 > y2 ? y1 : y2)) > 0;
};

pkg.unite = function(x1,y1,w1,h1,x2,y2,w2,h2,r){
    r.x = x1 < x2 ? x1 : x2;
    r.y = y1 < y2 ? y1 : y2;
    r.width  = Math.max(x1 + w1, x2 + w2) - r.x;
    r.height = Math.max(y1 + h1, y2 + h2) - r.y;
};

pkg.arraycopy = function(src, spos, dest, dpos, dlen) {
    for(var i=0; i<dlen; i++) dest[i + dpos] = src[spos + i];
};

pkg.currentTimeMillis = function() { return (new Date()).getTime(); };

pkg.str2bytes = function(s) {
    var ar = [];
    for (var i = 0; i < s.length; i++) {
        var code = s.charCodeAt(i);
        ar.push((code >> 8) & 0xFF);
        ar.push(code & 0xFF);
    }
    return ar;
};

var digitRE = /[0-9]/;
pkg.isDigit = function(ch) {
    if (ch.length != 1) throw new Error("Incorrect character");
    return digitRE.test(ch);
};

var letterRE = /[A-Za-z]/;
pkg.isLetter = function (ch) {
    if (ch.length != 1) throw new Error("Incorrect character");
    return letterRE.test(ch);
};

pkg.Listeners = function(n) {
    this.n = n ? n : 'fired';
};

var L = pkg.Listeners.prototype;

L.add = function(l) {
    if (!this.v) this.v = [];
    this.v.push(l);
};

L.remove = function(l) {
    if (this.v) {
        var i = 0;
        while((i = this.v.indexOf(l)) >= 0) this.v.splice(i, 1);
    }
};

L.fire = function() {
    if(this.v) {
        var n = this.n;
        for(var i = 0;i < this.v.length; i++) {
            var v = this.v[i];
            if (typeof v === 'function') v.apply(this, arguments);
            else v[n].apply(v, arguments);
        }
    }
};

L.removeAll = function(){ if (this.v) this.v.length = 0; };

pkg.MListeners = function() {
    if (arguments.length == 0) throw new Error();
    var $this = this;
    this.methods = {};
    for(var i=0; i<arguments.length; i++) {
        var c = [], m = arguments[i];
        this.methods[m] = c;
        (function(m, c) {
            $this[m] = function() {
                for(var i=0;i<c.length; i++) c[i][1].apply(c[i][0], arguments);
            };
        })(m, c);
    }
};

var ML = pkg.MListeners.prototype;

ML.add = function(l) {
    if (typeof l === 'function') {
        var n = zebra.FN(l);
        if (n == '') {
            for(var k in this.methods) {
                if (this.methods.hasOwnProperty(k)) this.methods[k].push([this, l]);
            }
        }
        else {
            if (this.methods.hasOwnProperty(n) === false) throw new Error("Unknown listener " + n);
            this.methods[n].push([this, l]);
        }
    }
    else {
        var b = false;
        for(var k in this.methods) {
            if (this.methods.hasOwnProperty(k)) {
                if (typeof l[k] === "function") {
                    this.methods[k].push([l, l[k]]);
                    b = true;
                }
            }
        }
        if (b === false) throw new Error("No listener can be registered for " + l);
    }
};

ML.remove = function(l) {
    for(var k in this.methods) {
        var v = this.methods[k];
        for(var i = 0; i < v.length; i++) {
            var f = v[i];
            if (l != this && (f[1] == l || f[0] == l)) v.splice(i, 1);
        }
    }
};

ML.removeAll = function(l) {
    for(var k in this.methods) {
        if (thi.methods.hasOwnProperty(k)) this.methods[k].length = 0;
    }
};

var Position = pkg.Position = Class([
    function $clazz() {
        this.PositionMetric = Interface();
        this.DOWN = 1;
        this.UP   = 2;
        this.BEG  = 3;
        this.END  = 4;
    },

    function $prototype() {
        this.invalidate = function (){ this.isValid = false; };

        this.clearPos = function (){
            if(this.offset >= 0){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
                this.offset  = this.currentLine = this.currentCol - 1;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.setOffset = function(o){
            if(o < 0) o = 0;
            else {
                var max = this.metrics.getMaxOffset();
                if(o >= max) o = max;
            }

            if(o != this.offset){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol,  p = this.getPointByOffset(o);
                this.offset = o;
                if(p != null){
                    this.currentLine = p[0];
                    this.currentCol = p[1];
                }
                this.isValid = true;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.seek = function(off){ this.setOffset(this.offset + off); };

        this.setRowCol = function (r,c){
            if(r != this.currentLine || c != this.currentCol){
                var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
                this.offset = this.getOffsetByPoint(r, c);
                this.currentLine = r;
                this.currentCol = c;
                this._.fire(this, prevOffset, prevLine, prevCol);
            }
        };

        this.inserted = function (off,size){
            if(this.offset >= 0 && off <= this.offset){
                this.invalidate();
                this.setOffset(this.offset + size);
            }
        };

        this.removed = function (off,size){
            if(this.offset >= 0 && this.offset >= off){
                this.invalidate();
                if(this.offset >= (off + size)) this.setOffset(this.offset - size);
                else this.setOffset(off);
            }
        };

        this.getPointByOffset = function(off){
            if(off == -1) return [-1, -1];
            var m = this.metrics, max = m.getMaxOffset();
            if(off > max) throw new Error("" + off);
            if(max === 0) return [(m.getLines() > 0 ? 0 : -1)];
            if(off === 0) return [0,0];
            var d = 0, sl = 0, so = 0;
            if(this.isValid && this.offset !=  -1){
                sl = this.currentLine;
                so = this.offset - this.currentCol;
                if(off > this.offset) d = 1;
                else
                    if(off < this.offset) d =  -1;
                    else return [sl, this.currentCol];
            }
            else{
                d = (~~(max / off) === 0) ?  -1 : 1;
                if(d < 0){
                    sl = m.getLines() - 1;
                    so = max - m.getLineSize(sl);
                }
            }
            for(; sl < m.getLines() && sl >= 0; sl += d){
                var ls = m.getLineSize(sl);
                if(off >= so && off < so + ls) return [sl, off - so];
                so += d > 0 ? ls : -m.getLineSize(sl - 1);
            }
            return [-1, -1];
        };

        this.getOffsetByPoint = function (row,col){
            var startOffset = 0, startLine = 0, m = this.metrics;

            if(row >= m.getLines() || col >= m.getLineSize(row)) throw new Error();
            if(this.isValid && this.offset !=  -1) {
                startOffset = this.offset - this.currentCol;
                startLine = this.currentLine;
            }
            if (startLine <= row) for(var i = startLine;i < row; i++) startOffset += m.getLineSize(i);
            else for(var i = startLine - 1;i >= row; i--) startOffset -= m.getLineSize(i);
            return startOffset + col;
        };

        this.calcMaxOffset = function (){
            var max = 0, m = this.metrics;
            for(var i = 0;i < m.getLines(); i ++ ) max += m.getLineSize(i);
            return max - 1;
        };
    },

    function (pi){
        this._ = new pkg.Listeners("posChanged");
        this.isValid = false;
        this.metrics = null;
        this.currentLine = this.currentCol = this.offset = 0;
        this.setPositionMetric(pi);
    },

    function setPositionMetric(p){
        if(p == null) throw new Error();
        if(p != this.metrics){
            this.metrics = p;
            this.clearPos();
        }
    },

    function seekLineTo(t){ this.seekLineTo(t, 1); },

    function seekLineTo(t,num){
        if(this.offset < 0){
            this.setOffset(0);
            return;
        }
        var prevOffset = this.offset, prevLine = this.currentLine, prevCol = this.currentCol;
        switch(t)
        {
            case Position.BEG:
                if(this.currentCol > 0){
                    this.offset -= this.currentCol;
                    this.currentCol = 0;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.END:
                var maxCol = this.metrics.getLineSize(this.currentLine);
                if(this.currentCol < (maxCol - 1)){
                    this.offset += (maxCol - this.currentCol - 1);
                    this.currentCol = maxCol - 1;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.UP:
                if(this.currentLine > 0){
                    this.offset -= (this.currentCol + 1);
                    this.currentLine--;
                    for(var i = 0;this.currentLine > 0 && i < (num - 1); i++ , this.currentLine--){
                        this.offset -= this.metrics.getLineSize(this.currentLine);
                    }
                    var maxCol = this.metrics.getLineSize(this.currentLine);
                    if(this.currentCol < maxCol) this.offset -= (maxCol - this.currentCol - 1);
                    else this.currentCol = maxCol - 1;
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            case Position.DOWN:
                if(this.currentLine < (this.metrics.getLines() - 1)){
                    this.offset += (this.metrics.getLineSize(this.currentLine) - this.currentCol);
                    this.currentLine++;
                    var size = this.metrics.getLines() - 1;
                    for(var i = 0;this.currentLine < size && i < (num - 1); i++ ,this.currentLine++ ){
                        this.offset += this.metrics.getLineSize(this.currentLine);
                    }
                    var maxCol = this.metrics.getLineSize(this.currentLine);
                    if(this.currentCol < maxCol) this.offset += this.currentCol;
                    else {
                        this.currentCol = maxCol - 1;
                        this.offset += this.currentCol;
                    }
                    this._.fire(this, prevOffset, prevLine, prevCol);
                } break;
            default: throw new Error();
        }
    }
]);

pkg.timer = new (function() {
    var quantum = 40;

    function CI() {
       this.run = null;
       this.ri = this.si = 0;
    }

    this.consumers  = Array(5);
    this.aconsumers = 0;
    for(var i = 0; i< this.consumers.length; i++) this.consumers[i] = new CI();

    this.get = function(r) {
        if (this.aconsumers > 0) {
            for(var i=0; i < this.consumers.length; i++) {
                var c = this.consumers[i];
                if (c.run != null && c.run == r) return c;
            }
        }
        return null;
    };

    this.run = function(r, startIn, repeatIn){
        var ps = this.consumers.length;
        if (this.aconsumers == ps) throw new Error("Out of runners limit");

        var ci = this.get(r);
        if (ci == null) {
            var consumers = this.consumers, $this = this;
            for(var i=0; i < ps; i++) {
                var j = (i + this.aconsumers) % ps, c = consumers[j];
                if (c.run == null) {
                    c.run = r;
                    c.si = startIn;
                    c.ri = repeatIn;
                    break;
                }
            }
            this.aconsumers++;

            if (this.aconsumers == 1) {
                var ii = window.setInterval(function() {
                    for(var i = 0; i < ps; i++) {
                        var c = consumers[i];
                        if (c.run != null) {
                            if (c.si <= 0){
                                try { c.run.run(); }
                                catch(e) {
                                    if (e.msg && e.msg.toLowerCase() === "interrupt") {
                                        c.run = null;
                                        $this.aconsumers--;
                                        if ($this.aconsumers === 0) break;
                                        continue;
                                    }
                                    zebra.out.print(e);
                                }
                                c.siw += c.ri;
                            }
                            else c.si -= quantum;
                        }
                    }
                    if ($this.aconsumers === 0) window.clearInterval(ii);
                }, quantum);
            }
         }
         else {
             ci.si = startIn;
             ci.ri = repeatIn;
         }
    };

    this.remove = function(l) {
        this.get(l).run = null;
        this.aconsumers--;
    };

    this.clear = function(l){
        var c = this.get(l);
        c.si = c.ri;
    };
})();

pkg.Bag = zebra.Class([
    function $prototype() {
        this.get = function(key) {
            if (key == null) throw new Error("Null key");
            var n = key.split('.'), v = this.objects;
            for(var i = 0; i < n.length; i++) {
                v = v[n[i]];
                if (typeof v === "undefined") return v;
            }
            return v != null && v.$new ? v.$new() : v;
        };

        this.mergeContent = function(o, v) {
            if (v === null || zebra.isNumber(v) || zebra.isBoolean(v) || zebra.isString(v)) return v;

            if (Array.isArray(v)) {
                if (o && !Array.isArray(o)) throw new Error("Array merging type inconsistency");
                return o ? o.concat(v) : v;
            }

            for (var k in v) {
                if (v.hasOwnProperty(k)) {
                    o[k] = o.hasOwnProperty(k) ? this.mergeContent(o[k], v[k]) : v[k];
                }
            }
            return o;
        };

        // create, merge to o and return a value by the given description d that is designed to be assigned to o
        // -- atomic types int string boolean number are returned as is
        // -- created by the given description array are append to o array
        // -- structure description (dictionary) are merged to o
        this.mergeObjWithDesc = function(o, d) {
            // atomic type should be returned as is
            if (d === null || zebra.isNumber(d) || zebra.isBoolean(d)) {
                return d;
            }

            // array should be merged (concat)
            if (Array.isArray(d)) {
                var v = [];
                for(var i=0; i< d.length; i++) v[i] = this.mergeObjWithDesc(null, d[i]);
                if (o && Array.isArray(o) === false) throw new Error("Destination has to be array");
                return (o != null) ? o.concat(v) : v;
            }

            // string is atomic, but  string can encode type other than string, decode string
            // (if necessary) by calling decodeStringValue method
            if (zebra.isString(d)) {
                return (d[0] == "@") ? this.get(d.substring(1)) : this.decodeStringValue(d);
            }

            // store and cleanup $inherit synthetic field from description.
            var inh = null;
            if (d.hasOwnProperty("$inherit")) {
                inh = d["$inherit"];
                delete d["$inherit"];
            }

            // test whether we have a class definition
            for (var k in d) {
                // handle class definition
                if (k[0] == '$' && d.hasOwnProperty(k)) {
                    var classname = k.substring(1).trim(), args = d[k];
                    args = this.mergeObjWithDesc(null, Array.isArray(args) ? args : [ args ]);
                    delete d[k];

                    if (classname[0] == "*") {
                        return (function(clazz, args) {
                            return {
                                $new : function() { return pkg.newInstance(clazz, args); }
                            };
                        })(this.resolveClass(classname.substring(1).trim()), args);
                    }
                    return this.mergeObjWithDesc(pkg.newInstance(this.resolveClass(classname), args), d);
                }

                //!!!! trust the name of class occurs first what in general cannot be guaranteed by JSON spec
                //     but we can trust since many other third party applications stands on it too :)
                break;
            }

            // the description is not atomic or array type. it can be either a number of fields that should be
            // merged with appropriate field of o object, or it can define how to instantiate an instance of a
            // class. There is one special case: ".name" property says that object is created by calling
            // "name" method

            var v = (o == null || zebra.isNumber(o) || zebra.isBoolean(o) || zebra.isString(o) || Array.isArray(o)) ? d : o;

            for (var k in d) {
                if (d.hasOwnProperty(k)) {
                    // special field name that says to create method  to create a value by the given description
                    if (k[0] == ".") {
                        var vv = d[k];
                        if (Array.isArray(vv) === false) vv = [ vv ];
                        return this.objects[k.substring(1).trim()].apply(this.objects, this.mergeObjWithDesc(null, vv));
                    }

                    //  handle description as property value
                    if (k[0] == ':') {
                        var clazz = v && v.getClazz ? v.getClazz() : null;
                        pkg.getPropertySetter(clazz, k.substring(1).trim())(v, this.mergeObjWithDesc(null, d[k]));
                    }
                    else {
                        var po = o && o.hasOwnProperty(k) ? o[k] : null;
                        v[k] = d[k];
                        v[k] = this.mergeObjWithDesc(po, d[k]);
                    }
                }
            }

            if (inh !== null) this.inherit(v, inh);
            return v;
        };

        this.decodeStringValue = function(v) {
            return (v[0] == "#" || (v[0] == 'r' && v[1] == 'g' && v[2] == 'b')) ? new pkg.rgb(v) : v;
        };

        this.resolveClass = function (clazz) {
            return this.aliases.hasOwnProperty(clazz) ? this.aliases[clazz]
                                                      : zebra.Class.forName(clazz);
        };

        this.inherit = function(o, pp) {
            for(var i=0; i < pp.length; i++) {
                var op = this.objects, n = pp[i].trim(), nn = n.split("."), j = 0;
                while (j < nn.length) {
                    op = op[nn[j++]];
                    if (op == null) {
                        throw new Error("Cannot find referenced object by '" + n + "(" + nn[j-1] + ")' path");
                    }
                }

                for(var k in op) {
                    if (op.hasOwnProperty(k) && o.hasOwnProperty(k) === false) o[k] = op[k];
                }
            }
        };
    },

    function () { this.$this({}); },

    function (container) {
        this.aliases = {};
        this.objects = container;
        this.content = {};
    },

    function load(s) { return this.load(s, true); },

    function load(s, b) {
        if (this.isloaded === true) throw new Error("Load is done");
        var content = null;
        try { content = JSON.parse(s); }
        catch(e) { throw new Error("Wrong JSON format"); }
        this.content = this.mergeContent(this.content, content);
        this.loaded(this.content);
        if (b === true) this.end();
        return this;
    },

    function end() {
        if (typeof this.isloaded === "undefined") {
            this.isloaded = true;
            if (this.content.hasOwnProperty("$aliases")) {
                var aliases = this.content["$aliases"];
                for(var k in aliases) {
                    this.aliases[k.trim()] = Class.forName(aliases[k].trim());
                }
                delete this.content["$aliases"];
            }
            this.objects = this.mergeObjWithDesc(this.objects, this.content);
        }
    },

    function loaded(c) {}
]);

})(zebra("util"), zebra.Class, zebra.Interface);

(function(pkg, Class) {    pkg.QS = Class(function() {        this.append = function (url, obj) {            return url + ((obj === null) ? '' : ((url.indexOf("?") > 0) ? '&' : '?') + pkg.QS.toQS(obj, true));        };        this.parse = function(url) {            var m = window.location.search.match(/[?&][a-zA-Z0-9_.]+=[^?&=]+/g), r = {};            for(var i=0; m && i < m.length; i++) {                var l = m[i].split('=');                r[l[0].substring(1)] = decodeURIComponent(l[1]);            }            return r;        };        this.toQS = function(obj, encode) {            if (typeof encode === "undefined") encode = true;            if (zebra.isString(obj) || zebra.isBoolean(obj) || zebra.isNumber(obj)) return "" + obj;            var p = [];            for(var k in obj) {                if (obj.hasOwnProperty(k)) p.push(k + '=' + (encode ? encodeURIComponent(obj[k].toString()) : obj[k].toString()));            }            return p.join("&");        };    });    pkg.getRequest = function(type) {        if (zebra.isIE || type === 0 || type === 1) {            if ((location.protocol.toLowerCase() === "file:" && type != 1) || type === 0) {                return new (function() {                    var o = new ActiveXObject("MSXML2.XMLHTTP"), $this = this;                    this.responseText = this.statusText = "";                    this.onreadystatechange = this.responseXml = null;                    this.readyState = this.status = 0;                    this.__type = "aie";                    o.onreadystatechange = function() {                        $this.readyState = o.readyState;                        if (o.readyState == 4) {                            $this.responseText = o.responseText;                            $this.responseXml  = o.responseXml;                            $this.status     = o.status;                            $this.statusText = o.statusText;                        }                        if ($this.onreadystatechange) $this.onreadystatechange();                    };                    this.open  = function(method, url, async, user, password) { return o.open(method, url, (async !== false), user, password); };                    this.send  = function(data) { return o.send(data); };                    this.abort = function(data) { return o.abort(); };                    this.setRequestHeader = function(name, value) { o.setRequestHeader(name, value); };                    this.getResponseHeader = function(name) { return o.getResponseHeader(name); };                    this.getAllResponseHeaders = function() { return o.getAllResponseHeaders(); };                })();            }            var obj = new XDomainRequest();            obj._open  = obj.open;            obj._send  = obj.send;            obj._async = true;            obj.__type = "xie";            obj.statusText = "";            obj.status = obj.readyState = 0;            obj.open = function(method, url, async, user, password) {                this._async = (async === true);                return this._open(method, url);            };            obj.setRequestHeader = obj.getResponseHeader = obj.getAllResponseHeaders = function () {                throw new Error("Method is not supported");            };            obj.send = function(data) {                var req = this;                this.onerror =function() { req.status = 404; };                this.onload = function() { req.status = 200; };                if (this._async === false) {                    var result = this._send(data);                    while (this.status === 0) {                        zebra.util.sleep();                    }                    this.readyState = 4;                    if (this.onreadystatechange) this.onreadystatechange();                    return result;                }                return this._send(data);            };            return obj;        }        var r = new XMLHttpRequest();        if (zebra.isFF) {            r.__send = r.send;            r.send = function(data) {                // !!! FF can throw NS_ERROR_FAILURE exception instead of returning 404 File Not Found HTTP error code                // !!! No request status, statusText are defined in this case                try { return this.__send(data); }                catch(e) {                    if (!e.message || e.message.toUpperCase().indexOf("NS_ERROR_FAILURE") < 0) throw e;                }            };        }        return r;    };    pkg.HTTP = Class([        function(url) { this.url = url; },        function GET()     { return this.GET(null, null); },        function GET(f)    { return (typeof f === 'function') ? this.GET(null, f) : this.GET(f, null);  },        function GET(d, f) { return this.SEND("GET", pkg.QS.append(this.url, d), null, f); },        function POST()     { return this.POST(null, null); },        function POST(d)    { return (typeof d === "function") ? this.POST(null, d) : this.POST(pkg.QS.toQS(d, false), null); },        function POST(d, f) { return this.SEND("POST", this.url, d, f); },        function SEND(method, url, data, callback) {            var r = pkg.getRequest(), $this = this;            if (callback !== null) {                r.onreadystatechange = function() {                    if (r.readyState == 4) {                        $this.httpError(r);                        callback(r.responseText, r);                    }                };            }            r.open(method, url, callback !== null);            r.send(data);            if (callback === null) {                this.httpError(r);                return r.responseText;            }        },        function httpError(r) { if (r.status != 200) throw new Error("HTTP error:" + r.status + "'" + r.responseText + "'"); }    ]);    pkg.GET = function(url) {        var http = new pkg.HTTP(url);        return http.GET.apply(http, Array.prototype.slice.call(arguments, 1));    };    pkg.POST = function(url) {        var http = new pkg.HTTP(url);        return http.POST.apply(http, Array.prototype.slice.call(arguments, 1));    };    var isBA = typeof(ArrayBuffer) !== 'undefined';    pkg.InputStream = Class([        function(container) {            if (isBA && container instanceof ArrayBuffer) this.data = new Uint8Array(container);            else {                if (zebra.isString(container)) {                    this.Field(function read() { return this.available() > 0 ? this.data.charCodeAt(this.pos++) & 0xFF : -1; });                }                else {                    if (Array.isArray(container) === false) throw new Error("Wrong type: " + typeof(container));                }                this.data = container;            }            this.marked = -1;            this.pos    = 0;        },        function mark() {            if (this.available() <= 0) throw new Error();            this.marked = this.pos;        },        function reset() {            if (this.available() <= 0 || this.marked < 0) throw new Error();            this.pos    = this.marked;            this.marked = -1;        },        function close()   { this.pos = this.data.length; },        function read()    { return this.available() > 0 ? this.data[this.pos++] : -1; },        function read(buf) { return this.read(buf, 0, buf.length); },        function read(buf, off, len) {            for(var i = 0; i < len; i++) {                var b = this.read();                if (b < 0) return i === 0 ? -1 : i;                buf[off + i] = b;            }            return len;        },        function readChar() {            var c = this.read();            if (c < 0) return -1;            if (c < 128) return String.fromCharCode(c);            var c2 = this.read();            if (c2 < 0) throw new Error();            if (c > 191 && c < 224) return String.fromCharCode(((c & 31) << 6) | (c2 & 63));            else {                var c3 = this.read();                if (c3 < 0) throw new Error();                return String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));            }        },        function readLine() {            if (this.available() > 0)            {                var line = [], b;                while ((b = this.readChar()) != -1 && b != "\n") line.push(b);                var r = line.join('');                line.length = 0;                return r;            }            return null;        },        function available() { return this.data === null ? -1 : this.data.length - this.pos; },        function toBase64() { return zebra.util.b64encode(this.data); }    ]);    pkg.URLInputStream = Class(pkg.InputStream, [        function(url) {  this.$this(url, null); },        function(url, f) {            var r = pkg.getRequest(), $this = this;            r.open("GET", url, f !== null);            if (f === null || isBA === false) {                if (!r.overrideMimeType) throw new Error("Binary mode is not supported");                r.overrideMimeType("text/plain; charset=x-user-defined");            }            if (f !== null)  {                if (isBA) r.responseType = "arraybuffer";                r.onreadystatechange = function() {                    if (r.readyState == 4) {                        if (r.status != 200)  throw new Error(url);                        $this.getClazz().$parent.getMethod('', 1).call($this, isBA ? r.response : r.responseText); // $this.$super(res);                        f($this.data, r);                    }                };                r.send(null);            }            else {                r.send(null);                if (r.status != 200) throw new Error(url);                this.$super(r.responseText);            }        },        function close() {            this.$super();            if (this.data) {                this.data.length = 0;                this.data = null;            }        }    ]);    pkg.Service = Class([        function(url, methods) {            var $this = this;            this.url = url;            if (Array.isArray(methods) === false) methods = [ methods ];            for(var i=0; i < methods.length; i++) {                (function() {                    var name = methods[i];                    $this[name] = function() {                        var args = Array.prototype.slice.call(arguments);                        if (args.length > 0 && typeof args[args.length - 1] == "function") {                            var callback = args.pop();                            return this.send(url, this.encode(name, args), function(res) { callback($this.decode(res)); } );                        }                        return this.decode(this.send(url, this.encode(name, args), null));                    };                })();            }        },        function send(url, data, callback) { return pkg.POST(url, data, callback); }    ]);    pkg.Service.invoke = function(clazz, url, method) {        var rpc = new clazz(url, method);        return function() { return rpc[method].apply(rpc, arguments); };    };    pkg.JRPC = Class(pkg.Service, [        function(url, methods) {            this.$super(url, methods);            this.version = "2.0";        },        function encode(name, args) {            return JSON.stringify({ jsonrpc: this.version, method: name, params: args, id: zebra.util.ID() });        },        function decode(r) {            if (r === null || r.length === 0) throw new Error("Empty JSON result string");            r = JSON.parse(r);            if (typeof(r.error) !== "undefined") throw new Error(r.error.message);            if (typeof r.result === "undefined" || typeof r.id === "undefined") throw new Error("Wrong JSON response format");            return r.result;        }    ]);    pkg.Base64 = function(s) { if (arguments.length > 0) this.encoded = zebra.util.b64encode(s); };    pkg.Base64.prototype.toString = function() { return this.encoded; };    pkg.Base64.prototype.decode   = function() { return zebra.util.b64decode(this.encoded); };    pkg.XRPC = Class(pkg.Service, [        function(url, methods) { this.$super(url, methods); },        function encode(name, args) {            var p = ["<?xml version=\"1.0\"?>\n<methodCall><methodName>", name, "</methodName><params>"];            for(var i=0; i < args.length;i++) {                p.push("<param>");                this.encodeValue(args[i], p);                p.push("</param>");            }            p.push("</params></methodCall>");            return p.join('');        },        function encodeValue(v, p)  {            if (v === null) throw new Error("Null is not allowed");            if (zebra.isString(v)) {                v = v.replace("<", "&lt;");                v = v.replace("&", "&amp;");                p.push("<string>", v, "</string>");            }            else {                if (zebra.isNumber(v)) {                    if (Math.round(v) == v) p.push("<i4>", v.toString(), "</i4>");                    else                    p.push("<double>", v.toString(), "</double>");                }                else {                    if (zebra.isBoolean(v)) p.push("<boolean>", v?"1":"0", "</boolean>");                    else {                        if (v instanceof Date)  p.push("<dateTime.iso8601>", zebra.util.dateToISO8601(v), "</dateTime.iso8601>");                        else {                            if (Array.isArray(v))  {                                p.push("<array><data>");                                for(var i=0;i<v.length;i++) {                                    p.push("<value>");                                    this.encodeValue(v[i], p);                                    p.push("</value>");                                }                                p.push("</data></array>");                            }                            else {                                if (v instanceof pkg.Base64) p.push("<base64>", v.toString(), "</base64>");                                else {                                    p.push("<struct>");                                    for(var k in v) {                                        if (v.hasOwnProperty(k)) {                                            p.push("<member><name>", k, "</name><value>");                                            this.encodeValue(v[k], p);                                            p.push("</value></member>");                                        }                                    }                                    p.push("</struct>");                                }                            }                        }                    }                }            }        },        function decodeValue(node) {            var tag = node.tagName.toLowerCase();            if (tag == "struct")            {                 var p = {};                 for(var i=0; i < node.childNodes.length; i++) {                    var member = node.childNodes[i],  // <member>                        key    = member.childNodes[0].childNodes[0].nodeValue.trim(); // <name>/text()                    p[key] = this.decodeValue(member.childNodes[1].childNodes[0]);   // <value>/<xxx>                }                return p;            }            if (tag == "array") {                var a = [];                node = node.childNodes[0]; // <data>                for(var i=0; i < node.childNodes.length; i++) {                    a[i] = this.decodeValue(node.childNodes[i].childNodes[0]); // <value>                }                return a;            }            var v = node.childNodes[0].nodeValue.trim();            switch (tag) {                case "datetime.iso8601": return zebra.util.ISO8601toDate(v);                case "boolean": return v == "1";                case "int":                case "i4":     return parseInt(v, 10);                case "double": return Number(v);                case "base64":                    var b64 = new pkg.Base64();                    b64.encoded = v;                    return b64;                case "string": return v;            }            throw new Error("Unknown tag " + tag);        },        function decode(r) {            var p = zebra.util.parseXML(r), c = p.getElementsByTagName("fault");            if (c.length > 0) {                var err = this.decodeValue(c[0].getElementsByTagName("struct")[0]);                throw new Error(err.faultString);            }            c = p.getElementsByTagName("methodResponse")[0];            c = c.childNodes[0].childNodes[0]; // <params>/<param>            if (c.tagName.toLowerCase() === "param") return this.decodeValue(c.childNodes[0].childNodes[0]); // <value>/<xxx>            throw new Error("incorrect XML-RPC response");        }    ]);    pkg.XRPC.invoke = function(url, method) { return pkg.Service.invoke(pkg.XRPC, url, method); };    pkg.JRPC.invoke = function(url, method) { return pkg.Service.invoke(pkg.JRPC, url, method); };})(zebra("io"), zebra.Class);

(function(pkg, Class, Interface) {

pkg.TextModel = Interface();
var MB = zebra.util, Listeners = MB.Listeners, MListeners = MB.MListeners;

function Line(s) {
    this.s = s;
    this.l = 0;
}
Line.prototype.toString = function() { return this.s; };

pkg.Text = Class(pkg.TextModel, [
    function $prototype() {
        this.textLength = 0;

        this.getLnInfo = function(lines, start, startOffset, o){
            for(; start < lines.length; start++){
                var line = lines[start].s;
                if(o >= startOffset && o <= startOffset + line.length) return [start, startOffset];
                startOffset += (line.length + 1);
            }
            return [];
        };

        this.setExtraChar = function(i,ch){ this.lines[i].l = ch; };
        this.getExtraChar = function (i) { return this.lines[i].l; };
        this.getLine = function(line) { return this.lines[line].s; };
        this.getText = function(){ return this.lines.join("\n"); };
        this.getLines = function () { return this.lines.length; };
        this.getTextLength = function(){ return this.textLength; };

        this.write = function (s, offset){
            var slen = s.length, info = this.getLnInfo(this.lines, 0, 0, offset), line = this.lines[info[0]].s, j = 0,
                lineOff = offset - info[1], tmp = [line.substring(0, lineOff), s, line.substring(lineOff)].join('');

            for(; j < slen && s[j] != '\n'; j++);

            if(j >= slen) {
                this.lines[info[0]].s = tmp;
                j = 1;
            }
            else {
                this.lines.splice(info[0], 1);
                j = this.parse(info[0], tmp, this.lines);
            }
            this.textLength += slen;
            this._.fire(this, true, offset, slen, info[0], j);
        };

        this.remove = function (offset,size){
            var i1 = this.getLnInfo(this.lines, 0, 0, offset), i2 = this.getLnInfo(this.lines, i1[0], i1[1], offset + size),
                l2 = this.lines[i2[0]].s, l1= this.lines[i1[0]].s, off1 = offset - i1[1], off2 = offset + size - i2[1],
                buf = [l1.substring(0, off1), l2.substring(off2)].join('');

            if (i2[0] == i1[0]) this.lines.splice(i1[0], 1, new Line(buf));
            else {
                this.lines.splice(i1[0], i2[0] - i1[0] + 1);
                this.lines.splice(i1[0], 0, new Line(buf));
            }
            this.textLength -= size;
            this._.fire(this, false, offset, size, i1[0], i2[0] - i1[0] + 1);
        };

        this.parse  =function (startLine, text, lines){
            var size = text.length, prevIndex = 0, prevStartLine = startLine;
            for(var index = 0; index <= size; prevIndex = index, startLine++){
                var fi = text.indexOf("\n", index);
                index = (fi < 0 ? size : fi);
                this.lines.splice(startLine, 0, new Line(text.substring(prevIndex, index)));
                index++;
            }
            return startLine - prevStartLine;
        };
    },

    function() { this.$this(""); },

    function(s){
        this.lines = [ new Line("") ];
        this._ = new Listeners("textUpdated");
        this.setText(s);
    },

    function setText(text){
        if (text == null) throw new Error();
        var old = this.getText();
        if (old !== text) {
            if (old.length > 0) {
                var numLines = this.getLines(), txtLen = this.getTextLength();
                this.lines.length = 0;
                this.lines = [ new Line("") ];
                this._.fire(this, false, 0, txtLen, 0, numLines);
            }

            this.lines = [];
            this.parse(0, text, this.lines);
            this.textLength = text.length;
            this._.fire(this, true, 0, this.textLength, 0, this.getLines());
        }
    }
]);

pkg.SingleLineTxt = Class(pkg.TextModel, [
    function $prototype() {
        this.setExtraChar = function(i,ch) { this.extra = ch; };
        this.getExtraChar = function(i){ return this.extra; };

        this.getText = function(){ return this.buf; };
        this.getLines = function(){ return 1; };
        this.getTextLength = function(){ return this.buf.length; };
        this.getMaxLength = function(){ return this.maxLen; };
        this.getLine = function(line){ return this.buf; };

        this.write = function(s,offset){
            var buf = this.buf, j = s.indexOf("\n");
            if (j >= 0) s = s.substring(0, j);
            var l = (this.maxLen > 0 && (buf.length + s.length) >= this.maxLen) ? this.maxLen - buf.length : s.length;
            if (l!==0) {
                this.buf = [buf.substring(0, offset), s.substring(0, l), buf.substring(offset)].join('');
                if (l > 0) this._.fire(this, true, offset, l, 0, 1);
            }
        };

        this.remove = function(offset,size){
            this.buf = [ this.buf.substring(0, offset), this.buf.substring(offset + size)].join('');
            this._.fire(this, false, offset, size, 0, 1);
        };
    },

    function()  { this.$this("",  -1); },
    function(s) { this.$this(s,  -1);  },

    function (s,max){
        this.maxLen = max;
        this.buf = null;
        this.extra = 0;
        this._ = new Listeners("textUpdated");
        this.setText(s);
    },

    function setMaxLength(max){
        if(max != this.maxLen){
            this.maxLen = max;
            this.setText("");
        }
    },

    function setText(text){
        if(text == null) throw new Error();
        var i = text.indexOf('\n');
        if (i >= 0) text = text.substring(0, i);
        if(this.buf == null || this.buf !== text) {
            if (this.buf != null && this.buf.length > 0) this._.fire(this, false, 0, this.buf.length, 0, 1);
            if (this.maxLen > 0 && text.length > this.maxLen) text = text.substring(0, this.maxLen);
            this.buf = text;
            this._.fire(this, true, 0, text.length, 0, 1);
        }
    }
]);

pkg.ListModel = Class([
    function () {
        this._ = new MListeners("elementInserted", "elementRemoved", "elementSet");
        this.d = [];
    },

    function $prototype() {
        this.elementAt = function(i){
            if (i < 0 || i >= this.d.length) throw new Error("" + i);
            return this.d[i];
        };

        this.addElement = function(o){
            this.d.push(o);
            this._.elementInserted(this, o, this.d.length - 1);
        };

        this.removeAllElements = function(){
            var size = this.d.length;
            for(var i = size - 1; i >= 0; i--) this.removeElementAt(i);
        };

        this.removeElementAt = function(i){
            var re = this.d[i];
            this.d.splice(i, 1);
            this._.elementRemoved(this, re, i);
        };

        this.removeElement = function(o){ 
            for(var i = 0;i < this.d.length; i++ ) if (this.d[i] === o) this.removeElementAt(i); 
        };

        this.insertElementAt = function(o,i){
            if(i < 0 || i >= this.d.length) throw new Error();
            this.d.splice(i, 0, o);
            this._.elementInserted(this, o, i);
        };

        this.elementsCount = function () { return this.d.length; };

        this.setElementAt = function (o,i){
            if(i < 0 || i >= this.d.length) throw new Error("" + i);
            var pe = this.d[i];
            this.d[i] = o;
            this._.elementSet(this, o, pe, i);
        };

        this.contains = function (o){ return this.indexOf(o) >= 0; };
        this.indexOf = function(o){ return this.d.indexOf(o); };
    }
]);

pkg.Item = Class([
    function (){ this.$this(null); },
    function (item) { this.setValue((item && item.value)? item.value : item); },

    function setValue(v){
        this.value = v;
        this.repr = v != null ? v.toString() : "null";
    }
]);

var ItemDesc = function(p) {
    this.kids = [];
    this.parent = p;
};

pkg.TreeModel = Class([
    function $clazz() {  
        this.Item = pkg.Item; 

        this.pclone = function(res,root,d){
            for(var i = 0;i < d.kids.length; i++){
                var originalItem = d.kids[i], item = new Item(originalItem);
                res.add(root, item);
                pkg.TreeModel.pclone(res, item, this.itemDesc(originalItem));
            }
        };
    },

    function $prototype() {
        this.getParent = function (item){ return this.itemDesc(item).parent; };
        this.getChildrenCount = function (item){ return this.itemDesc(item).kids.length; };
        this.hasChildren = function (item){ return this.itemDesc(item).kids.length > 0; };
        this.contains = function(item){ return typeof this.elements[item] !== "undefined"; };

        this.regItem = function (item,parent){
            this.elements[item] = new ItemDesc(parent);
            this._.itemInserted(this, item);
        };

        this.unregItem = function (item){
            var d = this.itemDesc(item);
            if(d.parent != null) rm(this.itemDesc(d.parent).kids, item);
            delete this.elements[item];
            if(item == this.root) this.root = null;
            this._.itemRemoved(this, item);
        };

        this.getChildAt = function(item,index){
            return this.itemDesc(item).kids[index];
        };

        this.getChildIndex = function (item){
            if(this.contains(item)){
                var p = this.getParent(item);
                return p != null ? this.itemDesc(p).kids.indexOf(item) : 0;
            }
            return  -1;
        };

        this.clone = function (item){
            var res = new pkg.TreeModel(root);
            pkg.TreeModel.pclone(res, new Item(item), this.itemDesc(item));
            return res;
        };

        this.set = function(item,o){
            item.setValue(o);
            this._.itemModified(this, item );
        };

        this.add = function(to,item){ this.insert(to, item, this.getChildrenCount(to)); };

        this.insert = function(to,item,index){
            if(index < 0) throw new Error();
            this.itemDesc(to).kids.splice(index, 0, item);
            this.regItem(item, to);
        };

        this.remove = function(item){
            var d = this.itemDesc(item);
            if(d.children != null) while(d.kids.length !== 0) this.remove(d.kids[0]);
            this.unregItem(item);
        };

        this.removeChild = function (p,i){ this.remove(this.itemDesc(p).kids[i]); };

        this.removeChildren = function (item){
            var items = this.getChildren(item);
            for(var i = 0;i < items.length; i++) this.remove(items[i]);
        };

        this.getRootChildren = function(){ return this.getChildren(this.root); };

        this.getChildren = function(item){
            var d = this.itemDesc(item), kids = d.kids, r = Array(kids.length);
            for(var i = 0;i < kids.length; i++) r[i] = kids[i];
            return r;
        };
    },

    function() { this.$this(new Item()); },

    function(r) {
        this.itemDesc = function(item){
            var v = this.elements[item];
            return typeof v === "undefined" ? null : v;
        };
        this.elements = {};
        this.root = null;
        this._ = new MListeners("itemMoved", "itemModified", "itemRemoved", "itemInserted");
        this.setRoot(r);
    },

    function setRoot(r){
        if(this.root != null && r == null) throw new Error();
        this.root = r;
        if(r != null) this.regItem(r, null);
    },

    function move(to,item){
        var p = this.getParent(item);
        this.itemDesc(p).removeKid(item);
        this.itemDesc(to).kids.push(item);
        this.itemDesc(item).parent = to;
        this._.itemMoved(this, item, p);
    }
]);

pkg.Matrix = Class([
    function $prototype() {
        this.get = function (row,col){
            return this.objs[row][col];
        };

        this.put = function(row,col,obj){
            if (arguments.length != 3) throw new Error();
            var nr = this.rows, nc = this.cols;
            if(row >= nr) nr += (row - nr + 1);
            if(col >= nc) nc += (col - nc + 1);
            this.setRowsCols(nr, nc);
            var old = this.objs[row] ? this.objs[row][col] : undefined;
            if (obj != old) {
                this.objs[row][col] = obj;
                this._.cellModified(this, row, col, old);
            }
        };

        this.puti = function(i, data){
            var p = zebra.util.index2point(i, this.rows);
            this.put(p[0], p[1], data);
        };

        this.setRowsCols = function(rows, cols){
            if(rows != this.rows || cols != this.cols){
                var pc = this.cols, pr = this.rows;
                this.rellocate(rows, cols);
                this.cols = cols;
                this.rows = rows;
                this._.matrixResized(this, pr, pc);
            }
        };

        this.rellocate = function(r, c) {
            if (r >= this.rows) {
                for(var i=this.rows; i < r; i++)  this.objs[i] = [];
            }
        };
    },

    function (rows,cols) {
        this.rows = this.cols = 0;
        this.objs    = [];
        this._ = new MListeners("matrixResized", "cellModified");
        this.setRowsCols(rows, cols);
    },

    function setRows(rows) { this.setRowsCols(rows, this.cols);},
    function setCols(cols) { this.setRowsCols(this.rows, cols); },

    function removeRows(begrow,count){
        if(begrow < 0 || begrow + count > this.rows) throw new Error();
        for(var i = (begrow + count);i < this.rows; i++, begrow++){
            for(var j = 0;j < this.cols; j ++ ){
                this.objs[begrow][j] = this.objs[i][j];
                this.objs[i][j] = null;
            }
        }
        this.rows -= count;
        this._.matrixResized(this, this.rows + count, this.cols);
    },

    function removeCols(begcol,count){
        if(begcol < 0 || begcol + count > this.cols) throw new Error();
        for(var i = (begcol + count);i < this.cols; i++, begcol++){
            for(var j = 0;j < this.rows; j++){
                this.objs[j][begcol] = this.objs[j][i];
                this.objs[j][i] = null;
            }
        }
        this.cols -= count;
        this._.matrixResized(this, this.rows, this.cols + count);
    }
]);

})(zebra("data"), zebra.Class, zebra.Interface);

(function(pkg, Class) {

var L = pkg.Layout = new zebra.Interface();
pkg.NONE        = 0;
pkg.LEFT        = 1;
pkg.RIGHT       = 2;
pkg.TOP         = 4;
pkg.BOTTOM      = 8;
pkg.CENTER      = 16;
pkg.HORIZONTAL  = 32;
pkg.VERTICAL    = 64;
pkg.TEMPORARY   = 128;

pkg.USE_PS_SIZE = 4;
pkg.STRETCH     = 256;

pkg.TLEFT  = pkg.LEFT  | pkg.TOP;
pkg.TRIGHT = pkg.RIGHT | pkg.TOP;
pkg.BLEFT  = pkg.LEFT  | pkg.BOTTOM;
pkg.BRIGHT = pkg.RIGHT | pkg.BOTTOM;

pkg.getDirectChild = function(parent,child){
    for(; child != null && child.parent != parent; child = child.parent) {}
    return child;
};

pkg.getDirectAt = function(x,y,p){
    for(var i = 0;i < p.kids.length; i++){
        var c = p.kids[i];
        if(c.isVisible && c.x <= x && c.y <= y && c.x + c.width > x && c.y + c.height > y) return i;
    }
    return -1;
};

pkg.getTopParent = function(c){
    for(; c != null && c.parent != null; c = c.parent);
    return c;
};

pkg.getAbsLocation = function(x,y,c){
    while (c.parent != null){
        x += c.x;
        y += c.y;
        c = c.parent;
    }
    return [x, y];
};

pkg.getRelLocation = function(x, y, p, c){
    while(c != p){
        x -= c.x;
        y -= c.y;
        c = c.parent;
    }
    return [x, y];
};

pkg.getXLoc = function(aow,alignX,aw){
    if (alignX == pkg.RIGHT)  return aw - aow;
    if (alignX == pkg.CENTER) return ~~((aw - aow) / 2);
    if (alignX == pkg.LEFT || alignX == pkg.NONE) return 0;
    throw new Error();
};

pkg.getYLoc = function(aoh,alignY,ah){
    if(alignY == pkg.BOTTOM) return ah - aoh;
    if(alignY == pkg.CENTER) return ~~((ah - aoh) / 2);
    if(alignY == pkg.TOP || alignY == pkg.NONE) return 0;
    throw new Error();
};

pkg.getMaxPreferredSize = function(target){
    var maxWidth = 0, maxHeight = 0;
    for(var i = 0;i < target.kids.length; i++){
        var l = target.kids[i];
        if(l.isVisible){
            var ps = l.getPreferredSize();
            if(ps.width > maxWidth) maxWidth = ps.width;
            if(ps.height > maxHeight) maxHeight = ps.height;
        }
    }
    return { width:maxWidth, height:maxHeight };
};

pkg.isAncestorOf = function(p,c){
    for(; c != null && c != p; c = c.parent);
    return c != null;
};

pkg.Layoutable = Class(L, [
    function $prototype() {
        this.x = this.y = this.height = this.width = this.cachedHeight= 0;
        this.psWidth = this.psHeight = this.cachedWidth = -1;
        this.isLayoutValid = this.isValid = false;
        this.constraints = this.parent = null;
        this.isVisible = true;

        this.validateMetric = function(){
            if (this.isValid === false){
                this.recalc();
                this.isValid = true;
            }
        };

        this.invalidateLayout = function(){
            this.isLayoutValid = false;
            if(this.parent != null) this.parent.invalidateLayout();
        };

        this.invalidate = function(){
            this.isValid = this.isLayoutValid = false;
            this.cachedWidth =  -1;
            if(this.parent != null) this.parent.invalidate();
        };

        this.validate = function(){
            this.validateMetric();
            if(this.width > 0 && this.height > 0 && this.isLayoutValid === false && this.isVisible) {
                this.layout.doLayout(this);
                for(var i = 0;i < this.kids.length; i++) {
                    this.kids[i].validate();
                }
                this.isLayoutValid = true;
                this.laidout();
            }
        };

        this.getPreferredSize = function(){
            this.validateMetric();
            if(this.cachedWidth < 0){
                var ps = (this.psWidth < 0 || this.psHeight < 0) ? this.layout.calcPreferredSize(this)
                                                                 : { width:0, height:0 };

                ps.width  = this.psWidth  >= 0 ? this.psWidth  : ps.width  + this.getLeft() + this.getRight();
                ps.height = this.psHeight >= 0 ? this.psHeight : ps.height + this.getTop()  + this.getBottom();
                this.cachedWidth  = ps.width;
                this.cachedHeight = ps.height;
                return ps;
            }
            return { width:this.cachedWidth, height:this.cachedHeight };
        };

        this.getTop    = function ()  { return 0; };
        this.getLeft   = function ()  { return 0; };
        this.getBottom = function ()  { return 0; };
        this.getRight  = function ()  { return 0; };

        this.laidout    = function (){};
        this.resized    = function (pw,ph){};
        this.relocated  = function (px,py){};
        this.kidAdded   = function (index,constr,l){};
        this.kidRemoved = function (index,l){};
        this.layoutSet  = function (old){};
        this.recalc     = function (){};

        this.setParent = function (o){
            if(o != this.parent){
                this.parent = o;
                this.invalidate();
            }
        };

        this.setLayout = function (m){
            if (m == null) throw new Error("Undefined layout");

            if(this.layout != m){
                var pl = this.layout;
                this.layout = m;
                this.invalidate();
                this.layoutSet(pl);
            }
        };

        this.calcPreferredSize = function (target){ return { width:0, height:0 }; };
        this.doLayout = function (target) {};

        this.get = function(i){
            if (i < 0 || i >= this.kids.length) throw new Error();
            return this.kids[i];
        };

        this.count = function (){ return this.kids.length; };

        this.indexOf = function (c){ return this.kids.indexOf(c); };

        this.insert = function(i,constr,d){
            d.setParent(this);
            if (d.constraints) constr = d.constraints;
            else               d.constraints = constr;

            if (i == this.kids.length) this.kids.push(d);
            else this.kids.splice(i, 0, d);

            this.kidAdded(i, constr, d);
            this.invalidate();
            return d;
        };

        this.setLocation = function (xx,yy){
            if(xx != this.x || this.y != yy){
                var px = this.x, py = this.y;
                this.x = xx;
                this.y = yy;
                this.relocated(px, py);
            }
        };

        this.setSize = function (w,h){
            if (w != this.width || h != this.height){
                var pw = this.width, ph = this.height;
                this.width = w;
                this.height = h;
                this.isLayoutValid = false;
                this.resized(pw, ph);
            }
        };

        this.getByConstraints = function (c) {
            if(this.kids.length > 0){
                for(var i = 0;i < this.kids.length; i++ ){
                    var l = this.kids[i];
                    if (c == l.constraints) return l;
                }
            }
            return null;
        };

        this.remove = function(c) { this.removeAt(this.kids.indexOf(c)); };

        this.removeAt = function (i){
            var obj = this.kids[i];
            obj.setParent(null);
            if (obj.constraints) obj.constraints = null;
            this.kids.splice(i, 1);
            this.kidRemoved(i, obj);
            this.invalidate();
            return obj;
        };
    },

    function() {
        this.kids = [];
        this.layout = this;
    },

    function add(constr,d) {
        return this.insert(this.kids.length, constr, d);
    },

    function setPreferredSize(w,h) {
        if (w != this.psWidth || h != this.psHeight){
            this.psWidth  = w;
            this.psHeight = h;
            this.invalidate();
        }
    }
]);

pkg.BorderLayout = Class(L, [
    function() { this.$this(0, 0); },

    function (hgap,vgap){
        this.hgap = hgap;
        this.vgap = vgap;
    },

    function $prototype() {
        this.calcPreferredSize = function (target){
            var center = null, west = null,  east = null, north = null, south = null, d = null;
            for(var i = 0; i < target.kids.length; i++){
                var l = target.kids[i];
                if(l.isVisible){
                    switch(l.constraints) {
                       case pkg.CENTER : center = l;break;
                       case pkg.TOP    : north  = l;break;
                       case pkg.BOTTOM : south  = l;break;
                       case pkg.LEFT   : west   = l;break;
                       case pkg.RIGHT  : east   = l;break;
                    }
                }
            }

            var dim = { width:0, height:0 };
            if (east != null) {
                d = east.getPreferredSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }

            if (west != null){
                d = west.getPreferredSize();
                dim.width += d.width + this.hgap;
                dim.height = Math.max(d.height, dim.height);
            }

            if (center != null){
                d = center.getPreferredSize();
                dim.width += d.width;
                dim.height = Math.max(d.height, dim.height);
            }

            if (north != null){
                d = north.getPreferredSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }

            if (south != null){
                d = south.getPreferredSize();
                dim.width = Math.max(d.width, dim.width);
                dim.height += d.height + this.vgap;
            }
            return dim;
        };

        this.doLayout = function(t){
            var top = t.getTop(), bottom = t.height - t.getBottom(),
                left = t.getLeft(), right = t.width - t.getRight(),
                center = null, west = null,  east = null;

            for(var i = 0;i < t.kids.length; i++){
                var l = t.kids[i];
                if(l.isVisible) {
                    switch(l.constraints) {
                        case pkg.CENTER: center = l; break;
                        case pkg.TOP :
                            var ps = l.getPreferredSize();
                            l.setLocation(left, top);
                            l.setSize(right - left, ps.height);
                            top += ps.height + this.vgap;
                            break;
                        case pkg.BOTTOM:
                            var ps = l.getPreferredSize();
                            l.setLocation(left, bottom - ps.height);
                            l.setSize(right - left, ps.height);
                            bottom -= ps.height + this.vgap;
                            break;
                        case pkg.LEFT: west = l; break;
                        case pkg.RIGHT: east = l; break;
                        default: throw new Error("Invalid constraints: " + l.constraints);
                    }
                }
            }

            if (east != null){
                var d = east.getPreferredSize();
                east.setLocation(right - d.width, top);
                east.setSize(d.width, bottom - top);
                right -= d.width + this.hgap;
            }

            if(west != null){
                var d = west.getPreferredSize();
                west.setLocation(left, top);
                west.setSize(d.width, bottom - top);
                left += d.width + this.hgap;
            }

            if(center != null){
                center.setLocation(left, top);
                center.setSize(right - left, bottom - top);
            }
        };
    }
]);

pkg.RasterLayout = Class(L, [
    function () { this.$this(0); },
    function (f){ this.flag = f; },

    function $prototype() {
        this.calcPreferredSize = function(c){
            var m = { width:0, height:0 }, b = (this.flag & pkg.USE_PS_SIZE) > 0;
            for(var i = 0;i < c.kids.length; i++ ){
                var el = c.kids[i];
                if(el.isVisible){
                    var ps = b ? el.getPreferredSize() : { width:el.width, height:el.height },
                        px = el.x + ps.width, py = el.y + ps.height;
                    if(px > m.width) m.width = px;
                    if(py > m.height) m.height = py;
                }
            }
            return m;
        };

        this.doLayout = function(c){
            var r = c.width - c.getRight(), b = c.height - c.getBottom(),
                usePsSize = (this.flag & pkg.USE_PS_SIZE) > 0;
            for(var i = 0;i < c.kids.length; i++ ){
                var el = c.kids[i], ww = 0, hh = 0;
                if(el.isVisible){
                    if(usePsSize){
                        var ps = el.getPreferredSize();
                        ww = ps.width;
                        hh = ps.height;
                    }
                    else{
                        ww = el.width;
                        hh = el.height;
                    }
                    if ((this.flag & pkg.HORIZONTAL) > 0) ww = r - el.x;
                    if ((this.flag & pkg.VERTICAL  ) > 0) hh = b - el.y;
                    el.setSize(ww, hh);
                }
            }
        };
    }
]);

pkg.FlowLayout = Class(L, [
    function (){ this.$this(pkg.LEFT, pkg.TOP, pkg.HORIZONTAL); },
    function (ax,ay){ this.$this(ax, ay, pkg.HORIZONTAL); },
    function (ax,ay,dir){ this.$this(ax, ay, dir, 0); },

    function (gap){
        this.$this();
        this.gap = gap;
    },

    function (ax,ay,dir,g){
        if(dir != pkg.HORIZONTAL && dir != pkg.VERTICAL) throw new Error();
        this.ax = ax;
        this.ay = ay;
        this.direction = dir;
        this.gap = g;
    },

    function $prototype() {
        this.calcPreferredSize = function (c){
            var m = { width:0, height:0 }, cc = 0;
            for(var i = 0;i < c.kids.length; i++){
                var a = c.kids[i];
                if(a.isVisible){
                    var d = a.getPreferredSize();
                    if(this.direction == pkg.HORIZONTAL){
                        m.width += d.width;
                        m.height = Math.max(d.height, m.height);
                    }
                    else{
                        m.width = Math.max(d.width, m.width);
                        m.height += d.height;
                    }
                    cc++;
                }
            }
            var add = this.gap * (cc - 1);
            if(this.direction == pkg.HORIZONTAL) m.width += add;
            else m.height += add;
            return m;
        };

        this.doLayout = function(c){
            var psSize = this.calcPreferredSize(c), t = c.getTop(), l = c.getLeft(), lastOne = null,
                px = pkg.getXLoc(psSize.width,  this.ax, c.width  - l - c.getRight()) + l,
                py = pkg.getYLoc(psSize.height, this.ay, c.height - t - c.getBottom()) + t;

            for(var i = 0;i < c.kids.length; i++){
                var a = c.kids[i];
                if(a.isVisible){
                    var d = a.getPreferredSize();
                    if(this.direction == pkg.HORIZONTAL){
                        a.setLocation(px, ~~((psSize.height - d.height) / 2) + py);
                        px += (d.width + this.gap);
                    }
                    else{
                        a.setLocation(px + ~~((psSize.width - d.width) / 2), py);
                        py += d.height + this.gap;
                    }
                    a.setSize(d.width, d.height);
                    lastOne = a;
                }
            }
            if(lastOne !== null && pkg.STRETCH == lastOne.constraints){
                if(this.direction == pkg.HORIZONTAL) lastOne.setSize(c.width - lastOne.x - c.getRight(), lastOne.height);
                else lastOne.setSize(lastOne.width, c.height - lastOne.y - c.getBottom());
            }
        };
    }
]);

pkg.ListLayout = Class(L, [
    function (){ this.$this(0); },
    function (gap){ this.$this( -1, gap); },

    function (ax, gap){
        if(ax !=  -1 && ax != pkg.LEFT && ax != pkg.RIGHT && ax != pkg.CENTER) throw new Error();
        this.ax = ax;
        this.gap = gap;
    },

    function $prototype() {
        this.calcPreferredSize = function (lw){
            var w = 0, h = 0;
            for(var i = 0;i < lw.kids.length; i++){
                var cc = lw.kids[i];
                if(cc.isVisible){
                    var d = cc.getPreferredSize();
                    h += (d.height + this.gap);
                    if(w < d.width) w = d.width;
                }
            }
            return { width:w, height:h };
        };

        this.doLayout = function (lw){
            var x = lw.getLeft(), y = lw.getTop(), psw = lw.width - x - lw.getRight();
            for(var i = 0;i < lw.kids.length; i++){
                var cc = lw.kids[i];
                if(cc.isVisible){
                    var d = cc.getPreferredSize();
                    cc.setSize((this.ax ==  -1) ? psw : d.width, d.height);
                    cc.setLocation((this.ax ==  -1) ? x : x + pkg.getXLoc(cc.width, this.ax, psw), y);
                    y += (d.height + this.gap);
                }
            }
        };
    }
]);

pkg.PercentLayout = Class(L, [
    function (){ this.$this(pkg.HORIZONTAL, 2); },
    function (dir, gap) { this.$this(dir, gap, true); },

    function (dir, gap, stretch){
        if(dir != pkg.HORIZONTAL && dir != pkg.VERTICAL) throw new Error("4005");
        this.dir = dir;
        this.gap = gap;
        this.stretch = stretch;
    },

    function $prototype() {
        this.doLayout = function(target){
            var right = target.getRight(), top = target.getTop(), bottom = target.getBottom(), left = target.getLeft(),
                size = target.kids.length, rs = -this.gap * (size === 0 ? 0 : size - 1), loc = 0, ns = 0;

            if (this.dir == pkg.HORIZONTAL){
                rs += target.width - left - right;
                loc = left;
            }
            else{
                rs += target.height - top - bottom;
                loc = top;
            }

            for(var i = 0;i < size; i ++ ){
                var l = target.kids[i], c = l.constraints;
                if(this.dir == pkg.HORIZONTAL){
                    ns = ((size - 1) == i) ? target.width - right - loc : ~~((rs * c) / 100);
                    var yy = top, hh = target.height - top - bottom;
                    if (this.stretch === false) {
                        var ph = hh;
                        hh = l.getPreferredSize().height;
                        yy = top + ~~((ph - hh) / 2 );
                    }

                    l.setLocation(loc, yy);
                    l.setSize(ns, hh);
                }
                else{
                    ns = ((size - 1) == i) ? target.height - bottom - loc : ~~((rs * c) / 100);
                    var xx = left, ww = target.width - left - right;
                    if (this.stretch === false) {
                        var pw = ww;
                        ww = l.getPreferredSize().width;
                        xx = left + ~~((pw - ww) / 2 );
                    }

                    l.setLocation(xx, loc);
                    l.setSize(ww, ns);
                }
                loc += (ns + this.gap);
            }
        };

        this.calcPreferredSize = function (target){
            var max = 0, size = target.kids.length, as = this.gap * (size === 0 ? 0 : size - 1);
            for(var i = 0;i < size; i++){
                var d = target.kids[i].getPreferredSize();
                if(this.dir == pkg.HORIZONTAL){
                    if(d.height > max) max = d.height;
                    as += d.width;
                }
                else {
                    if(d.width > max) max = d.width;
                    as += d.height;
                }
            }
            return (this.dir == pkg.HORIZONTAL) ? { width:as, height:max }
                                                : { width:max, height:as };
        };
    }
]);

pkg.Constraints = Class([
    function $prototype() {
        this.top = this.bottom = this.left = this.right = 0;
        this.ay = this.ax = pkg.STRETCH;
        this.rowSpan = this.colSpan = 1;

        this.equals = function(o) {
            return  this == o  ||  (o           != null    &&
                                    this.ax     == o.ax    &&
                                    this.ay     == o.ay    &&
                                    this.top    == o.top   &&
                                    this.left   == o.left  &&
                                    this.right  == o.right &&
                                    this.bottom == o.bottom   );
        };
    },

    function () {},

    function (ax, ay) {
        this.ax = ax;
        this.ay = ay;
    },

    function padding(p) {
        this.top = this.bottom = this.left = this.right = p;
    },

    function paddings(t,l,b,r) {
        this.top = t;
        this.bottom = b;
        this.left = l;
        this.right = r;
    }
]);

function getSizes(rows, cols, c, isRow){
    var max = isRow ? rows : cols, res = Array(max + 1);
    res[max] = 0;
    for(var i = 0;i < max; i++){
        res[i] = isRow ? getRowSize(i, cols, c) : getColSize(i, cols, c);
        res[max] += res[i];
    }
    return res;
}

function getRowSize(row, cols, c){
    var max = 0, s = zebra.util.indexByPoint(row, 0, cols);
    for(var i = s;i < c.kids.length && i < s + cols; i ++ ){
        var a = c.kids[i];
        if(a.isVisible){
            var arg = fetchConstraints(a), d = a.getPreferredSize().height;
            d += (arg.top + arg.bottom);
            max = Math.max(d, max);
        }
    }
    return max;
}

function getColSize(col, cols, c){
    var max = 0, r = 0, i;
    while((i = zebra.util.indexByPoint(r, col, cols)) < c.kids.length){
        var a = c.kids[i];
        if(a.isVisible){
            var arg = fetchConstraints(a), d = a.getPreferredSize().width;
            d += (arg.left + arg.right);
            max = Math.max(d, max);
        }
        r++;
    }
    return max;
}

function fetchConstraints(l){ return l.constraints || DEF_CONSTR; }

var DEF_CONSTR = new pkg.Constraints();
pkg.GridLayout = Class(L, [
    function (r,c){ this.$this(r, c, 0); },

    function (r,c,m){
        this.rows = r;
        this.cols = c;
        this.mask = m;
    },

    function $prototype() {
        this.calcPreferredSize = function(c){
            return { width :getSizes(this.rows, this.cols, c, false)[this.cols],
                     height:getSizes(this.rows, this.cols, c, true) [this.rows] };
        };

        this.doLayout = function(c){
            var rows = this.rows, cols = this.cols,
                colSizes = getSizes(rows, cols, c, false), rowSizes = getSizes(rows, cols, c, true),
                right = c.getRight(), top = c.getTop(), bottom = c.getBottom(), left = c.getLeft();

            if ((this.mask & pkg.HORIZONTAL) > 0){
                var dw = c.width - left - right - colSizes[cols];
                for(var i = 0;i < this.cols; i ++ ){
                    colSizes[i] = colSizes[i] + (colSizes[i] !== 0 ? ~~((dw * colSizes[i]) / colSizes[cols]) : 0);
                }
            }

            if((this.mask & pkg.VERTICAL) > 0){
                var dh = c.height - top - bottom - rowSizes[rows];
                for(var i = 0;i < this.rows; i++ ){
                    rowSizes[i] = rowSizes[i] + (rowSizes[i] !== 0 ? ~~((dh * rowSizes[i]) / rowSizes[rows]) : 0);
                }
            }

            var yy = top, cc = 0;
            for(var i = 0;i < this.rows && cc < c.kids.length; i++){
                var xx = left;
                for(var j = 0;j < this.cols && cc < c.kids.length; j++, cc++){
                    var l = c.kids[cc];
                    if(l.isVisible){
                        var arg = fetchConstraints(l), d = l.getPreferredSize(), cellW = colSizes[j], cellH = rowSizes[i];
                        cellW -= (arg.left + arg.right);
                        cellH -= (arg.top + arg.bottom);

                        if (pkg.STRETCH == arg.ax) d.width  = cellW;
                        if (pkg.STRETCH == arg.ay) d.height = cellH;
                        l.setSize(d.width, d.height);
                        l.setLocation(xx + arg.left + (pkg.STRETCH == arg.ax ? 0 : pkg.getXLoc(d.width,  arg.ax, cellW)),
                                      yy + arg.top  + (pkg.STRETCH == arg.ay ? 0 : pkg.getYLoc(d.height, arg.ay, cellH)));
                        xx += colSizes[j];
                    }
                }
                yy += rowSizes[i];
            }
        };
    }
]);

})(zebra("layout"), zebra.Class);

(function(pkg, Class, Interface) {

var rgb = zebra.util.rgb, L = zebra.layout, PositionMetric = zebra.util.Position.PositionMetric;

pkg.View = Class([
    function $clazz() {
        this.createView = function(f) {
            var v = new pkg.View();
            v.paint = f;
            return v;
        };
    },

    function $prototype() {
        this.gap = 2;
        this.getTop    = function() { return this.gap; };
        this.getBottom = function() { return this.gap; };
        this.getLeft   = function() { return this.gap; };
        this.getRight  = function() { return this.gap; };
        this.getPreferredSize = function() { return { width:0, height:0 }; };
    }
]);

pkg.Render = Class(pkg.View, [
    function (target) { this.setTarget(target); },

    function setTarget(o){
        if(this.target != o) {
            var old = this.target;
            this.target = o;
            if (this.targetWasChanged) this.targetWasChanged(old, o);
        }
    }
]);

pkg.Raised = Class(pkg.View, [
    function () { this.$this(pkg.lightBrColor, pkg.midBrColor); },

    function (brightest,middle) {
        this.brightest = brightest == null ? rgb.white : brightest;
        this.middle    = middle    == null ? rgb.gray  : middle;
    },

    function paint(g,x1,y1,w,h,d){
        var x2 = x1 + w - 1, y2 = y1 + h - 1;
        g.setColor(this.brightest);
        g.drawLine(x1 + 1, y1 + 1, x2 - 2, y1 + 1);
        g.drawLine(x1 + 1, y1, x1 + 1, y2 - 1);
        g.setColor(this.middle);
        g.drawLine(x2, y1, x2, y2);
        g.drawLine(x1, y2, x2, y2);
    }
]);

pkg.LightSunken = Class(pkg.View, [
    function () { this.$this(pkg.lightBrColor, pkg.midBrColor); },

    function (brightest,middle) {
        this.brightest = brightest == null ? rgb.white : brightest;
        this.middle    = middle    == null ? rgb.gray  : middle;
    },

    function paint(g,x1,y1,w,h,d){
        var x2 = x1 + w - 1, y2 = y1 + h - 1;
        g.setColor(this.middle);
        g.drawLine(x1, y1, x2 - 1, y1);
        g.drawLine(x1, y1, x1, y2 - 1);
        g.setColor(this.brightest);
        g.drawLine(x2, y1, x2, y2);
        g.drawLine(x1, y2, x2, y2);
    }
]);

pkg.Sunken = Class(pkg.View, [
    function () { this.$this(pkg.lightBrColor, pkg.midBrColor, pkg.darkBrColor); },

    function (brightest,middle,darkest) {
        this.brightest = brightest == null ? rgb.white : brightest;
        this.middle    = middle    == null ? rgb.gray  : middle;
        this.darkest   = darkest   == null ? rgb.black : darkest;
    },

    function paint(g,x1,y1,w,h,d){
        var x2 = x1 + w - 1, y2 = y1 + h - 1;
        g.setColor(this.middle);
        g.drawLine(x1, y1, x2 - 1, y1);
        g.drawLine(x1, y1, x1, y2 - 1);
        g.setColor(this.brightest);
        g.drawLine(x2, y1, x2, y2);
        g.drawLine(x1, y2, x2, y2);
        g.setColor(this.darkest);
        g.drawLine(x1 + 1, y1 + 1, x1 + 1, y2 - 1);
        g.drawLine(x1 + 1, y1 + 1, x2 - 1, y1 + 1);
    }
]);

pkg.Etched = Class(pkg.View, [
    function () { this.$this(pkg.lightBrColor, pkg.midBrColor); },

    function (brightest,middle) {
        this.brightest = brightest == null ? rgb.white : brightest;
        this.middle    = middle    == null ? rgb.gray  : middle;
    },

    function paint(g,x1,y1,w,h,d){
        var x2 = x1 + w - 1, y2 = y1 + h - 1;
        g.setColor(this.middle);
        g.drawLine(x1, y1, x1, y2 - 1);
        g.drawLine(x2 - 1, y1, x2 - 1, y2 - 1);
        g.drawLine(x1, y1, x2 - 1, y1);
        g.drawLine(x1, y2 - 1, x2 - 1, y2 - 1);

        g.setColor(this.brightest);
        g.drawLine(x2, y1 + 1, x2, y2);
        g.drawLine(x1 + 1, y1 + 1, x1 + 1, y2 - 2);
        g.drawLine(x1 + 1, y1 + 1, x2 - 2, y1 + 1);
        g.drawLine(x1 + 1, y2, x2, y2);
    }
]);

pkg.Border = Class(pkg.View, [
    function $clazz() {
        this.SOLID  = 1;
        this.DOTTED = 2;
        this.SPACE  = 4;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            if (this.style != pkg.Border.SPACE) {
                var ps = g.lineWidth;
                g.lineWidth = this.width;
                g.setColor(this.color);
                if (this.style == pkg.Border.SOLID) {
                    if (this.radius > 0) this.outline(g,x,y,w,h, d);
                    else {
                        var dt = this.width / 2;
                        g.beginPath();
                        g.rect(x + dt, y + dt, w - this.width, h - this.width);
                    }
                    g.setColor(this.color);
                    g.stroke();
                }
                else
                if (this.style == pkg.Border.DOTTED) g.drawDottedRect(x, y, w, h);
                g.lineWidth = ps;
            }
        };

        this.outline = function(g,x,y,w,h,d) {
            if (this.style != pkg.Border.SOLID || this.radius <= 0) return false;
            var r = this.radius, dt = this.width / 2, xx = x + w - dt, yy = y + h - dt;
            x += dt;
            y += dt;
            g.beginPath();
            g.moveTo(x - 1 + r, y);
            g.lineTo(xx - r, y);
            g.quadraticCurveTo(xx, y, xx, y + r);
            g.lineTo(xx, yy  - r);
            g.quadraticCurveTo(xx, yy, xx - r, yy);
            g.lineTo(x + r, yy);
            g.quadraticCurveTo(x, yy, x, yy - r);
            g.lineTo(x, y + r);
            g.quadraticCurveTo(x, y, x + r, y);
            return true;
        };
    },

    function() { this.$this(pkg.Border.SOLID); },

    function(c){
        if (zebra.isString(c)) {
            var r = /([0-9]+px)[ ]+([0-9]+px)?[ ]+(\w+)[ ]+(.*)/.match(c);
            if (r == null) throw new Error();

            var t = (e.length == 4) ? r[2].toLowerCase() : r[1].toLowerCase();
            t = "solid" ? pkg.Border.SOLID : ( t == "dotted" ? pkg.Border.DOTTED : -1);

            if (e.length == 4) {
                this.$this(t, r[3], parseInt(r[0].substring(0, r[0].length-1), 10), 
                                    parseInt(r[1].substring(0, r[1].length-1), 10));
            }
            else  {
                this.$this(t, r[2], parseInt(r[0].substring(0, r[0].length-1), 10));
            }
        }
        else this.$this(c, pkg.borderColor);
    },

    function (t,c)   { this.$this(t, c, 1, 0); },
    function (t,c,w) { this.$this(t, c, w, 0); },

    function (t,c,w,r){
        if (c == null) throw new Error();
        if (t != pkg.Border.DOTTED && t != pkg.Border.SOLID && t != pkg.Border.SPACE) throw new Error();
        this.style  = t;
        this.color  = (zebra.isString(c) ? new rgb(c) : c);
        this.width  = w;
        this.radius = r;
        this.gap = this.width + Math.round(this.radius / 4);
    }
]);

pkg.Gradient = Class(pkg.View, [
    function (c1,c2) { this.$this(c1, c2, L.VERTICAL); },

    function (c1,c2, orientation){
        this.orientation = orientation;
        this.startColor = zebra.isString(c1) ? new rgb(c1) : c1;
        this.endColor   = zebra.isString(c2) ? new rgb(c2) : c2;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,dd){
            var p = g.fillStyle, d = (this.orientation == L.HORIZONTAL? [0,1]: [1,0]),
                x1 = x*d[1], y1 = y * d[0], x2 = (x + w - 1) * d[1], y2 = (y + h - 1) * d[0];

            if (this.gradient == null || this.gx1 != x1 ||
                this.gx2 != x2 || this.gy1 != y1 || this.gy2 != y2)
            {
                this.gx1 = x1;
                this.gx2 = x2;
                this.gy1 = y1;
                this.gy2 = y2;
                this.gradient = g.createLinearGradient(x1, y1, x2, y2);
                this.gradient.addColorStop(0, this.startColor.toString());
                this.gradient.addColorStop(1, this.endColor.toString());
            }

            g.fillStyle = this.gradient;
            g.fillRect(x, y, w, h);
            g.fillStyle = p;
        };
    }
]);

pkg.Picture = Class(pkg.Render, [
    function (img) { this.$this(img,0,0,0,0, false);  },
    function (img,x,y,w,h){ this.$this(img,x,y,w,h, false); },

    function (img,x,y,w,h, ub){
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;
        if (ub === true) {
            this.buffer = document.createElement("canvas");
            this.buffer.width = 0;
        }
        this.$super(img);
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            if(this.target != null && w > 0 && h > 0){
                var img = this.target;
                if (this.buffer) {
                    img = this.buffer;
                    if (img.width <= 0) {
                        var ctx = img.getContext("2d");
                        if (this.width > 0) {
                            img.width  = this.width;
                            img.height = this.height;
                            ctx.drawImage(this.target, this.x, this.y, this.width,
                                          this.height, 0, 0, this.width, this.height);
                        }
                        else {
                            img.width  = this.target.width;
                            img.height = this.target.height;
                            ctx.drawImage(this.target, 0, 0);
                        }
                    }
                }

                if(this.width > 0 && !this.buffer) {
                    g.drawImage(img, this.x, this.y,
                                this.width, this.height, x, y, w, h);
                }
                else g.drawImage(img, x, y, w, h);
            }
        };

        this.targetWasChanged = function(o, n) {
            if (this.buffer) delete this.buffer;
        };

        this.getPreferredSize = function(){
            var img = this.target;
            return img == null ? { width:0, height:0 }
                               : (this.width > 0) ? { width:this.width, height:this.height }
                                                  : { width:img.width, height:img.height };
        };
    },

    function equals(o){
        return this.$super(o) && o.width  == this.width &&
                                 o.height == this.height &&
                                 o.x      == this.x &&
                                 o.y      == this.y;
    }
]);

pkg.CompositeView = Class(pkg.View, [
    function $prototype() {
        this.left = this.right = this.bottom = this.top = this.height = 0;

        this.getTop = function(){
            this.validate();
            return this.top;
        };

        this.getLeft = function(){
            this.validate();
            return this.left;
        };

        this.getBottom = function (){
            this.validate();
            return this.bottom;
        };

        this.getRight = function (){
            this.validate();
            return this.right;
        };

        this.getPreferredSize = function (){
            this.validate();
            return { width:this.width + this.left + this.right,
                     height:this.height + this.top + this.bottom };
        };

        this.validate = function (){
            if(this.width < 0){
                this.top = this.bottom = this.left = this.right = this.width = this.height = 0;
                for(var i = 0;i < this.views.length; i ++ ){
                    var s = this.views[i], ps = s.getPreferredSize();
                    if (ps.width > this.width) this.width = ps.width;
                    if (ps.height > this.height) this.height = ps.height;
                    this.top = Math.max(this.top, s.getTop());
                    this.left = Math.max(this.left, s.getLeft());
                    this.bottom = Math.max(this.bottom, s.getBottom());
                    this.right = Math.max(this.right, s.getRight());
                }
            }
        };

        this.paint = function(g,x,y,w,h,d) { 
            for(var i = 0;i < this.views.length; i++) this.views[i].paint(g, x, y, w, h, d); 
        };
    },

    function (){ this.$this([]);  },
    function (v1,v2){ this.$this([v1, v2]); },
    function (args) {
        this.views = [];
        this.width = -1;
        for(var i = 0;i < args.length; i ++) this.views[i] = args[i];
    }
]);

pkg.ViewSet = Class(pkg.View, [
    function $prototype() {
        this.paint     = function(g,x,y,w,h,d) { if (this.activeView != null) this.activeView.paint(g, x, y, w, h, d); };
        this.getTop    = function()  { return this.activeView == null ? 0 : this.activeView.getTop(); };
        this.getLeft   = function()  { return this.activeView == null ? 0 : this.activeView.getLeft(); };
        this.getBottom = function()  { return this.activeView == null ? 0 : this.activeView.getBottom(); };
        this.getRight  = function()  { return this.activeView == null ? 0 : this.activeView.getRight(); };

        this.getPreferredSize = function(){
            if(this.width < 0){
                this.width = this.height = 0;
                for(var k in this.views){
                    var v = this.views[k];
                    if(v != null){
                        var ps = v.getPreferredSize();
                        if (ps.width > this.width)   this.width  = ps.width;
                        if (ps.height > this.height) this.height = ps.height;
                    }
                }
            }
            return { width:this.width, height:this.height };
        };

        this.activate = function (id){
            var old = this.activeView;
            this.activeView = this.views[id];
            return this.activeView != old;
        };
    },

    function () {
        this.views = {};
        this.height = -1;
        this.activeView = null;
    },

    function (args){
        this.$this();
        if (Array.isArray(args)) {
            for(var i=0; i< args.length; i+=2) this.put(args[i], args[i+1]);
        }
        else for(var k in args) this.put(k, args[k]);
    },

    function put(id, v){
        if(v == null){
            if (this.views.hasOwnProperty(id)) {
               delete this.views[id];
               return true;
            }
            return false;
        }
        else this.views[id] = v;
        this.width =  -1;
        return true;
    }
]);

})(zebra("ui.view"), zebra.Class, zebra.Interface);

(function(pkg, Class, Interface) {

var instanceOf = zebra.instanceOf, L = zebra.layout, $configurators = [],
    rgb = zebra.util.rgb, temporary = { x:0, y:0, width:0, height:0 },
    $fmCanvas = null, $fmText = null, $fmImage = null;

rgb.prototype.paint = function(g,x,y,w,h,d) {
    if (this.s != g.fillStyle) g.fillStyle = this.s;
    g.fillRect(x, y, w, h);
};

rgb.prototype.getPreferredSize = function() {
    return { width:0, height:0 };
};

pkg.getPreferredSize = function(l) {
    return l != null && l.isVisible ? l.getPreferredSize() : { width:0, height:0 };
};

var cvp = pkg.cvp = function(c, r) {
    if(c.width > 0 && c.height > 0 && c.isVisible){
        var p = c.parent, px = -c.x, py = -c.y;
        if (r == null) r = { x:0, y:0, width:0, height:0 };
        else r.x = r.y = 0;
        r.width  = c.width;
        r.height = c.height;

        while (p != null && r.width > 0 && r.height > 0){
            MB.intersection(r.x, r.y, r.width, r.height, px, py, p.width, p.height, r);
            px -= p.x;
            py -= p.y;
            p = p.parent;
        }
        return r.width > 0 && r.height > 0 ? r : null;
    }
    return null;
};

pkg.configurator = function(c) { $configurators.push(c); };

//!!! Font should be able to parse CSS string
pkg.Font = function(name, style, size) {
    this.name   = name;
    this.style  = style;
    this.size   = size;
    this.s      = [
                    (this.style & pkg.Font.ITALIC) > 0 ? 'italic ' : '',
                    (style & pkg.Font.BOLD) > 0        ? 'bold ':'',
                    this.size, 'px ', this.name
                  ].join('');

    $fmText.style.font = this.s;
    this.height = $fmText.offsetHeight;
    this.ascent = $fmImage.offsetTop - $fmText.offsetTop + 1;
};

pkg.Font.PLAIN  = 0;
pkg.Font.BOLD   = 1;
pkg.Font.ITALIC = 2;

pkg.Font.prototype.stringWidth = function(s) {
    if (s.length === 0) return 0;
    if ($fmCanvas.font != this.s) $fmCanvas.font = this.s;
    return ($fmCanvas.measureText(s).width + 0.5) | 0;
};

pkg.Font.prototype.charsWidth = function(s, off, len) {
    if ($fmCanvas.font != this.s) $fmCanvas.font = this.s;
    return ($fmCanvas.measureText(len == 1 ? s[off] : s.substring(off, off + len)).width + 0.5) | 0;
};

pkg.Font.prototype.toString = function() { return this.s;  };
pkg.Font.prototype.equals = function(f)  { return f === this || (f != null && this.s === f.s); };

pkg.Cursor = {
        DEFAULT   : "default",
        MOVE      : "move",
        WAIT      : "wait",
        TEXT      : "text",
        HAND      : "pointer",
        NE_RESIZE : "ne-resize",
        SW_RESIZE : "sw-resize",
        SE_RESIZE : "se-resize",
        NW_RESIZE : "nw-resize",
        S_RESIZE  : "s-resize",
        W_RESIZE  : "w-resize",
        N_RESIZE  : "n-resize",
        E_RESIZE  : "e-resize"
};

var MouseListener       = pkg.MouseListener       = Interface(),
    MouseMotionListener = pkg.MouseMotionListener = Interface(),
    FocusListener       = pkg.FocusListener       = Interface(),
    KeyListener         = pkg.KeyListener         = Interface(),
    Cursorable          = pkg.Cursorable          = Interface();
    Composite           = pkg.Composite           = Interface();
    ChildrenListener    = pkg.ChildrenListener    = Interface();

pkg.ComponentListener   = Interface(),
pkg.ContainerListener   = Interface();
pkg.Layer               = Interface();

var CL = pkg.ComponentListener;
CL.COMP_ENABLED = 1;
CL.COMP_SHOWN   = 2;
CL.COMP_MOVED   = 3;
CL.COMP_SIZED   = 4;

var CNL = pkg.ContainerListener;
CNL.COMP_ADDED = 1;
CNL.COMP_REMOVED = 2;
CNL.LAYOUT_SET = 3;

var IE = pkg.InputEvent = Class([
    function $clazz() {
        this.MOUSE_UID    = 1;
        this.KEY_UID      = 2;
        this.FOCUS_UID    = 3;
        this.FOCUS_LOST   = 1;
        this.FOCUS_GAINED = 2;
    },

    function (target, id, uid){
        this.source = target;
        this.ID = id;
        this.UID = uid;
    }
]);

var KE = pkg.KeyEvent = Class(IE, [
    function $clazz() {
        this.TYPED    = 3;
        this.RELEASED = 4;
        this.PRESSED  = 5;

        this.CTRL  = 1;
        this.SHIFT = 2;
        this.ALT   = 4;
        this.CMD   = 8;

        this.VK_ENTER = 13;
        this.VK_ESCAPE = 27;
        this.VK_LEFT = 37;
        this.VK_RIGHT = 39;
        this.VK_UP = 38;
        this.VK_DOWN = 40;
        this.VK_SPACE = 32;
        this.VK_TAB = 9;
        this.VK_SHIFT = 16;
        this.VK_CONTROL = 17;
        this.VK_ALT = 18;

        this.VK_HOME = 36;
        this.VK_END = 35;
        this.VK_PAGE_UP = 33;
        this.VK_PAGE_DOWN = 34;

        this.VK_INSERT = 45;
        this.VK_DELETE = 46;
        this.VK_BACK_SPACE = 8;

        this.VK_C = 67;
        this.VK_A = 65;
        this.VK_V = 86;

        this.CHAR_UNDEFINED = 0;
    },

    function $prototype() {
        this.reset = function(target,id,code,ch,mask){
            this.source = target;
            this.ID = id;
            this.code = code;
            this.mask = mask;
            this.ch = ch;
        };

        this.isControlPressed = function(){ return (this.mask & KE.CTRL) > 0; };
        this.isShiftPressed = function(){ return (this.mask & KE.SHIFT) > 0; };
        this.isAltPressed = function(){ return (this.mask & KE.ALT) > 0; };
        this.isCmdPressed = function(){ return (this.mask & KE.CMD) > 0; };
    },

    function (target,id,code,ch,mask){
        this.$super(target, id, IE.KEY_UID);
        this.reset(target, id, code, ch, mask);
    }
]);

var ME = pkg.MouseEvent = Class(IE, [
    function $clazz() {
        this.CLICKED      = 6;
        this.PRESSED      = 7;
        this.RELEASED     = 8;
        this.ENTERED      = 9;
        this.EXITED       = 10;
        this.DRAGGED      = 11;
        this.STARTDRAGGED = 12;
        this.ENDDRAGGED   = 13;
        this.MOVED        = 14;
        this.LEFT_BUTTON  = 1;
        this.RIGHT_BUTTON = 4;
    },

    function $prototype() {
        this.reset = function(target,id,ax,ay,mask,clicks){
            this.source = target;
            this.ID = id;
            this.absX = ax;
            this.absY = ay;
            this.mask = mask;
            this.clicks = clicks;

            var p = L.getTopParent(target);
            while(target != p){
                ax -= target.x;
                ay -= target.y;
                target = target.parent;
            }
            this.x = ax;
            this.y = ay;
        };

        this.isActionMask = function(){
            return this.mask === 0 || ((this.mask & ME.LEFT_BUTTON) > 0 && (this.mask & ME.RIGHT_BUTTON) === 0);
        };

        this.isControlPressed = function(){ return (this.mask & KE.CTRL) > 0; };
        this.isShiftPressed = function(){ return (this.mask & KE.SHIFT) > 0; };
    },

    function (target,id,ax,ay,mask,clicks){
        this.$super(target, id, IE.MOUSE_UID);
        this.reset(target, id, ax, ay, mask, clicks);
    }
]);

pkg.getDesktop = function(c){
    c = L.getTopParent(c);
    return instanceOf(c, pkg.zCanvas) ? c : null;
};

var MDRAGGED = ME.DRAGGED, EM = null, MMOVED = ME.MOVED, MEXITED = ME.EXITED, MENTERED = ME.ENTERED,
    KPRESSED = KE.PRESSED, BM1 = ME.LEFT_BUTTON, BM3 = ME.RIGHT_BUTTON, MS = Math.sin, MC = Math.cos,
    context = Object.getPrototypeOf(document.createElement('canvas').getContext('2d')),
    $mousePressedEvent = null, $keyPressedCode = -1, $keyPressedOwner = null, $mousePressedX = 0, $mousePressedY = 0,
    $keyPressedModifiers = 0, KE_STUB = new KE(null,  KPRESSED, 0, 'x', 0), $focusGainedCounter = 0,
    ME_STUB = new ME(null,  ME.PRESSED, 0, 0, 0, 1), meX, meY, MB = zebra.util;

pkg.paintManager = pkg.events = pkg.$mousePressedOwner = pkg.$mouseDraggOwner = pkg.$mouseMoveOwner = null;

// !!!!
// the document mouse up happens whan we drag outside a canvas
// in this case canvas soen't get mouse up, so we do it by global mouseup handler
document.addEventListener("mouseup", function(e) {
    if (pkg.$mousePressedOwner) {
        var d = pkg.getDesktop(pkg.$mousePressedOwner);
        d.mouseReleased(e);
    }
},  false);

var $alert = (function(){ return this.alert; }());
window.alert = function() {
    if ($keyPressedCode > 0) {
        KE_STUB.reset($keyPressedOwner, KE.RELEASED, $keyPressedCode, '', $keyPressedModifiers);
        EM.performInput(KE_STUB);
        $keyPressedCode = -1;
    }
    $alert.apply(window, arguments);
    if ($mousePressedEvent) $mousePressedEvent.$zcanvas.mouseReleased($mousePressedEvent);
};

//!!!! debug var debugOff = true, setup = [];
// function debug(msg, d) {
//     if (debugOff) return ;
//     if (d == -1) shift.pop();
//     zebra.print(shift.join('') + msg);
//     if (d == 1) shift.push('    ');
// }

context.setFont = function(f) {
    if (f.s != this.font) {
        this.font = f.s;
    }
};

context.setColor = function(c) {
    if (c == null) throw new Error("Null color");
    if (c.s != this.fillStyle) this.fillStyle = c.s;
    if (c.s != this.strokeStyle) this.strokeStyle = c.s;
};

context.drawLine = function(x1, y1, x2, y2, w){
    if (arguments.length < 5) w = 1;
    var pw = this.lineWidth;
    this.beginPath();
    this.lineWidth = w;

    if (x1 == x2) {
        x1 += w / 2;
        x2 = x1;
    }
    else
    if (y1 == y2) {
        y1 += w / 2;
        y2 = y1;
    }

    this.moveTo(x1, y1);
    this.lineTo(x2, y2);
    this.stroke();
    this.lineWidth = pw;
};

context.drawArc = function(cx,cy,r, sa, ea, d){
    this.beginPath();
    this.arc(cx, cy, r, sa, ea, d);
    this.stroke();
};

context.fillArc = function(cx,cy,r, sa, ea, d){
    this.beginPath();
    this.arc(cx, cy, r, sa, ea, d);
    this.fill();
};

context.ovalPath = function(x,y,w,h){
    this.beginPath();
    var kappa = 0.5522848, ox = (w / 2) * kappa, oy = (h / 2) * kappa,
        xe = x + w, ye = y + h, xm = x + w / 2, ym = y + h / 2;
    this.moveTo(x, ym);
    this.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
    this.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
    this.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
    this.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
};

context.polylinePath = function(xPoints, yPoints, nPoints){
    this.beginPath();
    this.moveTo(xPoints[0], yPoints[0]);
    for(var i=1; i < nPoints; i++) this.lineTo(xPoints[i], yPoints[i]);
};

context.drawOval = function(x,y,w,h) {
    this.ovalPath(x, y, w, h);
    this.stroke();
};

context.drawPolygon = function(xPoints,yPoints,nPoints){
    this.polylinePath(xPoints, yPoints, nPoints);
    this.lineTo(xPoints[0], yPoints[0]);
    this.stroke();
};

context.drawPolyline = function(xPoints,yPoints,nPoints){
    this.polylinePath(xPoints, yPoints, nPoints);
    this.stroke();
};

context.fillPolygon = function(xPoints,yPoints,nPoints){
    this.polylinePath(xPoints, yPoints, nPoints);
    this.lineTo(xPoints[0], yPoints[0]);
    this.fill();
};

context.fillOval = function(x,y,width,height){
    this.beginPath();
    this.ovalPath(x, y, width, height);
    this.fill();
};

context.drawDottedRect = function(x,y,w,h) {
    var ctx = this, m = ["moveTo", "lineTo", "moveTo"];
    function dv(x, y, s) { for(var i=0; i < s; i++) ctx[m[i%3]](x + 0.5, y + i); }
    function dh(x, y, s) { for(var i=0; i < s; i++) ctx[m[i%3]](x + i, y + 0.5); }
    ctx.beginPath();
    dh(x, y, w);
    dh(x, y + h - 1, w);
    ctx.stroke();
    ctx.beginPath();
    dv(x, y, h);
    dv(w + x - 1, y, h);
    ctx.stroke();
};

context.drawDashLine = function(x,y,x2,y2) {
    var pattern=[1,2], count = pattern.length, ctx = this, compute = null,
        dx = (x2 - x), dy = (y2 - y), b = (Math.abs(dx) > Math.abs(dy)),
        slope = b ? dy / dx : dx / dy, sign = b ? (dx < 0 ?-1:1) : (dy < 0?-1:1);

    if (b) {
        compute = function(step) {
            x += step;
            y += slope * step;
        };
    }
    else {
        compute = function(step) {
            x += slope * step;
            y += step;
        };
    }

    ctx.moveTo(x, y);
    var dist = Math.sqrt(dx * dx + dy * dy), i = 0;
    while (dist >= 0.1) {
        var dl = Math.min(dist, pattern[i % count]), step = Math.sqrt(dl * dl / (1 + slope * slope)) * sign;
        compute(step);
        ctx[(i % 2 === 0) ? 'lineTo' : 'moveTo'](x + 0.5, y + 0.5);
        dist -= dl;
        i++;
    }
    ctx.stroke();
};

//!!! has to be made public in layout !!!
function measure(e, cssprop) {
    var value = window.getComputedStyle ? window.getComputedStyle(e, null).getPropertyValue(cssprop)
                                        : (e.style ? e.style[cssprop] : e.currentStyle[cssprop]);

    if (value == null || value == '') return 0;
    var m = /(^[0-9\.]+)([a-z]+)?/.exec(value);
    return parseInt(m[1], 10);
}

pkg.makeFullyVisible = function(d,c){
    var right = d.getRight(), top = d.getTop(), bottom = d.getBottom(), left = d.getLeft(),
        xx = c.x, yy = c.y, ww = c.width, hh = c.height;
    if (xx < left) xx = left;
    if (yy < top) yy = top;
    if (xx + ww > d.width - right) xx = d.width + right - ww;
    if (yy + hh > d.height - bottom) yy = d.height + bottom - hh;
    c.setLocation(xx, yy);
};

pkg.calcOrigin = function(x,y,w,h,px,py,t,tt,ll,bb,rr){
    if (arguments.length < 8) {
        tt = t.getTop();
        ll = t.getLeft();
        bb = t.getBottom();
        rr = t.getRight();
    }

    var dw = t.width, dh = t.height;
    if(dw > 0 && dh > 0){
        if(dw - ll - rr > w){
            var xx = x + px;
            if(xx < ll) px += (ll - xx);
            else {
                xx += w;
                if(xx > dw - rr) px -= (xx - dw + rr);
            }
        }
        if(dh - tt - bb > h){
            var yy = y + py;
            if (yy < tt) py += (tt - yy);
            else {
                yy += h;
                if (yy > dh - bb) py -= (yy - dh + bb);
            }
        }
        return [px, py];
    }
    return [0, 0];
};

pkg.loadImage = function(path, ready) {
    var i = new Image();
    zebra.busy();
    if (arguments.length > 1)  {
        i.onerror = function() {  zebra.ready(); ready(path, false);  };
        i.onload  = function() {  zebra.ready(); ready(path, true);  };
    }
    else {
        i.onload  =  i.onerror = function() { zebra.ready(); };
    }
    i.src = path;
    return i;
};

pkg.get = function(key) { return pkg.$objects.get(key); };

pkg.Panel = Class(L.Layoutable, [
     function $prototype() {
        this.top = this.left = this.right = this.bottom = 0;
        this.isEnabled = true;

        this.notifyRender = function(o,n){
            if (o != null && o.ownerChanged) o.ownerChanged(null);
            if (n != null && n.ownerChanged) n.ownerChanged(this);
        };

        this.properties = function(p) {
            var clazz = this.getClazz();
            for(var k in p) {
                if (p.hasOwnProperty(k)) {
                    zebra.util.getPropertySetter(clazz, k)(this, p[k]);
                }
            }
        };

        this.getComponentAt = function(xx,yy){
            var r = cvp(this, temporary);
            if (r == null || (xx < r.x || yy < r.y || xx >= r.x + r.width || yy >= r.y + r.height)) {
                return null;
            }

            var k = this.kids;
            if(k.length > 0){
                for(var i = k.length; --i >= 0; ){
                    var d = k[i];
                    d = d.getComponentAt(xx - d.x, yy - d.y);
                    if(d != null) return d;
                }
            }
            return this.contains(xx, yy) ? this : null;
        };

        this.contains = function(x,y) { return true; };

        this.vrp = function(){
            this.invalidate();
            if(this.parent != null) this.repaint();
        };

        this.getTop = function() {
            return this.border != null ? this.top + this.border.getTop() : this.top;
        };

        this.getLeft = function() {
            return this.border != null ? this.left + this.border.getLeft() : this.left;
        };

        this.getBottom = function() {
            return this.border != null ? this.bottom + this.border.getBottom() : this.bottom;
        };

        this.getRight  = function() {
            return this.border != null ? this.right  + this.border.getRight()  : this.right;
        };

        this.isInvalidatedByChild = function(c) { return true; };

        this.kidAdded = function (index,constr,l){
            pkg.events.performCont(CNL.COMP_ADDED, this, constr, l);
            if(l.width > 0 && l.height > 0) l.repaint();
            else this.repaint(l.x, l.y, 1, 1);
        };

        this.kidRemoved = function(i,l){
            pkg.events.performCont(CNL.COMP_REMOVED, this, null, l);
            if (l.isVisible) this.repaint(l.x, l.y, l.width, l.height);
        };

        this.layoutSet = function (old){ pkg.events.performCont(CNL.LAYOUT_SET, this, old, null); };
        this.relocated = function(px,py){ pkg.events.performComp(CL.COMP_MOVED, px, py, this); };
        this.resized   = function(pw,ph){ pkg.events.performComp(CL.COMP_SIZED, pw, ph, this); };
        this.hasFocus = function(){ return pkg.focusManager.hasFocus(this); };
        this.requestFocus = function(){ pkg.focusManager.requestFocus(this); };

        this.setVisible = function (b){
            if (this.isVisible != b) {
                this.isVisible = b;
                this.invalidate();
                pkg.events.performComp(CL.COMP_SHOWN,  -1,  -1, this);
            }
        };

        this.getScrollManager = function () { return null; };

        this.setEnabled = function (b){
            if(this.isEnabled != b){
                this.isEnabled = b;
                pkg.events.performComp(CL.COMP_ENABLED,  -1,  -1, this);
                if(this.kids.length > 0) for(var i = 0;i < this.kids.length; i++) this.kids[i].setEnabled(b);
            }
        };

        this.paddings = function (top,left,bottom,right){
            if(this.top != top || this.left != left || this.bottom != bottom || this.right != right) {
                this.top = top;
                this.left = left;
                this.bottom = bottom;
                this.right = right;
                this.vrp();
            }
        },

        this.padding = function(v) { this.paddings(v,v,v,v); };

        this.setBorder = function (v){
            var old = this.border;
            if (v != old){
                this.border = v;
                this.notifyRender(old, v);

                if ( old == null || v == null         ||
                     old.getTop()    != v.getTop()    ||
                     old.getLeft()   != v.getLeft()   ||
                     old.getBottom() != v.getBottom() ||
                     old.getRight()  != v.getRight())
                {
                    this.invalidate();
                }
                this.repaint();
            }
        };

        // !!! method is necessary for JSON form building
        this.setKids = function(k) {
            for(var i=0; i<k.length; i++) {
                this.insert(i, k.constraints, k[i]);
            }
        };
    },

    function() {
        this.$super();
        var clazz = this.getClazz();
        while (clazz) {
            if (clazz.properties != null) {
                this.properties(clazz.properties);
                break;
            }
            clazz = clazz.$parent;
        }
    },

    function(l) {
        this.$this();
        this.setLayout(l);
    },

    function setBackground(v){
        var old = this.bg;

        if (zebra.isString(v)) {
            v = rgb.hasOwnProperty(v) ? rgb[v] : new rgb(v);
        }

        if (typeof v === "function") {
            v = pkg.view.createView(v);
        }

        if(v != old){
            this.bg = v;
            this.notifyRender(old, v);
            this.repaint();
        }
    },

    function add(c){ return this.insert(this.kids.length, null, c); },
    function insert(i,d) { return this.insert(i, null, d); },

    function removeAll(){
        if(this.kids.length > 0){
            var size = this.kids.length, mx1 = Number.MAX_VALUE, my1 = mx1, mx2 = 0, my2 = 0;
            for(; size > 0; size--){
                var child = this.kids[size - 1];
                if(child.isVisible){
                    var xx = child.x, yy = child.y;
                    mx1 = Math.min(mx1, xx);
                    my1 = Math.min(my1, yy);
                    mx2 = Math.max(mx2, xx + child.width);
                    my2 = Math.max(my2, yy + child.height);
                }
                this.removeAt(size - 1);
            }
            this.repaint(mx1, my1, mx2 - mx1, my2 - my1);
        }
    },

    function toFront(c){
        var i = this.indexOf(c);
        if(i < (this.kids.length - 1)){
            this.kids.splice(i, 1);
            this.kids.push(c);
            c.repaint();
        }
    },

    function repaint() { this.repaint(0, 0, this.width, this.height); },

    function repaint(x,y,w,h){
        if (this.parent != null && this.width > 0 && this.height > 0 && pkg.paintManager != null){
            pkg.paintManager.repaint(this, x, y, w, h);
        }
    },

    function toPreferredSize(){
        var ps = this.getPreferredSize();
        this.setSize(ps.width, ps.height);
    }
]);

pkg.BaseLayer = Class(pkg.Panel, pkg.Layer, [
    function $prototype() {
        this.isLayerActive = function(){ return true;};
        this.isLayerActiveAt = function(x,y){return true;};

        this.layerMousePressed = function(x,y,m){};
        this.layerKeyPressed = function(code,m){};
        this.getFocusRoot = function() { return this; };

        activate = function(b){
            var fo = pkg.focusManager.focusOwner;
            if (L.isAncestorOf(this, fo) === false) fo = null;
            if (b) pkg.focusManager.requestFocus(fo != null ? fo : pfo);
            else {
                this.pfo = fo;
                pkg.focusManager.requestFocus(null);
            }
        };
    },

    function (id){
        if (id == null) throw new Error("Wrong ID");
        this.pfo = null;
        this.$super();
        this.id = id;
    }
]);

pkg.ViewPan = Class(pkg.Panel, [
    function $prototype() {
        this.paint = function (g){
            var v = this.view;
            if(v != null){
                var l = this.getLeft(), t = this.getTop();
                v.paint(g, l, t, this.width  - l - this.getRight(),
                                 this.height - t - this.getBottom(), this);
            }
        };

        this.setView = function (v){
            var old = this.view;

            if (typeof v === "function") {
                v = pkg.view.createView(v);
            }

            if(v != old) {
                this.view = v;
                this.notifyRender(old, v);
                this.vrp();
            }
        };

        this.calcPreferredSize = function (t) {
            return this.view ? this.view.getPreferredSize() : { width:0, height:0 };
        };
    }
]);

pkg.ImagePan = Class(pkg.ViewPan, [
    function () { this.$this(null); },

    function (img){
        this.setImage(img);
        this.$super();
    },

    function setImage(img) {
        if (img && zebra.isString(img)) {
            var $this = this;
            img = pkg.loadImage(img, function(b) { if (b) $this.vrp(); });
        }
        this.setView(instanceOf(img, pkg.view.Picture) ? img : new pkg.view.Picture(img));
    }
]);

pkg.Manager = Class([
    function() {
        //!!! sometimes pkg.events is set to descriptor the descriptor
        //    is used ot instantiate new event manager. when we do it
        //    Manager constructor is called from new phase of event manager
        //    instantiation what means  event manager is not null (points to descriptor)
        //    but not assigned yet. So we need check extra condition pkg.events.addListener != null
        if (pkg.events != null && pkg.events.addListener != null) {
            pkg.events.addListener(this);
        }
    }
]);

pkg.PaintManager = Class(pkg.Manager, [
    function $prototype() {
        var $timers = {};

        this.repaint = function(c,x,y,w,h){
            if (arguments.length == 1) {
                x = y = 0;
                w = c.width;
                h = c.height;
            }

            if(w > 0 && h > 0 && c.isVisible === true){
                var r = cvp(c, temporary);
                if (r == null) return;
                MB.intersection(r.x, r.y, r.width, r.height, x, y, w, h, r);
                if (r.width <= 0 || r.height <= 0) return;
                x = r.x;
                y = r.y;
                w = r.width;
                h = r.height;

                var desktop = pkg.getDesktop(c);
                if(desktop != null){
                    var p = L.getAbsLocation(x, y, c), x2 = desktop.width, y2 = desktop.height;
                    x = p[0];
                    y = p[1];
                    if(x < 0) {
                        w += x;
                        x = 0;
                    }
                    if(y < 0) {
                        h += y;
                        y = 0;
                    }

                    if (w + x > x2) w = x2 - x;
                    if (h + y > y2) h = y2 - y;

                    if(w > 0 && h > 0)
                    {
                        var da = desktop.da;
                        if(da.width > 0) {
                            if (x >= da.x && y >= da.y && x + w <= da.x + da.width && y + h <= da.y + da.height) return;
                            MB.unite(da.x, da.y, da.width, da.height, x, y, w, h, da);
                        }
                        else MB.intersection(0, 0, desktop.width, desktop.height, x, y, w, h, da);

                        if (da.width > 0 && !$timers[desktop]) {
                            var $this = this;
                            $timers[desktop] = setTimeout(function() {
                                try {
                                    $timers[desktop] = null;
                                    var context = desktop.graph;
                                    desktop.validate();
                                    context.save();

                                    //!!!! debug
                                    // zebra.print(" ============== DA = " + desktop.da );
                                    // var dg = desktop.canvas.getContext("2d");
                                    // dg.strokeStyle = 'red';
                                    // dg.beginPath();
                                    // dg.rect(da.x, da.y, da.width, da.height);
                                    // dg.stroke();

                                    context.clipRect(desktop.da.x, desktop.da.y, desktop.da.width, desktop.da.height);
                                    $this.paint(context, desktop);
                                    context.restore();
                                    desktop.da.width = -1; //!!!
                                }
                                catch(e) { zebra.print(e); }
                            }, 50);
                        }
                        if (da.width > 0) desktop.repaint(da.x, da.y, da.width, da.height);
                    }
                }
            }
        };

        this.paint = function(g,c){
            var dw = c.width, dh = c.height, ts = g.getTopStack();
            if(dw !== 0 && dh !== 0 && ts.width > 0 && ts.height > 0 && c.isVisible){
                c.validate();

                g.save();
                g.translate(c.x, c.y);
                g.clipRect(0, 0, dw, dh);

                ts = g.getTopStack();
                var c_w = ts.width, c_h = ts.height;
                if(c_w > 0 && c_h > 0) {
                    this.paintComponent(g, c);
                    var count = c.kids.length, c_x = ts.x, c_y = ts.y;
                    for(var i = 0; i < count; i++) {
                        var kid = c.kids[i];
                        if(kid.isVisible) {
                            var kidX = kid.x, kidY = kid.y,
                                ix = Math.max(kidX, c_x), iw = Math.min(kidX + kid.width,  c_x + c_w) - ix,
                                iy = Math.max(kidY, c_y), ih = Math.min(kidY + kid.height, c_y + c_h) - iy;

                            if (iw > 0 && ih > 0) this.paint(g, kid);
                        }
                    }
                    if (c.paintOnTop) c.paintOnTop(g);
                }

                g.restore();
            }
        };
    }
]);

pkg.PaintManImpl = Class(pkg.PaintManager, CL, [
    function $prototype() {
        this.compEnabled = function(t) { this.repaint(t); };

        this.compShown = function(t){
            if(t.isVisible) this.repaint(t);
            else {
                var p = t.parent;
                if(p != null) this.repaint(p, t.x, t.y, t.width, t.height);
            }
        };

        this.compSized = function(pw,ph,t){
            if(t.parent != null) {
                var w = t.width, h = t.height;
                this.repaint(t.parent, t.x, t.y, (w > pw) ? w : pw, (h > ph) ? h : ph);
            }
        };

        this.compMoved = function(px,py,t){
            var p = t.parent, w = t.width, h = t.height;
            if(p != null && w > 0 && h > 0){
                var x = t.x, y = t.y, nx = Math.max(x < px ? x : px, 0), ny = Math.max(y < py ? y : py, 0);
                this.repaint(p, nx, ny, Math.min(p.width - nx, w + (x > px ? x - px : px - x)),
                                        Math.min(p.height - ny, h + (y > py ? y - py : py - y)));
            }
        };

        this.paintComponent = function(g,c){
            var b = c.bg != null && (c.parent == null || c.bg.equals(c.parent.bg) === false);
            if (c.border && c.border.outline && b && c.border.outline(g, 0, 0, c.width, c.height,c)) {
                g.save();
                g.clip();
                c.bg.paint(g, 0, 0, c.width, c.height, c);
                g.restore();
                b = false;
            }
            if (b) c.bg.paint(g, 0, 0, c.width, c.height, c);
            if (c.border && c.border.paint) c.border.paint(g, 0, 0, c.width, c.height, c);

            if (c.update) c.update(g);

            if (c.paint) {
                var left = c.getLeft(), top = c.getTop(), bottom = c.getBottom(), right = c.getRight(), id = -1;
                if(left + right + top + bottom > 0){
                    var ts = g.getTopStack(), cw = ts.width, ch = ts.height;
                    if(cw <= 0 || ch <= 0) return;
                    var cx = ts.x, cy = ts.y, x1 = Math.max(cx, left), y1 = Math.max(cy, top);
                    id = g.save();
                    g.clipRect(x1, y1, Math.min(cx + cw, c.width - right) - x1,
                                       Math.min(cy + ch, c.height - bottom) - y1);

                }
                c.paint(g);
                if (id > 0) g.restore();
            }
        };
    }
]);

pkg.FocusManager = Class(pkg.Manager, MouseListener, CL, CNL, KeyListener, [
    function $prototype() {
        function freeFocus(ctx, t){ if(t == ctx.focusOwner) ctx.requestFocus(null);}

        this.prevFocusOwner = this.focusOwner = null;

        this.compEnabled = function(c){ if( !c.isEnabled) freeFocus(this, c); };
        this.compShown   = function(c){ if( !c.isVisible) freeFocus(this, c); };
        this.compRemoved = function(p,c){ freeFocus(this, c);};

        this.hasFocus = function(c){ return this.focusOwner == c; };

        this.keyPressed = function(e){
            if(KE.VK_TAB == e.code){
                var cc = this.ff(e.source, e.isShiftPressed() ?  -1 : 1);
                if(cc != null) this.requestFocus(cc);
            }
        };

        this.findFocusable = function(c){ return (this.isFocusable(c) ? c : this.fd(c, 0, 1)); };

        this.isFocusable = function(c){
            var d = pkg.getDesktop(c);
            //!!!
            // also we should checks whether parents isFocusable !!!
            return d && c.isEnabled && c.isVisible && c.width > 0 && c.height > 0 && c.canHaveFocus && c.canHaveFocus();
        };

        this.fd = function(t,index,d){
            if(t.kids.length > 0){
                var isNComposite = (instanceOf(t, Composite) === false);
                for(var i = index;i >= 0 && i < t.kids.length; i += d) {
                    var cc = t.kids[i];
                    if (cc.isEnabled && cc.isVisible && cc.width > 0 &&
                        cc.height > 0 && (isNComposite || (t.catchInput && t.catchInput(cc) === false)) &&
                        ((cc.canHaveFocus && cc.canHaveFocus()) || (cc = this.fd(cc, d > 0 ? 0 : cc.kids.length - 1, d)) != null))
                    {
                        return cc;
                    }
                }
            }
            return null;
        };

        this.ff = function(c,d){
            var top = c;
            while (instanceOf(top, pkg.Layer) === false) top = top.parent;
            top = top.getFocusRoot();
            for(var index = (d > 0) ? 0 : c.kids.length - 1;c != top.parent; ){
                var cc = this.fd(c, index, d);
                if(cc != null) return cc;
                cc = c;
                c = c.parent;
                if(c != null) index = d + c.indexOf(cc);
            }
            return this.fd(top, d > 0 ? 0 : top.kids.length - 1, d);
        };

        this.requestFocus = function (c){
            if (c != this.focusOwner && (c == null || this.isFocusable(c))){
                var oldFocusOwner = this.focusOwner;
                if(c != null) {
                    var nf = pkg.events.getEventDestination(c);
                    if(nf == null || oldFocusOwner == nf) return;
                    this.focusOwner = nf;
                }
                else {
                    this.focusOwner = c;
                }

                this.prevFocusOwner = oldFocusOwner;
                if (oldFocusOwner != null) pkg.events.performInput(new IE(oldFocusOwner, IE.FOCUS_LOST, IE.FOCUS_UID));
                if (this.focusOwner != null){ pkg.events.performInput(new IE(this.focusOwner, IE.FOCUS_GAINED, IE.FOCUS_UID)); }
            }
        };

        this.mousePressed = function(e){
            if (e.isActionMask()) {
                this.requestFocus(e.source);
            }
        };
    }
]);

pkg.CursorManager = Class(pkg.Manager, MouseListener, MouseMotionListener, [
    function $prototype() {
        this.setCursorable = function(t,c){
            if(c == null) delete this.cursors[t];
            else this.cursors[t] = c;
        };

        this.mouseMoved   = function(e){ this.setCursorType1(e); };
        this.mouseEntered = function(e){ this.setCursorType1(e); };
        this.mouseExited  = function(e){ this.setCursorType2("default", e.source); };
        this.mouseDragged = function(e){ this.setCursorType1(e); };

        this.setCursorType1 = function(e){
            var t = e.source, c = this.cursors.hasOwnProperty(t) ? this.cursors[t] : null;
            if(c == null && instanceOf(t, Cursorable)) c = t;
            this.setCursorType2(((c != null) ? c.getCursorType(t, e.x, e.y) :  "default"), t);
        };

        this.setCursorType2 = function(type,t){
            if(this.cursorType != type){
                var d = pkg.getDesktop(t);
                if(d != null){
                    this.cursorType = type;
                    d.canvas.style.cursor = (this.cursorType < 0) ? "default" : this.cursorType;
                }
            }
        };
    },

    function(){
        this.$super();
        this.cursors = {};
        this.cursorType = "default";
    }
]);

pkg.EventManager = Class(pkg.Manager, [
    function $prototype() {
        var IEHM = [], MUID = IE.MOUSE_UID, KUID = IE.KEY_UID,
            CSIZED = CL.COMP_SIZED, CMOVED = CL.COMP_MOVED,
            CENABLED = CL.COMP_ENABLED, CSHOWN = CL.COMP_SHOWN;

        IEHM[KE.TYPED]          = 'keyTyped';
        IEHM[KE.RELEASED]       = 'keyReleased';
        IEHM[KE.PRESSED]        = 'keyPressed';
        IEHM[ME.DRAGGED]        = 'mouseDragged';
        IEHM[ME.STARTDRAGGED]   = 'startDragged';
        IEHM[ME.ENDDRAGGED]     = 'endDragged';
        IEHM[ME.MOVED]          = 'mouseMoved';
        IEHM[ME.CLICKED]        = 'mouseClicked';
        IEHM[ME.PRESSED]        = 'mousePressed';
        IEHM[ME.RELEASED]       = 'mouseReleased';
        IEHM[ME.ENTERED]        = 'mouseEntered';
        IEHM[ME.EXITED]         = 'mouseExited';
        IEHM[IE.FOCUS_LOST]     = 'focusLost';
        IEHM[IE.FOCUS_GAINED]   = 'focusGained';

        function findComposite(t,child){
            if(t == null || t.parent == null) return null;
            var p = t.parent, b = instanceOf(p, Composite), res = findComposite(p, b ? p : child);
            return (res != null) ? res : ((b && (!p.catchInput || p.catchInput(child))) ? p : null);
        }

        function handleCompEvent(l,id,a1,a2,c){
            switch(id) {
                case CSIZED:   if (l.compSized) l.compSized(a1, a2, c);break;
                case CMOVED:   if (l.compMoved) l.compMoved(a1, a2, c);break;
                case CENABLED: if (l.compEnabled) l.compEnabled(c);break;
                case CSHOWN:   if (l.compShown) l.compShown(c);break;
                default: throw new Error();
            }
        }

        function handleContEvent(l,id,a1,a2,c){
            switch(id) {
                case CNL.COMP_ADDED:   if (l.compAdded) l.compAdded(a1, a2, c); break;
                case CNL.LAYOUT_SET:   if (l.layoutSet) l.layoutSet(a1, a2); break;
                case CNL.COMP_REMOVED: if (l.compRemoved) l.compRemoved(a1, c); break;
                default: throw new Error();
            }
        }
        this.performCont = function(id,p,constr,c){
            if (instanceOf(p, CNL)) handleContEvent(p, id, p, constr, c);
            for(var i = 0;i < this.cc_l.length; i++) handleContEvent(this.cc_l[i], id, p, constr, c);

            for(var t = p.parent;t != null; t = t.parent){
                if(t.childContEvent && instanceOf(t, ChildrenListener)) t.childContEvent(id, p, constr, c);
            }
        };

        this.performComp = function(id,pxw,pxh,src){
            if(instanceOf(src, CL)) handleCompEvent(src, id, pxw, pxh, src);
            for(var i = 0;i < this.c_l.length; i++) handleCompEvent(this.c_l[i], id, pxw, pxh, src);
            for(var t = src.parent;t != null; t = t.parent){
                if(t.childCompEvent && instanceOf(t, ChildrenListener)) t.childCompEvent(id, src);
            }
        };

        this.getEventDestination = function(t){
            var composite = findComposite(t, t);
            return composite == null ? t : composite;
        };

        this.performInput = function(e){
            var t = e.source, id = e.ID, it = null, k = IEHM[id];
            switch(e.UID)
            {
                case MUID:
                    if(id > 10){
                        if (instanceOf(t, MouseMotionListener)) {
                            var m = t[k];
                            if (m) m.call(t, e);
                        }
                        it = this.mm_l;
                        for(var i = 0; i < it.length; i++) {
                            var tt = it[i], m = tt[k];
                            if (m) m.call(tt, e);
                        }
                        return;
                    }
                    else{
                        if(instanceOf(t, MouseListener)) {
                            if (t[k]) t[k].call(t, e);
                        }
                        it = this.m_l;
                    }
                    break;
                case KUID:
                    if(instanceOf(t, KeyListener)) {
                        var m = t[k];
                        if (m) m.call(t, e);
                    }
                    it = this.k_l;
                    break;
                case IE.FOCUS_UID:
                    if(instanceOf(t, FocusListener)) {
                        if (t[k]) t[k].call(t, e);
                    }
                    it = this.f_l;
                    break;
                default: throw new Error();
            }

            for(var i = 0;i < it.length; i++) {
                var tt = it[i], m = tt[k];
                if (m) m.call(tt, e);
            }

            for (t = t.parent;t != null; t = t.parent){
                if (t.childInputEvent && instanceOf(t, ChildrenListener)) t.childInputEvent(e);
            }
        };

        this.a_ = function(c, l){ (c.indexOf(l) >= 0) || c.push(l); };
        this.r_ = function(c, l){ (c.indexOf(l) < 0) || c.splice(i, 1); };
    },

    function(){
        this.m_l  = [];
        this.mm_l = [];
        this.k_l  = [];
        this.f_l  = [];
        this.c_l  = [];
        this.cc_l = [];
        this.$super();
    },

    function addListener(l){
        if(instanceOf(l,CL))   this.addComponentListener(l);
        if(instanceOf(l,CNL))   this.addContainerListener(l);
        if(instanceOf(l,MouseListener))       this.addMouseListener(l);
        if(instanceOf(l,MouseMotionListener)) this.addMouseMotionListener(l);
        if(instanceOf(l,KeyListener))         this.addKeyListener(l);
        if(instanceOf(l,FocusListener))       this.addFocusListener(l);
    },

    function removeListener(l) {
        if(instanceOf(l, CL))   this.removeComponentListener(l);
        if(instanceOf(l, CNL))   this.removeContainerListener(l);
        if(instanceOf(l, MouseListener))       this.removeMouseListener(l);
        if(instanceOf(l, MouseMotionListener)) this.removeMouseMotionListener(l);
        if(instanceOf(l, KeyListener))         this.removeKeyListener(l);
        if(instanceOf(l, FocusListener))       this.removeFocusListener(l);
    },

    function addComponentListener(l) { this.a_(this.c_l, l); },
    function removeComponentListener(l){ this.r_(this.c_l, l); },
    function addContainerListener(l){ this.a_(this.cc_l, l); },
    function removeContainerListener(l){ this.r_(this.cc_l, l); },
    function addMouseListener(l){ this.a_(this.m_l, l); },
    function removeMouseListener(l){ this.r_(this.m_l, l); },
    function addMouseMotionListener(l){ this.a_(this.mm_l, l); },
    function removeMouseMotionListener(l){ this.r_(this.mm_l, l); },
    function addFocusListener(l){ this.a_(this.f_l, l); },
    function removeFocusListener(l){ this.r_(this.f_l, l); },
    function addKeyListener(l){ this.a_(this.k_l, l); },
    function removeKeyListener(l){ this.r_(this.k_l, l); },

    function destroy() {
        this.m_l.length = this.mm_l.length = this.k_l.length = this.f_l.length = this.c_l.length = this.cc_l.length = 0;
    }
]);

function setupMeF() {
    if (zebra.isIE) {
        var de = document.documentElement, db = document.body;
        meX = function meX(e, d) { return d.graph.tX(e.clientX - d.offx + de.scrollLeft + db.scrollLeft,
                                                     e.clientY - d.offy + de.scrollTop  + db.scrollTop);  };
        meY = function meY(e, d) {
            return d.graph.tY(e.clientX - d.offx + de.scrollLeft + de.scrollLeft,
                              e.clientY - d.offy + de.scrollTop + db.scrollTop);  };
    }
    else {
        meX = function meX(e, d) {  return d.graph.tX(e.pageX - d.offx, e.pageY - d.offy); };
        meY = function meY(e, d) {  return d.graph.tY(e.pageX - d.offx, e.pageY - d.offy); };
    }
}

function createContext(ctx, w, h) {
    var $save = ctx.save, $restore = ctx.restore, $rotate = ctx.rotate, $scale = ctx.scale, $translate = ctx.translate;

    ctx.counter = 0;
    ctx.stack = Array(50);
    for(var i=0; i < ctx.stack.length; i++) {
        var s = {};
        s.srot = s.rotateVal = s.x = s.y = s.width = s.height = s.dx = s.dy = 0;
        s.crot = s.sx = s.sy = 1;
        ctx.stack[i] = s;
    }
    ctx.stack[0].width  = w;
    ctx.stack[0].height = h;
    ctx.setFont(pkg.font);
    ctx.setColor(zebra.util.rgb.white);

    ctx.getTopStack = function() { return this.stack[this.counter]; };

    ctx.tX = function(x, y) {
        var c = this.stack[this.counter], b = (c.sx != 1 || c.sy != 1 || c.rotateVal !== 0);
        return (b ?  ((c.crot * x + y * c.srot)/c.sx + 0.5) | 0 : x) - c.dx;
    };

    ctx.tY = function(x, y) {
        var c = this.stack[this.counter], b = (c.sx != 1 || c.sy != 1 || c.rotateVal !== 0);
        return (b ? ((y * c.crot - c.srot * x)/c.sy + 0.5) | 0 : y) - c.dy;
    };

    ctx.translate = function(dx, dy) {
        if (dx !== 0 || dy !== 0) {
            var c = this.stack[this.counter];
            c.x -= dx;
            c.y -= dy;
            c.dx += dx;
            c.dy += dy;
            $translate.call(this, dx, dy);
        }
    };

    ctx.rotate = function(v) {
        var c = this.stack[this.counter];
        c.rotateVal += v;
        c.srot = MS(c.rotateVal);
        c.crot = MC(c.rotateVal);
        $rotate.call(this, v);
    };

    ctx.scale = function(sx, sy) {
        var c = this.stack[this.counter];
        c.sx = c.sx * sx;
        c.sy = c.sy * sy;
        $scale.call(this, sx, sy);
    };

    ctx.save = function() {
        this.counter++;
        var c = this.stack[this.counter], cc = this.stack[this.counter - 1];
        c.x = cc.x;
        c.y = cc.y;
        c.width = cc.width;
        c.height = cc.height;

        c.dx = cc.dx;
        c.dy = cc.dy;
        c.sx = cc.sx;
        c.sy = cc.sy;
        c.srot = cc.srot;
        c.crot = cc.crot;
        c.rotateVal = cc.rotateVal;

        $save.call(this);
        return this.counter - 1;
    };

    ctx.restore = function() {
        if (this.counter === 0) throw new Error();
        this.counter--;
        $restore.call(this);
        return this.counter;
    };

    ctx.clipRect = function(x,y,w,h){
        var c = this.stack[this.counter];
        if (c.x != x || y != c.y || w != c.width || h != c.height) {
            var xx = c.x, yy = c.y, ww = c.width, hh = c.height;
            c.x      = x > xx ? x : xx;
            c.width  = Math.min(x + w, xx + ww) - c.x;
            c.y      = y > yy ? y : yy;
            c.height = Math.min(y + h, yy + hh) - c.y;
            if (c.x != xx || yy != c.y || ww != c.width || hh != c.height) {
                this.beginPath();
                this.rect(x, y, w, h);
                this.clip();
            }
        }
    };

    ctx.reset = function(w, h) {
        //!!!!!!!!!!!!
        this.counter = 0;
        this.stack[0].width = w;
        this.stack[0].height = h;
    };

    return ctx;
}

pkg.zCanvas = Class(pkg.Panel, [
    function $clazz() {
        this.Layout = Class(L.Layout, [
            function calcPreferredSize(c) {
                return  { width:parseInt(c.canvas.width, 10), height:parseInt(c.canvas.height, 10) };
            },

            function doLayout(c){
                var x = c.getLeft(), y = c.getTop(), w = c.width - c.getRight() - x, h = c.height - c.getBottom() - y;
                for(var i = 0;i < c.kids.length; i++){
                    var l = c.kids[i];
                    if(l.isVisible){
                        l.setLocation(x, y);
                        l.setSize(w, h);
                    }
                }
            }
        ]);
    },

    function $prototype() {
        function km(e) {
            var c = 0;
            if (e.altKey)   c += KE.ALT;
            if (e.shiftKey) c += KE.SHIFT;
            if (e.ctrlKey)  c += KE.CTRL;
            if (e.metaKey)  c += KE.CMD;
            return c;
        }

        this.focusGained = function(e){
            if ($focusGainedCounter++ > 0) {
                e.preventDefault();
                return;
            }

            //debug("focusGained");

            if (pkg.focusManager.prevFocusOwner != null) {
                pkg.focusManager.requestFocus(pkg.focusManager.prevFocusOwner);
            }
        };

        this.focusLost = function(e){
            //!!! sometimes focus lost comes incorrectly
            if (document.activeElement == this.canvas) {
                e.preventDefault();
                return;
            }

            if ($focusGainedCounter === 0) return;
            $focusGainedCounter = 0;

            //debug("focusLost");

            if (pkg.focusManager.focusOwner != null || pkg.getDesktop(pkg.focusManager.focusOwner) == this) {
                pkg.focusManager.requestFocus(null);
            }
        };

        this.keyTyped = function(e){
            if (e.charCode == 0) {
                if ($keyPressedCode != e.keyCode) this.keyPressed(e);
                $keyPressedCode = -1;
                return;
            }

            var ch = e.charCode;
            if (ch > 0) {
                var fo = pkg.focusManager.focusOwner;
                if(fo != null) {
                    //debug("keyTyped: " + e.keyCode + "," + e.charCode + " " + (e.charCode == 0));
                    KE_STUB.reset(fo, KE.TYPED, e.keyCode, String.fromCharCode(e.charCode), km(e));
                    EM.performInput(KE_STUB);
                }
            }

            if (e.keyCode < 47) e.preventDefault();
        };

        this.keyPressed = function(e){
            $keyPressedCode  = e.keyCode;

            var code = e.keyCode, m = km(e);
            for(var i = this.kids.length - 1;i >= 0; i--){
                var l = this.kids[i];
                l.layerKeyPressed(code, m);
                if (l.isLayerActive()) break;
            }

            var focusOwner = pkg.focusManager.focusOwner;
            $keyPressedOwner     = focusOwner;
            $keyPressedModifiers = m;

            if (focusOwner != null) {
                //debug("keyPressed : " + e.keyCode, 1);
                KE_STUB.reset(focusOwner, KPRESSED, code, code < 47 ? KE.CHAR_UNDEFINED : '?', m);
                EM.performInput(KE_STUB);

                if (code == KE.VK_ENTER) {
                    //debug("keyTyped keyCode = " + code);
                    KE_STUB.reset(focusOwner, KE.TYPED, code, "\n", m);
                    EM.performInput(KE_STUB);
                }
            }

            //!!!!
            if (code < 47 && code != 32) e.preventDefault();
        };

        this.keyReleased = function(e){
            $keyPressedCode = -1;

            var fo = pkg.focusManager.focusOwner;
            if(fo != null) {
                //debug("keyReleased : " + e.keyCode, -1);
                KE_STUB.reset(fo, KE.RELEASED, e.keyCode, KE.CHAR_UNDEFINED, km(e));
                EM.performInput(KE_STUB);
            }
        };

        this.mouseEntered = function(e){
            if (pkg.$mouseDraggOwner == null){
                var x = meX(e, this), y = meY(e, this), d = this.getComponentAt(x, y);

                if (pkg.$mouseMoveOwner != null && d != pkg.$mouseMoveOwner) {
                    var prev = pkg.$mouseMoveOwner;
                    pkg.$mouseMoveOwner = null;

                    //debug("mouseExited << ", -1);
                    ME_STUB.reset(prev, MEXITED, x, y, -1, 0);
                    EM.performInput(ME_STUB);
                }

                if(d != null && d.isEnabled){
                    //debug("mouseEntered >> ", 1);
                    pkg.$mouseMoveOwner = d;
                    ME_STUB.reset(d, MENTERED, x, y, -1, 0);
                    EM.performInput(ME_STUB);
                }
            }
        };

        this.mouseExited = function (e){
            if(pkg.$mouseMoveOwner != null && pkg.$mouseDraggOwner == null){
                var p = pkg.$mouseMoveOwner;
                pkg.$mouseMoveOwner = null;

                ME_STUB.reset(p, MEXITED, meX(e, this), meY(e, this), -1, 0);
                EM.performInput(ME_STUB);
            }
        };

        this.mouseMoved = function(e){
            if (pkg.$mousePressedOwner != null) {
                this.mouseDragged(e);
                return;
            }

            var x = meX(e, this), y = meY(e, this), d = this.getComponentAt(x, y);
            if (pkg.$mouseMoveOwner != null) {
                if (d != pkg.$mouseMoveOwner) {
                    var old = pkg.$mouseMoveOwner;

                    //debug("mouseExited << ", -1);

                    pkg.$mouseMoveOwner = null;
                    ME_STUB.reset(old, MEXITED, x, y, -1, 0);
                    EM.performInput(ME_STUB);

                    if (d != null && d.isEnabled === true) {

                        //debug("mouseEntered >> " , 1);

                        pkg.$mouseMoveOwner = d;
                        ME_STUB.reset(pkg.$mouseMoveOwner, MENTERED, x, y, -1, 0);
                        EM.performInput(ME_STUB);
                    }
                }
                else {
                    if (d != null && d.isEnabled) {
                        ME_STUB.reset(d, MMOVED, x, y, -1, 0);
                        EM.performInput(ME_STUB);
                    }
                }
            }
            else {
                if (d != null && d.isEnabled === true){
                    //debug("mouseEntered >> ", 1);
                    pkg.$mouseMoveOwner = d;
                    ME_STUB.reset(d, MENTERED, x, y, -1, 0);
                    EM.performInput(ME_STUB);
                }
            }
        };

        this.mouseReleased = function(e){
            if ($mousePressedEvent == null) return;
            $mousePressedEvent = null;

            var drag = pkg.$mouseDraggOwner, x = meX(e, this), y = meY(e, this), m = e.button === 0 ? BM1: (e.button == 2 ? BM3 : 0);
            if(drag != null){
                ME_STUB.reset(drag, ME.ENDDRAGGED, x, y, m, 0);
                EM.performInput(ME_STUB);
                pkg.$mouseDraggOwner = null;
            }

            var po = pkg.$mousePressedOwner;
            if (po != null){

                //debug("mouseReleased ", -1);
                ME_STUB.reset(po, ME.RELEASED, x, y, m, 0);
                EM.performInput(ME_STUB);

                if (drag == null) {
                    var when = (new Date()).getTime(), clicks = ((when - this.lastClickTime) < this.doubleClickDelta) ? 2 : 1;
                    ME_STUB.reset(po, ME.CLICKED, x, y, m, clicks);
                    EM.performInput(ME_STUB);
                    this.lastClickTime = clicks > 1 ? 0 : when;
                }
                pkg.$mousePressedOwner = null;
            }

            var mo = pkg.$mouseMoveOwner;
            if (drag != null || (po != null && po != mo)) {
                var nd = this.getComponentAt(x, y);
                if (nd != mo) {
                    if (mo != null) {
                        //debug("mouseExited << ", -1);
                        ME_STUB.reset(mo, MEXITED, x, y, -1, 0);
                        EM.performInput(ME_STUB);
                    }

                    if (nd != null && nd.isEnabled === true){
                        pkg.$mouseMoveOwner = nd;

                        //debug("mouseEntered >> ", 1);

                        ME_STUB.reset(nd, MENTERED, x, y, -1, 0);
                        EM.performInput(ME_STUB);
                    }
                }
            }
        };

        this.mousePressed = function(e) {
            var $mousePressedMask = e.button === 0 ? BM1: (e.button == 2 ? BM3 : 0);

            // !!! it is possible to have a problem with stored event object in IE
            // !!! store what we need in event-independent object
            $mousePressedEvent = {
                button  : e.button,
                clientX : e.clientX,
                clientY : e.clientY,
                pageX   : e.pageX,
                pageY   : e.pageY,
                $button : $mousePressedMask,
                $zcanvas: this
            };

            $mousePressedX = meX(e, this);
            $mousePressedY = meY(e, this);

            for(var i = this.kids.length - 1;i >= 0; i--){
                var l = this.kids[i];
                l.layerMousePressed($mousePressedX, $mousePressedY, $mousePressedMask);
                if (l.isLayerActiveAt($mousePressedX, $mousePressedY)) break;
            }

            var d = this.getComponentAt($mousePressedX, $mousePressedY);
            if (d != null && d.isEnabled === true){
                pkg.$mousePressedOwner = d;
                ME_STUB.reset(d, ME.PRESSED, $mousePressedX, $mousePressedY, $mousePressedMask, 0);
                EM.performInput(ME_STUB);
            }
        };

        this.mouseDragged = function(e){
            var x = meX(e, this), y = meY(e, this), m = $mousePressedEvent.$button;

            if (pkg.$mouseDraggOwner == null){
                var d = (pkg.$mouseMoveOwner == null) ? this.getComponentAt($mousePressedX, $mousePressedY)
                                                      : pkg.$mouseMoveOwner;
                if (d != null && d.isEnabled === true) {
                    pkg.$mouseDraggOwner = d;
                    ME_STUB.reset(d, ME.STARTDRAGGED, $mousePressedX, $mousePressedY, m, 0);
                    EM.performInput(ME_STUB);

                    if ($mousePressedX != x || $mousePressedY != y) {
                        ME_STUB.reset(d, MDRAGGED, x, y, m, 0);
                        EM.performInput(ME_STUB);
                    }
                }
            }
            else {
                ME_STUB.reset(pkg.$mouseDraggOwner, MDRAGGED, x, y, m, 0);
                EM.performInput(ME_STUB);
            }
        };

        this.getComponentAt = function(x,y){
            for(var i = this.kids.length; --i >= 0; ){
                var tl = this.kids[i];
                if (tl.isLayerActiveAt(x, y)) return EM.getEventDestination(tl.getComponentAt(x, y));
            }
            return null;
        };
    },

    function(w, h) { this.$this(this.toString(), w, h); },

    function(canvas) { this.$this(canvas, -1, -1); },

    function(canvas, w, h) {
        var pc = canvas;
        if (zebra.isString(canvas)) canvas = document.getElementById(canvas);

        if (canvas == null) {
            canvas = document.createElement("canvas");
            canvas.setAttribute("class", "zebracanvas");
            canvas.setAttribute("width",  w <= 0 ? "400px" : "" + w + "px");
            canvas.setAttribute("height", h <= 0 ? "400px" : "" + h + "px");
            canvas.setAttribute("id", pc);
            document.body.appendChild(canvas);
        }

        if (canvas.getAttribute("tabindex") === null) {
            canvas.setAttribute("tabindex", "0");
        }

        //!!!! need for native element layouting
        //canvas.style.overflow = "auto";

        this.$super(new pkg.zCanvas.Layout());

        this.da = { x:0, y:0, width:-1, height:0 };
        this.width  = parseInt(canvas.width, 10);
        this.height = parseInt(canvas.height, 10);
        this.offx = this.offy = 0;
        this.graph = createContext(canvas.getContext("2d"), this.width, this.height);

        var e = canvas;
        if (e.offsetParent) {
            do {
                this.offx += parseInt(e.offsetLeft, 10) + measure(e, 'border-left-width');
                this.offy += parseInt(e.offsetTop, 10)  + measure(e, 'border-top-width');
            } while (e = e.offsetParent);
        }
        this.offx += measure(canvas, "padding-left");
        this.offy += measure(canvas, "padding-top");

        this.canvas = canvas;
        this.doubleClickDelta = 180;

        //!!! Event manager EM variable cannot be initialized before zebra.ui initialization
        EM = pkg.events;
        for(var i=0; i < pkg.layers.length; i++) {
            var l = pkg.layers[i];
            this.add(l.$new ? l.$new() : l);
        }

        var $this = this;
        this.canvas.onmousemove   = function(e) { $this.mouseMoved(e);   };
        this.canvas.onmousedown   = function(e) { $this.mousePressed(e); };
        this.canvas.onmouseup     = function(e) { $this.mouseReleased(e);};
        this.canvas.onmouseover   = function(e) { $this.mouseEntered(e); };
        this.canvas.onmouseout    = function(e) { $this.mouseExited(e);  };
        this.canvas.onkeydown     = function(e) { $this.keyPressed(e);   };
        this.canvas.onkeyup       = function(e) { $this.keyReleased(e);  };
        this.canvas.onkeypress    = function(e) { $this.keyTyped(e);     };
        this.canvas.oncontextmenu = function(e) { e.preventDefault(); };
        this.canvas.onmove        = function(e) { setupMeF(); };
        this.canvas.onfocus       = function(e) { $this.focusGained(e); };
        this.canvas.onblur        = function(e) {  $this.focusLost(e);  };
        if (zebra.isInBrowser) window.onresize = function() { setupMeF(); };

        var addons = pkg.zCanvas.addons;
        if (addons){
            for (var i=0; i<addons.length; i++) (new (Class.forName(addons[i]))()).setup(this);
        }

        this.validate();

        //!!!
        setupMeF();
    },

    function setSize(w, h) {
        if (this.canvas.width != w || h != this.canvas.height) {
            this.graph.reset(w, h);
            this.canvas.width  = w;
            this.canvas.height = h;
            this.$super(w, h);
        }
    },

    function kidAdded(i,constr,c){
        if (typeof this[c.id] !== "undefined") throw new Error();
        this[c.id] = c;
        this.$super(i, constr, c);
    },

    function getLayer(id){ return this[id]; },

    function kidRemoved(i, c){
        delete this[c.id];
        this.$super(i, c);
    }
]);

zebra.ready(function() {
    if (zebra.isInBrowser) {
        $fmCanvas = document.createElement("canvas").getContext("2d");
        var e = document.getElementById("zebra.fm");
        if (e == null) {
            e = document.createElement("div");
            e.setAttribute("id", "zebra.fm");
            e.setAttribute("style", "visibility:hidden;line-height: 0; height:1px;");
            e.innerHTML = "<span id='zebra.fm.text'  style='display:inline;'>&nbsp;</span>" +
                          "<img  id='zebra.fm.image' style='display:inline;' src='1x1.png' width='1' height='1'/>";
            document.body.appendChild(e);
        }
        $fmText  = document.getElementById("zebra.fm.text");
        $fmImage = document.getElementById("zebra.fm.image");
    }

    try {
        zebra.busy();

        pkg.$objects = new zebra.util.Bag(pkg, [
            function loaded(v) {
                if (v == null || zebra.isNumber(v) || zebra.isBoolean(v)) return v;
                if (zebra.isString(v)) {
                    if (this.root && v[0] == "%" && v[1] == "r") {
                        var s = "%root%/", i = v.indexOf(s);
                        if (i === 0) return this.root.join(v.substring(s.length));
                    }
                    return v;
                }

                if (Array.isArray(v)) {
                    for (var i = 0; i < v.length; i++) v[i] = this.loaded(v[i]);
                    return v;
                }

                for (var k in v) if (v.hasOwnProperty(k)) v[k] = this.loaded(v[k]);
                return v;
            },

            function loadByUrl(url) { return this.loadByUrl(url, null); },

            function loadByUrl(url, context) {
                this.root = null;
                if (zebra.URL.isAbsolute(url) || context == null) this.root = (new zebra.URL(url)).getParentURL();
                else {
                    if (context != null) {
                        url  = new zebra.URL(context.$url.join(url));
                        this.root = url.getParentURL();
                    }
                }
                return this.load(zebra.io.GET(url.toString()), false);
            }
        ]);

        pkg.$objects.loadByUrl("canvas.json", pkg);
        var p = zebra()['canvas.json'];
        if (p) pkg.$objects.loadByUrl(p, pkg);
        while($configurators.length > 0) $configurators.shift()(pkg.$objects);
        pkg.$objects.end();
    }
    catch(e) {
        ///!!!!! for some reason throwing exception doesn't appear in console.
        //       but it has side effect to the system, what cases other exception
        //       that is not relevant to initial one
        zebra.print(e)
        throw e;
    }
    finally { zebra.ready(); }

});

})(zebra("ui"), zebra.Class, zebra.Interface);

(function(pkg, Class) {

var L = zebra.layout, View = pkg.view.View, rgb = zebra.util.rgb;

pkg.TitleInfo = zebra.Interface();

pkg.ButtonBorder = Class(View,[
    function (s){
        this.$this(s, [ pkg.palette.white, pkg.palette.gray2, pkg.palette.gray5,
                        s ? pkg.palette.black : pkg.palette.gray7]);
    },

    function (s, cs){
        this.state  = s;
        this.colors = cs.slice(0);
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            var xx = x + w - 1, yy = y + h - 1;
            g.setColor(this.colors[0]);
            g.fillRect(x, y, w, h);
            g.setColor(this.colors[1]);
            g.strokeRect(x, y, w - 1, h - 1);
            if(this.state){
                g.setColor(this.colors[2]);
                g.drawLine(x + 1, y + 1, xx - 1, y + 1);
                g.drawLine(x + 1, y + 2, xx - 1, y + 2);
                g.setColor(this.colors[3]);
                g.strokeRect(x, y, w - 1, h - 1);
                return;
            }
            g.setColor(this.colors[2]);
            g.drawLine(x + 1, yy - 1, xx - 1, yy - 1);
            g.drawLine(x + 1, yy - 2, xx - 1, yy - 2);
            g.setColor(this.colors[3]);
            g.fillRect(x + 2, y + 2, w - 6, ~~((h - 4) / 2));
        };

        this.getBottom = function() { return 4; };
    }
]);

pkg.SoftBorder = Class(View, [
    function (){ this.$this(pkg.palette.gray1, pkg.palette.gray6); },

    function (dc, lc){
        this.gap   = 2;
        this.dark  = dc;
        this.light = lc;
    },

    function $prototype() {
        this.paint = function(g, x, y, w, h, d) {
            var xx = x + w , yy = y + h ;
            g.setColor(this.dark);
            g.drawLine(x, y, x, yy - 1);
            g.drawLine(xx - 1, y, xx - 1, yy - 1);
            g.drawLine(x, y, xx - 1, y);
            g.drawLine(x, yy - 1, xx - 1, yy - 1);

            g.setColor(this.light);
            g.drawLine(x + 1, y + 1, x + 1, yy);
            g.drawLine(xx, y + 1, xx, yy);
            g.drawLine(x + 1, y + 1, xx, y + 1);
            g.drawLine(x + 1, yy, xx, yy);
        };
    }
]);

pkg.ListBorder = Class(View, [
    function() { this.$this(pkg.palette.black, pkg.palette.gray1, pkg.palette.gray5); },

    function (dc, mc, lc){
        this.dark   = dc;
        this.medium = mc;
        this.light  = lc;
    },

    function $prototype() {
        this.paint = function(g, x, y, w, h, d) {
            var xx = x + w - 1, yy = y + h - 1;
            g.setColor(this.dark);
            g.drawLine(x, y, x, yy);
            g.drawLine(x+1, y, xx, y);
            g.setColor(this.medium);
            g.drawLine(xx, y, xx, yy);
            g.drawLine(x, yy, xx, yy);
            g.setColor(this.light);
            g.drawLine(xx - 1, y + 1, xx - 1, yy - 1);
            g.drawLine(x + 1, y + 1, xx - 1, y + 1);
            g.drawLine(x + 1, yy - 1, xx - 1, yy - 1);
        };
    }
]);

pkg.TFieldBorder = Class(View, [
    function (){ this.$this(pkg.palette.gray2, pkg.palette.gray4); },

    function (dc, lc){
        this.gap   = 3;
        this.dark  = dc;
        this.light = lc;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            var xx = x + w - 1, yy = y + h - 1;
            g.setColor(this.dark);
            g.strokeRect(x + 0.5, y+0.5, w - 1, h - 1);
            g.setColor(this.light);
            g.drawLine(x + 1, yy - 1, xx, yy - 1);
            g.drawLine(x + 1, yy - 2, xx, yy - 2);
        };
    }
]);

pkg.SBundleBorder = Class(View, [
    function (t){
        if (t != L.HORIZONTAL && t != L.VERTICAL) throw new Error();
        this.style = t;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            var xx = x + w - 1, yy = y + h - 1;
            g.setColor(pkg.palette.gray6);
            g.fillRect(x, y, w, h);
            g.setColor(pkg.palette.white);
            g.drawLine(x, y, xx, y);
            g.drawLine(x, y, x, yy);
            g.setColor(pkg.palette.black);
            g.drawLine(x, yy, xx, yy);
            g.drawLine(xx, y, xx, yy);
            if(this.style == L.VERTICAL){
                g.setColor(pkg.palette.gray7);
                g.fillRect(x + ~~(w / 2), y + 1, 3, h - 2);
                g.setColor(pkg.palette.white);
                g.drawLine(x + ~~(w / 2) + 4, y + 1, x + ~~(w / 2) + 4, yy - 1);
                g.drawLine(x + ~~(w / 2) + 5, y + 1, x + ~~(w / 2) + 5, yy - 1);
                return;
            }
            g.setColor(pkg.palette.gray7);
            g.fillRect(x + 1, y + ~~(h / 2), w - 2, 3);
            g.setColor(pkg.palette.white);
            g.drawLine(x + 1, y + ~~(h / 2) + 4, xx - 1, ~~(y + h / 2) + 4);
            g.drawLine(x + 1, y + ~~(h / 2) + 5, xx - 1, ~~(y + h / 2) + 5);
        };
    }
]);

pkg.P3DBorder = Class(View, [
    function (){ this.$this(pkg.palette.black, pkg.palette.gray2, pkg.palette.gray3); },

    function (dc, mc, lc){
        this.dark   = dc;
        this.medium = mc;
        this.light  = lc;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            var xx = x + w - 1, yy = y + h - 1;
            g.setColor(this.medium);
            g.drawLine(x, y, x, yy - 1);
            g.drawLine(x, y, xx, y);
            g.setColor(this.dark);
            g.drawLine(xx, y, xx, yy);
            g.drawLine(xx - 1, y, xx - 1, yy);
            g.drawLine(x, yy - 1, xx, yy - 1);
            g.drawLine(x, yy, xx, yy);
            g.setColor(this.light);
            g.drawLine(x + 1, yy - 2, xx - 2, yy - 2);
            g.drawLine(x + 1, yy - 3, xx - 2, yy - 3);
            g.drawLine(x + 1, y + 1, xx - 2, y + 1);
            g.drawLine(x + 1, y, x + 1, yy - 1);
        };

        this.getBottom = function(){ return 4;};
    }
]);

pkg.TabBorder = Class(View, [
    function(t){  this.$this(t, 1); },

    function(t, w){
        this.type = t;  
        this.gap = 4 + w;
        this.width = w;

        this.onColor1 = pkg.palette.black;
        this.onColor2 = pkg.palette.gray5;
        this.offColor = pkg.palette.gray1;

        this.fillColor1 = pkg.palette.gray5;
        this.fillColor2 = pkg.palette.white;
        this.fillColor3 = pkg.palette.gray7;
    },

    function $prototype() {
        this.paint = function(g,x,y,w,h,d){
            var xx = x + w - 1, yy = y + h - 1, o = d.parent.orient, t = this.type, s = this.width,  dt = s / 2;

            if(d.isEnabled){
                g.setColor(t == 2 ? this.fillColor1 : this.fillColor2);
                g.fillRect(x + 1, y, w - 3, h);
                g.setColor(this.fillColor3);
                g.fillRect(x + 1, y + 2, w - 3, ~~((h - 6) / 2));
            }

            g.setColor((t === 0 || t == 2) ? this.onColor1 : this.offColor);
            switch(o) {
                case L.LEFT:
                    g.drawLine(x + 2, y, xx + 1, y);
                    g.drawLine(x, y + 2, x, yy - 2);
                    g.drawLine(x, y + 2, x + 2, y);
                    g.drawLine(x + 2, yy, xx + 1, yy);
                    g.drawLine(x, yy - 2, x + 2, yy);

                    if (t == 1) {
                        g.setColor(this.onColor2);
                        g.drawLine(x + 2, yy - 1, xx, yy - 1);
                        g.drawLine(x + 2, yy, xx, yy);
                    }
                    break;
                case L.RIGHT:
                    g.drawLine(x, y, xx - 2, y);
                    g.drawLine(xx - 2, y, xx, y + 2);
                    g.drawLine(xx, y + 2, xx, yy - 2);
                    g.drawLine(xx, yy - 2, xx - 2, yy);
                    g.drawLine(x, yy, xx - 2, yy);

                    if (t == 1) {
                        g.setColor(this.onColor2);
                        g.drawLine(xx - 2, yy - 1, x, yy - 1);
                        g.drawLine(xx - 2, yy, x, yy);
                    }
                    break;
                case L.TOP:
                    g.lineWidth = s;
                    g.beginPath();
                    g.moveTo(x + dt, yy + 1);
                    g.lineTo(x + dt, y + dt + 2);
                    g.lineTo(x + dt + 2, y + dt);
                    g.lineTo(xx - dt - 1, y + dt);
                    g.lineTo(xx - dt + 1, y + dt + 2);
                    g.lineTo(xx - dt + 1, yy + 1);
                    g.stroke();
                    if (t === 0) {
                        g.setColor(this.onColor2);
                        g.beginPath();
                        g.moveTo(xx - dt - 2, y + dt + 1);
                        g.lineTo(xx - dt, y + dt + 3);
                        g.lineTo(xx - dt, yy - dt + 1);
                        g.stroke();
                    }
                    g.lineWidth = 1;
                    break;
                case L.BOTTOM:
                    g.drawLine(x + 2, yy, xx - 2, yy);
                    g.drawLine(x, yy - 2, x, y - 2);
                    g.drawLine(xx, yy - 2, xx, y - 2);
                    g.drawLine(x, yy - 2, x + 2, yy);
                    g.drawLine(xx, yy - 2, xx - 2, yy);
                    if (t == 1) {
                        g.setColor(this.onColor2);
                        g.drawLine(xx - 1, yy - 2, xx - 1, y - 2);
                        g.drawLine(xx, yy - 2, xx, y - 2);
                    }
                    break;
            }
        };

        this.getTop = function (){ return 3; };
        this.getBottom = function (){ return 2;};
    }
]);

pkg.TitledBorder = Class(pkg.view.Render, [
    function $prototype() {
        this.getTop    = function (){ return this.target.getTop(); };
        this.getLeft   = function (){ return this.target.getLeft(); };
        this.getRight  = function (){ return this.target.getRight(); };
        this.getBottom = function (){ return this.target.getBottom(); };

        this.outline = function (g,x,y,w,h,d) {
            var xx = x + w, yy = y + h;
            if (zebra.instanceOf(d, pkg.TitleInfo)){
                var r = d.getTitleInfo();
                if (r != null) {
                    var o = r.orient, cx = x, cy = y;

                    if (o == L.BOTTOM || o == L.TOP)
                    {
                        switch(this.lineAlignment) {
                            case L.CENTER : cy = r.y + ~~(r.height / 2); break;
                            case L.TOP    : cy = r.y + (o == L.BOTTOM ?1:0)* (r.height - 1); break;
                            case L.BOTTOM : cy = r.y + (o == L.BOTTOM ?0:1) *(r.height - 1); break;
                        }

                        if (o == L.BOTTOM)  yy = cy;
                        else                y  = cy;
                    }
                    else {

                        switch(this.lineAlignment) {
                            case L.CENTER : cx = r.x + ~~(r.width / 2); break;
                            case L.TOP    : cx = r.x + ((o == L.RIGHT)?1:0) *(r.width - 1); break;
                            case L.BOTTOM : cx = r.x + ((o == L.RIGHT)?0:1) *(r.width - 1); break;
                        }
                        if (o == L.RIGHT)  xx = cx;
                        else               x  = cx;
                    }
                }
            }

            if (this.target && this.target.outline) return this.target.outline(g, x, y, xx - x, yy - y, d);
            g.rect(x, y, xx - x, yy - y);
            return true;
        };

        this.paint = function(g,x,y,w,h,d){
            if(zebra.instanceOf(d, pkg.TitleInfo)){
                var r = d.getTitleInfo();
                if(r != null) {
                    var xx = x + w, yy = y + h, o = r.orient;
                    g.save();
                    g.beginPath();

                    var br = (o == L.RIGHT), bb = (o == L.BOTTOM),  dt = (bb || br) ? -1 : 1;
                    if (bb || o == L.TOP) {
                        var sy = y, syy = yy, cy = 0 ;
                        switch(this.lineAlignment) {
                            case L.CENTER : cy = r.y + ~~(r.height / 2); break;
                            case L.TOP    : cy = r.y + (bb?1:0) *(r.height - 1); break;
                            case L.BOTTOM : cy = r.y + (bb?0:1) *(r.height - 1); break;
                        }

                        if (bb) {
                            sy  = yy;
                            syy = y;
                        }

                        g.moveTo(r.x + 1, sy);
                        g.lineTo(r.x + 1, r.y + dt * (r.height));
                        g.lineTo(r.x + r.width - 1, r.y + dt * (r.height));
                        g.lineTo(r.x + r.width - 1, sy);
                        g.lineTo(xx, sy);
                        g.lineTo(xx, syy);
                        g.lineTo(x, syy);
                        g.lineTo(x, sy);
                        g.lineTo(r.x, sy);
                        if (bb)  yy = cy;
                        else     y  = cy;
                    }
                    else {
                        var sx = x, sxx = xx, cx = 0;
                        if (br) {
                            sx = xx;
                            sxx = x;
                        }
                        switch(this.lineAlignment) {
                            case L.CENTER : cx = r.x + ~~(r.width / 2); break;
                            case L.TOP    : cx = r.x + (br?1:0) *(r.width - 1); break;
                            case L.BOTTOM : cx = r.x + (br?0:1) *(r.width - 1); break;
                        }

                        g.moveTo(sx, r.y);
                        g.lineTo(r.x + dt * (r.width), r.y);
                        g.lineTo(r.x + dt * (r.width), r.y + r.height - 1);
                        g.lineTo(sx, r.y + r.height - 1);
                        g.lineTo(sx, yy);
                        g.lineTo(sxx, yy);
                        g.lineTo(sxx, y);
                        g.lineTo(sx, y);
                        g.lineTo(sx, r.y);
                        if (br)  xx = cx;
                        else     x  = cx;
                    }

                    g.clip();
                    this.target.paint(g, x, y, xx - x, yy - y, d);
                    g.restore();
                }
            }
            else {
                this.target.paint(g, x, y, w, h, d);
            }
        };
    },

    function (border){ this.$this(border, L.BOTTOM); },

    function (b, a){
        if (b == null && a != L.BOTTOM && a != L.TOP && a != L.CENTER) throw new Error();
        this.$super(b);
        this.lineAlignment = a;
    }
]);


})(zebra("ui"), zebra.Class);

(function(pkg, Class, Interface) {

pkg.ScrollListener   = Interface();
pkg.ExternalEditor   = Interface();
pkg.TxtSelectionInfo = Interface();

var MB = zebra.util,Composite = pkg.Composite, rgb = zebra.util.rgb, ViewSet = pkg.view.ViewSet, ME = pkg.MouseEvent,
    MouseListener = pkg.MouseListener, Cursor = pkg.Cursor, TextModel = zebra.data.TextModel,
    Actionable = zebra.util.Actionable, KE = pkg.KeyEvent, L = zebra.layout, instanceOf = zebra.instanceOf,
    timer = zebra.util.timer, KeyListener = pkg.KeyListener, Cursorable = pkg.Cursorable, FocusListener = pkg.FocusListener,
    ChildrenListener = pkg.ChildrenListener, MouseMotionListener = pkg.MouseMotionListener, Listeners = zebra.util.Listeners;

pkg.MouseWheelSupport = Class([
    function $prototype() {
        var bars = [2, 1];

        this.mouseWheelMoved = function(e){
            var owner = this.lookup(pkg.$mouseMoveOwner);
            if (owner == null) return;

            var d = [0, 0];
            d[0] = (e.detail? e.detail : e.wheelDelta/120);
            if (e.axis) {
                if (e.axis === e.HORIZONTAL_AXIS) {
                    d[1] = d[0];
                    d[0] = 0;
                }
            }

            if (d[0] > 1) d[0] = ~~(d[0]/3);
            if (zebra.isIE || zebra.isChrome || zebra.isSafari) d[0] = -d[0];

            for(var i=0; i < bars.length; i++) {
                if (d[i] !== 0) {
                    var bar = owner.getByConstraints(bars[i]);
                    if (bar != null && bar.isVisible) bar.position.setOffset(bar.position.offset + d[i]*bar.pageIncrement);
                }
            }
            e.preventDefault ? e.preventDefault() : e.returnValue = false;
        };

        this.lookup = function(c) {
            while(c != null && instanceOf(c, pkg.ScrollPan) === false) c = c.parent;
            return c;
        };
    },

    function setup(desktop) {
        if (desktop == null) throw new Error();
        this.desktop = desktop;
        var elem = desktop.canvas, $this = this;
        elem.addEventListener ("mousewheel", function(e) { $this.mouseWheelMoved(e); }, false);
        elem.addEventListener ("DOMMouseScroll", function(e) { $this.mouseWheelMoved(e); }, false);
    }
]);

pkg.CompRender = Class(pkg.view.Render, [
    function $prototype() {
        this.getPreferredSize = function(){
            return this.target == null ? { width:0, height:0 } : this.target.getPreferredSize();
        };

        this.recalc = function() { if (this.target != null) this.target.validate(); };

        this.paint = function(g,x,y,w,h,d){
            var c = this.target;
            if(c != null) {
                c.validate();
                var prevW =  -1, prevH = 0;
                if(zebra.ui.getDesktop(c) == null){
                    prevW = c.width;
                    prevH = c.height;
                    c.setSize(w, h);
                }
                var cx = x - c.x, cy = y - c.y;
                g.translate(cx, cy);
                pkg.paintManager.paint(g, c);
                g.translate(-cx,  -cy);
                if(prevW >= 0){
                    c.setSize(prevW, prevH);
                    c.validate();
                }
            }
        };
    }
]);

pkg.Line = Class(pkg.Panel, [
    function (){
        this.$this(L.VERTICAL);
    },

    function (orient){
        if(orient != L.HORIZONTAL && orient != L.VERTICAL) throw new Error();
        this.orient = orient;
        this.$super();
    },

    function $prototype() {
        this.lineWidth = 1;
        this.lineColor = rgb.black;

        this.paint = function(g) {
            g.setColor(this.lineColor);
            if(this.orient == L.HORIZONTAL) {
                var yy = this.top + ~~((this.height - this.top - this.bottom - 1) / 2);
                g.drawLine(this.left, yy, this.width - this.right - this.left, yy, this.lineWidth);
            }
            else {
                var xx = this.left + ~~((this.width - this.left - this.right - 1) / 2);
                g.drawLine(xx, this.top, xx, this.height - this.top - this.bottom, this.lineWidth);
            }
        };

        this.getPreferredSize = function() { return { width:this.lineWidth, height:this.lineWidth }; };
    }
]);

pkg.TextRender = Class(pkg.view.Render, zebra.util.Position.PositionMetric, [
    function $prototype() {
        this.textWidth = this.textHeight = this.startLine = this.lines = 0;
        this.owner = null;

        this.getLineIndent = function() { return 1; };
        this.getLines = function() { return this.target.getLines(); };
        this.getLineSize = function(l) { return this.target.getLine(l).length + 1; };
        this.getMaxOffset = function() { return this.target.getTextLength(); };
        this.ownerChanged = function(v) { this.owner = v; };
        this.paintLine = function (g,x,y,line,d) { g.fillText(this.getLine(line), x, y + this.font.ascent); };
        this.getLine = function(r){ return this.target.getLine(r); };

        this.targetWasChanged = function(o,n){
            if (o != null) o._.remove(this);
            if (n != null) {
                n._.add(this);
                this.invalidate(0, this.getLines());
            }
            else this.lines = 0;
        };

        this.getText = function(){
            var text = this.target;
            return text == null ? null : text.getText();
        };

        this.lineWidth = function (line){
            this.recalc();
            return this.target.getExtraChar(line);
        };

        this.recalc = function(){
            if(this.lines > 0 && this.target != null){
                var text = this.target;
                if(text != null){
                    if(this.lines > 0){
                        for(var i = this.startLine + this.lines - 1;i >= this.startLine; i-- ){
                            text.setExtraChar(i, this.font.stringWidth(this.getLine(i)));
                        }
                        this.startLine = this.lines = 0;
                    }
                    this.textWidth = 0;
                    var size = text.getLines();
                    for(var i = 0;i < size; i++){
                        var len = text.getExtraChar(i);
                        if (len > this.textWidth) this.textWidth = len;
                    }
                    this.textHeight = this.font.height * size + (size - 1) * this.getLineIndent();
                }
            }
        };

        this.textUpdated = function(src,b,off,size,ful,updatedLines){
            if (b === false) {
                if(this.lines > 0){
                    var p1 = ful - this.startLine, p2 = this.startLine + this.lines - ful - updatedLines;
                    this.lines = ((p1 > 0) ? p1 : 0) + ((p2 > 0) ? p2 : 0) + 1;
                    this.startLine = Math.min(this.startLine, ful);
                }
                else{
                    this.startLine = ful;
                    this.lines = 1;
                }
                if(this.owner != null) this.owner.invalidate();
            }
            else{
                if(this.lines > 0){
                    if(ful <= this.startLine) this.startLine += (updatedLines - 1);
                    else
                        if(ful < (this.startLine + size)) size += (updatedLines - 1);
                }
                this.invalidate(ful, updatedLines);
            }
        };

        this.invalidate = function(start,size){
            if(size > 0 && (this.startLine != start || size != this.lines)){
                if(this.lines === 0){
                    this.startLine = start;
                    this.lines = size;
                }
                else{
                    var e = this.startLine + this.lines;
                    this.startLine = Math.min(start, this.startLine);
                    this.lines = Math.max(start + size, e) - this.startLine;
                }
                if(this.owner != null) this.owner.invalidate();
            }
        };

        this.getPreferredSize = function(){
            this.recalc();
            return { width:this.textWidth, height:this.textHeight };
        };

        this.paint = function(g,x,y,w,h,d) {
            var ts = g.getTopStack();
            if(ts.width > 0 && ts.height > 0){
                var lineIndent = this.getLineIndent(), lineHeight = this.font.height, lilh = lineHeight + lineIndent;
                w = ts.width  < w ? ts.width  : w;
                h = ts.height < h ? ts.height : h;
                var startLine = 0;
                if(y < ts.y) {
                    startLine = ~~((lineIndent + ts.y - y) / lilh);
                    h += (ts.y - startLine * lineHeight - startLine * lineIndent);
                }
                else if (y > (ts.y + ts.height)) return;

                var size = this.target.getLines();
                if(startLine < size){
                    var lines =  ~~((h + lineIndent) / lilh) + (((h + lineIndent) % lilh > lineIndent) ? 1 : 0);
                    if(startLine + lines > size) lines = size - startLine;
                    y += startLine * lilh;

                    g.setFont(this.font);
                    if (d == null || d.isEnabled === true){
                        var fg = this.foreground;
                        for(var i = 0;i < lines; i ++ ){
                            this.paintSelection(g, x, y, i + startLine, d);
                            g.setColor(fg);
                            this.paintLine(g, x, y, i + startLine, d);
                            y += lilh;
                        }
                    }
                    else {
                        var c1 = pkg.disabledColor1, c2 = pkg.disabledColor2;
                        for(var i = 0;i < lines; i++){
                            if(c1 != null){
                                g.setColor(c1);
                                this.paintLine(g, x, y, i + startLine, d);
                            }
                            if(c2 != null){
                                g.setColor(c2);
                                this.paintLine(g, x + 1, y + 1, i + startLine, d);
                            }
                            y += lilh;
                        }
                    }
                }
            }
        };

        this.paintSelection = function(g,x,y,line,d){
            if(zebra.instanceOf(d, pkg.TxtSelectionInfo)){
                var p1 = d.getStartSelection();
                if(p1 != null){
                    var p2 = d.getEndSelection();
                    if ((p1[0] != p2[0] || p1[1] != p2[1]) && line >= p1[0] && line <= p2[0]){
                        var s = this.getLine(line), w = this.lineWidth(line);
                        if(line == p1[0]){
                            var ww = this.font.charsWidth(s, 0, p1[1]);
                            x += ww;
                            w -= ww;
                            if(p1[0] == p2[0]) w -= this.font.charsWidth(s, p2[1], s.length - p2[1]);
                        }
                        else if (line == p2[0]) w = this.font.charsWidth(s, 0, p2[1]);
                        g.setColor(d.selectionColor);
                        g.fillRect(x, y, w === 0 ? 1 : w, this.font.height + this.getLineIndent());
                    }
                }
            }
        };
    },

    function (text) {
        this.foreground = pkg.fontColor;
        this.font = pkg.font;
        this.$super(zebra.isString(text) ? new zebra.data.Text(text) : text);
    },

    function setText(s) { this.target.setText(s); },
    function setDefBoldFont() { this.setFont(pkg.boldFont); },

    function setFont(f){
        var old = this.font;
        if(f != old && (f == null || f.s != old.s)){
            this.font = f;
            this.invalidate(0, this.getLines());
        }
    },

    function setForeground(c){
        if (c != this.foreground && (c == null || !c.equals(this.foreground))) this.foreground = c;
    },

    function equals(o){
        return this.$super(o) && o.getLineIndent() == this.getLineIndent() &&
                                 o.foreground.equals(this.foreground) &&
                                 o.font.equals(this.font);
    }
]);

pkg.PasswordText = Class(pkg.TextRender, [
    function() {  this.$this(new zebra.data.SingleLineTxt("")); },

    function(text){
        this.echo = "*";
        this.$super(text);
    },

    function setEchoChar(ch){
        if(this.echo != ch){
            this.echo = ch;
            if(this.target != null) this.invalidate(0, this.target.getLines());
        }
    },

    function getLine(r){
        var buf = [], ln = this.$super(r);
        for(var i = 0;i < ln.length; i++) buf[i] = this.echo;
        return buf.join('');
    }
]);

pkg.Label = Class(pkg.ViewPan, [
    function () { this.$this(""); },

    function (r){
        if (zebra.isString(r)) r = new zebra.data.SingleLineTxt(r);
        this.setView(instanceOf(r, TextModel) ? new pkg.TextRender(r) : r);
        this.$super();
    },

    function getText(){ return this.view.getText(); },
    function getFont(){ return this.view.font; },
    function getForeground(){ return this.view.foreground; },

    function setText(s){
        this.view.setText(s);
        this.repaint();
    },

    function setForeground(c){
        if (c == null) throw new Error("Null color");
        if (!this.getForeground().equals(c)){
            this.view.setForeground(c);
            this.repaint();
        }
    },

    function setFont(f){
        if (f == null) throw new Error("Null font");
        if (!this.getFont().equals(f)){
            this.view.setFont(f);
            this.repaint();
        }
    }
]);

pkg.ImageLabel = Class(pkg.Panel, [
    function(txt, img) {
        this.$super(new L.FlowLayout(L.LEFT, L.CENTER, L.HORIZONTAL, 6));
        this.add(new pkg.ImagePan(img));
        this.add(new pkg.Label(txt));
    }
]);

var OVER = 0, PRESSED_OVER = 1, OUT = 2, PRESSED_OUT = 3, DISABLED = 4;
pkg.StatePan = Class(pkg.ViewPan, FocusListener, Composite, MouseListener,
                     MouseMotionListener, KeyListener, [
    function $clazz() {
        this.OVER = OVER;
        this.PRESSED_OVER = PRESSED_OVER;
        this.OUT = OUT;
        this.PRESSED_OUT = PRESSED_OUT;
        this.DISABLED = DISABLED;
    },

    function $prototype() {
        var IDS = [ "over", "pressed", "out", "out", "disabled" ];

        this.state = OUT;
        this.isCanHaveFocus = false;
        this.focusComponent = null;
        this.focusMarkerView = null;

        this.idByState = function(s) { return IDS[s]; };

        this.updateState = function(s) {
            if(s != this.state){
                var prev = this.state;
                this.state = s;
                this.stateUpdated(prev, s);
            }
        };

        this.stateUpdated = function(o,n){
            var id = this.idByState(n), b = false;

            for(var i=0; i < this.kids.length; i++) {
                if (this.kids[i].parentStateUpdated) {
                    this.kids[i].parentStateUpdated(o, n, id);
                }
            }

            if (this.border && this.border.activate) b = this.border.activate(id) || b;
            if (this.view   && this.view.activate)  b = this.view.activate(id) || b;
            if (this.bg     && this.bg.activate)   b = this.bg.activate() || b;

            if (b) this.repaint();
        };

        this.keyPressed = function(e){
            if(this.state != PRESSED_OVER && this.state != PRESSED_OUT &&
                (e.code == KE.VK_ENTER || e.code == KE.VK_SPACE))
            {
                this.updateState(PRESSED_OVER);
            }
        };

        this.keyReleased = function(e){
            if(this.state == PRESSED_OVER || this.state == PRESSED_OUT){
                this.updateState(OVER);
                if (pkg.$mouseMoveOwner != this) this.updateState(OUT);
            }
        };

        this.mouseEntered = function (e){
            if (this.isEnabled) this.updateState(this.state == PRESSED_OUT ? PRESSED_OVER : OVER);
        };

        this.mouseExited = function(e){
            if (this.isEnabled) this.updateState(this.state == PRESSED_OVER ? PRESSED_OUT : OUT);
        };

        this.mousePressed = function(e){
            if(this.state != PRESSED_OVER && this.state != PRESSED_OUT && e.isActionMask()){
                this.updateState(pkg.$mouseMoveOwner == this ? PRESSED_OVER : PRESSED_OUT);
            }
        };

        this.mouseReleased = function(e){
            if((this.state == PRESSED_OVER || this.state == PRESSED_OUT) && e.isActionMask()){
                this.updateState(pkg.$mouseMoveOwner == this ? OVER : OUT);
            }
        };

        this.mouseDragged = function(e){
            if(e.isActionMask()){
                var pressed = (this.state == PRESSED_OUT || this.state == PRESSED_OVER);
                if (e.x > 0 && e.y > 0 && e.x < this.width && e.y < this.height) {
                    this.updateState(pressed ? PRESSED_OVER : OVER);
                }
                else this.updateState(pressed ? PRESSED_OUT : OUT);
            }
        };

        this.canHaveFocus = function (){ return this.isCanHaveFocus; };
        this.focusGained = function (e){ this.repaint(); };
        this.focusLost = function (e){ this.repaint(); };

        this.paintOnTop = function(g){
            var fc = this.focusComponent;
            if (this.focusMarkerView != null &&  fc != null && this.hasFocus()) {
                this.focusMarkerView.paint(g, fc.x, fc.y, fc.width, fc.height, this);
            }
        };
    },

    function setCanHaveFocus(b){
        if(this.isCanHaveFocus != b){
            var fm = pkg.focusManager;
            if (!b && fm.focusOwner == this) fm.requestFocus(null);
            this.isCanHaveFocus = b;
        }
    },

    function setView(v){
        if (v != this.view){
            v = this.createViewSet(v);
            this.$super(v);
            this.stateUpdated(this.state, this.state);
        }
    },

    function setBorder(v){
        if(v != this.border){
            v = this.createViewSet(v);
            this.$super(v);
            this.stateUpdated(this.state, this.state);
        }
    },

    function setBackground(v){
        if(v != this.bg){
            v = this.createViewSet(v);
            this.$super(v);
            this.stateUpdated(this.state, this.state);
        }
    },

    function createViewSet(v) {
        if (v && v.paint) return v;
        if (typeof v === "function") return pkg.view.createView(v);
        var s = new ViewSet();
        for (var k in v) if (v.hasOwnProperty(k)) s.put(k, v[k]);
        return s;
    },

    function setEnabled(b){
        this.$super(b);
        this.updateState(b ? OUT : DISABLED);
    },

    function addFocusComponent(c) {
        if (this.focusComponent != c) {
            if (c != null && this.kids.indexOf(c) >= 0) throw Error();
            this.focusComponent = c;
            this.isCanHaveFocus = (c != null);
            if (c != null) this.add(c);
        }
    },

    function setFocusMarkerView(c){
        if(c != this.focusMarkerView){
            this.focusMarkerView = c;
            this.repaint();
        }
    },

    function kidRemoved(i,l){
        if(l == this.focusComponent) this.focusComponent = null;
        this.$super(i, l);
    }
]);

pkg.Button = Class(pkg.StatePan, Actionable, [
    function $clazz() {
        this.Label = Class(pkg.Label, []);

        //!!! should be identified automatically
        this.Label.$name = "Label";
    },

    function $prototype() {
        this.isFireByPress = true;
        this.firePeriod    = 20;
        this.isCanHaveFocus = true;

        this.fire = function() { this._.fire(this); };
        this.run = function(){ if (this.state == PRESSED_OVER) this.fire(); };
    },

    function() { this.$this(null); },

    function (t){
        this._ = new Listeners();
        if (zebra.isString(t)) t = new pkg.Button.Label(t);
        this.$super();
        if (t != null) this.addFocusComponent(t);
    },

    function stateUpdated(o,n){
        this.$super(o, n);
        if(n == PRESSED_OVER){
            if(this.isFireByPress){
                this.fire();
                if (this.firePeriod > 0) timer.run(this, 400, this.firePeriod);
            }
        }
        else {
            if (this.firePeriod > 0 && timer.get(this) != null)  timer.remove(this);
            if(n == OVER && (o == PRESSED_OVER && this.isFireByPress === false)) this.fire();
        }
    },

    function setFireParams(b,time){
        this.isFireByPress = b;
        this.firePeriod = time;
    }
]);

pkg.BorderPan = Class(pkg.Panel, pkg.TitleInfo, [
    function $clazz() {
        this.Label = Class(pkg.Label, []);

        //!!! should be identified automatically
        this.Label.$name = "Label";
    },

    function $prototype() {
         this.vGap = this.hGap = 0;
         this.indent = 4;

         this.getTitleInfo = function() {
            return (this.label != null) ? { x:this.label.x, y:this.label.y,
                                            width:this.label.width, height:this.label.height,
                                            orient:this.label.constraints & (L.TOP | L.BOTTOM) }
                                        : null;
        };

        this.calcPreferredSize = function(target){
            var ps = this.center != null && this.center.isVisible ? this.center.getPreferredSize()
                                                                  : { width:0, height:0 };
            if(this.label != null && this.label.isVisible){
                var lps = this.label.getPreferredSize();
                ps.height += lps.height;
                ps.width = Math.max(ps.width, lps.width + this.indent);
            }
            ps.width += (this.hGap * 2);
            ps.height += (this.vGap * 2);
            return ps;
        };

        this.doLayout = function (target){
            var h = 0, right = this.getRight(), top = this.getTop(), bottom = this.getBottom(), left = this.getLeft(),
                xa = this.label ? this.label.constraints & (L.LEFT | L.CENTER | L.RIGHT): 0,
                ya = this.label ? this.label.constraints & (L.BOTTOM | L.TOP) : 0;

            if(this.label != null && this.label.isVisible){
                var ps = this.label.getPreferredSize();
                h = ps.height;
                this.label.setSize(ps.width, h);
                this.label.setLocation((xa == L.LEFT) ? left + this.indent
                                                      : ((xa == L.RIGHT) ? this.width - right - ps.width - this.indent
                                                                                                   : ~~((this.width - ps.width) / 2)),
                                        (ya == L.BOTTOM) ? (this.height - bottom - ps.height) : top);
            }

            if(this.center != null && this.center.isVisible){
                this.center.setLocation(left + this.hGap, (ya == L.BOTTOM ? top : top + h) + this.vGap);
                this.center.setSize(this.width - right - left - 2 * this.hGap,
                                    this.height - top - bottom - h - 2 * this.vGap);
            }
        };
    },

    function(title) { this.$this(title, null); },
    function() { this.$this(null); },
    function(title, center) { this.$this(title, center, L.TOP | L.LEFT); },

    function(title, center, ctr){
        if (zebra.isString(title)) title = new pkg.BorderPan.Label(title);
        this.label = this.center= null;
        this.$super();
        if(title != null) this.add(ctr, title);
        if(center != null) this.add(L.CENTER, center);
    },

    function setGaps(vg,hg){
        if(this.vGap != vg || hg != this.hGap){
            this.vGap = vg;
            this.hGap = hg;
            this.vrp();
        }
    },

    function kidAdded(index,id,lw){
        this.$super(index, id, lw);
        if(L.CENTER == id) this.center = lw;
        else this.label = lw;
    },

    function kidRemoved(index,lw){
        this.$super(index, lw);
        if(lw == this.label) this.label = null;
        else this.center = null;
    },

    function set(ctr,c){
        var rc = (CENTER == ctr) ? this.center : this.label;
        if(rc != null) this.remove(rc);
        this.add(ctr, c);
    }
]);

pkg.SwitchManager = Class([
    function $prototype() {
        this.getState = function(o) { return this.state; };

        this.setState = function(o,b) {
            if(this.getState(o) != b){
                this.state = b;
                this.updated(o, b);
            }
        };

        this.updated = function(o, b){
            if (o != null) o.switched(b);
            this._.fire(this, o);
        };
    },

    function () {
        this.state = false;
        this._ = new Listeners();
    },

    function install(o) { o.switched(this.getState(o)); },
    function uninstall(o){}
]);

pkg.Group = Class(pkg.SwitchManager, [
    function (){
        this.$super();
        this.state = null;
    },

    function getState(o) { return o == this.state; },

    function setState(o,b){
        if(this.getState(o) != b){
            this.clearSelected();
            this.state = o;
            this.updated(o, true);
        }
    },

    function clearSelected(){
        if(this.state != null){
            var old = this.state;
            this.state = null;
            this.updated(old, false);
        }
    }
]);

pkg.Checkbox = Class(pkg.StatePan, Actionable, [
    function $clazz() {
        var IDS = ["on", "off", "don", "doff", "onover", "offover"];

        this.Box = Class(pkg.ViewPan, [
            function parentStateUpdated(o, n, id) {
                this.view.activate(id);
                this.repaint();
            }
        ]);

        this.Label = Class(pkg.Label, []);
    },

    function $prototype() {
       this.setState = function(b){ this.manager.setState(this, b); };
       this.getState = function() { return this.manager.getState(this); };
       this.switched = function(b){ this.stateUpdated(this.state, this.state); };

       this.idByState = function(state){
           if(this.isEnabled) {
               var id = this.getState() ? "on" : "off";
               return (this.state == OVER) ? id.concat("over") : id;
           }
           return this.getState() ? "don" : "doff";
       };
    },

    function () { this.$this(null); },

    function (c){
        this.$this(c, new pkg.SwitchManager());
    },

    function (c, m){
        var clazz = this.getClazz();
        if (zebra.isString(c)) c = clazz.Label ? new clazz.Label(c) : new pkg.Label(c);
        this.$super();
        if (clazz.Box) this.add(new clazz.Box());
        if (c != null) this.addFocusComponent(c);
        this.setSwitchManager(m);
    },

    function keyPressed(e){
        if(instanceOf(this.manager, pkg.Group) && this.getState()){
            var code = e.code, d = 0;
            if(code == KE.VK_LEFT || code == KE.VK_UP) d = -1;
            else if (code == KE.VK_RIGHT || code == KE.VK_DOWN) d = 1;

            if(d !== 0) {
                var p = this.parent, idx = p.indexOf(this);
                for(var i = idx + d;i < p.kids.length && i >= 0; i += d){
                    var l = p.kids[i];
                    if(l.isVisible && l.isEnabled && instanceOf(l, pkg.Checkbox) && l.manager == this.manager){
                        l.requestFocus();
                        l.setState(true);
                        break;
                    }
                }
                return ;
            }
        }
        this.$super(e);
    },

    function setSwitchManager(m){
        if(m == null) throw new Error();
        if(this.manager != m){
            if(this.manager != null) this.manager.uninstall(this);
            this.manager = m;
            this.manager.install(this);
        }
    },

    function stateUpdated(o, n) {
        if (o == PRESSED_OVER && n == OVER) this.setState(!this.getState());
        this.$super(o, n);
    }
]);

pkg.Radiobox = Class(pkg.Checkbox, [
    function $clazz() {
        this.Box   = Class(pkg.Checkbox.Box, []);
        this.Label = Class(pkg.Checkbox.Label, []);
    },

    function(c) {
        this.$this(c, new pkg.Group());
    },

    function(c, group) {
        this.$super(c, group);
    }
]);

pkg.SplitPan = Class(pkg.Panel, MouseMotionListener, Composite, Cursorable, [
    function $clazz() {
        this.Bar = Class(pkg.Panel, []);
    },

    function $prototype() {
        this.leftMinSize = this.rightMaxSize = 50;
        this.isMoveable = true;
        this.gap = 1;

        this.getCursorType = function(t,x,y){
            return this.isInGripper(this.gripper, x, y) ? this.orientation == L.VERTICAL ? Cursor.W_RESIZE
                                                                                         : Cursor.N_RESIZE : -1;
        };

        this.catchInput = function(c) { return c == this.gripper; };

        this.mouseDragged = function(e){
            if(this.isDragged === true){
                var x = e.x, y = e.y;
                if(this.orientation == L.VERTICAL){
                    if(this.prevLoc != x){
                        x = this.normalizeBarLoc(x);
                        if(x > 0){
                            this.prevLoc = x;
                            this.setGripperLoc(x);
                        }
                    }
                }
                else{
                    if(this.prevLoc != y){
                        y = this.normalizeBarLoc(y);
                        if(y > 0){
                            this.prevLoc = y;
                            this.setGripperLoc(y);
                        }
                    }
                }
            }
        };

        this.normalizeBarLoc = function(xy){
            if(xy < this.minXY) xy = this.minXY;
            else if(xy > this.maxXY) xy = this.maxXY;
            return (xy > this.maxXY || xy < this.minXY) ?  -1 : xy;
        };

        this.isInGripper = function(g, x, y){
            return g != null && x >= g.x && y >= g.y && x < g.x + g.width && y < g.y + g.height;
        };

        this.setGripperLoc = function(l){
            if(l != this.barLocation){
                this.barLocation = l;
                this.vrp();
            }
        };

        this.calcPreferredSize = function(c){
            var fSize = pkg.getPreferredSize(this.leftComp),
                sSize = pkg.getPreferredSize(this.rightComp),
                bSize = pkg.getPreferredSize(this.gripper);

            if(this.orientation == L.HORIZONTAL){
                bSize.width = Math.max(Math.max(fSize.width, sSize.width), bSize.width);
                bSize.height = fSize.height + sSize.height + bSize.height + 2 * this.gap;
            }
            else{
                bSize.width = fSize.width + sSize.width + bSize.width + 2 * this.gap;
                bSize.height = Math.max(Math.max(fSize.height, sSize.height), bSize.height);
            }
            return bSize;
        };

        this.doLayout = function(target){
            var right = this.getRight(), top = this.getTop(), bottom = this.getBottom(),
                left = this.getLeft(), gap = this.gap, bSize = pkg.getPreferredSize(this.gripper);

            if (this.orientation == L.HORIZONTAL){
                var w = this.width - left - right;
                if(this.barLocation < top) this.barLocation = top;
                else {
                    if(this.barLocation > this.height - bottom - bSize.height) {
                        this.barLocation = this.height - bottom - bSize.height;
                    }
                }

                if(this.gripper != null){
                    if(this.isMoveable){
                        this.gripper.setLocation(left, this.barLocation);
                        this.gripper.setSize(w, bSize.height);
                    }
                    else{
                        this.gripper.setSize(bSize.width, bSize.height);
                        this.gripper.toPreferredSize();
                        this.gripper.setLocation(~~((w - bSize.width) / 2), this.barLocation);
                    }
                }
                if(this.leftComp != null){
                    this.leftComp.setLocation(left, top);
                    this.leftComp.setSize(w, this.barLocation - gap - top);
                }
                if(this.rightComp != null){
                    this.rightComp.setLocation(left, this.barLocation + bSize.height + gap);
                    this.rightComp.setSize(w, this.height - this.rightComp.y - bottom);
                }
            }
            else{
                var h = this.height - top - bottom;
                if(this.barLocation < left) this.barLocation = left;
                else {
                    if (this.barLocation > this.width - right - bSize.width) {
                        this.barLocation = this.width - right - bSize.width;
                    }
                }

                if (this.gripper != null){
                    if(this.isMoveable){
                        this.gripper.setLocation(this.barLocation, top);
                        this.gripper.setSize(bSize.width, h);
                    }
                    else{
                        this.gripper.setSize(bSize.width, bSize.height);
                        this.gripper.setLocation(this.barLocation, ~~((h - bSize.height) / 2));
                    }
                }

                if (this.leftComp != null){
                    this.leftComp.setLocation(left, top);
                    this.leftComp.setSize(this.barLocation - left - gap, h);
                }

                if(this.rightComp != null){
                    this.rightComp.setLocation(this.barLocation + bSize.width + gap, top);
                    this.rightComp.setSize(this.width - this.rightComp.x - right, h);
                }
            }
        };
    },

    function (){ this.$this(null, null, L.VERTICAL); },
    function (f,s){ this.$this(f, s, L.VERTICAL); },

    function (f,s,o){
        this.isDragged = false;
        this.prevLoc = this.orientation = this.minXY = this.maxXY = 0;
        this.barLocation = 70;
        this.leftComp = this.rightComp = this.gripper = null;
        this.setOrientation(o);
        this.$super();

        if(f != null) this.add(L.LEFT, f);
        if(s != null) this.add(L.RIGHT, s);
        this.add(L.CENTER, new pkg.SplitPan.Bar());
    },

    function setGap(g){
        if(this.gap != g){
            this.gap = g;
            this.vrp();
        }
    },

    function setLeftMinSize(m){
        if(this.leftMinSize != m){
            this.leftMinSize = m;
            this.vrp();
        }
    },

    function setRightMaxSize(m){
        if(this.rightMaxSize != m){
            this.rightMaxSize = m;
            this.vrp();
        }
    },

    function setOrientation(o){
        if(o != L.VERTICAL && o != L.HORIZONTAL) throw new Error();
        if(this.orientation != o){
            this.orientation = o;
            this.vrp();
        }
    },

    function startDragged(e){
        var x = e.x, y = e.y;
        if(e.isActionMask() && this.isInGripper(this.gripper, x, y)){
            this.isDragged = true;
            if(this.orientation == L.VERTICAL){
                x = this.normalizeBarLoc(x);
                if(x > 0) this.prevLoc = x;
            }
            else{
                y = this.normalizeBarLoc(y);
                if(y > 0) this.prevLoc = y;
            }
        }
    },

    function endDragged(e){
        if(this.isDragged === true){
            this.isDragged = false;
            var xy = this.normalizeBarLoc(this.orientation == L.VERTICAL ? e.x : e.y);
            if(xy > 0) this.setGripperLoc(xy);
        }
    },

    function setGripperMovable(b){
        if(b != this.isMoveable){
            this.isMoveable = b;
            this.vrp();
        }
    },

    function kidAdded(index,id,c){
        this.$super(index, id, c);
        if(L.LEFT == id) this.leftComp = c;
        else
            if(L.RIGHT == id) this.rightComp = c;
            else
                if(L.CENTER == id) this.gripper = c;
                else throw new Error();
    },

    function kidRemoved(index,c){
        this.$super(index, c);
        if(c == this.leftComp) this.leftComp = null;
        else
            if(c == this.rightComp) this.rightComp = null;
            else
                if(c == this.gripper) this.gripper = null;
    },

    function resized(pw,ph) {
        var ps = this.gripper.getPreferredSize();
        if(this.orientation == L.VERTICAL){
            this.minXY = this.getLeft() + this.gap + this.leftMinSize;
            this.maxXY = this.width - this.gap - this.rightMaxSize - ps.width - this.getRight();
        }
        else{
            this.minXY = this.getTop() + this.gap + this.leftMinSize;
            this.maxXY = this.height - this.gap - this.rightMaxSize - ps.height - this.getBottom();
        }
        this.$super(pw, ph);
    }
]);

pkg.Progress = Class(pkg.Panel, Actionable, [
    function (){
        this.value = 0;
        this.gap = 2;
        this.bundleView = rgb.darkBlue;
        this.bundleWidth = this.bundleHeight = 6;
        this.orientation = L.HORIZONTAL;
        this.maxValue = 20;
        this._ = new Listeners();
        this.$super();
    },

    function setOrientation(o){
        if(o != L.HORIZONTAL && o != L.VERTICAL) throw new Error();
        if(o != this.orientation){
            this.orientation = o;
            this.vrp();
        }
    },

    function setMaxValue(m){
        if(m != this.maxValue){
            this.maxValue = m;
            this.setValue(this.value);
            this.vrp();
        }
    },

    function setValue(p){
        p = p % (this.maxValue + 1);
        if(this.value != p){
            var old = this.value;
            this.value = p;
            this._.fire(this, old);
            this.repaint();
        }
    },

    function setGap(g){
        if(this.gap != g){
            this.gap = g;
            this.vrp();
        }
    },

    function setBundleView(v){
        if(this.bundleView != v){
            this.bundleView = v;
            this.vrp();
        }
    },

    function setBundleSize(w, h){
        if(w != this.bundleWidth && h != this.bundleHeight){
            this.bundleWidth  = w;
            this.bundleHeight = h;
            this.vrp();
        }
    },

    function paint(g){
        var left = this.getLeft(), right = this.getRight(), top = this.getTop(), bottom = this.getBottom(),
            rs = (this.orientation == L.HORIZONTAL) ? this.width - left - right : this.height - top - bottom,
            bundleSize = (this.orientation == L.HORIZONTAL) ? this.bundleWidth : this.bundleHeight;

        if(rs >= bundleSize){
            var vLoc = ~~((rs * this.value) / this.maxValue),
                x = left, y = this.height - bottom, bundle = this.bundleView,
                wh = this.orientation == L.HORIZONTAL ? this.height - top - bottom
                                                      : this.width - left - right;

            while(x < (vLoc + left) && this.height - vLoc - bottom < y){
                if(this.orientation == L.HORIZONTAL){
                    bundle.paint(g, x, top, bundleSize, wh, this);
                    x += (bundleSize + this.gap);
                }
                else{
                    bundle.paint(g, left, y - bundleSize, wh, bundleSize, this);
                    y -= (bundleSize + this.gap);
                }
            }

            if (this.titleView != null){
                var ps = this.bundleView.getPreferredSize();
                this.titleView.paint(g, L.getXLoc(ps.width, L.CENTER, this.width),
                                           L.getYLoc(ps.height, L.CENTER, this.height),
                                           ps.width, ps.height, this);
            }
        }
    },

    function calcPreferredSize(l){
        var bundleSize = (this.orientation == L.HORIZONTAL) ? this.bundleWidth : this.bundleHeight,
            v1 = (this.maxValue * bundleSize) + (this.maxValue - 1) * this.gap,
            ps = this.bundleView.getPreferredSize();

        ps = (this.orientation == L.HORIZONTAL) ? { width:v1,
                                                    height:(this.bundleHeight >= 0 ? this.bundleHeight
                                                                                   : ps.height) }
                                                : { width:(this.bundleWidth >= 0 ? this.bundleWidth
                                                                                 : ps.width),
                                                    height: v1 };
        if (this.titleView != null) {
            var tp = this.titleView.getPreferredSize();
            ps.width  = Math.max(ps.width, tp.width);
            ps.height = Math.max(ps.height, tp.height);
        }
        return ps;
    }
]);

pkg.Link = Class(pkg.Button, Cursorable, [
    function $prototype() {
        this.getCursorType = function(target,x,y){ return Cursor.HAND; };
    },

    function(s){
        this.colors = [ rgb.blue, rgb.darkBlue, rgb.black, rgb.blue, rgb.gray];
        this.$super(null);
        var tr = new pkg.TextRender(s);
        tr.setFont(pkg.Link.font);
        this.setView(tr);
        this.stateUpdated(this.state, this.state);
    },

    function setColor(state,c){
        if (this.colors[state].equals(c) === false){
            this.colors[state] = c;
            this.stateUpdated(state, state);
        }
    },

    function stateUpdated(o,n){
        this.$super(o, n);
        var r = this.view;
        if (r && !r.foreground.equals(this.colors[n])){
            r.setForeground(this.colors[n]);
            this.repaint();
        }
    }
]);

pkg.Extender = Class(pkg.Panel, MouseListener, Composite, [
    function $prototype() {
        this.catchInput = function(child){ return child != this.contentPan && !L.isAncestorOf(this.contentPan, child); };
    },

    function $clazz() {
        this.Label = Class(pkg.Label,[]);
        this.TitlePan = Class(pkg.Panel, []);
        this.TogglePan = Class(pkg.ViewPan, []);
    },

    function (content, lab){
        this.isCollapsed = false;
        this.$super(new L.BorderLayout(8,8));
        if (zebra.isString(lab)) lab = new pkg.Extender.Label(lab);

        this.labelPan = lab;
        this.titlePan = new pkg.Extender.TitlePan();
        this.add(L.TOP, this.titlePan);

        this.togglePan = new pkg.Extender.TogglePan();
        this.titlePan.add(this.togglePan);
        this.titlePan.add(this.labelPan);

        this.contentPan = content;
        this.contentPan.setVisible( !this.isCollapsed);
        this.add(L.CENTER, this.contentPan);
    },

    function toggle(){
        this.isCollapsed = this.isCollapsed ? false : true;
        this.contentPan.setVisible(!this.isCollapsed);
        this.togglePan.view.activate(this.isCollapsed ? "off" : "on");
        this.repaint();
    },

    function mousePressed(e){
        if (e.isActionMask() && this.getComponentAt(e.x, e.y) == this.togglePan) this.toggle();
    }
]);

pkg.ScrollManager = Class([
    function (c){
        this.sx = this.sy = 0;
        this._ = new Listeners('scrolled');
        this.target = c;
        this.targetIsListener = instanceOf(c, pkg.ScrollListener);
    },

    function getSX(){ return this.sx; },
    function getSY(){ return this.sy; },

    function scrolled(sx,sy,psx,psy){
        this.sx = sx;
        this.sy = sy;
    },

    function scrollXTo(v){ this.scrollTo(v, this.getSY());},
    function scrollYTo(v){ this.scrollTo(this.getSX(), v); },

    function scrollTo(x, y){
        var psx = this.getSX(), psy = this.getSY();
        if(psx != x || psy != y){
            this.scrolled(x, y, psx, psy);
            if (this.targetIsListener === true) this.target.scrolled(psx, psy);
            this._.fire(psx, psy);
        }
    },

    function makeVisible(x,y,w,h){
        var p = pkg.calcOrigin(x, y, w, h, this.getSX(), this.getSY(), this.target);
        this.scrollTo(p[0], p[1]);
    }
]);

//!!! not sure the class is useful
pkg.CompScrollManager = Class(pkg.ScrollManager, L.Layout, [
    function (c){
        this.$super(c);
        this.tl = c.layout;
        c.setLayout(this);
    },

    function $prototype() {
        this.calcPreferredSize = function(l) { return this.tl.calcPreferredSize(l); };

        this.doLayout = function(t){
            this.tl.doLayout(t);
            for(var i = 0;i < t.kids.length; i ++ ){
                var l = t.kids[i];
                l.setLocation(l.x + this.getSX(), l.y + this.getSY());
            }
        };

        this.scrolled = function(sx,sy,px,py){
            this.$super(sx, sy, px, py);
            this.target.invalidate();
        };
    }
]);

pkg.Scroll = Class(pkg.Panel, MouseListener, MouseMotionListener,
                   zebra.util.Position.PositionMetric, Composite, [

    function $clazz() {
        var SB = Class(pkg.Button, [
            function $prototype() {
                this.isFireByPress = true;
                this.firePeriod = 20;
                this.isCanHaveFocus = false;
            }
        ]);

        this.VIncButton = Class(SB, []);
        this.VDecButton = Class(SB, []);
        this.HIncButton = Class(SB, []);
        this.HDecButton = Class(SB, []);

        this.VBundle = Class(pkg.Panel, []);
        this.HBundle = Class(pkg.Panel, []);

        this.MIN_BUNDLE_SIZE = 16;
    },

    function $prototype() {
        this.extra = this.max  = 100;
        this.pageIncrement = 20;
        this.unitIncrement = 5;

        this.isInBundle = function(x,y){
            var bn = this.bundle;
            return (bn != null && bn.isVisible && bn.x <= x && bn.y <= y && bn.x + bn.width > x && bn.y + bn.height > y);
        };

        this.amount = function(){
            var db = this.decBt, ib = this.incBt;
            return (this.type == L.VERTICAL) ? ib.y - db.y - db.height : ib.x - db.x - db.width;
        };

        this.pixel2value = function(p) {
            var db = this.decBt, bn = this.bundle;
            return (this.type == L.VERTICAL) ? ~~((this.max * (p - db.y - db.height)) / (this.amount() - bn.height))
                                             : ~~((this.max * (p - db.x - db.width )) / (this.amount() - bn.width));
        };

        this.value2pixel = function(){
            var db = this.decBt, bn = this.bundle, off = this.position.offset;
            return (this.type == L.VERTICAL) ? db.y + db.height +  ~~(((this.amount() - bn.height) * off) / this.max)
                                             : db.x + db.width  +  ~~(((this.amount() - bn.width) * off) / this.max);
        };


        this.catchInput = function (child){
            return child == this.bundle || (this.bundle.kids.length > 0 &&
                                            L.isAncestorOf(this.bundle, child));
        };

        this.posChanged = function(target,po,pl,pc){
            if(this.bundle != null){
                if(this.type == L.HORIZONTAL) this.bundle.setLocation(this.value2pixel(), this.getTop());
                else this.bundle.setLocation(this.getLeft(), this.value2pixel());
            }
        };

        this.getLines     = function (){ return this.max; };
        this.getLineSize  = function (line){ return 1; };
        this.getMaxOffset = function (){ return this.max; };

        this.fired = function(src){
            this.position.setOffset(this.position.offset + ((src == this.incBt) ? this.unitIncrement
                                                                                : -this.unitIncrement));
        };

        this.mouseDragged = function(e){
            if(Number.MAX_VALUE != this.startDragLoc) {
                this.position.setOffset(this.pixel2value(this.bundleLoc -
                                                         this.startDragLoc +
                                                         ((this.type == L.HORIZONTAL) ? e.x : e.y)));
            }
        };

        this.calcPreferredSize = function (target){
            var ps1 = pkg.getPreferredSize(this.incBt), ps2 = pkg.getPreferredSize(this.decBt),
                ps3 = pkg.getPreferredSize(this.bundle);

            if(this.type == L.HORIZONTAL){
                ps1.width += (ps2.width + ps3.width);
                ps1.height = Math.max(Math.max(ps1.height, ps2.height), ps3.height);
            }
            else{
                ps1.height += (ps2.height + ps3.height);
                ps1.width = Math.max(Math.max(ps1.width, ps2.width), ps3.width);
            }
            return ps1;
        };

        this.doLayout = function(target){
            var right = this.getRight(), top = this.getTop(), bottom = this.getBottom(),
                left = this.getLeft(), ew = this.width - left - right, eh = this.height - top - bottom,
                b = (this.type == L.HORIZONTAL), ps1 = pkg.getPreferredSize(this.decBt),
                ps2 = pkg.getPreferredSize(this.incBt),
                minbs = pkg.Scroll.MIN_BUNDLE_SIZE;

            if(ps1.width > 0){
                this.decBt.setSize(b ? ps1.width : ew, b ? eh : ps1.height);
                this.decBt.setLocation(left, top);
            }

            if(ps2.width > 0){
                this.incBt.setSize(b ? ps2.width : ew, b ? eh : ps2.height);
                this.incBt.setLocation(b ? this.width - right - ps2.width : left, b ? top : this.height - bottom - ps2.height);
            }

            if(this.bundle != null && this.bundle.isVisible){
                var am = this.amount();
                if(am > minbs){
                    var bsize = Math.max(Math.min(~~((this.extra * am) / this.max), am - minbs), minbs);
                    this.bundle.setSize(b ? bsize : ew, b ? eh : bsize);
                    this.bundle.setLocation(b ? this.value2pixel() : left, b ? top : this.value2pixel());
                }
                else this.bundle.setSize(0, 0);
            }
        };
    },

    function (t) {
        if (t != L.VERTICAL && t != L.HORIZONTAL) throw new Error();
        this.incBt = this.decBt = this.bundle = this.position = null;
        this.bundleLoc = this.type = 0;
        this.startDragLoc = Number.MAX_VALUE;
        this.$super(this);

        this.add(L.CENTER, t == L.VERTICAL ? new pkg.Scroll.VBundle()    : new pkg.Scroll.HBundle());
        this.add(L.TOP   , t == L.VERTICAL ? new pkg.Scroll.VDecButton() : new pkg.Scroll.HDecButton());
        this.add(L.BOTTOM, t == L.VERTICAL ? new pkg.Scroll.VIncButton() : new pkg.Scroll.HIncButton());

        this.type = t;
        this.setPosition(new zebra.util.Position(this));
    },

    function setMaximum(m){
        if(m != this.max){
            this.max = m;
            if(this.position.offset > this.max) this.position.setOffset(this.max);
            this.vrp();
        }
    },

    function setPosition(p){
        if(p != this.position){
            if(this.position != null) this.position._.remove(this);
            this.position = p;
            if(this.position != null){
                this.position._.add(this);
                this.position.setPositionMetric(this);
                this.position.setOffset(0);
            }
        }
    },

    function startDragged(e){
        if (this.isInBundle(e.x, e.y)){
            this.startDragLoc = this.type == L.HORIZONTAL ? e.x : e.y;
            this.bundleLoc = this.type == L.HORIZONTAL ? this.bundle.x : this.bundle.y;
        }
    },

    function endDragged(e){ this.startDragLoc = Number.MAX_VALUE; },

    function mousePressed(e){
        if( !this.isInBundle(e.x, e.y) && e.isActionMask()){
            var d = this.pageIncrement;
            if(this.type == L.VERTICAL){
                if(e.y < (this.bundle != null ? this.bundle.y : ~~(this.height / 2))) d =  -d;
            }
            else {
                if(e.x < (this.bundle != null ? this.bundle.x : ~~(this.width / 2))) d =  -d;
            }
            this.position.setOffset(this.position.offset + d);
        }
    },

    function setExtraSize(e){
        if(e != this.extra){
            this.extra = e;
            this.vrp();
        }
    },

    function kidAdded(index,id,lw){
        this.$super(index, id, lw);
        if(L.CENTER == id) this.bundle = lw;
        else
            if(L.BOTTOM == id){
                this.incBt = lw;
                this.incBt._.add(this);
            }
            else
                if(L.TOP == id){
                    this.decBt = lw;
                    this.decBt._.add(this);
                }
                else throw new Error();
    },

    function kidRemoved(index,lw){
        this.$super(index, lw);
        if(lw == this.bundle) this.bundle = null;
        else {
            if(lw == this.incBt){
                this.incBt._.remove(this);
                this.incBt = null;
            }
            else {
                if(lw == this.decBt){
                    this.decBt._.remove(this);
                    this.decBt = null;
                }
            }
        }
    }
]);

pkg.ScrollPan = Class(pkg.Panel, pkg.ScrollListener, [
    function $clazz() {
        this.ContentPan = Class(pkg.Panel, [
            function (c){
                this.$super(new L.RasterLayout(L.USE_PS_SIZE));
                this.sman = new pkg.ScrollManager(c, [
                    function getSX() {  return this.target.x; },
                    function getSY() { return this.target.y;  },
                    function scrolled(sx,sy,psx,psy){ this.target.setLocation(sx, sy); }
                ]);
                this.addScrolledComponent(c);
            },

            function getScrollManager(){ return this.sman; },
            function addScrolledComponent(c){ this.add(c);}
        ]);
    },

    function $prototype() {
        this.scrolled = function (psx,psy){
            try{
                this.validate();
                this.isPosChangedLocked = true;
                if(this.hBar != null) this.hBar.position.setOffset( -this.scrollObj.getScrollManager().getSX());
                if(this.vBar != null) this.vBar.position.setOffset( -this.scrollObj.getScrollManager().getSY());
                if(this.scrollObj.getScrollManager() == null) this.invalidate();
            }
            finally { this.isPosChangedLocked = false; }
        };

        this.calcPreferredSize = function (target){ return pkg.getPreferredSize(this.scrollObj); };

        this.doLayout = function (target){
            var sman = (this.scrollObj == null) ? null : this.scrollObj.getScrollManager(),
                right = this.getRight(), top = this.getTop(), bottom = this.getBottom(), left = this.getLeft(),
                ww = this.width - left - right, maxH = ww, hh = this.height - top - bottom, maxV = hh,
                so = this.scrollObj.getPreferredSize();

            if(this.hBar != null &&
                (so.width > ww ||
                  (so.height > hh && so.width > (ww - (this.vBar == null ? 0
                                                                         : this.vBar.getPreferredSize().width)))))
            {
                maxV -= this.hBar.getPreferredSize().height;
            }

            maxV = so.height > maxV ? (so.height - maxV) :  -1;
            if(this.vBar != null &&
                (so.height > hh ||
                  (so.width > ww && so.height > (hh - (this.hBar == null ? 0
                                                                         : this.hBar.getPreferredSize().height)))))
            {
                maxH -= this.vBar.getPreferredSize().width;
            }

            maxH = so.width > maxH ? (so.width - maxH) :  -1;
            var sy = sman.getSY(), sx = sman.getSX();
            if(this.vBar != null){
                if(maxV < 0){
                    if(this.vBar.isVisible){
                        this.vBar.setVisible(false);
                        sman.scrollTo(sx, 0);
                        this.vBar.position.setOffset(0);
                    }
                    sy = 0;
                }
                else{
                    this.vBar.setVisible(true);
                    sy = sman.getSY();
                }
            }
            if(this.hBar != null){
                if(maxH < 0){
                    if(this.hBar.isVisible){
                        this.hBar.setVisible(false);
                        sman.scrollTo(0, sy);
                        this.hBar.position.setOffset(0);
                    }
                }
                else this.hBar.setVisible(true);
            }
            var vs = pkg.getPreferredSize(this.vBar), hs = pkg.getPreferredSize(this.hBar);
            if(this.scrollObj.isVisible){
                this.scrollObj.setLocation(left, top);
                this.scrollObj.setSize(ww - vs.width, hh - hs.height);
            }

            if(this.hBar != null && hs.height > 0){
                this.hBar.setLocation(left, this.height - bottom - hs.height);
                this.hBar.setSize(ww - vs.width, hs.height);
                this.hBar.setMaximum(maxH);
            }

            if(this.vBar != null && vs.width > 0){
                this.vBar.setLocation(this.width - right - vs.width, top);
                this.vBar.setSize(vs.width, hh - hs.height);
                this.vBar.setMaximum(maxV);
            }
        };
    },

    function (){ this.$this(null, L.HORIZONTAL | L.VERTICAL); },
    function (c){ this.$this(c, L.HORIZONTAL | L.VERTICAL); },

    function (c, barMask){
        this.hBar = this.vBar = this.scrollObj = null;
        this.isPosChangedLocked = false;
        this.$super();
        if ((L.HORIZONTAL & barMask) > 0) this.add(L.BOTTOM, new pkg.Scroll(L.HORIZONTAL));
        if ((L.VERTICAL & barMask) > 0) this.add(L.RIGHT, new pkg.Scroll(L.VERTICAL));
        if (c != null) this.add(L.CENTER, c);
    },

    function setIncrements(hUnit,hPage,vUnit,vPage){
        if(this.hBar != null){
            if(hUnit !=  -1) this.hBar.unitIncrement = hUnit;
            if(hPage !=  -1) this.hBar.pageIncrement = hPage;
        }

        if(this.vBar != null){
            if(vUnit !=  -1) this.vBar.unitIncrement = vUnit;
            if(vPage !=  -1) this.vBar.pageIncrement = vPage;
        }
    },

    function posChanged(target,prevOffset,prevLine,prevCol){
        if (this.isPosChangedLocked === false){
            if(this.hBar != null && this.hBar.position == target) {
                this.scrollObj.getScrollManager().scrollXTo(-this.hBar.position.offset);
            }
            else {
                if(this.vBar != null) this.scrollObj.getScrollManager().scrollYTo(-this.vBar.position.offset);
            }
        }
    },

    function insert(i,ctr,c){
        if (L.CENTER == ctr && c.getScrollManager() == null) c = new pkg.ScrollPan.ContentPan(c);
        return this.$super(i, ctr, c);
    },

    function kidAdded(index,id,comp){
        this.$super(index, id, comp);
        if(L.CENTER == id){
            this.scrollObj = comp;
            this.scrollObj.getScrollManager()._.add(this);
        }
        if(L.BOTTOM  == id || L.TOP == id){
            this.hBar = comp;
            this.hBar.position._.add(this);
        }
        else
            if(L.LEFT == id || L.RIGHT == id){
                this.vBar = comp;
                this.vBar.position._.add(this);
            }
    },

    function kidRemoved(index,comp){
        this.$super(index, comp);
        if(comp == this.scrollObj){
            this.scrollObj.getScrollManager()._.remove(this);
            this.scrollObj = null;
        }
        else {
            if(comp == this.hBar){
                this.hBar.position._.remove(this);
                this.hBar = null;
            }
            else {
                if(comp == this.vBar){
                    this.vBar.position._.remove(this);
                    this.vBar = null;
                }
            }
        }
    }
]);

pkg.Tabs = Class(pkg.Panel, MouseListener, KeyListener, pkg.TitleInfo, FocusListener,
                 MouseMotionListener, [
    function $prototype() {
        this.brSpace = this.upperSpace = this.vgap = this.hgap = this.tabAreaX = 0;
        this.tabAreaY = this.tabAreaWidth = this.tabAreaHeight = 0;
        this.overTab = this.selectedIndex = -1;
        this.hTabGap = this.vTabGap = this.sideSpace = 1;
        this.orient = L.TOP;

        this.mouseMoved = function(e) {
            var i = this.getTabAt(e.x, e.y);
            if (this.overTab != i) {
                //!!! var tr1 = (this.overTab >= 0) ? this.getTabBounds(this.overTab) : null;
                //!!!var tr2 = (i >= 0) ? this.getTabBounds(i) : null;
                //!!!if (tr1 && tr2) zebra.util.unite();
                this.overTab = i;
                if (this.views["tabover"] != null) {
                    this.repaint(this.tabAreaX, this.tabAreaY, this.tabAreaWidth, this.tabAreaHeight);
                }
            }
        };

        this.endDragged = function(e) {
            var i = this.getTabAt(e.x, e.y);
            if (this.overTab != i) {
                this.overTab = i;
                if (this.views["tabover"] != null) {
                    this.repaint(this.tabAreaX, this.tabAreaY, this.tabAreaWidth, this.tabAreaHeight);
                }
            }
        };

        this.mouseExited = function(e) {
            if (this.overTab >= 0) {
                this.overTab = -1;
                if (this.views["tabover"] != null) {
                    this.repaint(this.tabAreaX, this.tabAreaY, this.tabAreaWidth, this.tabAreaHeight);
                }
            }
        };

        this.next =  function (page, d){
            for(; page >= 0 && page < ~~(this.pages.length / 2); page += d) {
                if (this.isTabEnabled(page)) return page;
            }
            return -1;
        };

        this.getTitleInfo = function(){
            var b = (this.orient == L.LEFT || this.orient == L.RIGHT),
                res = b ? { x:this.tabAreaX, y:0, width:this.tabAreaWidth, height:0, orient:this.orient }
                        : { x:0, y:this.tabAreaY, width:0, height:this.tabAreaHeight, orient:this.orient };
            if(this.selectedIndex >= 0){
                var r = this.getTabBounds(this.selectedIndex);
                if(b){
                    res[1] = r.y;
                    res[3] = r.height;
                }
                else{
                    res[0] = r.x;
                    res[2] = r.width;
                }
            }
            return res;
        };

        this.canHaveFocus = function(){ return true; };

        this.getTabView = function (index){
            var data = this.pages[2 * index];
            if (data.paint) return data;
            this.textRender.target.setText(data.toString());
            return this.textRender;
        };

        this.isTabEnabled = function (index){ return this.kids[index].isEnabled; };

        this.paint = function(g){
            var ts = g.getTopStack(), cx = ts.x, cy = ts.y, cw = ts.width, ch = ts.height;

            if(this.selectedIndex > 0){
                var r = this.getTabBounds(this.selectedIndex);
                //!!!! if(this.orient == L.LEFT || this.orient == L.RIGHT)
                //     g.clipRect(r.x, this.tabAreaY, r.width, r.y - this.tabAreaY);
                // else
                //     g.clipRect(this.tabAreaX, r.y, r.x - this.tabAreaX, r.height);
            }

            for(var i = 0;i < this.selectedIndex; i++) this.paintTab(g, i);

            if(this.selectedIndex >= 0){
                //!!!g.setClip(cx, cy, cw, ch);
                var r = this.getTabBounds(this.selectedIndex);
                //!!!! if(this.orient == L.LEFT || this.orient == L.RIGHT)
                //     g.clipRect(r.x, r.y + r.height, r.width, this.height - r.y - r.height);
                // else
                //     g.clipRect(r.x + r.width, r.y, this.width - r.x - r.width, r.height);
            }

            for(var i = this.selectedIndex + 1;i < ~~(this.pages.length / 2); i++) this.paintTab(g, i);

            //!!!!if (cw > 0 && ch > 0) g.setClip(cx, cy, cw, ch);

            if(this.selectedIndex >= 0){
                this.paintTab(g, this.selectedIndex);
                if (this.hasFocus()) this.drawMarker(g, this.getTabBounds(this.selectedIndex));
            }
        };

        this.drawMarker = function(g,r){
            var marker = this.views["marker"];
            if(marker != null){
                var bv = this.views["tab"];
                marker.paint(g, r.x + bv.getLeft(), r.y + bv.getTop(),
                                            r.width - bv.getLeft() - bv.getRight(),
                                            r.height - bv.getTop() - bv.getBottom(), this);
            }
        };

        this.paintTab = function (g, pageIndex){
            var b = this.getTabBounds(pageIndex), page = this.kids[pageIndex], vs = this.views,
                tab = vs["tab"], tabover = vs["tabover"], tabon = vs["tabon"];

            if(this.selectedIndex == pageIndex && tabon != null) {
                tabon.paint(g, b.x, b.y, b.width, b.height, page);
            }
            else {
                tab.paint(g, b.x, b.y, b.width, b.height, page);
            }

            if (this.overTab >= 0 && this.overTab == pageIndex && tabover != null) {
                tabover.paint(g, b.x, b.y, b.width, b.height, page);
            }

            var v = this.getTabView(pageIndex),
                ps = v.getPreferredSize(), px = b.x + L.getXLoc(ps.width, L.CENTER, b.width),
                py = b.y + L.getYLoc(ps.height, L.CENTER, b.height);

            v.paint(g, px, py, ps.width, ps.height, page);
            if (this.selectedIndex == pageIndex) {
                v.paint(g, px + 1, py, ps.width, ps.height, page);
            }
        };

        this.getTabBounds = function(i){ return this.pages[2 * i + 1]; };
    },

    function (){ this.$this(L.TOP); },

    function (o){
        this._ = new Listeners();
        this.pages = [];
        this.views = {};
        this.textRender = new pkg.TextRender(new zebra.data.SingleLineTxt(""));

        if (pkg.Tabs.font != null) this.textRender.setFont(pkg.Tabs.font);
        if (pkg.Tabs.fontColor != null) this.textRender.setForeground(pkg.Tabs.fontColor);
        this.setTitleAlignment(o);

        this.$super();
        this.setTitleAlignment(o);
    },

    function setViews(v){
        for(var k in v) {
            if (v.hasOwnProperty(k)) this.views[k] = v[k];
        }
        this.vrp();
    },

    function setTabSpaces(vg,hg,sideSpace,upperSpace,brSpace){
        if(this.vTabGap != vg || this.hTabGap != hg || sideSpace != this.sideSpace ||
           upperSpace != this.upperSpace || brSpace != this.brSpace)
        {
            this.vTabGap = vg;
            this.hTabGap = hg;
            this.sideSpace = sideSpace;
            this.upperSpace = upperSpace;
            this.brSpace = brSpace;
            this.vrp();
        }
    },

    function setGaps(vg,hg){
        if(this.vgap != vg || hg != this.hgap){
            this.vgap = vg;
            this.hgap = hg;
            this.vrp();
        }
    },

    function setTitleAlignment(o){
        if(o != L.TOP && o != L.BOTTOM && o != L.LEFT && o != L.RIGHT) throw new Error();
        if(this.orient != o){
            this.orient = o;
            this.vrp();
        }
    },

    function enableTab(i,b){
        var c = this.kids[i];
        if(c.isEnabled != b){
            c.setEnabled(b);
            if( !b && this.selectedIndex == i) this.select(-1);
            this.repaint();
        }
    },

    function insert(index,constr,c){
        this.pages.splice(index * 2, 0, constr == null ? "Page " + index
                                                       : constr, { x:0, y:0, width:0, height:0 });
        var r = this.$super(index, constr, c);
        if(this.selectedIndex < 0) this.select(this.next(0, 1));
        return r;
    },

    function setTitle(pageIndex,data){
        if( !this.pages[2 * pageIndex].equals(data)){
            this.pages[pageIndex * 2] = data;
            this.vrp();
        }
    },

    function removeAt(i){
        if(this.selectedIndex == i) this.select( -1);
        this.pages.splice(i * 2, 2);
        this.$super(i);
    },

    function removeAll(){
        if(this.selectedIndex >= 0) this.select( -1);
        this.pages.splice(0, this.pages.length);
        this.pages.length = 0;
        this.$super();
    },

    function recalc(){
        var count = ~~(this.pages.length / 2);
        if(count > 0){
            this.tabAreaHeight = this.tabAreaWidth = 0;
            var bv = this.views["tab"], b = (this.orient == L.LEFT || this.orient == L.RIGHT), max = 0,
                hadd = 2 * this.hTabGap + bv.getLeft() + bv.getRight(),
                vadd = 2 * this.vTabGap + bv.getTop() + bv.getBottom();

            for(var i = 0;i < count; i++){
                var ps = this.getTabView(i).getPreferredSize(), r = this.getTabBounds(i);
                if(b){
                    r.height = ps.height + vadd;
                    if(ps.width + hadd > max) max = ps.width + hadd;
                    this.tabAreaHeight += r.height;
                }
                else{
                    r.width = ps.width + hadd;
                    if(ps.height + vadd > max) max = ps.height + vadd;
                    this.tabAreaWidth += r.width;
                }
            }
            for(var i = 0; i < count; i++ ){
                var r = this.getTabBounds(i);
                if(b) r.width = max;
                else r.height = max;
            }
            if(b) {
                this.tabAreaWidth = max + this.upperSpace + 1;
                this.tabAreaHeight += (2 * this.sideSpace);
            }
            else {
                this.tabAreaWidth += (2 * this.sideSpace);
                this.tabAreaHeight = this.upperSpace + max + 1;
            }
            if(this.selectedIndex >= 0) {
                var r = this.getTabBounds(this.selectedIndex);
                if(b){
                    r.height += 2 * this.sideSpace;
                    r.width += (this.brSpace + this.upperSpace);
                }
                else{
                    r.height += (this.brSpace + this.upperSpace);
                    r.width += 2 * this.sideSpace;
                }
            }
        }
    },

    function keyPressed(e){
        if(this.selectedIndex != -1 && this.pages.length > 0){
            switch(e.code)
            {
                case KE.VK_UP:
                case KE.VK_LEFT:
                    var nxt = this.next(this.selectedIndex - 1,  -1);
                    if(nxt >= 0) this.select(nxt);
                    break;
                case KE.VK_DOWN:
                case KE.VK_RIGHT:
                    var nxt = this.next(this.selectedIndex + 1, 1);
                    if(nxt >= 0) this.select(nxt);
                    break;
            }
        }
    },

    function mousePressed(e){
        if(e.isActionMask()){
            var index = this.getTabAt(e.x, e.y);
            if(index >= 0 && this.isTabEnabled(index)) this.select(index);
        }
    },

    function calcPreferredSize(target){
        var max = L.getMaxPreferredSize(target);
        if(this.orient == L.BOTTOM || this.orient == L.TOP){
            max.width = Math.max(2 * this.sideSpace + max.width, this.tabAreaWidth);
            max.height += this.tabAreaHeight;
        }
        else{
            max.width += this.tabAreaWidth;
            max.height = Math.max(2 * this.sideSpace + max.height, this.tabAreaHeight);
        }
        max.width  += (this.hgap * 2);
        max.height += (this.vgap * 2);
        return max;
    },

    function doLayout(target){
        var right = this.getRight(), top = this.getTop(), bottom = this.getBottom(), left = this.getLeft();
        var b = (this.orient == L.TOP || this.orient == L.BOTTOM);
        if(b){
            this.tabAreaX = left;
            this.tabAreaY = (this.orient == L.TOP) ? top : this.height - bottom - this.tabAreaHeight;
        }
        else{
            this.tabAreaX = (this.orient == L.LEFT) ? left : this.width - right - this.tabAreaWidth;
            this.tabAreaY = top;
        }
        var count = ~~(this.pages.length / 2), sp = 2*this.sideSpace,
            xx = b ? (this.tabAreaX + this.sideSpace)
                   : ((this.orient == L.LEFT) ? (this.tabAreaX + this.upperSpace) : this.tabAreaX + 1),
            yy = b ? (this.orient == L.TOP ? this.tabAreaY + this.upperSpace : this.tabAreaY + 1)
                   : (this.tabAreaY + this.sideSpace);

        for(var i = 0;i < count; i++ ){
            var r = this.getTabBounds(i);
            if(b){
                r.x = xx;
                r.y = yy;
                xx += r.width;
                if(i == this.selectedIndex) xx -= sp;
            }
            else{
                r.x = xx;
                r.y = yy;
                yy += r.height;
                if(i == this.selectedIndex) yy -= sp;
            }
        }

        for(var i = 0;i < count; i++){
            var l = this.kids[i];
            if(i == this.selectedIndex){
                if(b) {
                    l.setSize(this.width - left - right - 2 * this.hgap,
                              this.height - this.tabAreaHeight - top - bottom - 2 * this.vgap);
                    l.setLocation(left + this.hgap,
                                 ((this.orient == L.TOP) ? top + this.tabAreaHeight : top) + this.vgap);
                }
                else {
                    l.setSize(this.width - this.tabAreaWidth - left - right - 2 * this.hgap,
                              this.height - top - bottom - 2 * this.vgap);
                    l.setLocation(((this.orient == L.LEFT) ? left + this.tabAreaWidth : left) + this.hgap,
                                  top + this.vgap);
                }
            }
            else l.setSize(0, 0);
        }

        if(this.selectedIndex >= 0){
            var r = this.getTabBounds(this.selectedIndex), dt = 0;
            if(b){
                r.x -= this.sideSpace;
                r.y -= (this.orient == L.TOP) ? this.upperSpace : this.brSpace;
                dt = (r.x < left) ? left - r.x
                                  : (r.x + r.width > this.width - right) ? this.width - right - r.x - r.width : 0;
            }
            else{
                r.x -= (this.orient == L.LEFT) ? this.upperSpace : this.brSpace;
                r.y -= this.sideSpace;
                dt = (r.y < top) ? top - r.y
                                 : (r.y + r.height > this.height - bottom) ? this.height - bottom - r.y - r.height : 0;
            }
            for(var i = 0;i < count; i ++ ){
                var br = this.getTabBounds(i);
                if(b) br.x += dt;
                else br.y += dt;
            }
        }
    },

    function select(index){
        if(this.selectedIndex != index){
            this.selectedIndex = index;
            this._.fire(this, this.selectedIndex);
            this.vrp();
        }
    },

    function focusGained(e){
        if(this.selectedIndex < 0) this.select(this.next(0, 1));
        else {
            if(this.selectedIndex >= 0){
                var r = this.getTabBounds(this.selectedIndex);
                this.repaint(r.x, r.y, r.width, r.height);
            }
        }
    },

    function focusLost(e){
        if(this.selectedIndex >= 0){
            var r = this.getTabBounds(this.selectedIndex);
            this.repaint(r.x, r.y, r.width, r.height);
        }
    },

    function getTabAt(x,y){
        this.validate();
        if(x >= this.tabAreaX && y >= this.tabAreaY &&
            x < this.tabAreaX + this.tabAreaWidth &&
            y < this.tabAreaY + this.tabAreaHeight)
        {
            for(var i = 0; i < ~~(this.pages.length / 2); i++ ) {
                var tb = this.getTabBounds(i);
                if (x >= tb.x && y >= tb.y && x < tb.x + tb.width && y < tb.y + tb.height) return i;
            }
        }
        return -1;
    },

    function setSize(w,h){
        if(this.width != w || this.height != h){
            if(this.orient == L.RIGHT || this.orient == L.BOTTOM) this.tabAreaX =  -1;
            this.$super(w, h);
        }
    }
]);

pkg.Slider = Class(pkg.Panel, KeyListener, MouseListener, FocusListener,MouseMotionListener,
                   Actionable, [
    function $prototype() {
        this.max = this.min = this.value = this.roughStep = this.exactStep = 0;
        this.netSize = this.gap = 3;
        this.correctDt = this.orient = this.scaleStep = this.psW = this.psH = 0;
        this.intervals = this.pl = this.scaleColor = null;

        this.paintNums = function(g,loc){
            if(this.isShowTitle)
                for(var i = 0;i < this.pl.length; i ++ ){
                    var render = this.provider.getView(this, this.getPointValue(i)),
                        d = render.getPreferredSize();

                    if (this.orient == L.HORIZONTAL) {
                        render.paint(g, this.pl[i] - ~~(d.width / 2), loc, this);
                    }
                    else {
                        render.paint(g, loc, this.pl[i] - ~~(d.height / 2), this);
                    }
                }
        };

        this.getScaleSize = function(){
            var bs = this.views["bundle"].getPreferredSize();
            return (this.orient == L.HORIZONTAL ? this.width - this.getLeft() -
                                                  this.getRight() - bs.width
                                                : this.height - this.getTop() -
                                                  this.getBottom() - bs.height) - 2;
        };

        this.getScaleLocation = function(){
            var bs = this.views["bundle"].getPreferredSize();
            return (this.orient == L.HORIZONTAL ? this.getLeft() + ~~(bs.width / 2)
                                                : this.getTop()  + ~~(bs.height/ 2)) + 1;
        };
    },

    function() { this.$this(L.HORIZONTAL); },

    function (o){
        this._ = new Listeners();
        this.views = {};
        this.isShowScale = this.isShowTitle = true;
        this.dragged = this.isIntervalMode = false;
        this.render = new pkg.TextRender("");
        this.render.setDefBoldFont();
        this.render.setForeground(this.scaleColor);
        this.orient = o;
        this.setValues(0, 20, [0, 5, 10], 2, 1);
        this.setScaleStep(1);

        this.$super();
        this.views["bundle"] = (o == L.HORIZONTAL ? this.views["hbundle"] : this.views["vbundle"]);

        this.provider = this;
    },

    function focusGained(e){ this.repaint(); },
    function focusLost(e){ this.repaint(); },
    function canHaveFocus(){ return true; },

    function setScaleGap(g){
        if(g != this.gap){
            this.gap = g;
            this.vrp();
        }
    },

    function setScaleColor(c){
        if(!c.equals(this.scaleColor)){
            this.scaleColor = c;
            if (this.provider == this) this.render.setForeground(c);
            this.repaint();
        }
    },

    function setScaleStep(s){
        if(s != this.scaleStep){
            this.scaleStep = s;
            this.repaint();
        }
    },

    function showScale(b){
        if(isShowScale != b){
            this.isShowScale = b;
            this.vrp();
        }
    },

    function showTitle(b){
        if(this.isShowTitle != b){
            this.isShowTitle = b;
            this.vrp();
        }
    },

    function setViewProvider(p){
        if(p != this.provider){
            this.provider = p;
            this.vrp();
        }
    },

    function getView(d,o){
        this.render.target.setText(o != null ? o.toString() : "");
        return this.render;
    },

    function setViews(v){
        for(var k in v) this.views[k] = v[k];
        this.vrp();
    },

    function setValue(v){
        if(v < this.min || v > this.max) throw new Error();
        var prev = this.value;
        if(this.value != v){
            this.value = v;
            this._.fire(this, prev);
            this.repaint();
        }
    },

    function setValues(min,max,intervals,roughStep,exactStep){
        if(roughStep <= 0 || exactStep < 0 || min >= max || min + roughStep > max || min + exactStep > max)
            throw new Error();

        for(var i = 0, start = min;i < intervals.length; i ++ ){
            start += intervals[i];
            if(start > max || intervals[i] < 0) throw new Error();
        }
        this.min = min;
        this.max = max;
        this.roughStep = roughStep;
        this.exactStep = exactStep;
        this.intervals = Array(intervals.length);
        for(var i=0; i<intervals.length; i++) this.intervals[i] = intervals[i];
        if(this.value < min || this.value > max) {
            this.setValue(this.isIntervalMode ? min + intervals[0] : min);
        }
        this.vrp();
    },

    function getPointValue(i){
        var v = this.min + this.intervals[0];
        for(var j = 0; j < i; j++, v += this.intervals[j]);
        return v;
    },

    function keyPressed(e){
        var b = this.isIntervalMode;
        switch(e.code)
        {
            case KE.VK_UP:
            case KE.VK_LEFT:
                var v = this.nextValue(this.value, this.exactStep,-1);
                if(v >= this.min) this.setValue(v);
                break;
            case KE.VK_DOWN:
            case KE.VK_RIGHT:
                var v = this.nextValue(this.value, this.exactStep, 1);
                if(v <= this.max) this.setValue(v);
                break;
            case KE.VK_HOME: this.setValue(b ? this.getPointValue(0) : this.min);break;
            case KE.VK_END:  this.setValue(b ? this.getPointValue(this.intervals.length - 1) : this.max);break;
        }
    },

    function mousePressed(e){
        if(e.isActionMask()){
            var x = e.x, y = e.y, bb = this.getBundleBounds(this.value);
            if (x < bb.x || y < bb.y || x >= bb.x + bb.width || y >= bb.y + bb.height) {
                var l = ((this.orient == L.HORIZONTAL) ? x : y), v = this.loc2value(l);
                if(this.value != v)
                    this.setValue(this.isJumpOnPress ? v
                                                     : this.nextValue(this.value, this.roughStep, v < this.value ? -1:1));
            }
        }
    },

    function startDragged(e){
        var r = this.getBundleBounds(this.value);
        if(e.x >= r.x && e.y >= r.y && e.x < r.x + r.width && e.y < r.y + e.height){
            this.dragged = true;
            this.correctDt = this.orient == L.HORIZONTAL ? r.x + ~~(r.width  / 2) - e.x
                                                         : r.y + ~~(r.height / 2) - e.y;
        }
    },

    function endDragged(e){ this.dragged = false; },

    function mouseDragged(e){
        if(this.dragged)
            this.setValue(this.findNearest(e.x + (this.orient == L.HORIZONTAL ? this.correctDt : 0),
                                           e.y + (this.orient == L.HORIZONTAL ? 0 : this.correctDt)));
    },

    function paint(g){
        if(this.pl == null){
            this.pl = Array(this.intervals.length);
            for(var i = 0, l = this.min;i < this.pl.length; i ++ ){
                l += this.intervals[i];
                this.pl[i] = this.value2loc(l);
            }
        }
        var left = this.getLeft(), top = this.getTop(), right = this.getRight(), bottom = this.getBottom(),
            bnv = this.views["bundle"], gauge = this.views["gauge"],
            bs = bnv.getPreferredSize(), gs = gauge.getPreferredSize(),
            w = this.width - left - right - 2, h = this.height - top - bottom - 2;

        if(this.orient == L.HORIZONTAL){
            var topY = top + ~~((h - this.psH) / 2) + 1, by = topY;
            if(this.isEnabled) {
                gauge.paint(g, left + 1, topY + ~~((bs.height - gs.height) / 2), w, gs.height, this);
            }
            else{
                g.setColor(rgb.gray);
                g.strokeRect(left + 1, topY + ~~((bs.height - gs.height) / 2), w, gs.height);
            }
            topY += bs.height;
            if(this.isShowScale){
                topY += this.gap;
                g.setColor(this.isEnabled ? this.scaleColor : rgb.gray);
                for(var i = this.min;i <= this.max; i += this.scaleStep){
                    var xx = this.value2loc(i);
                    g.drawLine(xx, topY, xx, topY + this.netSize);
                }
                for(var i = 0;i < this.pl.length; i ++ )
                    g.drawLine(this.pl[i], topY, this.pl[i], topY + 2 * this.netSize);
                topY += (2 * this.netSize);
            }
            this.paintNums(g, topY);
            bnv.paint(g, this.getBundleLoc(this.value), by, bs.width, bs.height, this);
        }
        else{
            var leftX = left + ~~((w - this.psW) / 2) + 1, bx = leftX;
            if(this.isEnabled) {
                gauge.paint(g, leftX + ~~((bs.width - gs.width) / 2), top + 1, gs.width, h, this);
            }
            else{
                g.setColor(rgb.gray);
                g.strokeRect(leftX + ~~((bs.width - gs.width) / 2), top + 1, gs.width, h);
            }
            leftX += bs.width;
            if(this.isShowScale){
                leftX += this.gap;
                g.setColor(this.scaleColor);
                for(var i = this.min;i <= this.max; i += this.scaleStep){
                    var yy = this.value2loc(i);
                    g.drawLine(leftX, yy, leftX + this.netSize, yy);
                }
                for(var i = 0;i < this.pl.length; i ++ )
                    g.drawLine(leftX, this.pl[i], leftX + 2 * this.netSize, this.pl[i]);
                leftX += (2 * this.netSize);
            }
            this.paintNums(g, leftX);
            bnv.paint(g, bx, this.getBundleLoc(this.value), bs.width, bs.height, this);
        }
        if(this.hasFocus()) this.views["marker"].paint(g, left, top, w + 2, h + 2, this);
    },

    function findNearest(x,y){
        var v = this.loc2value(this.orient == L.HORIZONTAL ? x : y);
        if(this.isIntervalMode){
            var nearest = Number.MAX_VALUE, res = 0;
            for(var i = 0;i < this.intervals.length; i ++ ){
                var pv = this.getPointValue(i), dt = Math.abs(pv - v);
                if(dt < nearest){
                    nearest = dt;
                    res = pv;
                }
            }
            return res;
        }
        v = this.exactStep * ~~((v + v % this.exactStep) / this.exactStep);
        if(v > this.max) v = this.max;
        else if(v < this.min) v = this.min;
        return v;
    },

    function value2loc(v){
        return ~~((this.getScaleSize() * (v - this.min)) / (this.max - this.min)) +
               this.getScaleLocation();
    },

    function loc2value(xy){
        var sl = this.getScaleLocation(), ss = this.getScaleSize();
        if(xy < sl) xy = sl;
        else if(xy > sl + ss) xy = sl + ss;
        return this.min + ~~(((this.max - this.min) * (xy - sl)) / ss);
    },

    function invalidate(){
        this.pl = null;
        this.$super();
    },

    function calcPreferredSize(l){ return { width:this.psW + 2, height: this.psH + 2 }; },

    function recalc(){
        var ps = this.views["bundle"].getPreferredSize(),
            ns = this.isShowScale ? (this.gap + 2 * this.netSize) : 0,
            dt = this.max - this.min, hMax = 0, wMax = 0;

        if(this.isShowTitle && this.intervals.length > 0){
            for(var i = 0;i < this.intervals.length; i ++ ){
                var v = this.provider.getView(this, this.getPointValue(i)), d = v.getPreferredSize();
                if(d.height > hMax) hMax = d.height;
                if(d.width  > wMax) wMax = d.width;
            }
        }
        if(this.orient == L.HORIZONTAL){
            this.psW = dt * 2 + ps.width;
            this.psH = ps.height + ns + hMax;
        }
        else{
            this.psW = ps.width + ns + wMax;
            this.psH = dt * 2 + ps.height;
        }
    },

    function nextValue(value,s,d){
        if(this.isIntervalMode) return this.getNeighborPoint(value, d);
        else{
            var v = value + (d * s);
            if(v > this.max) v = this.max;
            else if(v < this.min) v = this.min;
            return v;
        }
    },

    function getBundleLoc(v){
        var bs = this.views["bundle"].getPreferredSize();
        return this.value2loc(v) - (this.orient == L.HORIZONTAL ? ~~(bs.width / 2)
                                                                : ~~(bs.height / 2));
    },

    function getBundleBounds(v){
        var bs = this.views["bundle"].getPreferredSize();
        return this.orient == L.HORIZONTAL ? { x:this.getBundleLoc(v),
                                               y:this.getTop() + ~~((this.height - this.getTop() - this.getBottom() - this.psH) / 2) + 1,
                                               width:bs.width, height:bs.height }
                                           : { x:this.getLeft() + ~~((this.width - this.getLeft() - this.getRight() - this.psW) / 2) + 1,
                                               y:this.getBundleLoc(v), width:bs.width, height:bs.height };
    },

    function getNeighborPoint(v,d){
        var left = this.min + this.intervals[0], right = this.getPointValue(this.intervals.length - 1);
        if (v < left) return left;
        else if (v > right) return right;
        if (d > 0) {
            var start = this.min;
            for(var i = 0;i < this.intervals.length; i ++ ){
                start += this.intervals[i];
                if(start > v) return start;
            }
            return right;
        }
        else {
            var start = right;
            for(var i = this.intervals.length - 1;i >= 0; i--) {
                if (start < v) return start;
                start -= this.intervals[i];
            }
            return left;
        }
    }
]);

pkg.StatusBar = new Class(pkg.Panel, [
    function () { this.$this(2); },

    function (gap){
        this.paddings(gap, 0, 0, 0);
        this.$super(new L.PercentLayout(Layout.HORIZONTAL, gap));
    },

    function setBorderView(v){
        if(v != this.borderView){
            this.borderView = v;
            for(var i = 0;i < this.count(); i++) this.get(i).setBorder(this.borderView);
            this.repaint();
        }
    },

    function insert(i,s,d){
        d.setBorder(this.borderView);
        this.$super(i, s, d);
    }
]);


pkg.Toolbar = Class(pkg.Panel, ChildrenListener, [
    function $clazz() {
        this.Constraints = function(isDec, str) {
            this.views = [null, null, null];
            this.isDecorative = arguments.length > 0 ? isDec : false;
            this.stretched = arguments.length > 1 ? str : false;
        };
    },

    function $prototype() {
        var OVER = "over", OUT = "out", PRESSED = "pressed";

        this.isDecorative = function(c){ return c.constraints.isDecorative; };

        this.childInputEvent = function(e){
            if(e.UID == pkg.InputEvent.MOUSE_UID){
                var dc = L.getDirectChild(this, e.source);
                if (!this.isDecorative(dc)){
                    switch(e.ID)
                    {
                        case ME.ENTERED:this.select(dc, true); break;
                        case ME.EXITED  : if(this.selected != null && L.isAncestorOf(this.selected, e.source)) this.select(null, true); break;
                        case ME.PRESSED : this.select(this.selected, false);break;
                        case ME.RELEASED: this.select(this.selected, true); break;
                    }
                }
            }
        };

        this.recalc = function(){
            var v = this.views, vover = v[OVER], vpressed = v[PRESSED];
            this.leftShift   = Math.max(vover     == null ? 0 : vover.getLeft(),
                                        vpressed  == null ? 0 : vpressed.getLeft());
            this.rightShift  = Math.max(vover     == null ? 0 : vover.getRight(),
                                        vpressed  == null ? 0 : vpressed.getRight());
            this.topShift    = Math.max(vover     == null ? 0 : vover.getTop(),
                                        vpressed  == null ? 0 : vpressed.getTop());
            this.bottomShift = Math.max(vover     == null ? 0 : vover.getBottom(),
                                        vpressed  == null ? 0 : vpressed.getBottom());
        };

        this.paint = function(g) {
            for(var i = 0;i < this.kids.length; i++){
                var c = this.kids[i];
                if(c.isVisible && this.isDecorative(c) === false){
                    var index = (this.selected == c) ? (this.isOver ? OVER : PRESSED) : OUT;
                    if (instanceOf(c, pkg.Checkbox) && c.getState()) index = PRESSED;
                    var v = this.getView(c, index);
                    if(v != null) {
                        v.paint(g, c.x, this.getTop(),
                                   c.width, this.height - this.getTop() - this.getBottom(), this);
                    }
                }
            }
        };
    },

    function () { this.$this(L.HORIZONTAL, 4); },

    function (orient,gap){
        if(orient != L.HORIZONTAL && orient != L.VERTICAL) throw new Error();

        this.selected = null;
        this.isOver = false;
        this._ = new Listeners();
        this.leftShift = this.topShift = this.bottomShift = this.rightShift = 0;

        this.views = {};
        this.orient = orient;
        this.gap = gap;
        this.$super();
    },

    function setViews(v){
        for(var k in v) {
            if (v.hasOwnProperty(k)) this.views[k] = v[k];
        }
        this.vrp();
    },

    function setView(type,v){ this.setView(null, type, v); },

    function setView(c,id,v){
        if(c != null){
            if (this.indexOf(c) < 0) throw new Error();
            c.constraints.views[id] = v;
        }
        else this.views[id] = v;
        this.vrp();
    },

    function getView(id){ return this.getView(null, id); },

    function getView(c,id){
        // if(c != null){
        //     var constr = c.constraints;
        //     if(constr.views[id] != null) return constr.views[id];
        // }
        return this.views[id];
    },

    function addDecorative(c){ this.add(new pkg.Toolbar.Constraints(true), c); },

    function addRadio(g,c){
        var cbox = new pkg.Radiobox(c, g);
        this.add(cbox);
        return cbox;
    },

    function addSwitcher(c){
        var cbox = new pkg.Checkbox(c);
        this.add(cbox);
        return cbox;
    },

    function addImage(img){
        this.validateMetric();
        var pan = new pkg.ImagePan(img);
        pan.paddings(this.topShift, this.leftShift + 2, this.bottomShift, this.rightShift+2);
        this.add(pan);
        return pan;
    },

    function addCombo(list){
        var combo = new pkg.Combo(list);
        this.add(new pkg.Toolbar.Constraints(false), combo);
        combo.paddings(1, 4, 1, 1);
        return combo;
    },

    function addLine(){
        var line = new pkg.Line(L.VERTICAL);
        this.add(new pkg.Toolbar.Constraints(true, true), line);
        return line;
    },

    function insert(i,id,d){
        if(id == null) id = new pkg.Toolbar.Constraints();
        return this.$super(i, id, d);
    },

    function calcPreferredSize(target){
        var w = 0, h = 0, c = 0, b = (this.orient == L.HORIZONTAL);
        for(var i = 0;i < target.kids.length; i++ ){
            var l = target.kids[i];
            if(l.isVisible){
                var ps = l.getPreferredSize();
                if(b) {
                    w += (ps.width + (c > 0 ? this.gap : 0));
                    h = Math.max(ps.height, h);
                }
                else{
                    w = Math.max(ps.width, w);
                    h += (ps.height + (c > 0 ? this.gap : 0));
                }
                c++;
            }
        }

        return { width:  (b ? w + c * (this.leftShift + this.rightShift)
                            : w + this.topShift + this.bottomShift),
                 height: (b ? h + this.leftShift + this.rightShift
                            : h + c * (this.topShift + this.bottomShift)) };
    },

    function doLayout(t){
        var b = (this.orient == L.HORIZONTAL), x = t.getLeft(), y = t.getTop(),
            av = this.topShift + this.bottomShift, ah = this.leftShift + this.rightShift,
            hw = b ? t.height - y - t.getBottom() : t.width - x - t.getRight();
        for(var i = 0;i < t.kids.length; i++){
            var l = t.kids[i];
            if(l.isVisible){
                var ps = l.getPreferredSize(), str = l.constraints.stretched;
                if(b){
                    if (str) ps.height = hw;
                    l.setLocation(x + this.leftShift, y + ((hw - ps.height) / 2  + 0.5) | 0);
                    x += (this.gap + ps.width + ah);
                }
                else{
                    if (str) ps.width = hw;
                    l.setLocation(x + (hw - ps.width) / 2, y + this.topShift);
                    y += (this.gap + ps.height + av);
                }
                l.setSize(ps.width, ps.height);
            }
        }
    },

    function select(c,state){
        if(c != this.selected || (this.selected != null && state != this.isOver)){
            var prev = this.selected, addW = this.leftShift + this.rightShift, addH = this.topShift + this.bottomShift;
            this.selected = c;
            this.isOver = state;
            var top = this.getTop(), mb = this.height - this.getBottom() + top;
            //!!! if(prev != null) this.repaint(prev.x - this.leftShift, top, prev.width + addW, mb);
            //!!! if(c != null) this.repaint(c.x - this.leftShift, top, c.width + addW, mb);
            this.repaint();
            if (state === false && c != null) this._.fire(this, c);
        }
    }
]);

pkg.ClipboardMan = Class(pkg.Manager, KeyListener, [
    function() {
        this.$super();
        this.data = null;
    },

    function get() { return this.data; },
    function put(d) { this.data = d; },
    function isEmpty() { return this.get() != null; }
]);

pkg.configurator(function(conf) {
    var p = zebra()["ui.theme"];
//    if (p) p = "ui.json";
    conf.loadByUrl("ui.json", pkg);
    p = zebra()["ui.json"];
    if (p) conf.loadByUrl(p, pkg);
});

})(zebra("ui"), zebra.Class, zebra.Interface);

(function(pkg, Class) {

var L = zebra.layout, Position = zebra.util.Position, KE = pkg.KeyEvent, Listeners = zebra.util.Listeners;

pkg.BaseList = Class(pkg.Panel, pkg.MouseMotionListener, pkg.MouseListener, pkg.KeyListener,
                     Position.PositionMetric, pkg.ScrollListener, pkg.FocusListener, [

    function $prototype() {
        this.gap = 2;

        this.getItemGap = function() { return this.gap; };

        this.getSelected = function(){
            return this.selectedIndex < 0 ? null
                                          : this.model.elementAt(this.selectedIndex);
        };

        this.lookupItem = function(ch){
            var count = this.model.elementsCount();
            if(zebra.util.isLetter(ch) && count > 0){
                var index = this.selectedIndex < 0 ? 0 : this.selectedIndex + 1;
                ch = ch.toLowerCase();
                for(var i = 0;i < count - 1; i++){
                    var idx = (index + i) % count, item = this.model.elementAt(idx).toString();
                    if(item.length > 0 && item[0].toLowerCase() == ch) return idx;
                }
            }
            return -1;
        };

        this.isSelected = function(i){ return i == this.selectedIndex; };
    },

    function() { this.$this(false); },

    function (b){
        this.selectedIndex = -1;
        this._ = new Listeners();
        this.sman = this.createScrollManager();
        this.isComboMode = b;
        this.$super();
        this.setModel(this.createModel());
        this.setPosition(this.createPosition());
    },

    function setItemGap(g){
        if(this.gap != g){
            this.gap = g;
            this.vrp();
        }
    },

    function select(index){
        if(index >= this.model.elementsCount()){
            throw new Error("index=" + index + ",max=" + this.model.elementsCount());
        }

        if(this.selectedIndex != index){
            var prev = this.selectedIndex;
            this.selectedIndex = index;
            this.notifyScrollMan(index);
            this.repaint(prev, this.selectedIndex);
            this.fire(this, prev);
        }
        else this.fire(this, null);
    },

    function mousePressed(e){
        if( !this.isComboMode && e.isActionMask()){
            var index = this.getItemIdxAt(e.x, e.y);
            if(index >= 0){
                if(this.position.offset != index) this.position.setOffset(index);
                else this.select(index);
            }
        }
    },

    function mouseMoved(e){ this.correctPM(e.x, e.y); },
    function mouseEntered(e){  this.correctPM(e.x, e.y);},
    function mouseReleased(e){ if(this.isComboMode && e.isActionMask()) this.select(this.position.offset); },

    function keyPressed(e){
        if(this.model.elementsCount() > 0){
            switch(e.code)
            {
                case KE.VK_END:
                    if (e.isControlPressed()) this.position.setOffset(this.position.metrics.getMaxOffset());
                    else this.position.seekLineTo(Position.END);
                    break;
                case KE.VK_HOME:
                    if(e.isControlPressed()) this.position.setOffset(0);
                    else this.position.seekLineTo(Position.BEG);
                    break;
                case KE.VK_RIGHT: this.position.seek(1); break;
                case KE.VK_DOWN: this.position.seekLineTo(Position.DOWN); break;
                case KE.VK_LEFT: this.position.seek(-1);break;
                case KE.VK_UP: this.position.seekLineTo(Position.UP);break;
                case KE.VK_PAGE_UP: this.position.seek(this.pageSize(-1));break;
                case KE.VK_PAGE_DOWN: this.position.seek(this.pageSize(1));break;
                case KE.VK_ENTER: this.select(this.position.offset);break;
            }
        }
    },

    function keyTyped(e){
        var i = this.lookupItem(e.ch);
        if(i >= 0) this.select(i);
    },

    function focusGained(e){ this.repaint();},
    function focusLost(e){ this.repaint();},
    function getLines(){ return this.model.elementsCount();},
    function getLineSize(l){ return 1; },
    function getMaxOffset(){ return this.getLines() - 1; },

    function posChanged(target,prevOffset,prevLine,prevCol){
        var off = this.position.offset;
        this.notifyScrollMan(off);
        if( !this.isComboMode) this.select(off);
        this.repaint(prevOffset, off);
    },

    function canHaveFocus(){ return true; },

    function setModel(m){
        if(m == null) throw new Error();
        if(m != this.model){
            if(this.model != null && this.model._) this.model._.remove(this);
            this.model = m;
            if (this.model._) this.model._.add(this);
            this.vrp();
        }
    },

    function getScrollManager(){ return this.sman; },

    function setPosition(c){
        if(c != this.position){
            if(this.position != null) this.position._.remove(this);
            this.position = c;
            this.position._.add(this);
            this.position.setPositionMetric(this);
            this.repaint();
        }
    },

    function setViewProvider(v){
        if(this.provider != v){
            this.provider = v;
            this.vrp();
        }
    },

    function update(g){
        if(this.selectedIndex >= 0 && this.views["select"] != null){
            var gap = this.getItemGap();
            this.drawSelMarker(g, this.getItemX(this.selectedIndex) - gap,
                                  this.getItemY(this.selectedIndex) - gap,
                                  this.getItemW(this.selectedIndex) + 2 * gap,
                                  this.getItemH(this.selectedIndex) + 2 * gap);
        }
    },

    function paintOnTop(g){
        if(this.views["marker"] != null && (this.isComboMode || this.hasFocus())){
            var offset = this.position.offset;
            if(offset >= 0){
                var gap = this.getItemGap();
                this.drawPosMarker(g, this.getItemX(offset) - gap,
                                      this.getItemY(offset) - gap,
                                      this.getItemW(offset) + 2 * gap,
                                      this.getItemH(offset) + 2 * gap);
            }
        }
    },

    function elementInserted(target, e,index){
        this.invalidate();
        if(this.selectedIndex >= 0 && this.selectedIndex >= index) this.selectedIndex ++ ;
        this.position.inserted(index, 1);
        this.repaint();
    },

    function elementRemoved(target, e,index){
        this.invalidate();
        if(this.selectedIndex == index || this.model.elementsCount() === 0) this.select(-1);
        else if(this.selectedIndex > index) this.selectedIndex--;
        this.position.removed(index, 1);
        this.repaint();
    },

    function elementSet(target, e,pe,index){
        this.invalidate();
        this.repaint();
    },

    function scrolled(psx,psy){ this.repaint();},
    function getItemIdxAt(x,y){ return  -1;},

    function calcMaxItemSize(){
        var maxH = 0, maxW = 0;
        this.validate();
        for(var i = 0;i < this.model.elementsCount(); i ++ ){
            if(this.getItemH(i) > maxH) maxH = this.getItemH(i);
            if(this.getItemW(i) > maxW) maxW = this.getItemW(i);
        }
        return { width:maxW, height:maxH };
    },

    function fire(src, data){ this._.fire(src, data); },

    function repaint(p,n){
        this.validate();
        var xx = this.width - this.getRight(), gap = this.getItemGap(),
            count = this.model.elementsCount();
        if(p >= 0 && p < count){
            var x = this.getItemX(p) - gap;
            this.repaint(x, this.getItemY(p) - gap, xx - x, this.getItemH(p) + 2 * gap);
        }
        if(n >= 0 && n < count){
            var x = this.getItemX(n) - gap;
            this.repaint(x, this.getItemY(n) - gap, xx - x, this.getItemH(n) + 2 * gap);
        }
    },

    function notifyScrollMan(index){
        if(index >= 0 && this.getScrollManager() != null){
            var sman = this.getScrollManager();
            this.validate();
            var gap = this.getItemGap(), dx = sman.getSX(), dy = sman.getSY();
            sman.makeVisible(this.getItemX(index) - dx - gap, this.getItemY(index) - dy - gap,
                             this.getItemW(index) + 2 * gap, this.getItemH(index) + 2 * gap);
        }
    },

    function pageSize(d){
        var offset = this.position.offset;
        if(offset >= 0){
            var vp = pkg.cvp(this, {});
            if (vp != null){
                var sum = 0, i = offset, gap = 2 * this.getItemGap();
                for(;i >= 0 && i <= this.position.metrics.getMaxOffset() && sum < vp.height; i += d){
                    sum += (this.getItemH(i) + gap);
                }
                return i - offset - d;
            }
        }
        return 0;
    },

    function drawSelMarker(g,x,y,w,h){ this.views["select"].paint(g, x, y, w, h, this); },
    function drawPosMarker(g,x,y,w,h){ this.views["marker"].paint(g, x, y, w, h, this); },

    function correctPM(x,y){
        if(this.isComboMode){
            var index = this.getItemIdxAt(x, y);
            if(index >= 0) this.position.setOffset(index);
        }
    },

    function createScrollManager(){ return new pkg.ScrollManager(this);},
    function createModel(){ return new zebra.data.ListModel(); },
    function createPosition(){ return new Position(this); },
    function getItemX(i){ return this.getLeft(); },

    function getItemY(index){
        this.validate();
        var gap = this.getItemGap(), y = this.getTop() + this.getScrollManager().getSY() + gap;
        for(var i = 0;i < index; i++) y += (this.getItemH(i) + 2 * gap);
        return y;
    },

    function getItemW(i){
        return this.provider.getView(this, this.model.elementAt(i)).getPreferredSize().width;
    },

    function getItemH(i){
        return this.provider.getView(this, this.model.elementAt(i)).getPreferredSize().height;
    }
]);

pkg.List = Class(pkg.BaseList, [
    function $prototype() {
        this.paint = function(g){
            this.vVisibility();
            if(this.firstVisible >= 0){
                var sx = this.getScrollManager().getSX(), sy = this.getScrollManager().getSY();
                try{
                    g.translate(sx, sy);
                    var gap = this.getItemGap(), y = this.firstVisibleY, x = this.getLeft() + gap,
                        yy = this.vArea.y + this.vArea.height - sy, count = this.model.elementsCount(),
                        provider = this.provider;

                    for(var i = this.firstVisible;i < count; i++){
                        provider.getView(this, this.model.elementAt(i)).paint(g, x, y, this.widths[i], this.heights[i], this);
                        y += (this.heights[i] + 2 * gap);
                        if(y > yy) break;
                    }
                }
                catch(e) { throw e; }
                finally { g.translate(-sx,  -sy); }
            }
        };

        this.recalc = function(){
            this.psWidth_ = this.psHeight_ = 0;
            var count = this.model.elementsCount();
            if(this.heights == null || this.heights.length != count) this.heights = Array(count);
            if(this.widths == null || this.widths.length != count) this.widths = Array(count);

            var provider = this.provider;
            if (provider == null) return;

            for(var i = 0;i < count; i++){
                var ps = provider.getView(this, this.model.elementAt(i)).getPreferredSize();
                this.heights[i] = ps.height;
                this.widths [i] = ps.width;
                if(this.widths [i] > this.psWidth_)this.psWidth_ = this.widths[i];
                this.psHeight_ += this.heights[i];
            }
        };

        this.calcPreferredSize = function(l){
            var gap = 2 * this.getItemGap();
            return { width:gap + this.psWidth_, height:gap * this.model.elementsCount() + this.psHeight_ };
        };

        this.vVisibility = function(){
            this.validate();
            var prev = this.vArea;
            this.vArea = pkg.cvp(this, {});
            if(this.vArea == null) {
                this.firstVisible = -1;
                return;
            }
            if (  this.visValid === false ||
                    (prev == null || prev.x != this.vArea.x ||
                     prev.y != this.vArea.y || prev.width != this.vArea.width ||
                     prev.height != this.vArea.height))
            {
                var top = this.getTop(), gap = this.getItemGap();
                if(this.firstVisible >= 0){
                    var dy = this.getScrollManager().getSY();
                    while(this.firstVisibleY + dy >= top && this.firstVisible > 0){
                        this.firstVisible--;
                        this.firstVisibleY -= (this.heights[firstVisible] + 2 * gap);
                    }
                }
                else{
                    this.firstVisible = 0;
                    this.firstVisibleY = top + gap;
                }
                if(this.firstVisible >= 0){
                    var count = this.model.elementsCount();
                    for(; this.firstVisible < count && !this._isVisible(this.firstVisibleY, top, this.firstVisible); this.firstVisible++){
                        this.firstVisibleY += (this.heights[firstVisible] + 2 * gap);
                    }
                    if(this.firstVisible >= count) this.firstVisible =  -1;
                }
                this.visValid = true;
            }
        };

        this.iVisibility = function(){ this.visValid = false; };
        this.getItemX = function (i){ return this.getLeft() + this.getItemGap(); };

        this.getItemY = function(index){
            this.validate();
            var gap = this.getItemGap(), y = this.getTop() + this.getScrollManager().getSY() + gap;
            for(var i = 0;i < index; i++) y += (this.heights[i] + 2 * gap);
            return y;
        };

        this.getItemW = function(i){
            this.validate();
            return this.widths[i];
        };

        this.getItemH = function(i){
            this.validate();
            return this.heights[i];
        };

        this._isVisible = function (y,top,index){
            var y1 = y + this.getScrollManager().getSY(), y2 = y1 + this.heights[index] - 1, hh = this.height - this.getBottom();
            return ((y1 >= top && y1 < hh) || (y2 >= top && y2 < hh) || (y1 < top && y2 >= hh));
        };

        this.getItemIdxAt = function(x,y){
            this.vVisibility();
            if(this.vArea != null && this.firstVisible >= 0){
                var yy = this.firstVisibleY + this.getScrollManager().getSY(), hh = this.height - this.getBottom(),
                    count = this.model.elementsCount(), gap = this.getItemGap() * 2;

                for(var i = this.firstVisible;i < count; i++) {
                    if(y >= yy && y < yy + this.heights[i]) return i;
                    yy += (this.heights[i] + gap);
                    if (yy > hh) break;
                }
            }
            return  -1;
        };
    },

    function (){ this.$this(false); },

    function (b){
        this.firstVisible = -1;
        this.firstVisibleY = this.psWidth_ = this.psHeight_ = 0;
        this.heights = this.widths = this.vArea = null;
        this.visValid = false;
        this.setViewProvider(new zebra.Dummy([
            function () { this.text = new pkg.TextRender(""); },
            function getView(target, value) {
                if (value.paint) return value;
                this.text.target.setText(value.toString());
                return this.text;
            }
        ]));
        this.$super(b);
    },

    function invalidate(){
        this.iVisibility();
        this.firstVisible =  -1;
        this.$super();
    },

    function drawSelMarker(g,x,y,w,h){
        this.$super(g, x, y, this.width - this.getRight() - x, h);
    },

    function drawPosMarker(g,x,y,w,h){
        this.$super(g, x, y, this.width - this.getRight() - x, h);
    },

    function scrolled(psx,psy){
        this.firstVisible = -1;
        this.iVisibility();
        this.$super(psx, psy);
    }
]);

pkg.CompList = Class(pkg.BaseList, pkg.Composite, [
    function $clazz() {
        this.CompListModel = Class([
            function $prototype() {
                this.elementAt = function (i) { return this.src.kids[i]; };

                this.setElementAt = function(item,i){
                    this.src.removeElementAt(i);
                    this.src.insertElementAt(item, i);
                };

                this.addElement = function(o){ this.src.add(zebra.isString(o)? new pkg.Label(s) : o); };
                this.removeElementAt = function (i){ this.src.removeAt(i);};
                this.insertElementAt = function (item,i){ this.src.insert(i, null, item); };
                this.elementsCount = function (){ return this.src.kids.length; };

                this.removeAllElements = function () { this.src.removeAll(); };
            },

            function(src) {
                this.src = src;
                this._ = new zebra.util.MListeners("elementInserted", "elementRemoved");
            }
        ]);
    },

    function (){ this.$this(false); },

    function (b){
        this.input = this.max = null;
        this.setViewProvider(new zebra.Dummy([
            function getView(target,obj) { return new pkg.CompRender(obj); }
        ]));
        this.$super(b);
        this.setLayout(new L.ListLayout());
    },

    function setModel(m){
        if (zebra.instanceOf(m, pkg.CompList.CompListModel) === false) throw new Error();
        this.$super(m);
    },

    function setPosition(c){
        if(c != this.position){
            if (zebra.instanceOf(this.layout, Position.PositionMetric)) c.setPositionMetric(this.layout);
            this.$super(c);
        }
    },

    function setLayout(l){
         if(l != this.layout){
             this.$super(l);
             if (this.position != null) {
                this.position.setPositionMetric(zebra.instanceOf(l, Position.PositionMetric) ? l : this);
            }
         }
    },

    function getItemGap(){ return 0; },

    function focusGained(e){
        var o = this.position.offset;
        this.input = (o >= 0 && o == this.selectedIndex) ? this.model.elementAt(this.position.offset) : null;
        this.$super(e);
    },

    function drawSelMarker(g,x,y,w,h){
        if (this.input == null || !L.isAncestorOf(this.input, pkg.focusManager.focusOwner)) {
            this.$super(g, x, y, w, h);
        }
    },

    function catchInput(child){
        if(this.isComboMode) return true;
        var b = this.input != null && L.isAncestorOf(this.input, child);
        if( b && this.input != null &&
            L.isAncestorOf(this.input, pkg.focusManager.focusOwner) &&
            this.hasFocus() === false)
        {
            this.input = null;
        }
        return (this.input == null || !b);
    },

    function posChanged(target,prevOffset,prevLine,prevCol){
        this.$super(target, prevOffset, prevLine, prevCol);
        if (this.isComboMode === false) {
            this.input = (this.position.offset >= 0) ? this.model.elementAt(this.position.offset)
                                                     : null;
        }
    },

    function insert(index,constr,e) {
        return this.$super(index, constr, zebra.isString(e) ? new pkg.Label(e) : e);
    },

    function kidAdded(index,constr,e){ this.model._.elementInserted(this, e, index); },
    function kidRemoved(index,e)     { this.model._.elementRemoved(this, e, index); },

    function scrolled(px,py){},
    function getItemX(i){ return this.kids[i].x; },
    function getItemY(i){ return this.kids[i].y; },
    function getItemW(i){ return this.kids[i].width; },
    function getItemH(i){ return this.kids[i].height; },
    function recalc(){ this.max = L.getMaxPreferredSize(this); },

    function maxItemSize(){
        this.validate();
        return { width:this.max.width, height:this.max.height };
    },

    function getItemIdxAt(x,y){ return L.getDirectAt(x, y, this); },
    function createScrollManager(){ return new pkg.CompScrollManager(this); },
    function createModel(){ return new pkg.CompList.CompListModel(this); }
]);

pkg.Combo = Class(pkg.Panel, pkg.MouseListener, pkg.KeyListener,
                  pkg.Composite, pkg.FocusListener, [
    function $clazz() {
        this.ContentPan = Class(pkg.Panel, [
            function (){
                this.$super();
                this._ = new Listeners("contentUpdated");
                this.isEditable = false;
                this.owner = null;
            },

            function setValue(nv){
                var old = this.getValue();
                if(nv != old){
                    this.updateValue(old, nv);
                    this._.fire(this,  -1, old);
                }
            },

            function getValue() { return null; },

            function paintOnTop(g){
                var v = this.getContentView();
                if(v != null){
                    var ps = v.getPreferredSize(), vpW = this.width, vpH = this.height;
                    v.paint(g, this.getLeft(), this.getTop() + ~~((vpH - ps.height) / 2), vpW, vpH, this);
                }
            },

            function getContentView() { return null; },
            function updateValue(ov,nv) { }
        ]);

        this.ComboPadPan = Class(pkg.ScrollPan, [
            function setParent(l){
                this.$super(l);
                if(l == null) this.time = zebra.util.currentTimeMillis();
            }
        ]);

        this.ReadonlyContentPan = Class(this.ContentPan,[
            function $prototype(){
                this.value = null;
            },

            function calcPreferredSize(l){ return this.owner.list.calcMaxItemSize(); },
            function updateValue(ov,nv){ this.value = nv; },
            function getValue(){ return this.value; },

            function getContentView(){
                var list = this.owner.list, selected = list.getSelected();
                return selected != null ? list.provider.getView(list, selected) : null;
            }
        ]);

        this.EditableContentPan = Class(this.ContentPan, pkg.FocusListener, [
            function (){
                this.$super();
                this.setLayout(new L.BorderLayout());
                this.isEditable = true;
                this.dontGenerateUpdateEvent = false;
                this.textField = new pkg.TextField("",  -1);
                this.textField.setBorder(null);
                this.textField.setBackground(null);
                this.add(L.CENTER, this.textField);
            },

            function textUpdated(src,b,off,size,startLine,lines){
                if (this.dontGenerateUpdateEvent === false) this._.fire(this,  -1, null);
            },

            function focusGained(e){ this.textField.requestFocus(); },
            function focusLost(e){ this.textField.requestFocus(); },
            function canHaveFocus(){ return true; },

            function updateValue(ov,nv){
                this.dontGenerateUpdateEvent = true;
                try{
                    var txt = (nv == null ? "" : nv.toString());
                    this.textField.setText(txt);
                    this.textField.select(0, txt.length);
                }
                finally { this.dontGenerateUpdateEvent = false; }
            },

            function getValue(){ return this.textField.getText(); },
            function getContentView(){ return null; }
        ]);

        this.Button = Class(pkg.Button, [
            function() {
                this.setFireParams(true,  -1);
                this.setCanHaveFocus(false);
                this.$super();
            }
        ]);

        this.List = Class(pkg.List, []);
    },

    function (){ this.$this(new pkg.Combo.List(true)); },

    function(list){
        this.list = this.button = this.content = this.winpad = this.arrowGlyph = this.selectionView = null;
        this.maxPadHeight = this.time = 0;
        this.lockListSelEvent = false;
        this._ = new Listeners();
        this.$super();
        this.setContentPan(new pkg.Combo.ReadonlyContentPan());
        this.add(L.RIGHT, new pkg.Combo.Button());
        this.setList(list);
    },

    function setContentPan(c){
        if(c != this.content){
            if(this.content != null){
                this.content._.remove(this);
                this.content.owner = null;
                this.remove(this.content);
            }
            this.content = c;
            if(this.content != null){
                this.content._.add(this);
                this.content.owner = this;
                if(this.list != null) this.content.setValue(this.list.getSelected());
                this.add(L.CENTER, this.content);
            }
        }
    },

    function focusGained(e){ this.repaint(); },
    function focusLost(e){ this.repaint(); },

    function setSelectionView(c){
        if(c != this.selectionView){
            this.selectionView = c;
            this.repaint();
        }
    },

    function setArrowGlyph(v){
        if(v != this.arrowGlyph){
            this.arrowGlyph = v;
            this.repaint();
        }
    },

    function canHaveFocus(){
        return this.winpad.parent == null && (this.content == null || this.content.isEditable == false);
    },

    function kidAdded(index,s,c){
        this.$super(index, s, c);
        if(this.button == null && zebra.instanceOf(c, zebra.util.Actionable)){
            this.button = c;
            this.button._.add(this);
        }
    },

    function kidRemoved(index,l){
        this.$super(index, l);
        if(this.button == l){
            this.button._.remove(this);
            this.button = null;
        }
    },

    function setMaxPadHeight(h){
        if(this.maxPadHeight != h){
            this.hidePad();
            this.maxPadHeight = h;
        }
    },

    function setList(l){
        if(this.list != l){
            this.hidePad();
            if(this.list != null) this.list._.remove(this);
            this.list = l;
            this.list._.add(this);
            this.winpad = new pkg.Combo.ComboPadPan(this.list);
            if(this.content != null) this.content.setValue(this.list.getSelected());
            this.vrp();
        }
    },

    function keyPressed(e){
        var index = this.list.selectedIndex;
        switch(e.code) {
            case KE.VK_LEFT:
            case KE.VK_UP: if(index > 0) this.list.select(index - 1);break;
            case KE.VK_DOWN:
            case KE.VK_RIGHT:if(this.list.model.elementsCount() - 1 > index) this.list.select(index + 1); break;
        }
    },

    function keyTyped(e){ this.list.keyTyped(e);},

    function fired(src){
        if (zebra.util.currentTimeMillis() - this.time > 100) this.showPad();
    },

    function fired(src, data){
        if( !this.lockListSelEvent){
            this.hidePad();
            if(this.content != null){
                this.content.setValue(this.list.getSelected());
                if(this.content.isEditable) pkg.focusManager.requestFocus(this.content);
                this.repaint();
            }
        }
    },

    function contentUpdated(src,id,data){
        if(src == this.content){
            try{
                this.lockListSelEvent = true;
                var v = this.content.getValue();
                if(v == null) this.list.select( -1);
                else {
                    var m = this.list.model;
                    for(var i = 0;i < m.elementsCount(); i++){
                        var mv = m.elementAt(i);
                        if(mv == v || (mv.equals && mv.equals(v))){
                            this.list.select(i);
                            break;
                        }
                    }
                }
            }
            finally { this.lockListSelEvent = false; }
            this._.fire(this, data);
        }
    },

    function mousePressed(e){
        if (zebra.util.currentTimeMillis() - this.time > 100 && e.isActionMask() && this.content != null &&
             e.x > this.content.x && e.y > this.content.y && e.x < this.content.x + this.content.width &&
             e.y < this.content.y + this.content.height)
        {
            this.showPad();
        }
    },

    function paint(g){
        if(this.content != null && this.selectionView != null && this.hasFocus()){
            this.selectionView.paint(g, this.content.x, this.content.y,
                                        this.content.width, this.content.height, this);
        }
    },

    function paintOnTop(g){
        if(this.arrowGlyph != null && this.button != null){
            var ps = this.arrowGlyph.getPreferredSize(), b = this.button;
            this.arrowGlyph.paint(g, b.x + ~~((b.width  - ps.width ) / 2),
                                     b.y + ~~((b.height - ps.height) / 2), ps.width, ps.height, this);
        }
    },

    function catchInput(child){ 
        return child != this.button && (this.content == null || this.content.isEditable == false); 
    },

    function hidePad(){
        var d = pkg.getDesktop(this);
        if(d != null && this.winpad.parent != null){
            d.getLayer(pkg.PopupLayer.ID).remove(this.winpad);
            this.requestFocus();
        }
    },

    function showPad(){
        var desktop = pkg.getDesktop(this);
        if(desktop != null){
            var winlayer = desktop.getLayer(pkg.PopupLayer.ID), ps = this.winpad.getPreferredSize();
            if(ps.width > this.width) ps.height += this.winpad.get(pkg.ScrollPan.HBAR_EL).getPreferredSize().height;
            var p = L.getAbsLocation(0, 0, this), px = p[0], py = p[1];
            if(this.maxPadHeight > 0 && ps.height > this.maxPadHeight) ps.height = this.maxPadHeight;
            if (py + this.height + ps.height > desktop.height)
            {
                if(py - ps.height >= 0) py -= (ps.height + this.height);
                else {
                    var hAbove = desktop.height - py - this.height;
                    if(py > hAbove){
                        ps.height = py;
                        py -= (ps.height + this.height);
                    }
                    else ps.height = hAbove;
                }
            }
            this.winpad.setSize(this.width, ps.height);
            this.winpad.setLocation(px, py + this.height);
            this.list.notifyScrollMan(this.list.selectedIndex);
            winlayer.add(this, this.winpad);
            this.list.requestFocus();
        }
    }
]);

})(zebra("ui"), zebra.Class);

(function(pkg, Class, Interface) {

pkg.TooltipInfo = Interface();
pkg.PopupInfo   = Interface();
pkg.WinListener = Interface();

var KE = pkg.KeyEvent, timer = zebra.util.timer, L = zebra.layout, InputEvent = pkg.InputEvent, MouseEvent = pkg.MouseEvent,
    WinListener = pkg.WinListener, ComponentListener = pkg.ComponentListener, BaseList = pkg.BaseList;

var WIN_OPENED = 1, WIN_CLOSED = 2, WIN_ACTIVATED = 3, WIN_DEACTIVATED = 4, VIS_PART_SIZE = 30;
pkg.WinLayer = Class(pkg.BaseLayer, pkg.ChildrenListener, [
    function $clazz() {
        this.ID = "win";

        this.MODAL = 1;
        this.MDI   = 2;
        this.INFO  = 3;
    },

    function $prototype() {
        this.isLayerActive  = function(){ return this.activeWin != null; };
        this.isLayerActiveAt= function(x,y) { return this.activeWin != null; };

        this.layerMousePressed = function(x,y,mask){
            var cnt = this.kids.length;
            if(cnt > 0){
                if(this.activeWin != null && this.indexOf(this.activeWin) == cnt - 1){
                    var x1 = this.activeWin.x, y1 = this.activeWin.y,
                        x2 = x1 + this.activeWin.width, y2 = y1 + this.activeWin.height;
                    if(x >= x1 && y >= y1 && x < x2 && y < y2) return;
                }
                for(var i = cnt - 1;i >= 0 && i >= this.topModalIndex; i--){
                    var d = this.kids[i];
                    if(d.isVisible && d.isEnabled && this.winType(d) != pkg.WinLayer.INFO &&
                       x >= d.x && y >= d.y && x < d.x + d.width && y < d.y + d.height)
                    {
                        this.activate(d);
                        return;
                    }
                }
                if(this.topModalIndex < 0 && this.activeWin != null) this.activate(null);
            }
        };

        this.layerKeyPressed = function(keyCode,mask){
            if(this.kids.length > 0 && keyCode == KE.VK_TAB && (mask & KE.SHIFT) > 0){
                if(this.activeWin == null) this.activate(this.kids[this.kids.length - 1]);
                else{
                    var winIndex = this.winsStack.indexOf(this.activeWin) - 1;
                    if(winIndex < this.topModalIndex || winIndex < 0) winIndex = this.winsStack.length - 1;
                    this.activate(this.winsStack[winIndex]);
                }
            }
        };

        this.childInputEvent = function (e) {
            if (e.ID == InputEvent.FOCUS_GAINED) this.activate(L.getDirectChild(this, e.source));
        };

        this.getComponentAt = function(x,y){
            return (this.activeWin == null) ? null
                                            : this.activeWin.getComponentAt(x - this.activeWin.x,
                                                                            y - this.activeWin.y);
        };

        this.calcPreferredSize = function(target) {
            return L.getMaxPreferredSize(target);
        };

        this.getFocusRoot = function(){ return this.activeWin; };

        this.winType = function(w){ return this.winsInfo[w][1]; };
    },

    function (){
        this.activeWin = null;
        this.topModalIndex = -1;
        this.winsInfo  = {};
        this.winsStack = [];
        this._ = new zebra.util.MListeners("winOpened", "winActivated");
        this.$super(pkg.WinLayer.ID);
    },

    function addWin(type, win, listener) {
        this.winsInfo[win] = [ this.activeWin, type, listener ];
        this.add(win);
    },

    function insert(index, constr, lw) {
        var info = this.winsInfo[lw];
        if (typeof info === 'undefined') {
            info = [this.activeWin, pkg.WinLayer.MDI, null];
            this.winsInfo[lw] = info;
        }
        if (info[1] != pkg.WinLayer.MDI && info[1] != pkg.WinLayer.MODAL && info[1] != pkg.WinLayer.INFO) throw new Error();
        return this.$super(index, constr, lw);
    },

    function kidAdded(index,constr,lw){
        this.$super(index, constr, lw);
        var info = this.winsInfo[lw];
        this.winsStack.push(lw);
        if (info[1] == pkg.WinLayer.MODAL) this.topModalIndex = this.winsStack.length - 1;
        this.fire(WIN_OPENED, lw);
        if(info[1] == pkg.WinLayer.MODAL) this.activate(lw);
    },

    function kidRemoved(index,lw){
        this.$super(this.kidRemoved,index, lw);
        if(this.activeWin == lw){
            this.activeWin = null;
            pkg.focusManager.requestFocus(null);
        }
        var ci = this.winsStack.indexOf(lw), l = this.winsInfo[lw][2];
        delete this.winsInfo[lw];
        this.winsStack.splice(this.winsStack.indexOf(lw), 1);
        if(ci < this.topModalIndex) this.topModalIndex--;
        else {
            if(this.topModalIndex == ci){
                for(this.topModalIndex = this.kids.length - 1;this.topModalIndex >= 0; this.topModalIndex--){
                    if (this.winType(this.winsStack[this.topModalIndex]) == pkg.WinLayer.MODAL) break;
                }
            }
        }

        this.fire(WIN_CLOSED, lw, l);
        if(this.topModalIndex >= 0){
            var aindex = this.winsStack.length - 1;
            while(this.winType(this.winsStack[aindex]) == pkg.WinLayer.INFO) aindex--;
            this.activate(this.winsStack[aindex]);
        }
    },


    function doLayout(target){
        var cnt = this.kids.length;
        for(var i = 0;i < cnt; i ++ ){
            var l = this.kids[i];
            if(l.isVisible){
                var x = l.x, y = l.y, w = l.width, h = l.height, minH = Math.min(VIS_PART_SIZE, h), minW = Math.min(VIS_PART_SIZE, w);
                if(x > this.width - minW) x = this.width - minW;
                else if(x + w < minW) x = minW - w;
                if(y > this.height - minH) y = this.height - minH;
                else if(y < 0) y = 0;
                l.setLocation(x, y);
            }
        }
    },

    function activate(c){
        if(c != null && (this.winsInfo.hasOwnProperty(c) === false || this.winType(c) == pkg.WinLayer.INFO)) throw new Error();
        if(c != this.activeWin){
            var old = this.activeWin;
            if(c == null){
                if (this.winType(this.activeWin) == pkg.WinLayer.MODAL) throw new Error();
                this.activeWin = null;
                this.fire(WIN_DEACTIVATED, old);
                pkg.focusManager.requestFocus(null);
            }
            else{
                if(this.winsStack.indexOf(c) < this.topModalIndex) throw new Error();
                this.activeWin = c;
                this.toFront(this.activeWin);
                if(old != null) this.fire(WIN_DEACTIVATED, old);
                this.fire(WIN_ACTIVATED, this.activeWin);
                this.activeWin.validate();
                pkg.focusManager.requestFocus(pkg.focusManager.findFocusable(this.activeWin));
            }
        }
    },

    function fire(id, win) { this.fire(id, win, this.winsInfo[win][2]); },

    function fire(id, win, l) {
        var b = (id == WIN_OPENED || id == WIN_ACTIVATED),
            n = (id == WIN_OPENED || id == WIN_CLOSED) ? "winOpened" : "winActivated";

        this._[n](this, win, b);
        if (zebra.instanceOf(win, WinListener)) win[n].apply(win, [this, win, b]);
        if (l != null) l[n].apply(l, [this, win, b]);
    }
]);

pkg.Window = Class(pkg.Panel, pkg.MouseMotionListener, WinListener,
                       pkg.MouseListener, pkg.Composite, pkg.Cursorable,
                       pkg.FocusListener, pkg.ExternalEditor, [
    function $prototype() {
        var MOVE_ACTION = 1, SIZE_ACTION = 2;
        this.minSize = 40;
        this.isSizeable = true;

        this.startDragged = function(e){
            this.px = e.x;
            this.py = e.y;
            this.psw = this.width;
            this.psh = this.height;
            this.action = this.insideCorner(this.px, this.py) ? (this.isSizeable ? SIZE_ACTION : -1): MOVE_ACTION;
            if(this.action > 0) this.dy = this.dx = 0;
        };

        this.mouseDragged = function(e){
            if(this.action > 0){
                if(this.action != MOVE_ACTION){
                    var nw = this.psw + this.dx, nh = this.psh + this.dy;
                    if(nw > this.minSize && nh > this.minSize) this.setSize(nw, nh);
                }
                this.dx = (e.x - this.px);
                this.dy = (e.y - this.py);
                if(this.action == MOVE_ACTION){
                    this.invalidate();
                    this.setLocation(this.x + this.dx, this.y + this.dy);
                }
            }
        };

        this.endDragged = function(e){
            if(this.action > 0){
                if(this.action == MOVE_ACTION){
                    this.invalidate();
                    this.setLocation(this.x + this.dx, this.y + this.dy);
                }
                this.action = -1;
            }
        };

        this.insideCorner = function(px,py){ return this.getComponentAt(px, py) == this.sizer; };

        this.getCursorType = function(target,x,y){
            return (this.isSizeable && this.insideCorner(x, y)) ? pkg.Cursor.SE_RESIZE : -1;
        };

        this.catchInput = function(c){
            var tp = this.caption;
            return c == tp || (L.isAncestorOf(tp, c) && !(zebra.instanceOf(c, pkg.Button))) || this.sizer== c;
        };
    },

    function $clazz() {
        this.CaptionPan = Class(pkg.Panel, [
            function() {
                this.$super();
                this.activate(false);
            },

            function activate(b) {
                this.setBackground(b?this.activeBg:this.inactiveBg);
            }
        ]);

        this.TitleLab   = Class(pkg.Label, []);
        this.StatusPan  = Class(pkg.Panel, []);
        this.ContentPan = Class(pkg.Panel, []);
        this.SizerIcon  = Class(pkg.ImagePan, []);
        this.Icon       = Class(pkg.ImagePan, []);
        this.Button     = Class(pkg.Button, []);
    },

    function () {  this.$this("");  },

    function (s){
        this.prevH = this.prevX = this.prevY = this.psw = this.psh = this.px = this.py = this.dx = this.dy = 0;
        this.prevW = this.action = -1;

        this.root    = new pkg.Window.ContentPan();
        this.caption = new pkg.Window.CaptionPan();
        this.title   = new pkg.Window.TitleLab(s);

        var icons = new pkg.Panel(new L.FlowLayout(L.LEFT, L.CENTER, L.HORIZONTAL, 2));
        this.buttons = new pkg.Panel(new L.FlowLayout(L.CENTER, L.CENTER)),

        icons.add(new pkg.Window.Icon());
        icons.add(this.title);

        this.caption.add(L.LEFT, icons);
        this.caption.add(L.RIGHT, this.buttons);

        this.status = new pkg.Window.StatusPan();
        this.sizer  = new pkg.Window.SizerIcon();
        this.status.add(this.sizer);

        this.setSizeable(true);

        this.$super(new L.BorderLayout(2,2));

        this.add(L.CENTER, this.root);
        this.add(L.TOP, this.caption);
        this.add(L.BOTTOM, this.status);
    },

    function fired(src) { this.parent.remove(this); },

    function focusGained(e){ this.focusStateUpdated(); },
    function focusLost(e){ this.focusStateUpdated(); },

    function setSizeable(b){
        if(this.isSizeable != b){
            this.isSizeable = b;
            if (this.sizer != null) this.sizer.setVisible(b);
        }
    },

    function winOpened(winLayer,target,b) {
        if (this.caption != null && this.caption.activate) {
            this.caption.activate(false);
        }
    },

    function winActivated(winLayer, target,b){
        if (this.caption != null && this.caption.activate) {
            this.caption.activate(b);
        }
    },

    function mouseClicked(e){
        var x = e.x, y = e.y, cc = this.caption;
        if (e.clicks == 2 && this.isSizeable && x > cc.x &&
            x < cc.y + cc.width && y > cc.y && y < cc.y + cc.height)
        {
            if(this.prevW < 0) this.maximize();
            else this.restore();
        }
    },

    function maximize(){
        if(this.prevW < 0){
            var d = pkg.getDesktop(this), left = d.getLeft(), top = d.getTop();
            this.prevX = this.x;
            this.prevY = this.y;
            this.prevW = this.width;
            this.prevH = this.height;
            this.setLocation(left, top);
            this.setSize(d.width - left - d.getRight(), d.height - top - d.getBottom());
        }
    },

    function restore(){
        if(this.prevW >= 0){
            this.setLocation(this.prevX, this.prevY);
            this.setSize(this.prevW, this.prevH);
            this.prevW = -1;
        }
    },

    function close() {
        if (this.parent) this.parent.remove(this);
    },

    function setButtons(buttons) {
        for(var i=0; i< this.buttons.length; i++) {
            var kid = this.buttons.kids[i];
            if (kid._) kid._.removeAll();
        }
        this.buttons.removeAll();

        for(var k in buttons) {
            if (buttons.hasOwnProperty(k)) {
                var b = new pkg.Window.Button(), bv = buttons[k];
                b.setView(bv);
                this.buttons.add(b);
                (function(t, f) {
                    b._.add(function() { f.call(t); });
                })(this, this[k]);
            }
        }
    },

    function isMaximized(){ return this.prevW != -1; },
    function focusStateUpdated() { if(this.caption != null) this.caption.repaint(); }
]);

pkg.TooltipManager = Class(pkg.Manager, pkg.MouseListener, pkg.MouseMotionListener, [
    function $clazz() {
        this.Label = Class(pkg.Label, []);

        this.createTooltip = function(text){
            var lab = new pkg.TooltipManager.Label(new zebra.data.Text(text));
            lab.toPreferredSize();
            return lab;
        };
    },

    function $prototype() {
        var TI = pkg.TooltipInfo;

        this.mouseEntered = function(e){
            var c = e.source;
            if(zebra.instanceOf(c, TI) || this.tooltips[c]){
                this.target = c;
                this.targetLayer = pkg.getDesktop(c).getLayer(pkg.WinLayer.ID);
                this.x = e.x;
                this.y = e.y;
                timer.run(this, this.tick, this.tick);
            }
        };

        this.mouseExited = function(e){
            if(this.target != null){
                timer.remove(this);
                this.target = null;
                this.hideTooltipInfo();
            }
        };

        this.mouseMoved = function(e){
            if(this.target != null){
                timer.clear(this);
                this.x = e.x;
                this.y = e.y;
                this.hideTooltipInfo();
            }
        };

        this.run = function(){
            if(this.tooltip == null){
                var tp = this.tooltips[this.target];
                if (!tp) tp = null;
                if (tp == null && zebra.instanceOf(this.target, TI)) tp = this.target;
                this.tooltip = zebra.instanceOf(tp, TI) ? tp.getTooltip(this.target, this.x, this.y) : tp;
                if(this.tooltip != null) {
                    var ps = this.tooltip.getPreferredSize(), p = L.getAbsLocation(this.x, this.y, this.target);
                    this.tooltip.setSize(ps.width, ps.height);
                    var tx = p[0], ty = p[1] - this.tooltip.height, dw = this.targetLayer.width;
                    if(tx + ps.width > dw) tx = dw - ps.width - 1;
                    this.tooltip.setLocation(tx < 0 ? 0 : tx, ty);
                    this.targetLayer.addWin(pkg.WinLayer.INFO, this.tooltip, null);
                }
            }
        };

        this.hideTooltipInfo = function(){
            if(this.tooltip != null){
                this.targetLayer.remove(this.tooltip);
                this.tooltip = null;
            }
        };
    },

    function(){
        this.$super();
        this.tooltips = {};
        this.x = this.y = 0;
        this.targetLayer = this.tooltip = this.target = null;
        this.tick = 400;

    },

    function setTooltip(c,data){
        if(data != null) this.tooltips[c] = zebra.isString(data) ? pkg.TooltipManager.createTooltip(data) : data;
        else {
            if(this.target == c){
                timer.remove(this);
                this.target = null;
                this.hideTooltipInfo();
            }
            delete this.tooltips[c];
        }
    },

    function mousePressed(e){
        if(this.target != null){
            timer.remove(this);
            this.target = null;
            this.hideTooltipInfo();
        }
    },

    function mouseReleased(e){
        if(this.target != null){
            this.x = e.x;
            this.y = e.y;
            timer.run(this, this.tick, this.tick);
        }
    },

    function destroy() {  delete this.tooltips; }
]);

pkg.Menu = Class(pkg.CompList, pkg.ChildrenListener, [
    function $prototype() {
        this.rightIndent = this.gap = 4;
        this.leftIndent = 2;

        this.getSubMenuIndex = function (target){
            for(var i = 0;i < this.menus.length; i++) {
                if (this.menus[i][0] == target) return i;
            }
            return -1;
        };

        this.isDecorative = function (index){
            return !(zebra.instanceOf(this.kids[index], pkg.Panel) &&
                     zebra.instanceOf(this.kids[index].layout, pkg.Menu));
        };

        this.canHaveFocus = function(){return true;};

        this.childCompEvent = function(id,src){
            if(id == ComponentListener.COMP_SHOWN ||
               id == ComponentListener.COMP_ENABLED)
            {
                for(var i = 0;i < this.kids.length; i++){
                    if(this.fetchContentComp(i) == src){
                        var ccc = this.kids[i];
                        ccc.setVisible(src.isVisible);
                        ccc.setEnabled(src.isEnabled);
                        if(i > 0 && this.isDecorative(i - 1)) this.kids[i - 1].setVisible(src.isVisible);
                        break;
                    }
                }
            }
        };

        this.hasVisibleItems = function(){
            for(var i = 0;i < this.kids.length; i++) if (this.kids[i].isVisible) return true;
            return false;
        };
    },

    function $clazz() {
        this.Label = Class(pkg.Label, []);
        this.ItemPan = Class(pkg.Panel, []);
        this.Line = Class(pkg.Line, []);
        this.SubImage = Class(pkg.ImagePan, []);
    },

    function () { this.$this(-1); },

    function (key){
        this.arrowAreaWidth = this.iconAreaWidth = 0;
        this.parentComp = null;
        this.menus = [];
        this.key = key;
        this.$super(true);
    },

    function setIndents(left,right){
        if(left != this.leftIndent || right != this.rightIndent){
            this.leftIndent = left;
            this.rightIndent = right;
            this.vrp();
        }
    },

    function insert(i,o,c){ return this.$super(i, o, this.createItem(c));},
    function addDecorative(c){ this.addDecorative(null, c); },
    function addDecorative(constr, c) { this.$super(this.insert, this.kids.length, constr, c); },
    function addLine(){ this.addDecorative(new Menu.Line()); },

    function addWithIcon(c,icon){
        var p = this.createItem(c);
        p.insert(0, null, icon);
        this.$super(this.insert, this.kids.length, null, p);
    },

    function removeAll(){
        this.menus.length = 0;
        this.menus = [];
        this.$super();
    },

    function removeAt(i){
        this.setSubMenu(i, null);
        this.$super(i);
    },

    function setSubMenu(index,menu){
        if(index >= this.kids.length || menu == this || this.isDecorative(index)) throw new Error();
        var p = this.get(index), sub = this.getSubMenuIndex(p), psub = sub < 0 ? null : this.getSubMenu(index);
        if(psub != null) psub.setMenuParent(null);
        if(menu != null){
            if(sub < 0) {
                this.menus.push([p, menu]);
                p.add(new pkg.Menu.SubImage());
            }
            else this.menus[sub][1] = menu;
            menu.setMenuParent(this);
        }
        else{
            if(sub >= 0){
                this.menus.splice(sub, 1);
                p.removeAt(p.kids.length - 1);
            }
        }
    },

    function posChanged(target,prevOffset,prevLine,prevCol){
        var off = this.position.offset;
        if(off < 0 || (this.kids.length > 0 && this.kids[off].isVisible)){
            this.$super(target, prevOffset, prevLine, prevCol);
        }
        else{
            var d = (prevOffset < off) ? 1 :  -1, cc = this.kids.length, ccc = cc;
            for(; cc > 0 && (!this.get(off).isVisible || this.isDecorative(off)); cc--){
                off += d;
                if(off < 0) off = ccc - 1;
                if(off >= ccc) off = 0;
            }
            if(cc > 0){
                this.position.setOffset(off);
                this.repaint();
            }
        }
    },

    function getSubMenu(index){
        if (this.menus.length === 0) return null;
        var sub = this.getSubMenuIndex(this.get(index));
        return sub < 0 ? null : this.menus[sub][1];
    },

    function select(index){
        if(index < 0 || !this.isDecorative(index)){
            if(index >= 0){
                var l = this.fetchContentComp(index);
                if(l.isEnabled === false) return;
                if(zebra.instanceOf(l, pkg.Checkbox)) l.setState(!l.getState());
            }
            this.$super(this.select,index);
        }
    },

    function calcPreferredSize(target){
        var cc = target.kids.length, gaps = this.getItemGap(),
            ps = (cc > 2 || (this.getSubMenuIndex(target) < 0 && cc > 1)) ? target.kids[1].getPreferredSize()
                                                                          : target.kids[0].getPreferredSize();
        for(var i = 0;i < cc; i++){
            var cps = target.get(i).getPreferredSize();
            if (cps.height > ps.height) ps.height = cps.height;
        }
        ps.width += this.leftIndent + this.rightIndent + this.iconAreaWidth + this.arrowAreaWidth + 2 * gaps;
        ps.height += 2 * gaps;
        return ps;
    },

    function doLayout(target){
        var top = target.getTop(), left = target.getLeft(), right = target.getRight(), bottom = target.getBottom();
        left  += this.leftIndent;
        right += this.rightIndent;

        var x = left, eh = target.height - top - bottom, ew = target.width - left - right,
            count = target.kids.length, hasSub = this.getSubMenuIndex(target) >= 0, l = null;

        if(hasSub){
            l = target.kids[count - 1];
            var ps = l.getPreferredSize();
            l.setLocation(left + ew - ps.width, top + ((eh - ps.height) / 2) + 0.5) | 0;
            l.setSize(ps.width, ps.height);
        }

        if(count > 2 || (!hasSub && count > 1)){
            l = target.kids[0];
            var ps = l.getPreferredSize();
            l.setLocation(x, top + ((eh - ps.height) / 2) + 0.5) | 0;
            l.setSize(ps.width, ps.height);
            l = target.kids[1];
        }
        else l = target.kids[0];

        var ps = l.getPreferredSize();
        l.setLocation(x + this.iconAreaWidth, top + ((eh - ps.height) / 2) + 0.5) | 0;
        l.setSize(ew - this.iconAreaWidth - this.arrowAreaWidth, ps.height);
    },

    function update(g){
        if(this.views["marker"] != null && this.hasFocus()){
            var gap = this.getItemGap(), offset = this.position.offset;
            if(offset >= 0 && !this.isDecorative(offset)){
                this.views["marker"].paint(g, this.getItemX(offset) - gap,
                                           this.getItemY(offset) - gap,
                                           this.getItemW(offset) + 2 * gap,
                                           this.getItemH(offset) + 2 * gap, this);
            }
        }
    },

    function mouseExited(e){
        var offset = this.position.offset;
        if(offset >= 0 && this.getSubMenu(offset) == null) this.position.clearPos();
    },

    function fetchContentComp(index){
        var count = this.kids[index].length;
        return this.isDecorative(index) ? null : this.kids[index].get((count > 2 || (this.getSubMenu(index) == null && count > 1)) ? 1 : 0);
    },

    function keyPressed(e){
        var position = this.position;
        if(position.metrics.getMaxOffset() > 0){
            var code = e.code, offset = position.offset;
            if(code == KE.VK_DOWN){
                var ccc = this.kids.length;
                do { offset = (offset + 1) % ccc; }
                while(this.isDecorative(offset));
                position.setOffset(offset);
            }
            else {
                if(code == KE.VK_UP){
                    var ccc = this.kids.length;
                    do { offset = (ccc + offset - 1) % ccc; }
                    while(this.isDecorative(offset));
                    position.setOffset(offset);
                }
                else
                    if(e.code == KE.VK_ENTER || e.code == KE.VK_SPACE) this.select(offset);
            }
        }
    },

    function drawPosMarker(g,x,y,w,h){},

    function createItem(c){
        if (zebra.isString(c)) c = new pkg.Menu.Label(c);

        var cc = c, pan = new pkg.Menu.ItemPan(this);

        if (zebra.instanceOf(cc, pkg.StatePan)) cc = c.focusComponent;
        else
        if(zebra.instanceOf(c, pkg.Checkbox)){
            var box = c.box;
            c.setBox(box, false);
            c.setLayout(new L.FlowLayout(L.LEFT, L.CENTER));
            c.padding(0);
            pan.add(box);
        }
        pan.add(c);
        pan.setEnabled(c.isEnabled);
        pan.setVisible(c.isVisible);
        pan.setBackground(null);
        return pan;
    },

    function recalc(){
        for(var i = 0;i < this.kids.length; i++) this.kids[i].invalidate();
        this.iconAreaWidth = this.arrowAreaWidth = 0;
        for(var i = 0;i < this.kids.length; i++){
            if(!this.isDecorative(i)){
                var pan = this.kids[i], sub = this.getSubMenuIndex(pan), cc = pan.kids.length;
                if((sub < 0 && cc > 1) || cc > 2){
                    var ps = pan.kids[0].getPreferredSize();
                    if(this.iconAreaWidth < ps.width) this.iconAreaWidth = ps.width;
                }
                if(sub >= 0){
                    var ps = pan.kids[cc - 1].getPreferredSize();
                    if(this.arrowAreaWidth < ps.width) this.arrowAreaWidth = ps.width;
                }
            }
        }
        if(this.iconAreaWidth > 0) this.iconAreaWidth += this.gap;
        if(this.arrowAreaWidth > 0) this.arrowAreaWidth += this.gap;
    },

    function setMenuParent(m){ this.parentComp = m; }
]);

pkg.MenuBar = Class(pkg.Panel, pkg.ChildrenListener, pkg.KeyListener, [
    function $prototype() {
        this.childInputEvent = function(e){
            var target = L.getDirectChild(this, e.source);
            switch(e.ID)
            {
                case MouseEvent.ENTERED:{
                    if(this.over != target){
                        var prev = this.over;
                        this.over = target;
                        if(this.selected != null) this.$select(this.over);
                        else this.repaint2(prev, this.over);
                    }
                } break;
                case MouseEvent.EXITED:{
                    var p = L.getRelLocation(e.absX, e.absY, pkg.getDesktop(this), this.over);
                    if(p[0] < 0 || p[1] < 0 || p[0] >= this.over.width || p[1] >= this.over.height){
                        var prev = this.over;
                        this.over = null;
                        if (this.selected == null) this.repaint2(prev, this.over);
                    }
                } break;
                case MouseEvent.PRESSED:{
                    this.over = target;
                    this.$select(this.selected == target ? null : target);
                } break;
            }
        };

        this.activated = function(b) { if (!b) this.$select(null); };

        this.$select = function(b){
            if(this.selected != b){
                var prev = this.selected, d = pkg.getDesktop(this);
                this.selected = b;
                if(d != null){
                    var pop = d.getLayer(pkg.PopupLayer.ID);
                    pop.removeAll();
                    if(this.selected != null){
                        pop.setMenuBar(this);
                        var menu = this.getMenu(this.selected);
                        if(menu != null && menu.hasVisibleItems()){
                            var abs = L.getAbsLocation(0,0,this.selected);
                            menu.setLocation(abs[0], abs[1] + this.selected.height + 1);
                            pop.add(menu);
                        }
                    }
                    else pop.setMenuBar(null);
                }
                this.repaint2(prev, this.selected);
                this.itemSelected(this.selected);
            }
        };

        this.repaint2 = function(i1,i2){
            if(i1 != null) i1.repaint();
            if(i2 != null) i2.repaint();
        };
    },

    function $clazz() {
        this.Label = Class(pkg.Label, []);
    },

    function (){
        this.menus = {};
        this.over = this.selected = null;
        this.views = {};
        this.$super();
    },

    function add(c,m){
        if (isString(c) ) c = new pkg.MenuBar.Label(c);
        var r = this.add(c);
        this.setMenu(this.kids.length - 1, m);
        return r;
    },

    function setMenu(index,m){
        var c = this.get(index);
        if(m == null) {
            var pm = this.menus.hasOwnProperty(c) ? this.menus[c] : null;
            if (pm != null) {
                delete this.menus[c];
                pm.setMenuParent(null);
            }
        }
        else {
            this.menus[c] = m;
            m.setMenuParent(this);
        }
    },

    function removeAt(i){
        this.setMenu(i, null);
        this.$super(i);
    },

    function removeAll(){
        this.menus = {};
        this.$super();
    },


    function paint(g){
        var target = (this.selected != null) ? this.selected : this.over;
        if(target != null){
            var v = (this.selected != null) ? this.views["on"] : this.views["off"];
            if(v != null) v.paint(g, target.x, target.y, target.width, target.height, this);
        }
    },

    function keyPressed(e){
        if(this.selected != null){
            var idx = this.indexOf(this.selected), pidx = idx, c = null;
            if(e.code == KE.VK_LEFT){
                var ccc = this.kids.length;
                do {
                    idx = (ccc + idx - 1) % ccc;
                    c = this.kids[idx];
                }
                while(!c.isEnabled || !c.isVisible);
            }
            else
                if(e.code == KE.VK_RIGHT){
                    var ccc = this.kids.length;
                    do {
                        idx = (idx + 1) % ccc;
                        c = this.kids[idx];
                    }
                    while(!c.isEnabled || !c.isVisible);
                }
            if(idx != pidx) this.$select(this.get(idx));
        }
    },

    function getMenu(c) { return this.menus.hasOwnProperty(c) ? this.menus[c] : null; },
    function itemSelected(selected) {}
]);

pkg.PopupLayer = Class(pkg.BaseLayer, pkg.ChildrenListener, [
    function $clazz() {
        this.ID = "pop";
    },

    function $prototype() {
        this.mTop = this.mLeft = this.mBottom = this.mRight = 0;

        this.layerMousePressed = function(x,y,mask){
            if(this.isLayerActiveAt(x, y) && this.getComponentAt(x, y) == this){
                this.removeAll();
                this.setMenuBar(null);
            }
        };

        this.isLayerActive = function(){return this.kids.length > 0;};

        this.isLayerActiveAt = function(x,y){
            return this.kids.length > 0 && (this.mbar == null || y > this.mBottom || y < this.mTop ||
                   x < this.mLeft || x > this.mRight || this.getComponentAt(x, y) != this);
        };

        this.childInputEvent = function(e){
            if(e.UID == pkg.InputEvent.KEY_UID){
                if(e.ID == KE.PRESSED && e.code == KE.VK_ESCAPE){
                    var p = e.source;
                    while(p.parent != this) p = p.parent;
                    this.remove(p);
                    if(this.kids === 0) this.setMenuBar(null);
                }
                if(zebra.instanceOf(this.mbar, pkg.KeyListener))
                    pkg.events.performInput(new KE(this.mbar, e.ID, e.code, e.ch, e.mask));
            }
        };

        this.calcPreferredSize = function (target){ return { width:0, height:0 }; };
    },

    function (){
        this.mbar = null;
        this.pcMap = [];
        this.$super(pkg.PopupLayer.ID);
    },

    function run(){
        timer.remove(this);
        if(this.kids.length > 0){
            var menu = this.kids[this.kids.length - 1];
            menu.select(menu.position.offset);
        }
    },

    function removeAt(index){ for(var i = this.kids.length - 1;i >= index; i--) this.$super(this.removeAt,index); },

    function posChanged(target,prevOffset,prevLine,prevCol){
        if (timer.get(this)) timer.remove(this);
        var selectedIndex = target.offset;
        if(selectedIndex >= 0){
            var index = this.pcMap.indexOf(target), sub = this.get(index).getSubMenu(selectedIndex);
            if(index + 1 < this.kids.length && sub != this.get(index + 1)) this.removeAt(index + 1);
            if(index + 1 == this.kids.length && sub != null) timer.run(this, 900, 5000);
        }
    },

    function fired(src,data){
        var index = (data != null) ? src.selectedIndex :  -1;
        if(index >= 0){
            var sub = src.getSubMenu(index);
            if(sub != null){
                if(sub.parent == null){
                    sub.setLocation(src.x + src.width - 10, src.y + src.get(index).y);
                    this.add(sub);
                }
                else pkg.focusManager.requestFocus(this.get(this.kids.length - 1));
            }
            else{
                this.removeAll();
                this.setMenuBar(null);
            }
        }
        else {
            if (src.selectedIndex >= 0) {
                var sub = src.getSubMenu(src.selectedIndex);
                if (sub != null) { this.remove(sub); }
            }
        }
    },

    function setMenuBar(mb){
        if(this.mbar != mb){
            this.removeAll();
            if (this.mbar && this.mbar.activated) this.mbar.activated(false);
            this.mbar = mb;
            if(this.mbar != null){
                var abs = L.getAbsLocation(0, 0, this.mbar);
                this.mLeft = abs[0];
                this.mRight = this.mLeft + this.mbar.width - 1;
                this.mTop = abs[1];
                this.mBottom = this.mTop + this.mbar.height - 1;
            }
            if (this.mbar && this.mbar.activated) this.mbar.activated(true);
        }
    },

    function kidAdded(index,id,lw){
        this.$super(index, id, lw);
        if(zebra.instanceOf(lw, pkg.Menu)){
            lw.position.clearPos();
            lw.select(-1);
            this.pcMap.splice(index, 0, lw.position);
            lw._.add(this);
            lw.position._.add(this);
            lw.requestFocus();
        }
    },

    function kidRemoved(index,lw){
        this.$super(index, lw);
        if(zebra.instanceOf(lw, pkg.Menu)){
            lw._.remove(this);
            lw.position._.remove(this);
            this.pcMap.splice(index, 1);
            if(this.kids.length > 0) {
                this.get(this.kids.length - 1).select(-1);
                this.get(this.kids.length - 1).requestFocus();
            }
        }
    },

    function doLayout(target){
        var cnt = this.kids.length;
        for(var i = 0; i < cnt; i++){
            var m = this.kids[i];
            if(zebra.instanceOf(m, pkg.Menu)){
                var ps = m.getPreferredSize(),
                    xx = (m.x + ps.width > this.width) ? this.width - ps.width : m.x,
                    yy = (m.y + ps.height > this.height) ? this.height - ps.height : m.y;
                m.setSize(ps.width, ps.height);
                if (xx < 0) xx = 0;
                if (yy < 0) yy = 0;
                m.setLocation(xx, yy);
            }
        }
    }
]);

pkg.PopupManager = Class(pkg.Manager, pkg.MouseListener, [
    function () {
        this.$super();
        this.menus = {};
        this.time = this.initialX = this.initialY = 0;
    },

    function setPopup(c,p){
        if(p == null) delete this.menus[c];
        else this.menus[c] = p;
    },

    function getPopup(c){ return this.menus.hasOwnProperty(c) ? this.menus[c] : null; },
    function destroy(){ delete this.menus; },

    function mousePressed(e){
        this.time = zebra.util.currentTimeMillis();
        this.initialX = e.absX;
        this.initialY = e.absY;
        if((e.mask & MouseEvent.RIGHT_BUTTON) > 0) {
            this.addPopup(e.source, e.x, e.y);
        }
    },

    function mouseReleased(e){
        if (this.time > 0 && zebra.util.currentTimeMillis() - this.time > 500){
            var nx = e.absX, ny = e.absY;
            if(this.initialX == nx && this.initialY == ny) this.addPopup(e.source, nx, ny);
        }
    },

    function fetchMenu(target,x,y){
        var popup = this.getPopup(target);
        return (popup != null) ? popup.getPopup(target, x, y) : (zebra.instanceOf(target, pkg.PopupInfo)) ? target.getPopup(target, x, y) : null;
    },

    function addPopup(target,x,y){
        var menu = this.fetchMenu(target, x, y);
        if(menu != null){
            menu.setLocation(this.initialX, this.initialY);
            pkg.getDesktop(target).getLayer(pkg.PopupLayer.ID).add(menu);
            menu.requestFocus();
        }
        this.time = -1;
    }
]);

})(zebra("ui"), zebra.Class, zebra.Interface);

(function(pkg, Class) {

var ME = pkg.MouseEvent, KE = pkg.KeyEvent, PO = zebra.util.Position, rgb = zebra.util.rgb;

function CM() { return pkg.clipboard; }

pkg.TextField = Class(pkg.Label, pkg.KeyListener, pkg.MouseListener, pkg.MouseMotionListener,
                      pkg.FocusListener, pkg.Cursorable, pkg.TxtSelectionInfo,
                      pkg.ScrollListener, pkg.PopupInfo, [

    function $clazz() {
        this.TextPosition = Class(PO, [
            function (render){
                  this.$super(render);
                  render.target._.add(this);
            },

            function $prototype() {
                this.textUpdated = function(src,b,off,size,startLine,lines){
                      if(b === true) this.inserted(off, size);
                      else this.removed(off, size);
                };
            },

            function destroy() { this.metrics.target._.remove(this); }
        ]);

        this.Menu = Class(pkg.Menu, [
            function (){
                this.target = null;
                this.$super();

                this.setIndents(8, 8);
                this.add(pkg.get("tf.cmenu.cut"));
                this.add(pkg.get("tf.cmenu.copy"));
                this.add(pkg.get("tf.cmenu.paste"));
                this.add(pkg.get("tf.cmenu.del"));
                this.addLine();
                this.add(pkg.get("tf.cmenu.selall"));

                this._.add(function(src) {
                    switch(src.selectedIndex) {
                        case 0:
                            src.target.copy();
                            var p = src.target.getSelectionOffsets();
                            src.target.remove(p[0], p[1] - p[0]);
                            break;
                        case 1: src.target.copy(); break;
                        case 2: src.target.paste(); break;
                        case 3:
                            var p = src.target.getSelectionOffsets();
                            src.target.remove(p[0], p[1] - p[0]);
                            break;
                        case 5: src.target.select(0, src.target.position.metrics.getMaxOffset());
                    }
                });
            },

            function setTarget(tf){
                this.target = tf;
                if(this.target != null){
                    var b = this.target.hasSelection(), bb = this.target.isEditable;
                    this.get(0).setEnabled(b && bb);
                    this.get(1).setEnabled(b);
                    this.get(3).setEnabled(b && bb);
                    if(this.target.getText() == null || this.target.getText().length === 0) this.get(5).setEnabled(false);
                    else this.get(5).setEnabled(true);
                    this.get(2).setEnabled(bb && CM() != null && !CM().isEmpty());
                }
            },

            function setParent(c){
                this.$super(c);
                if(c == null && this.target != null) this.target.requestFocus();
            }
        ]);
    },

    function $prototype() {
        this.selectionColor = this.curView = this.position = null;
        this.isEditable = true;
        this.isPopupEnabled = false;

        this.getTextRowColAt = function(render,x,y){
            var size = render.target.getLines();
            if(size === 0) return null;

            var lh = render.font.height, li = render.getLineIndent(),
                ln = (y < 0) ? 0 : ~~((y + li) / (lh + li)) + ((y + li) % (lh + li) > li ? 1 : 0) -1;

            if(ln >= size) return [size - 1, render.getLine(size - 1).length];
            else if (ln < 0) return [0,0];

            if(x < 0) return [ln, 0];

            var x1 = 0, x2 = 0, s = render.getLine(ln);
            for(var c = 0; c < s.length; c++){
                x1 = x2;
                x2 = render.font.charsWidth(s, 0, c + 1);
                if(x >= x1 && x < x2) return [ln, c];
            }
            return [ln, s.length];
        };

        this.findNextWord = function(t,line,col,d){
            if(line < 0 || line >= t.getLines()) return null;
            var ln = t.getLine(line);
            col += d;
            if(col < 0 && line > 0) return [line - 1, t.getLine(line - 1).length];
            else
                if(col > ln.length && line < t.getLines() - 1) return [line + 1, 0];

            var b = false;
            for(; col >= 0 && col < ln.length; col += d){
                if(b){
                    if(d > 0){ if(zebra.util.isLetter(ln[col])) return [line, col]; }
                    else if (!zebra.util.isLetter(ln[col])) return [line, col + 1];
                }
                else  b = d > 0 ? !zebra.util.isLetter(ln[col]) : zebra.util.isLetter(ln[col]);
            }
            return (d > 0 ? [line, ln.length ]: [line, 0]);
        };

        this.getSubString = function(r,start,end){
            var res = [];
            for(var i = start.x;i < end.x + 1; i++){
                var ln = r.getLine(i);
                if (i != start.x) res.push('\n');
                else ln = ln.substring(start.y);
                if(i == end.x) ln = ln.substring(0, end.y - ((start.x == end.x) ? start.y : 0));
                res.push(ln);
            }
            return res.join('');
        };

        this.removeSelected = function(){
            if(this.hasSelection()){
                var start = Math.min(this.startOff, this.endOff);
                this.remove(start, Math.max(this.startOff, this.endOff) - start);
                this.clearSelection();
            }
        };

        this.startSelection = function(){
            if(this.startOff < 0){
                var pos = this.position;
                this.endLine = this.startLine = pos.currentLine;
                this.endCol = this.startCol = pos.currentCol;
                this.endOff = this.startOff = pos.offset;
            }
        };

        this.keyTyped = function(e){
            if( !e.isControlPressed() && !e.isCmdPressed() && this.isEditable){
                if(e.ch == '\n' && zebra.instanceOf(this.view.target, zebra.data.SingleLineTxt)) return;
                this.removeSelected();
                this.write(this.position.offset, e.ch);
            }
        };

        this.keyPressed = function(e) {
            if (this.isFiltered(e)) return;

            var position = this.position, col = position.currentCol, isShiftDown = e.isShiftPressed(),
                line = position.currentLine, lines = position.metrics.getLines();
            if (isShiftDown && e.ch == KE.CHAR_UNDEFINED) this.startSelection();

            switch(e.code)
            {
                case KE.VK_DOWN: position.seekLineTo(PO.DOWN);break;
                case KE.VK_UP: position.seekLineTo(PO.UP);break;
                case KE.VK_RIGHT:
                    if(e.isControlPressed()){
                        var p = this.findNextWord(this.view.target, line, col, 1);
                        if(p != null) position.setRowCol(p[0], p[1]);
                    }
                    else position.seek(1);
                    break;
                case KE.VK_LEFT:
                    if(e.isControlPressed()){
                        var p = this.findNextWord(this.view.target, line, col,  - 1);
                        if(p != null) position.setRowCol(p[0], p[1]);
                    }
                    else this.position.seek(-1);
                    break;
                case KE.VK_END:
                    if(e.isControlPressed()) position.seekLineTo(PO.DOWN, lines - line - 1);
                    else position.seekLineTo(PO.END);
                    break;
                case KE.VK_HOME:
                    if(e.isControlPressed()) position.seekLineTo(PO.UP, line);
                    else position.seekLineTo(PO.BEG);
                    break;
                case KE.VK_PAGE_DOWN: position.seekLineTo(PO.DOWN, this.pageSize());break;
                case KE.VK_PAGE_UP: position.seekLineTo(PO.UP, this.pageSize());break;
                case KE.VK_DELETE:
                    if(this.hasSelection()) {
                        if(isShiftDown){
                            var cm = CM();
                            if(cm != null) cm.put(this.getSelectedText());
                        }
                        if (this.isEditable) this.removeSelected();
                    }
                    else {
                        if (this.isEditable) this.remove(position.offset, 1);
                    } break;
                case KE.VK_BACK_SPACE:
                    if(this.isEditable) {
                        if(this.hasSelection()) this.removeSelected();
                        else {
                            if(this.isEditable && position.offset > 0){
                                position.seek(-1);
                                this.remove(position.offset, 1);
                            }
                        }
                    } break;
                case KE.VK_V:
                    if(e.isControlPressed() || e.isCmdPressed()) this.paste();
                    return;
                case KE.VK_C:
                    if(e.isControlPressed() || e.isCmdPressed()) this.copy();
                    return;
                case KE.VK_INSERT:
                    if(this.isEditable){
                        if(this.hasSelection() && e.isControlPressed()){
                            this.copy();
                            return;
                        }
                        else if(isShiftDown) this.paste();
                    } break;
                case KE.VK_A:
                    if(e.isControlPressed() || e.isCmdPressed()) this.select(0, position.metrics.getMaxOffset());
                    return;
                default: return ;
            }
            if (!isShiftDown && this.isEditable) this.clearSelection();
        };

        this.isFiltered = function (e){
            var code = e.code;
            return code == KE.VK_SHIFT || code == KE.VK_CONTROL || code == KE.VK_TAB || code == KE.VK_ALT || (e.mask & KE.ALT) > 0;
        };

        this.remove = function (pos,size){
            var position = this.position;
            if(pos >= 0 && (pos + size) <= position.metrics.getMaxOffset()){
                var pl = position.metrics.getLines(), old = position.offset;
                this.view.target.remove(pos, size);
                if (position.metrics.getLines() != pl || old == pos) this.repaint();
            }
        };

        this.write = function (pos,s){
            var old = this.position.offset, m = this.view.target,  pl = m.getLines();
            m.write(s, pos);
            if(m.getLines() != pl || this.position.offset == old) this.repaint();
        };

        this.recalc = function() { this.validateCursorMetrics(); };

        this.validateCursorMetrics = function() {
            var r = this.view, p = this.position;
            if(p.offset >= 0){
                var cl = p.currentLine;
                this.curX = r.font.charsWidth(r.getLine(cl), 0, p.currentCol) + this.getLeft();
                this.curY = cl * (r.font.height + r.getLineIndent()) + this.getTop();
            }
            this.curH = r.font.height - 1;
        };

        this.getCursorType = function(target,x,y){ return pkg.Cursor.TEXT; };

        this.getScrollManager = function (){ return this.sman;};
        this.scrolled = function (psx,psy){ this.repaint(); };
        this.canHaveFocus = function (){ return true;};

        this.drawCursor = function (g){
            if(this.isEditable && this.hasFocus() && this.position.offset >= 0){
                if (this.curView != null) this.curView.paint(g, this.curX, this.curY, this.curW, this.curH, this);
            }
        };

        this.startDragged = function (e){
            if((e.mask & ME.LEFT_BUTTON) > 0 && this.position.metrics.getMaxOffset() > 0) this.startSelection();
        };

        this.endDragged =function (e){
            if((e.mask & ME.LEFT_BUTTON) > 0 &&  !this.hasSelection()) this.clearSelection();
        };

        this.mouseDragged = function (e){
            if((e.mask & ME.LEFT_BUTTON) > 0){
                var p = this.getTextRowColAt(this.view, e.x - this.sman.getSX(), e.y - this.sman.getSY());
                if(p != null) this.position.setRowCol(p[0], p[1]);
            }
        };

        this.select = function (startOffset,endOffset){
            if(endOffset < startOffset || startOffset < 0 || endOffset > this.position.metrics.getMaxOffset()){
                throw new Error();
            }
            if(this.startOff != startOffset || endOffset != this.endOff){
                if(startOffset == endOffset) this.clearSelection();
                else {
                    this.startOff = startOffset;
                    var p = this.position.getPointByOffset(startOffset);
                    this.startLine = p[0];
                    this.startCol = p[1];
                    this.endOff = endOffset;
                    p = this.position.getPointByOffset(endOffset);
                    this.endLine = p[0];
                    this.endCol = p[1];
                    this.repaint();
                }
            }
        };

        this.hasSelection = function (){ return this.startOff != this.endOff; };
    },

    function () { this.$this(""); },

    function(s, maxCol){
        var b = zebra.isNumber(maxCol);
        this.$this(b ? new zebra.data.SingleLineTxt(s, maxCol) : (maxCol ? new zebra.data.Text(s) : s));
        if (b && maxCol > 0) this.setPSByRowsCols(-1, maxCol);
    },

    function (render){
        if (zebra.isString(render)) render = new pkg.TextRender(new zebra.data.SingleLineTxt(render));
        else {
            if (zebra.instanceOf(render, zebra.data.TextModel)) render = new pkg.TextRender(render);
        }
        this.startLine = this.startCol = this.endLine = this.endCol = this.curX = this.curY = this.curH = this.curH = 0;
        this.startOff = this.endOff = -1;
        this.$super(render);
        this.sman = new pkg.ScrollManager(this);
    },

    function setView(v){
        if(v != this.view){
            this.$super(v);
            this.setPosition(this.createPosition(this.view));
        }
    },

    function setPosition(p){
        if(this.position != p){
            if(this.position != null){
                this.position._.remove(this);
                if (this.position.destroy) this.position.destroy();
            }
            this.position = p;
            this.position._.add(this);
            this.invalidate();
        }
    },

    function setPopupEnabled(b){ this.isPopupEnabled = b; },

    function getPopup(target,x,y){
        if(this.isPopupEnabled){
            var contextMenu = pkg.get("tf.cmenu");
            if(contextMenu != null){
                contextMenu.setTarget(this);
                return contextMenu;
            }
        }
        return null;
    },

    function setCursorView(v){
        // !!!
        // cursor size should be set by property
        this.curW = 1;
        if(v != this.curView){
            this.curView = v;
            //!!!this.curW = this.curView != null ? this.curView.getPreferredSize().width : 1;
            this.validateCursorMetrics();
            this.repaint();
        }
    },

    function setPSByRowsCols(r,c){
        var tr = this.view, w = (c > 0) ? (tr.font.stringWidth("W") * c) : this.psWidth,
            h = (r > 0) ? (r * tr.font.height + (r - 1) * tr.getLineIndent()) : this.psHeight;
        this.setPreferredSize(w, h);
    },

    function setEditable(b){
        if(b != this.isEditable){
            this.isEditable = b;
            this.vrp();
        }
    },

    function focusGained(e){
        if(this.position.offset < 0) this.position.setOffset(0);
        else {
            if (this.isEditable) {
                this.repaint(this.curX + this.sman.getSX(), this.curY + this.sman.getSY(),
                             this.curW, this.curH);
            }
        }
    },

    function focusLost(e){
        if(this.isEditable) {
            this.repaint(this.curX + this.sman.getSX(), this.curY + this.sman.getSY(),
                         this.curW, this.curH);
        }
    },

    function mouseClicked(e){
        if ((e.mask & ME.LEFT_BUTTON) > 0 && e.clicks > 1) this.select(0, this.position.metrics.getMaxOffset());
    },

    function mousePressed(e){
        if(e.isActionMask()){
            if ((e.mask & KE.SHIFT) > 0) this.startSelection();
            else this.clearSelection();
            var p = this.getTextRowColAt(this.view, e.x - this.sman.getSX() - this.getLeft(),
                                                    e.y - this.sman.getSY() - this.getTop());
            if(p != null) this.position.setRowCol(p[0], p[1]);
        }
    },

    function setText(s){
        var txt = this.getText();
        if(txt != s){
            this.position.setOffset(0);
            this.sman.scrollTo(0, 0);
            this.$super(s);
        }
    },

    function posChanged(target,po,pl,pc){
        this.validateCursorMetrics();
        var position = this.position;
        if(position.offset >= 0){
            var lineHeight = this.view.font.height, top = this.getTop();
            this.sman.makeVisible(this.curX, this.curY, this.curW, lineHeight);
            if(pl >= 0){
                if(this.startOff >= 0){
                    this.endLine = position.currentLine;
                    this.endCol = position.currentCol;
                    this.endOff = position.offset;
                }
                var minUpdatedLine = Math.min(pl, position.currentLine), maxUpdatedLine = Math.max(pl, position.currentLine),
                    li = this.view.getLineIndent(), bottom = this.getBottom(), left = this.getLeft(), right = this.getRight(),
                    y1 = lineHeight * minUpdatedLine + minUpdatedLine * li + top + this.sman.getSY();
                if(y1 < top) y1 = top;
                if(y1 < this.height - bottom){
                    var h = (maxUpdatedLine - minUpdatedLine + 1) * (lineHeight + li);
                    if( y1 + h > this.height - bottom) h = this.height - bottom - y1;
                    this.repaint(left, y1, this.width - left - right, h);
                }
            }
            else this.repaint();
        }
    },

    function paint(g){
        var sx = this.sman.getSX(), sy = this.sman.getSY();
        try{
            g.translate(sx, sy);
            this.$super(g);
            this.drawCursor(g);
        }
        finally{ g.translate( -sx,  -sy); }
    },

    function getPreferredSize(){
        var d = this.$super();
        if (this.psWidth < 0) d.width += this.curW;
        return d;
    },

    function getStartSelection(){
        return this.hasSelection() ? ((this.startOff < this.endOff) ? [this.startLine, this.startCol]
                                                                    : [this.endLine, this.endCol]) : null;
    },

    function getEndSelection(){
        return this.hasSelection() ? ((this.startOff < this.endOff) ? [this.endLine, this.endCol]
                                                                    : [this.startLine, this.startCol]) : null;
    },

    function getSelectionOffsets(){
        return this.hasSelection() ? ((this.startOff < this.endOff) ? [this.startOff, this.endOff]
                                                                    : [this.endOff, this.startOff]) : null;
    },

    function getSelectedText(){
        return this.hasSelection() ? this.getSubString(this.view, this.getStartSelection(), this.getEndSelection())
                                   : null;
    },

    function setSelectionColor(c){
        if (!c.equals(this.selectionColor)){
            this.selectionColor = c;
            if (this.hasSelection()) this.repaint();
        }
    },

    function setEnabled(b){
        this.clearSelection();
        this.$super(b);
    },

    function paste(){
        var cm = CM(), s = (cm == null ? null : cm.get());
        if(s != null){
            this.removeSelected();
            this.write(this.position.offset, s);
        }
    },

    function copy(){
        var cm = CM();
        if(cm != null) cm.put(this.getSelectedText());
    },

    function pageSize(){
        var height = this.height - this.getTop() - this.getBottom(),
            render = this.view, indent = render.getLineIndent(), textHeight = render.font.height;
        return (((height + indent) / (textHeight + indent) + 0.5) | 0) + (((height + indent) % (textHeight + indent) > indent) ? 1 : 0);
    },

    function createPosition(r){ return new pkg.TextField.TextPosition(r); },

    function clearSelection(){
        if(this.startOff >= 0){
            var b = this.hasSelection();
            this.endOff = this.startOff =  -1;
            if (b) this.repaint();
        }
    }
]);

})(zebra("ui"), zebra.Class);

(function(pkg, Class, ui)  {

var KE = ui.KeyEvent, rgb = zebra.util.rgb;

var IM = function(b) {
    this.width = this.height = this.x = this.y = this.viewHeight = 0;
    this.viewWidth = -1;
    this.isOpen = b;
};

pkg.DefEditors = Class([
    function (){
        this.tf = new ui.TextField(new zebra.data.SingleLineTxt(""));
        this.tf.setBackground(rgb.white);
        this.tf.setBorder(null);
        this.tf.padding(0);
    },

    function $prototype() {
        this.getEditor = function(src,item){
            var o = item.value;
            this.tf.setText((o == null) ? "" : o.toString());
            return this.tf;
        };

        this.fetchEditedValue = function(src,editor){ return editor.view.target.getText(); };

        this.shouldStartEdit = function(src,e){
            return (e.ID == ui.MouseEvent.CLICKED && e.clicks == 2) ||
                   (e.ID == KE.PRESSED && e.code == KE.VK_ENTER);
        };
    }
]);

pkg.Tree = Class(ui.Panel, ui.MouseListener, ui.KeyListener,
                 ui.ScrollListener, ui.ChildrenListener, ui.FocusListener, [
    function $prototype() {
        this.gapx = this.gapy = 2;

        this.canHaveFocus = function() { return true; };

        this.childInputEvent = function(e){
            if(e.ID == KE.PRESSED){
                var kc = e.code;
                if(kc == KE.VK_ESCAPE) this.stopEditing(false);
                else
                    if(kc == KE.VK_ENTER){
                        if(!(zebra.instanceOf(e.source, ui.TextField)) ||
                            (zebra.instanceOf(e.source.view.target, zebra.data.SingleLineTxt))){
                            this.stopEditing(true);
                        }
                    }
            }
        };

        this.isInvalidatedByChild = function (c){ return false; };

        this.scrolled = function (psx,psy){
            this.stopEditing(true);
            if(this.firstVisible == null) this.firstVisible = this.model.root;
            this.firstVisible = (this.y < psy) ? this.nextVisible(this.firstVisible)
                                               : this.prevVisible(this.firstVisible);
            this.repaint();
        };

        this.iItem = function (item){
            if(item == this.firstVisible) this.firstVisible = null;
            this.getIM(item).viewWidth =  -1;
            this.invalidate();
        };

        this.iItems = function(){
            this.firstVisible = null;
            delete this.nodes;
            this.nodes = {};
            this.invalidate();
        };

        this.isOpen = function(i){
            this.validate();
            return this.isOpen_(i);
        };

        this.getItemMetrics = function(i){
            this.validate();
            return this.getIM(i);
        };

        this.laidout = function(){ this.vVisibility(); };

        this.vVisibility = function (){
            if(this.model == null) this.firstVisible = null;
            else{
                var nva = ui.cvp(this, {});
                if (nva == null) this.firstVisible = null;
                else
                {
                    if (this._isVal === false ||
                        (this.visibleArea == null || this.visibleArea.x != nva.x ||
                         this.visibleArea.y != nva.y || this.visibleArea.width != nva.width ||
                         this.visibleArea.height != nva.height))
                    {
                        this.visibleArea = nva;
                        if(this.firstVisible != null){
                            this.firstVisible = this.findOpened(this.firstVisible);
                            this.firstVisible = this.isAbove(this.firstVisible) ? this.nextVisible(this.firstVisible)
                                                                                : this.prevVisible(this.firstVisible);
                        }
                        else
                            this.firstVisible = (-this.sman.getSY() > ~~(this.maxh / 2)) ? this.prevVisible(this.findLast(this.model.root))
                                                                                         : this.nextVisible(this.model.root);
                    }
                }
            }
            this._isVal = true;
        };

        this.recalc = function (){
            this.maxh = this.maxw = 0;
            if(this.model != null && this.model.root != null){
                this.recalc_(this.getLeft(), this.getTop(), null, this.model.root, true);
                this.maxw -= this.getLeft();
                this.maxh -= this.gapy;
            }
        };

        this.getViewBounds = function(root){
            var metrics = this.getIM(root), toggle = this.getToggleBounds(root), image = this.getImageBounds(root);
            toggle.x = image.x + image.width + (image.width > 0 || toggle.width > 0 ? this.gapx : 0);
            toggle.y = metrics.y + ~~((metrics.height - metrics.viewHeight) / 2);
            toggle.width = metrics.viewWidth;
            toggle.height = metrics.viewHeight;
            return toggle;
        };

        this.getToggleBounds = function(root){
            var node = this.getIM(root), d = this.getToggleSize(root);
            return { x:node.x, y:node.y + ~~((node.height - d.height) / 2), width:d.width, height:d.height };
        };

        this.getToggleView = function (i){
            return this.model.hasChildren(i) ? (this.getIM(i).isOpen ? this.views["on"]
                                                                     : this.views["off"]) : null;
        };

        this.getItemAt = function(x,y){
            this.validate();
            return this.firstVisible == null ? null : this.getItemAt_(this.firstVisible, x, y);
        };

        this.focusStateUpdated = function() {
            if(this.selected != null){
                var m = this.getItemMetrics(this.selected);
                this.repaint(m.x + this.sman.getSX(), m.y + this.sman.getSY(), m.width, m.height);
            }
        };

        this.recalc_ = function (x,y,parent,root,isVis){
            var node = this.getIM(root);
            if(isVis === true){
                if(node.viewWidth < 0){
                    var nodeView = this.provider.getView(this, root), viewSize = nodeView.getPreferredSize();
                    node.viewWidth = viewSize.width === 0 ? 5 : viewSize.width + this.itemGapX * 2;
                    node.viewHeight = viewSize.height + this.itemGapY * 2;
                }
                var imageSize = this.getImageSize(root), toggleSize = this.getToggleSize(root);
                if(parent != null){
                    var pImg = this.getImageBounds(parent);
                    x = pImg.x + ~~((pImg.width - toggleSize.width) / 2);
                }
                node.x = x;
                node.y = y;
                node.width = toggleSize.width + imageSize.width +
                             node.viewWidth + (toggleSize.width > 0 ? this.gapx : 0) + (imageSize.width > 0 ? this.gapx : 0);
                node.height = Math.max(Math.max(toggleSize.height, imageSize.height), node.viewHeight);
                if(node.x + node.width > this.maxw) this.maxw = node.x + node.width;
                this.maxh += (node.height + this.gapy);
                x = node.x + toggleSize.width + (toggleSize.width > 0 ? this.gapx : 0);
                y += (node.height + this.gapy);
            }
            var b = node.isOpen && isVis;
            if(b){
                var count = this.model.getChildrenCount(root);
                for(var i = 0;i < count; i++) y = this.recalc_(x, y, root, this.model.getChildAt(root, i), b);
            }
            return y;
        };

        this.isOpen_ = function (i){
            return i == null || (this.model.hasChildren(i) && this.getIM(i).isOpen && this.isOpen_(this.model.getParent(i)));
        };

        this.getIM = function (i){
            var node = this.nodes[i];
            if(typeof node === 'undefined'){
                node = new IM(this.isOpenVal);
                this.nodes[i] = node;
            }
            return node;
        };

        this.getItemAt = function(root,x,y){
            if(y >= this.visibleArea.y && y < this.visibleArea.y + this.visibleArea.height){
                var dx = this.sman.getSX(), dy = this.sman.getSY(),
                    found = this.getItemAtInBranch(root, x - dx, y - dy);
                if (found != null) return found;
                var parent = this.model.getParent(root);
                while(parent != null){
                    var count = this.model.getChildrenCount(parent);
                    for(var i = this.model.getChildIndex(root) + 1;i < count; i ++ ){
                        found = this.getItemAtInBranch(this.model.getChildAt(parent, i), x - dx, y - dy);
                        if(found != null) return found;
                    }
                    root = parent;
                    parent = this.model.getParent(root);
                }
            }
            return null;
        };

        this.getItemAtInBranch = function(root,x,y){
            if(root != null){
                var node = this.getIM(root);
                if (x >= node.x && y >= node.y && x < node.x + node.width && y < node.y + node.height + this.gapy) return root;
                if (this.isOpen_(root)){
                    for(var i = 0;i < this.model.getChildrenCount(root); i++) {
                        var res = this.getItemAtInBranch(this.model.getChildAt(root, i), x, y);
                        if(res != null) return res;
                    }
                }
            }
            return null;
        };

        this.getImageView = function (i){
            return this.model.hasChildren(i) ? (this.getIM(i).isOpen ? this.views["open"]
                                                                     : this.views["close"])
                                             : this.views["least"];
        };

        this.getImageSize = function (i){
            return this.model.hasChildren(i) ? (this.getIM(i).isOpen ? this.viewSizes["open"]
                                                                     : this.viewSizes["close"])
                                             : this.viewSizes["least"];
        };

        this.getImageBounds = function (root){
            var node = this.getIM(root), id = this.getImageSize(root), td = this.getToggleSize(root);
            return { x:node.x + td.width + (td.width > 0 ? this.gapx : 0),
                     y:node.y + ~~((node.height - id.height) / 2), width:id.width, height:id.height };
        };

        this.getImageY = function (root){
            var node = this.getIM(root);
            return node.y + ~~((node.height - this.getImageSize(root).height) / 2);
        };

        this.getToggleY = function (root){
            var node = this.getIM(root);
            return node.y + ~~((node.height - this.getToggleSize(root).height) / 2);
        };

        this.getToggleSize = function (i){
            return this.isOpen_(i) ? this.viewSizes["on"] : this.viewSizes["off"];
        };

        this.isAbove = function (i){
            var node = this.getIM(i);
            return node.y + node.height + this.sman.getSY() < this.visibleArea.y;
        };

        this.findOpened = function (item){
            var parent = this.model.getParent(item);
            return (parent == null || this.isOpen_(parent)) ? item : this.findOpened(parent);
        };

        this.findNext = function (item){
            if(item != null){
                if(this.model.hasChildren(item) && this.isOpen_(item) && this.model.getChildrenCount(item) > 0){
                    return this.model.getChildAt(item, 0);
                }
                var parent = null;
                while((parent = this.model.getParent(item)) != null){
                    var index = this.model.getChildIndex(item);
                    if(index + 1 < this.model.getChildrenCount(parent)) return this.model.getChildAt(parent, index + 1);
                    item = parent;
                }
            }
            return null;
        };

        this.findPrev = function (item){
            if(item != null){
                var parent = this.model.getParent(item);
                if(parent != null){
                    var index = this.model.getChildIndex(item);
                    return (index - 1 >= 0) ? this.findLast(this.model.getChildAt(parent, index - 1)) : parent;
                }
            }
            return null;
        };

        this.findLast = function (item){
            return this.isOpen_(item) && this.model.getChildrenCount(item) > 0 ? this.findLast(this.model.getChildAt(item, this.model.getChildrenCount(item) - 1))
                                                                               : item;
        };

        this.prevVisible = function (item){
            if(item == null || this.isAbove(item)) return this.nextVisible(item);
            var parent = null;
            while((parent = this.model.getParent(item)) != null){
                for(var i = this.model.getChildIndex(item) - 1;i >= 0; i-- ){
                    var child = this.model.getChildAt(parent, i);
                    if (this.isAbove(child)) return this.nextVisible(child);
                }
                item = parent;
            }
            return item;
        };

        this.isVerVisible = function (item){
            if(this.visibleArea == null) return false;
            var node = this.getIM(item), yy1 = node.y + this.sman.getSY(), yy2 = yy1 + node.height - 1,
                by = this.visibleArea.y + this.visibleArea.height;

            return ((this.visibleArea.y <= yy1 && yy1 < by) ||
                    (this.visibleArea.y <= yy2 && yy2 < by) ||
                    (this.visibleArea.y > yy1 && yy2 >= by)    );
        };

        this.nextVisible = function (item){
            if (item == null || this.isVerVisible(item)) return item;
            var res = this.nextVisibleInBranch(item), parent = null;
            if(res != null) return res;
            while((parent = this.model.getParent(item)) != null){
                var count = this.model.getChildrenCount(parent);
                for(var i = this.model.getChildIndex(item) + 1;i < count; i ++ ){
                    res = this.nextVisibleInBranch(this.model.getChildAt(parent, i));
                    if(res != null) return res;
                }
                item = parent;
            }
            return null;
        };

        this.nextVisibleInBranch = function (item){
            if(this.isVerVisible(item)) return item;
            if(this.isOpen_(item)){
                for(var i = 0;i < this.model.getChildrenCount(item); i++){
                    var res = this.nextVisibleInBranch(this.model.getChildAt(item, i));
                    if(res != null) return res;
                }
            }
            return null;
        };

        this.paintTree = function (g,item){
            this.paintBranch(g, item);
            var parent = null;
            while((parent = this.model.getParent(item)) != null){
                this.paintChild(g, parent, this.model.getChildIndex(item) + 1);
                item = parent;
            }
        };

        this.paintBranch = function (g, root){
            if(root == null) return false;
            var node = this.getIM(root), dx = this.sman.getSX(), dy = this.sman.getSY(), va = this.visibleArea;
            if (zebra.util.isIntersect(node.x + dx, node.y + dy, node.width, node.height,
                                       va.x, va.y, va.width, va.height))
            {
                var toggle = this.getToggleBounds(root), toggleView = this.getToggleView(root);
                if(toggleView != null) {
                    toggleView.paint(g, toggle.x, toggle.y, toggle.width, toggle.height, this);
                }

                var image = this.getImageBounds(root);
                if(image.width > 0) this.getImageView(root).paint(g, image.x, image.y, image.width, image.height, this);

                var vx = image.x + image.width + (image.width > 0 || toggle.width > 0 ? this.gapx : 0),
                    vy = node.y + ~~((node.height - node.viewHeight) / 2);

                if(this.selected == root && root != this.editedItem){
                    var selectView = this.views[this.hasFocus()?"aselect":"iselect"];
                    if(selectView != null) selectView.paint(g, vx, vy, node.viewWidth, node.viewHeight, this);
                }

                if(root != this.editedItem){
                    var vvv = this.provider.getView(this, root), vvvps = vvv.getPreferredSize();
                    vvv.paint(g, vx + this.itemGapX, vy + this.itemGapY, vvvps.width, vvvps.height, this);
                }

                if(this.lnColor != null){
                    g.setColor(this.lnColor);
                    var x1 = toggle.x + (toggleView == null ? ~~(toggle.width / 2) + 1 : toggle.width),
                        yy = toggle.y + ~~(toggle.height / 2) + 0.5;

                    g.beginPath();
                    g.moveTo(x1-1, yy);
                    g.lineTo(image.x, yy);
                    g.stroke();
                }
            }
            else{
                if(node.y + dy > this.visibleArea.y + this.visibleArea.height ||
                   node.x + dx > this.visibleArea.x + this.visibleArea.width)
                {
                    return false;
                }
            }
            return this.paintChild(g, root, 0);
        };

        this.y_ = function (item,isStart){
            var ty = this.getToggleY(item), th = this.getToggleSize(item).height, dy = this.sman.getSY(),
                y = (this.model.hasChildren(item)) ? (isStart ? ty + th : ty - 1) : ty + ~~(th / 2);
            if (y + dy < 0) y = -dy - 1;
            else if (y + dy > this.height) y = this.height - dy;
            return y;
        };

        this.paintChild = function (g,root,index){
            var b = this.isOpen_(root), vs = this.viewSizes;
            if(root == this.firstVisible && this.lnColor != null){
                g.setColor(this.lnColor);
                var y1 = this.getTop(), y2 = this.y_(root, false),
                    xx = this.getIM(root).x + ~~((b ? vs["on"].width
                                                    : vs["off"].width) / 2);
                g.beginPath();
                g.moveTo(xx + 0.5, y1);
                g.lineTo(xx + 0.5, y2);
                g.stroke();
            }
            if(b && this.model.getChildrenCount(root) > 0){
                var firstChild = this.model.getChildAt(root, 0);
                if(firstChild == null) return true;
                var x = this.getIM(firstChild).x + ~~((this.isOpen_(firstChild) ? vs["on"].width
                                                                                : vs["off"].width) / 2);
                var count = this.model.getChildrenCount(root);
                if(index < count){
                    var y = (index > 0) ? this.y_(this.model.getChildAt(root, index - 1), true)
                                        : this.getImageY(root) + this.getImageSize(root).height;
                    for(var i = index;i < count; i ++ ){
                        var child = this.model.getChildAt(root, i);
                        if(this.lnColor != null){
                            g.setColor(this.lnColor);
                            g.beginPath();
                            g.moveTo(x+0.5, y);
                            g.lineTo(x+0.5, this.y_(child, false));
                            g.stroke();
                            y = this.y_(child, true);
                        }
                        if (!this.paintBranch(g, child)){
                            if(this.lnColor != null && i + 1 != count){
                                g.setColor(this.lnColor);
                                g.beginPath();
                                g.moveTo(x + 0.5, y);
                                g.lineTo(x + 0.5, this.height - this.sman.getSY());
                                g.stroke();
                            }
                            return false;
                        }
                    }
                }
            }
            return true;
        };

        this.nextPage = function (item,dir){
            var sum = 0, prev = item;
            while(item != null && sum < this.visibleArea.height){
                sum += (this.getIM(item).height + this.gapy);
                prev = item;
                item = dir < 0 ? this.findPrev(item) : this.findNext(item);
            }
            return prev;
        };

        this.se = function (item,e){
            if(item != null){
                this.stopEditing(true);
                if(this.editors != null && this.editors.shouldStartEdit(item, e)){
                    this.startEditing(item);
                    return true;
                }
            }
            return false;
        };

        this.getScrollManager = function(){ return this.sman; };

        this.paint = function(g){
            if(this.model != null){
                this.vVisibility();
                if(this.firstVisible != null){
                    var sx = this.sman.getSX(), sy = this.sman.getSY();
                    try{
                        g.translate(sx, sy);
                        this.paintTree(g, this.firstVisible);
                    }
                    finally{
                        g.translate(-sx,  -sy);
                    }
                }
            }
        };
    },

    function () { this.$this(null); },
    function (d){ this.$this(d, true);},

    function (d,b){
        this.provider = this.selected = this.firstVisible = this.editedItem = this.pressedItem = null;
        this.maxw = this.maxh = this.itemGapY = 0;
        this.itemGapX = 3;
        this.visibleArea = this.lnColor = this.editors = null;

        this.views     = {};
        this.viewSizes = {};

        this._isVal = false;
        this.nodes = {};
        this._ = new zebra.util.MListeners("toggled", "selected");
        this.setLineColor(rgb.gray);

        this.isOpenVal = b;
        this.setModel(d);

        this.setViewProvider(new zebra.Dummy([
            function $prototype() {
                this.getView = function (d,obj){
                    this.defaultRender.target.setText(obj.repr);
                    return this.defaultRender;
                };
            },

            function() {
                this.defaultRender = new ui.TextRender("");
                this.defaultRender.setFont(pkg.Tree.font);
                this.defaultRender.setForeground(pkg.Tree.fontColor);
            }
        ]));

        this.setSelectable(true);
        this.$super();
        this.sman = new ui.ScrollManager(this);
    },

    function focusGained(e){ this.focusStateUpdated(); },
    function focusLost(e)  { this.focusStateUpdated(); },

    function setEditorProvider(p){
        if(p != this.editors){
            this.stopEditing(false);
            this.editors = p;
        }
    },

    function startEditing(item){
        this.stopEditing(true);
        if(this.editors != null){
            var editor = this.editors.getEditor(this, item);
            if(editor != null){
                this.editedItem = item;
                var b = this.getViewBounds(this.editedItem), ps = editor.getPreferredSize();
                editor.setLocation(b.x + this.sman.getSX(),
                                   b.y - ~~((ps.height - b.height) / 2)+ this.sman.getSY());
                editor.setSize(ps.width, ps.height);
                this.add(editor);
                ui.focusManager.requestFocus(editor);
            }
        }
    },

    function stopEditing(applyData){
        if(this.editors != null && this.editedItem != null){
            try{
                if(applyData)  {
                    this.model.set(this.editedItem, this.editors.fetchEditedValue(this.editedItem, this.kids[0]));
                }
            }
            finally{
                this.editedItem = null;
                this.removeAt(0);
                this.requestFocus();
            }
        }
    },

    function setSelectable(b){
        if(this.isSelectable != b){
            if (b === false && this.selected != null) this.select(null);
            this.isSelectable = b;
            this.repaint();
        }
    },

    function setLineColor(c){
        this.lnColor = c;
        this.repaint();
    },

    function setGaps(gx,gy){
        if((gx >= 0 && gx != this.gapx) || (gy >= 0 && gy != this.gapy)){
            this.gapx = gx < 0 ? this.gapx : gx;
            this.gapy = gy < 0 ? this.gapy : gy;
            this.vrp();
        }
    },

    function setViewProvider(p){
        if(p == null) p = this;
        if(this.provider != p){
            this.stopEditing(false);
            this.provider = p;
            delete this.nodes;
            this.nodes = {};
            this.repaint();
        }
    },

    function setViews(v){
        for(var k in v) {
            if (v.hasOwnProperty(k)) {
                var vv = v[k];
                this.views[k] = vv;
                if (k != "aselect" && k != "iselect"){
                    this.stopEditing(false);
                    this.viewSizes[k] = (vv == null) ? { width:0, height:0 }
                                                     : vv.getPreferredSize();
                    this.vrp();
                }
            }
        }
    },

    function setModel(d){
        if(this.model != d){
            this.stopEditing(false);
            this.select(null);
            if(this.model != null && this.model._) this.model._.remove(this);
            this.model = d;
            if(this.model != null && this.model._) this.model._.add(this);
            this.firstVisible = null;
            this.vrp();
        }
    },

    function mouseClicked(e){
        if (this.se(this.pressedItem, e)) this.pressedItem = null;
        else
            if(this.selected != null && e.clicks > 1 && e.isActionMask() &&
               this.getItemAt(this.firstVisible, e.x, e.y) == this.selected)
            {
                this.toggle(this.selected);
            }
    },

    function mouseReleased(e){ if (this.se(this.pressedItem, e)) this.pressedItem = null; },

    function keyTyped(e){
        if(this.selected != null){
            switch(e.ch) {
                case '+': if( !this.isOpen(this.selected)) this.toggle(this.selected);break;
                case '-': if(this.isOpen(this.selected)) this.toggle(this.selected);break;
            }
        }
    },

    function keyPressed(e){
        var newSelection = null;
        switch(e.code) {
            case KE.VK_DOWN:
            case KE.VK_RIGHT: newSelection = this.findNext(this.selected);break;
            case KE.VK_UP:
            case KE.VK_LEFT: newSelection = this.findPrev(this.selected);break;
            case KE.VK_HOME: if(e.isControlPressed()) this.select(this.model.root);break;
            case KE.VK_END:  if(e.isControlPressed()) this.select(this.findLast(this.model.root));break;
            case KE.VK_PAGE_DOWN: if(this.selected != null) this.select(this.nextPage(this.selected, 1));break;
            case KE.VK_PAGE_UP: if(this.selected != null) this.select(this.nextPage(this.selected,  - 1));break;
            //!!!!case KE.VK_ENTER: if(this.selected != null) this.toggle(this.selected);break;
        }
        if(newSelection != null) this.select(newSelection);
        this.se(this.selected, e);
    },

    function mousePressed(e){
        this.pressedItem = null;
        this.stopEditing(true);
        if(this.firstVisible != null && e.isActionMask()){
            var x = e.x, y = e.y, root = this.getItemAt(this.firstVisible, x, y);
            if(root != null){
                x -= this.sman.getSX();
                y -= this.sman.getSY();
                var r = this.getToggleBounds(root);

                if (x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height){
                    if (this.model.hasChildren(root)) this.toggle(root);
                }
                else {
                    if(x > r.x + r.width) this.select(root);
                    if( !this.se(root, e)) this.pressedItem = root;
                }
            }
        }
    },

    function toggleAll(root,b){
        var model = this.model;
        if(model.hasChildren(root)){
            if(this.getItemMetrics(root).isOpen != b) this.toggle(root);
            for(var i = 0;i < model.getChildrenCount(root); i++ ){
                this.toggleAll(model.getChildAt(root, i), b);
            }
        }
    },

    function toggle(item){
        if(this.model.hasChildren(item)){
            this.stopEditing(true);
            this.validate();
            var node = this.getIM(item);
            node.isOpen = (node.isOpen ? false : true);
            this.invalidate();
            this._.toggled(this, item);
            if( !node.isOpen && this.selected != null){
                var parent = this.selected;
                do {
                    parent = this.model.getParent(parent);
                }
                while(parent != item && parent != null);
                if(parent == item) this.select(item);
            }
            this.repaint();
        }
    },

    function select(item){
        if(this.isSelectable && item != this.selected){
            var old = this.selected, m = null;
            this.selected = item;
            if(this.selected != null) this.makeVisible(this.selected);
            this._.selected(this, this.selected);

            if(old != null && this.isVerVisible(old)){
                m = this.getItemMetrics(old);
                this.repaint(m.x + this.sman.getSX(), m.y + this.sman.getSY(), m.width, m.height);
            }
            if(this.selected != null && this.isVerVisible(this.selected)){
                m = this.getItemMetrics(this.selected);
                this.repaint(m.x + this.sman.getSX(), m.y + this.sman.getSY(), m.width, m.height);
            }
        }
    },

    function makeVisible(item){
        this.validate();
        var r = this.getViewBounds(item);
        this.sman.makeVisible(r.x, r.y, r.width, r.height);
    },

    function itemInserted(target,item){
        this.stopEditing(false);
        this.vrp();
    },

    function itemMoved(target,item,parent){
        this.firstVisible = null;
        this.stopEditing(false);
        this.vrp();
    },

    function itemRemoved(target,item){
        if(item == this.firstVisible) this.firstVisible = null;
        this.stopEditing(false);
        if(item == this.selected) this.select(null);
        delete this.nodes[item];
        this.vrp();
    },

    function itemModified(target,item){
        var node = this.getIM(item);
        if(node != null) node.viewWidth = -1;
        this.vrp();
    },

    function invalidate(){
        if(this.isValid){
            this._isVal = false;
            this.$super(this.invalidate);
        }
    },

    function calcPreferredSize(target){
        return this.model == null ? this.$super(this.calcPreferredSize,target)
                                  : { width:this.maxw, height:this.maxh };
    }
]);

})(zebra("ui.tree"), zebra.Class, zebra.ui);

(function(pkg, Class, ui) {

var ScrollListener = ui.ScrollListener, MouseEvent = ui.MouseEvent,
    FocusListener = ui.FocusListener, Matrix = zebra.data.Matrix, L = zebra.layout,
    ExternalEditor = ui.ExternalEditor, WinLayer = ui.WinLayer, MB = zebra.util, Cursor = ui.Cursor,
    Position = zebra.util.Position, KE = ui.KeyEvent, rgb = zebra.util.rgb, Listeners = zebra.util.Listeners;

function arr(l, v) {
    var a = Array(l);
    for(var i=0; i<l; i++) a[i] = v;
    return a;
}

pkg.START_EDITING  = 1;
pkg.FINISH_EDITING = 2;
pkg.CANCEL_EDITING = 3;

function CellsVisibility() {
    this.hasVisibleCells = function(){
        return this.fr != null && this.fc != null && this.lr != null && this.lc != null;
    };
    // first visible row (row and y), first visible col, last visible col and row
    this.fr = this.fc = this.lr = this.lc = null;
}

pkg.DefViews = Class([
    function (){
        this.defView = new ui.TextRender(new zebra.data.SingleLineTxt(""));
    },

    function $prototype() {
        this.getXAlignment = function(row,col){ return L.CENTER; },
        this.getYAlignment = function(row,col){ return L.CENTER; },
        this.getCellColor  = function(row,col){ return pkg.DefViews.cellBackground;},

        this.getView = function(row,col,obj){
            if (obj != null){
                if (obj && obj.paint) return obj;
                this.defView.target.setText(obj.toString());
                return this.defView;
            }
            return null;
        };
    }
]);

pkg.DefEditors = Class([
    function getEditor(t, row, col, o){
        if (this.editor == null) {
            this.editor = new ui.TextField("", 150);
            this.editor.setBorder(null);
        }

        this.editor.setText((o == null ? "" : o.toString()));
        this.editor.paddings(t.cellInsetsTop + t.lineSize, t.cellInsetsLeft,
                             t.cellInsetsBottom + t.lineSize, t.cellInsetsRight);
        return this.editor;
    },

    function fetchEditedValue(row,col,data,editor){ return editor.view.target.getText(); },

    function shouldDo(a,row,col,e){
        //!!! if (action == pkg.START_EDITING) return e.ID == MouseEvent.CLICKED && e.clicks == 1;
        // !!!else return (action == pkg.CANCEL_EDITING) ? e.ID == KE.PRESSED && KE.VK_ESCAPE == e.code: false;
        var b = (a == pkg.START_EDITING && e.ID == MouseEvent.CLICKED && e.clicks == 1) ||
                (a == pkg.CANCEL_EDITING && e.ID == KE.PRESSED && KE.VK_ESCAPE == e.code) ||
                (a == pkg.FINISH_EDITING && e.ID == KE.PRESSED && KE.VK_ENTER == e.code);
        return b;
    },

    function editingCanceled(row,col,data,editor) {}
]);

pkg.GridCaption = Class(ui.Panel, ui.MouseMotionListener, ui.MouseListener, ui.Cursorable, [
    function $prototype() {
        this.minSize = 10;
        this.activeAreaWidth = 4;
        this.isAutoFit = this.isResizable = true;

        this.getCursorType = function (target,x,y){
            return this.metrics != null && this.selectedColRow >= 0 && this.isResizable &&
                  !this.metrics.isUsePsMetric ? ((this.orient == L.HORIZONTAL) ? Cursor.W_RESIZE
                                                                               : Cursor.S_RESIZE)
                                              : -1;
        };

        this.mouseDragged = function(e){
            if(this.pxy != null){
                var b  = (this.orient == L.HORIZONTAL), m = this.metrics, rc = this.selectedColRow,
                    ns = (b ? m.getColWidth(rc) + e.x : m.getRowHeight(rc) + e.y) - this.pxy;

                if (ns > this.minSize) {
                    if (b) {
                        var pw = m.getColWidth(rc);
                        m.setColWidth (rc, ns);
                        this._.captionResized(this, rc, pw);
                    }
                    else  {
                        var ph = m.getRowHeight(rc);
                        m.setRowHeight(rc, ns);
                        this._.captionResized(this, rc, ph);
                    }
                    this.pxy = b ? e.x : e.y;
                }
            }
        };

        this.mouseMoved = function(e){ if (this.metrics != null) this.calcRowColAt(e.x, e.y); };

        this.calcRowColAt = function(x, y){
            var isHor = (this.orient == L.HORIZONTAL), cv = this.metrics.getCellsVisibility();

            if ((isHor && cv.fc != null) || (!isHor && cv.fr != null)){
                var m = this.metrics, g = m.lineSize, xy = isHor ? x : y,
                    xxyy = isHor ? cv.fc[1] - this.x + m.getXOrigin() - g
                                 : cv.fr[1] - this.y + m.getYOrigin() - g;

                for(var i = (isHor ? cv.fc[0] : cv.fr[0]);i <= (isHor ? cv.lc[0] : cv.lr[0]); i ++ )
                {
                    var wh = isHor ? m.getColWidth(i) : m.getRowHeight(i);
                    xxyy += (wh + g);
                    if(xy < xxyy + this.activeAreaWidth && xy > xxyy - this.activeAreaWidth){
                        this.selectedColRow = i;
                        this.selectedXY = xy - wh;
                        return ;
                    }
                }
            }
            this.selectedColRow = -1;
        };

        this.getTitleProps = function(i){
            return this.titles != null && i < this.titles.length / 2 ? this.titles[i*2 + 1] : null;
        };

        this.getTitleView = function(i){
            var data = this.getTitle(i);
            if (data == null || data.paint) return data;
            this.render.target.setText(data.toString());
            return this.render;
        };

        this.calcPreferredSize = function (l) { return { width:this.psW, height:this.psH }; };

        this.recalc = function(){
            this.psW = this.psH = 0;
            if(this.metrics != null){
                var m = this.metrics, isHor = (this.orient == L.HORIZONTAL), size = isHor ? m.getGridCols() : m.getGridRows();
                for(var i = 0;i < size; i++){
                    var v = this.getTitleView(i);
                    if(v != null){
                        var ps = v.getPreferredSize();
                        if(isHor){
                            if(ps.height > this.psH) this.psH = ps.height;
                            this.psW += ps.width;
                        }
                        else{
                            if(ps.width > this.psW) this.psW = ps.width;
                            this.psH += ps.height;
                        }
                    }
                }
                if(this.psH === 0) this.psH = pkg.Grid.DEF_ROWHEIGHT;
                if(this.psW === 0) this.psW = pkg.Grid.DEF_COLWIDTH;
                if(this.borderView != null){
                    this.psW += (this.borderView.getLeft() + this.borderView.getRight()) * (isHor ? size : 1);
                    this.psH += (this.borderView.getTop() + this.borderView.getBottom()) * (isHor ? 1 : size);
                }
            }
        };

    },

    function (){ this.$this(null, L.HORIZONTAL); },
    function (m){ this.$this(m, L.HORIZONTAL); },

    function (m,o){
        this._ = new zebra.util.MListeners("captionResized");

        this.pxy = this.titles = this.metrics = this.render = null;
        this.psW = this.psH = this.orient = this.selectedXY = 0;
        this.selectedColRow = -1;

        this.setup(m, o);
        this.render = new ui.TextRender("");
        this.render.setFont(pkg.GridCaption.font);
        this.render.setForeground(pkg.GridCaption.foreground);
        this.$super();
    },

    function setup(m,o){
        if(this.metrics != m || o != this.orient){
            if(o != L.HORIZONTAL && o != L.VERTICAL) throw new Error();
            this.metrics = m;
            this.orient = o;
            this.vrp();
        }
    },

    function setBorderView(v){
        if(v != this.borderView){
            this.borderView = v;
            this.vrp();
        }
    },

    function getTitle(rowcol){
        return this.titles == null || this.titles.length / 2 <= rowcol ? null
                                                                       : this.titles[rowcol*2];
    },

    function putTitle(rowcol,title){
        var old = this.getTitle(rowcol);
        if(old != title || (title != null && title.equals(old) === false))
        {
            if(this.titles == null) this.titles = arr((rowcol + 1) * 2, null);
            else {
                if(Math.floor(this.titles.length / 2) <= rowcol){
                    var nt = arr((rowcol + 1) * 2, null);
                    zebra.util.arraycopy(this.titles, 0, nt, 0, this.titles.length);
                    this.titles = nt;
                }
            }
            var index = rowcol * 2;
            this.titles[index] = title;
            if (title == null && index + 2 == this.titles.length) {
                var nt = arr(this.titles.length - 2, null);
                zebra.util.arraycopy(this.titles, 0, nt, 0, index);
                this.titles = nt;
            }
            this.vrp();
        }
    },

    function setTitleProps(rowcol,ax,ay,bg){
        var p = this.getTitleProps(rowcol);
        if(p == null) p = [];
        p[0] = ax;
        p[1] = ay;
        p[2] = bg == null ? 0 : bg.getRGB();
        this.titles[rowcol*2 + 1] = p;
        this.repaint();
    },

    function startDragged(e){
        if(this.metrics != null && this.isResizable && !this.metrics.isUsePsMetric){
            this.calcRowColAt(e.x, e.y);
            if(this.selectedColRow >= 0) this.pxy = (this.orient == L.HORIZONTAL) ? e.x : e.y;
        }
    },

    function endDragged(e){
        if (this.pxy != null) {
            this.pxy = null;
        }
        if (this.metrics != null) this.calcRowColAt(e.x, e.y);
    },

    function mouseClicked(e){
        if (this.pxy == null && this.metrics != null){
            if(e.clicks > 1 && this.selectedColRow >= 0 && this.isAutoFit){
                var b = (this.orient == L.HORIZONTAL), add = 0, m = this.metrics, bv = this.borderView,
                    size = b ? m.getColPSWidth(this.selectedColRow) : m.getRowPSHeight(this.selectedColRow);

                if (bv != null) add = (b ? (bv.getLeft() + bv.getRight()) : (bv.getTop() + bv.getBottom()));

                var v = this.getTitleView(this.selectedColRow);
                if (v != null) size = Math.max(size, add + (b ? v.getPreferredSize().width : v.getPreferredSize().height));

                if (b) m.setColWidth(this.selectedColRow, size);
                else  m.setRowHeight(this.selectedColRow, size);
            }
        }
    },

    function paint(g){
        if(this.metrics != null){
            var m = this.metrics, cv = m.getCellsVisibility();
            if(cv.hasVisibleCells() === false) return;

            var isHor = (this.orient == L.HORIZONTAL), gap = m.lineSize, top = 0, left = 0, bottom = 0, right = 0;
            if(this.borderView != null){
                top    = this.borderView.getTop();
                left   = this.borderView.getLeft();
                bottom = this.borderView.getBottom();
                right  = this.borderView.getRight();
            }

            var x = isHor ? cv.fc[1] - this.x + m.getXOrigin() - gap : this.getLeft(),
                y = isHor ? this.getTop() : cv.fr[1] - this.y + m.getYOrigin() - gap,
                size = isHor ? m.getGridCols() : m.getGridRows(),
                ts = g.getTopStack(), cx = ts.x, cy = ts.y, cw = ts.width, ch = ts.height;

            for(var i = (isHor ? cv.fc[0] : cv.fr[0]);i <= (isHor ? cv.lc[0] : cv.lr[0]); i ++ )
            {
                var wh1 = isHor ? m.getColWidth(i) + gap + (((size - 1) == i) ? gap : 0) : this.psW,
                    wh2 = isHor ? this.psH : m.getRowHeight(i) + gap + (((size - 1) == i) ? gap : 0),
                    v = this.getTitleView(i);

                if (v != null) {
                    var props = this.getTitleProps(i), ps = v.getPreferredSize();
                    if(props != null && props[2] != 0){
                        g.setColor(new rgb(props[2]));
                        g.fillRect(x, y, wh1 - 1, wh2 - 1);
                    }

                    g.save();
                    g.clipRect(x, y, wh1, wh2);

                    var vx = x + L.getXLoc(ps.width, props != null ? props[0] : L.CENTER, wh1 - left - right) + left,
                        vy = y + L.getYLoc(ps.height, props != null ? props[1] : L.CENTER, wh2 - top - bottom) + top;

                    v.paint(g, vx, vy, ps.width, ps.height, this);
                    g.restore();
                }
                if (this.borderView != null) this.borderView.paint(g, x, y, wh1, wh2, this);

                if (isHor) x += wh1;
                else       y += wh2;
            }
        }
    },

    function getCaptionAt(x,y){
        if(this.metrics != null && x >= 0 && y >= 0 && x < this.width && y < this.height){
            var m = this.metrics, cv = m.getCellsVisibility(), isHor = (this.orient == L.HORIZONTAL);
            if((isHor && cv.fc != null) || ( !isHor && cv.fr != null)){
                var gap = m.lineSize, xy = isHor ? x : y,
                    xxyy = isHor ? cv.fc[1] - this.x - gap + m.getXOrigin() : cv.fr[1] - this.y - gap + m.getYOrigin();

                for(var i = (isHor ? cv.fc[0] : cv.fr[0]);i <= (isHor ? cv.lc[0] : cv.lr[0]); i ++ ){
                    var wh = isHor ? m.getColWidth(i) : m.getRowHeight(i);
                    if(xy > xxyy && xy < xxyy + wh) return i;
                    xxyy += wh + gap;
                }
            }
        }
        return -1;
    }
]);

pkg.Grid = Class(ui.Panel, ui.MouseListener, ui.KeyListener, Position.PositionMetric,
                 ui.ChildrenListener, ui.WinListener, ScrollListener, FocusListener, [
        function $clazz() {
            this.DEF_COLWIDTH  = 80;
            this.DEF_ROWHEIGHT = 20;
        },

        function $prototype() {
            this.lineSize = this.cellInsetsTop = this.cellInsetsBottom = 1;
            this.cellInsetsLeft = this.cellInsetsRight = 2;
            this.drawVerLines = this.drawHorLines = true;
            this.lineColor = rgb.gray;
            this.isUsePsMetric = false;

            this.getColX_ = function (col){
                var start = 0, d = 1, x = this.getLeft() + this.getLeftCaptionWidth() + this.lineSize, v = this.visibility;
                if(v.hasVisibleCells()){
                    start = v.fc[0];
                    x = v.fc[1];
                    d = (col > v.fc[0]) ? 1 :  - 1;
                }
                for(var i = start;i != col; x += ((this.colWidths[i] + this.lineSize) * d),i += d);
                return x;
            };

            this.getRowY_ = function (row){
                var start = 0, d = 1, y = this.getTop() + this.getTopCaptionHeight() + this.lineSize, v = this.visibility;
                if(v.hasVisibleCells()){
                    start = v.fr[0];
                    y = v.fr[1];
                    d = (row > v.fr[0]) ? 1 :  - 1;
                }
                for(var i = start;i != row; y += ((this.rowHeights[i] + this.lineSize) * d),i += d);
                return y;
            };

            this.rPs = function(){
                var cols = this.getGridCols(), rows = this.getGridRows();
                this.psWidth_ = this.lineSize * (cols + 1);
                this.psHeight_ = this.lineSize * (rows + 1);
                for(var i = 0;i < cols; i ++ ) this.psWidth_ += this.colWidths[i];
                for(var i = 0;i < rows; i ++ ) this.psHeight_ += this.rowHeights[i];
            };

            this.colVisibility = function(col,x,d,b){
                var cols = this.getGridCols();
                if(cols === 0) return null;
                var left = this.getLeft(), right = this.getRight(), dx = this.sman.getSX(),
                    xx1 = Math.min(this.visibleArea.x + this.visibleArea.width, this.width - right),
                    xx2 = Math.max(left, this.visibleArea.x + this.getLeftCaptionWidth());

                for(; col < cols && col >= 0; col += d){
                    if(x + dx < xx1 && (x + this.colWidths[col] + dx) > xx2){
                        if(b) return [col, x];
                    }
                    else{
                        if(b === false) return this.colVisibility(col, x, (d > 0 ?  -1 : 1), true);
                    }
                    if(d < 0){
                        if(col > 0) x -= (this.colWidths[col - 1] + this.lineSize);
                    }
                    else{
                        if(col < cols - 1) x += (this.colWidths[col] + this.lineSize);
                    }
                }
                return b ? null : ((d > 0) ? [col -1, x] : [0, left + this.getLeftCaptionWidth() + this.lineSize]);
            };

            this.rowVisibility = function(row,y,d,b){
                var rows = this.getGridRows();

                if(rows === 0) return null;
                var top = this.getTop(), bottom = this.getBottom(), dy = this.sman.getSY(),
                    yy1 = Math.min(this.visibleArea.y + this.visibleArea.height, this.height - bottom),
                    yy2 = Math.max(this.visibleArea.y, top + this.getTopCaptionHeight());

                for(; row < rows && row >= 0; row += d){
                    if(y + dy < yy1 && (y + this.rowHeights[row] + dy) > yy2){
                        if(b) return [row, y];
                    }
                    else{
                        if(b === false) return this.rowVisibility(row, y, (d > 0 ?  -1 : 1), true);
                    }
                    if(d < 0){
                        if(row > 0) y -= (this.rowHeights[row - 1] + this.lineSize);
                    }
                    else{
                        if(row < rows - 1) y += (this.rowHeights[row] + this.lineSize);
                    }
                }
                return b ? null : ((d > 0) ? [row - 1, y] : [0, top + this.getTopCaptionHeight() + this.lineSize]);
            };

            this.vVisibility = function(){
                var va = ui.cvp(this, {});
                if(va == null){
                    this.visibleArea = null;
                    this.visibility.cancelVisibleCells();
                    return ;
                }
                else{
                    if (this.visibleArea == null           ||
                        va.x != this.visibleArea.x         ||
                        va.y != this.visibleArea.y         ||
                        va.width != this.visibleArea.width ||
                        va.height != this.visibleArea.height  )
                    {
                        this.iColVisibility(0);
                        this.iRowVisibility(0);
                        this.visibleArea = va;
                    }
                }

                var v = this.visibility, b = v.hasVisibleCells();
                if(this.colOffset != 100){
                    if(this.colOffset > 0 && b){
                        v.lc = this.colVisibility(v.lc[0], v.lc[1],  -1, true);
                        v.fc = this.colVisibility(v.lc[0], v.lc[1],  -1, false);
                    }
                    else
                        if(this.colOffset < 0 && b){
                            v.fc = this.colVisibility(v.fc[0], v.fc[1], 1, true);
                            v.lc = this.colVisibility(v.fc[0], v.fc[1], 1, false);
                        }
                        else{
                            v.fc = this.colVisibility(0, this.getLeft() + this.lineSize + this.getLeftCaptionWidth(), 1, true);
                            v.lc = (v.fc != null) ? this.colVisibility(v.fc[0], v.fc[1], 1, false) : null;
                        }
                    this.colOffset = 100;
                }

                if(this.rowOffset != 100){
                    if(this.rowOffset > 0 && b){
                        v.lr = this.rowVisibility(v.lr[0], v.lr[1],  -1, true);
                        v.fr = this.rowVisibility(v.lr[0], v.lr[1],  -1, false);
                    }
                    else {
                        if(this.rowOffset < 0 && b){
                            v.fr = this.rowVisibility(v.fr[0], v.fr[1], 1, true);
                            v.lr = (v.fr != null) ? this.rowVisibility(v.fr[0], v.fr[1], 1, false) : null;
                        }
                        else {
                            v.fr = this.rowVisibility(0, this.getTop() + this.getTopCaptionHeight() + this.lineSize, 1, true);
                            v.lr = (v.fr != null) ? this.rowVisibility(v.fr[0], v.fr[1], 1, false) : null;
                        }
                    }
                    this.rowOffset = 100;
                }
            };

            this.calcOrigin = function(off,y){
                var top = this.getTop() + this.getTopCaptionHeight(), left = this.getLeft() + this.getLeftCaptionWidth(),
                    o = ui.calcOrigin(this.getColX(0) - this.lineSize, y - this.lineSize, this.psWidth_,
                                      this.rowHeights[off] + 2 * this.lineSize, this.sman.getSX(), this.sman.getSY(),
                                      this, top, left, this.getBottom(), this.getRight());
                this.sman.scrollTo(o[0], o[1]);
            };

            this.$se = function(row,col,e){
                if(row >= 0){
                    this.stopEditing(true);
                    if(this.editors != null && this.editors.shouldDo(pkg.START_EDITING, row, col, e)) return this.startEditing(row, col);
                }
                return false;
            };

            this.getXOrigin =     function () { return this.sman.getSX(); };
            this.getYOrigin =     function () { return this.sman.getSY(); };
            this.getColPSWidth =  function (col){ return this.getPSSize(col, false); };
            this.getRowPSHeight = function (row){ return this.getPSSize(row, true); };

            this.recalc = function(){
                if(this.isUsePsMetric) this.rPsMetric();
                else this.rCustomMetric();
                this.rPs();
            };

            this.getGridRows = function (){ return this.model != null ? this.model.rows : 0; };
            this.getGridCols = function (){ return this.model != null ? this.model.cols : 0; };

            this.getRowHeight = function(row){
                this.validate();
                return this.rowHeights[row];
            };

            this.getColWidth = function(col){
                this.validate();
                return this.colWidths[col];
            };

            this.getCellsVisibility = function(){
                this.validate();
                return this.visibility;
            };

            this.getColX = function (col){
                this.validate();
                return this.getColX_(col);
            };

            this.getRowY = function (row){
                this.validate();
                return this.getRowY_(row);
            };

            this.childInputEvent = function(e){
                if (this.editingRow >= 0){
                    if(this.editors.shouldDo(pkg.CANCEL_EDITING, this.editingRow, this.editingCol, e)) this.stopEditing(false);
                    else
                        if(this.editors.shouldDo(pkg.FINISH_EDITING, this.editingRow, this.editingCol, e)) this.stopEditing(true);
                }
            };

            this.dataToPaint = function(row,col){ return this.model.get(row, col); };

            this.iColVisibility = function(off){
                this.colOffset = (this.colOffset == 100) ? this.colOffset = off : ((off != this.colOffset) ? 0 : this.colOffset);
            };

            this.iRowVisibility = function(off){
                this.rowOffset = (this.rowOffset == 100) ? off : (((off + this.rowOffset) === 0) ? 0 : this.rowOffset);
            };

            this.getTopCaptionHeight = function(){
                return (this.topCaption != null && this.topCaption.isVisible) ? this.topCaption.height : 0;
            };

            this.getLeftCaptionWidth = function(){
                return (this.leftCaption != null && this.leftCaption.isVisible) ? this.leftCaption.width : 0;
            };

            this.paint = function(g){
                this.vVisibility();
                if(this.visibility.hasVisibleCells()){
                    var sx = this.sman.getSX(), sy = this.sman.getSY(), cw = 0, ts = g.getTopStack();
                    try{
                        g.save();
                        g.translate(sx, sy);
                        this.paintSelection(g);
                        if(this.leftCaption != null || this.topCaption != null){
                            cw = ts.width;
                            var cx = ts.x, cy = ts.y, ch = ts.height, dx = this.sman.getSX(), dy = this.sman.getSY();
                            g.clipRect(this.leftCaption != null && this.leftCaption.isVisible ? this.leftCaption.x + this.leftCaption.width - dx
                                                                                    : cx,
                                        this.topCaption != null && this.topCaption.isVisible ? this.topCaption.y + this.topCaption.height - dy
                                                                                             : cy, this.width, this.height);
                        }
                        this.paintData(g);
                        this.paintNet(g);
                        this.paintMarker(g);
                    }
                    finally{
                        g.restore();
                    }
                }
            };

            this.scrolled = function (psx,psy){
                var x = this.sman.getSX(), y = this.sman.getSY(), offx = x - psx, offy = y - psy;
                if(offx !== 0) this.iColVisibility(offx > 0 ? 1 :  - 1);
                if(offy !== 0) this.iRowVisibility(offy > 0 ? 1 :  - 1);
                this.stopEditing(false);
                this.repaint();
            };

            this.isInvalidatedByChild = function (c){ return c != this.editor || this.isUsePsMetric; };

            this.stopEditing = function(applyData){
                if(this.editors != null && this.editingRow >= 0 && this.editingCol >= 0){
                    try{
                        if(zebra.instanceOf(this.editor, pkg.Grid)) this.editor.stopEditing(applyData);
                        var data = this.getDataToEdit(this.editingRow, this.editingCol);
                        if(applyData){
                            this.setEditedData(this.editingRow, this.editingCol, this.editors.fetchEditedValue(this.editingRow, this.editingCol, data, this.editor));
                        }
                        else this.editors.editingCanceled(this.editingRow, this.editingCol, data, this.editor);
                        this.repaintRows(this.editingRow, this.editingRow);
                    }
                    finally{
                        this.editingCol = this.editingRow =  -1;
                        if(this.indexOf(this.editor) >= 0) this.remove(this.editor);
                        this.editor = null;
                        this.requestFocus();
                    }
                }
            };
        },

        function (rows, cols){ this.$this(new Matrix(rows, cols)); },
        function (){ this.$this(new Matrix(5, 5)); },

        function (data){
            this.psWidth_ = this.psHeight_ = this.colOffset = this.rowOffset = this.pressedCol = this.selectedIndex = 0;
            this.visibleArea = this.selected = null;
            this.evStartRow = this.evLen = 0;

            this._ = new Listeners();
            this.views = {};

            this.editingRow = this.editingCol = this.pressedRow = -1;
            this.editors = this.leftCaption = this.topCaption = this.colWidths = this.rowHeights = null;
            this.model = this.provider = this.sman = this.position = this.editors = this.stub = null;
            this.visibility = new CellsVisibility();
            this.evState = false;

            this.$super();

            this.setModel(data);
            this.setViewProvider(new pkg.DefViews());
            this.setPosition(new Position(this));
            this.sman = new ui.ScrollManager(this);
        },

        function showTopHeader(titles) {
            return this.showHeader(L.TOP, titles);
        },

        function showLeftHeader() {
            return this.showHeader(L.LEFT, null);
        },

        function showHeader(constr, titles) {
            var cap = new pkg.GridCaption(this);
            this.add(constr, cap);
            if (titles != null) {
                for (var i = 0; i < titles.length; i++) cap.putTitle(i, titles[i]);
            }
            return cap;
        },

        function focusGained(e){ this.repaint(); },
        function focusLost(e){ this.repaint(); },
        function getScrollManager(){ return this.sman; },

        function enableMultiSelect(b){
            if(b != this.isMultiSelectEnabled()){
                this.selected = b ? arr(this.getGridRows(), false) : null;
                this.repaint();
            }
        },

        function isMultiSelectEnabled(){ return this.selected != null; },

        function clearSelect(){
            if(this.isMultiSelectEnabled()){
                for(var i = 0;i < this.selected.length; i++) this.selected[i] = 0;
                this._.fire(this, -1, 0, false);
                this.repaint();
            }
            else
                if(this.selectedIndex >= 0){
                    var prev = this.selectedIndex;
                    this.selectedIndex =  - 1;
                    this._.fire(this, -1, 0, false);
                    this.repaintRows(-1, prev);
                }
        },

        function select(row,b){
            if(this.isSelected(row) != b){
                if(this.isMultiSelectEnabled()){
                    this.selected[row] = b ? 1 : 0;
                    this._.fire(this, row, 1, b);
                    this.repaintRows(row, row);
                }
                else{
                    if(this.selectedIndex >= 0) this.clearSelect();
                    if (b) {
                        this.selectedIndex = row;
                        this._.fire(this, row, 1, b);
                    }
                }
            }
        },

        function isSelected(row){ return (this.selected == null) ? row == this.selectedIndex : this.selected[row] > 0; },
        function canHaveFocus(){ return this.editor == null; },

        function setEditorProvider(p){
            if(p != this.editors){
                this.stopEditing(true);
                this.editors = p;
            }
        },

        function drawLines(hor, ver){
            if (this.drawVerLines != hor || this.drawHorLines != ver) {
                this.drawHorLines = hor;
                this.drawVerLines = ver;
                this.repaint();
            }
        },

        function usePsMetric(b){
            if(this.isUsePsMetric != b){
                this.isUsePsMetric = b;
                this.vrp();
            }
        },

        function setPosition(p){
            if(this.position != p){
                if(this.position != null)this.position._.remove(this);
                this.position = p;
                if(this.position != null){
                    this.position._.add(this);
                    this.position.setPositionMetric(this);
                }
                this.repaint();
            }
        },

        function setViewProvider(p){
            if(this.provider != p){
                this.provider = p;
                this.vrp();
            }
        },

        function setModel(d){
            if(d != this.model){
                this.clearSelect();
                if(this.model != null && this.model._) this.model._.remove(this);
                this.model = d;
                if (this.model != null && this.model._) this.model._.add(this);
                if (this.position != null) this.position.clearPos();
                if (this.model != null && this.selected != null) this.selected = arr(this.model.rows, false);
                this.vrp();
            }
        },

        function setCellInsets(t,l,b,r){
            var nt = (t < 0) ? this.cellInsetsTop : t, nl = (l < 0) ? this.cellInsetsLeft : l,
                nb = (b < 0) ? this.cellInsetsBottom : b, nr = (r < 0) ? this.cellInsetsRight : r;

            if (nt != this.cellInsetsTop || nl != this.cellInsetsLeft ||
                nb != this.cellInsetsBottom || nr != this.cellInsetsRight)
            {
                this.cellInsetsTop = nt;
                this.cellInsetsLeft = nl;
                this.cellInsetsBottom = nb;
                this.cellInsetsRight = nr;
                this.vrp();
            }
        },

        function matrixResized(target,prevRows,prevCols){
            this.clearSelect();
            if (this.selected != null) this.selected = arr(this.model.rows, false);
            this.vrp();
            if (this.position != null) this.position.clearPos();
        },

        function cellModified(target,row,col,prevValue) {
            if (this.isUsePsMetric) this.invalidate();
        },

        function laidout(){ this.vVisibility(); },

        function invalidate(){
            this.$super();
            this.iColVisibility(0);
            this.iRowVisibility(0);
        },

        function setRowHeight(row,h){
            if(h < 0) throw new Error();

            if( !this.isUsePsMetric){
                this.validateMetric();
                if(this.rowHeights[row] != h){
                    this.stopEditing(false);
                    this.psHeight_ += (h - this.rowHeights[row]);
                    this.rowHeights[row] = h;
                    this.cachedHeight = this.getTop() + this.getBottom() + this.psHeight_ +
                                        ((this.topCaption != null && this.topCaption.isVisible) ? this.topCaption.getPreferredSize().height : 0);
                    if(this.parent != null) this.parent.invalidate();
                    this.iRowVisibility(0);
                    this.invalidateLayout();
                    this.repaint();
                }
            }
        },

        function setColWidth(col,w){
            if(w < 0) throw new Error();

            if( !this.isUsePsMetric){
                this.validateMetric();
                if(this.colWidths[col] != w){
                    this.stopEditing(false);
                    this.psWidth_ += (w - this.colWidths[col]);
                    this.colWidths[col] = w;
                    this.cachedWidth = this.getRight() + this.getLeft() +
                                       this.psWidth_ + ((this.leftCaption != null && this.leftCaption.isVisible) ? this.leftCaption.getPreferredSize().width : 0);
                    if(this.parent != null) this.parent.invalidate();
                    this.iColVisibility(0);
                    this.invalidateLayout();
                    this.repaint();
                }
            }
        },

        function mouseClicked(e) { if (this.$se(this.pressedRow, this.pressedCol, e)) this.pressedRow =  -1; },
        function mouseReleased(e){ if (this.$se(this.pressedRow, this.pressedCol, e)) this.pressedRow =  -1; },

        function setLineColor(c){
            if(c == null) throw new Error();

            if (c.equals(this.lineColor) === false){
                this.lineColor = c;
                if(this.drawVerLines || this.drawHorLines) this.repaint();
            }
        },

        function mousePressed(e){
            this.pressedRow =  -1;
            if(this.visibility.hasVisibleCells()){
                this.stopEditing(true);
                if(e.isActionMask()){
                    var p = this.cellByLocation(e.x, e.y);
                    if(p != null){
                        if(this.position != null){
                            var off = this.position.currentLine;
                            if(off == p[0]) this.calcOrigin(off, this.getRowY(off));
                            else{
                                if(!e.isControlPressed()) this.clearSelect();
                                this.position.setOffset(p[0]);
                            }
                        }

                        if(!this.$se(p[0], p[1], e)){
                            this.pressedRow = p[0];
                            this.pressedCol = p[1];
                        }
                    }
                }
            }
        },

        function getLines(){ return this.getGridRows(); },
        function getLineSize(line){ return 1; },
        function getMaxOffset(){ return this.getGridRows() - 1; },

        function posChanged(target,prevOffset,prevLine,prevCol){
            var off = this.position.currentLine;
            if(off >= 0) {
                this.calcOrigin(off, this.getRowY(off));
                this.select(off, true);
                this.repaintRows(prevOffset, off);
            }
        },

        function keyPressed(e){
            if(this.position != null){
                var cl = this.position.currentLine;
                switch(e.code)
                {
                    case KE.VK_LEFT: this.position.seek( - 1);break;
                    case KE.VK_UP: this.position.seekLineTo(Position.UP);break;
                    case KE.VK_RIGHT: this.position.seek(1);break;
                    case KE.VK_DOWN: this.position.seekLineTo(Position.DOWN);break;
                    case KE.VK_PAGE_UP: this.position.seekLineTo(Position.UP, this.pageSize(-1));break;
                    case KE.VK_PAGE_DOWN: this.position.seekLineTo(Position.DOWN, this.pageSize(1));break;
                    case KE.VK_END: if(e.isControlPressed()) this.position.setOffset(this.getLines() - 1);break;
                    case KE.VK_HOME: if(e.isControlPressed()) this.position.setOffset(0);break;
                }
                this.$se(this.position.currentLine, this.position.currentCol, e);
                if(cl != this.position.currentLine && cl >= 0){
                    for(var i = 0;i < this.getGridRows(); i++){
                        if(i != this.position.currentLine) this.select(i, false);
                    }
                }
            }
        },

        function doLayout(target){
            var topHeight = (this.topCaption != null && this.topCaption.isVisible) ? this.topCaption.getPreferredSize().height : 0,
                leftWidth = (this.leftCaption != null && this.leftCaption.isVisible) ? this.leftCaption.getPreferredSize().width : 0;

            if(this.stub != null && this.stub.isVisible){
                var stubPs = this.stub.getPreferredSize();
                leftWidth = Math.max(leftWidth, stubPs.width);
                topHeight = Math.max(topHeight, stubPs.height);
                this.stub.setSize(leftWidth, topHeight);
                this.stub.setLocation(this.getLeft(), this.getTop());
            }

            if(this.topCaption != null){
                this.topCaption.setLocation(this.getLeft() + leftWidth, this.getTop());
                this.topCaption.setSize(Math.min(target.width - this.getLeft() - this.getRight() - leftWidth, this.psWidth_), topHeight);
            }

            if(this.leftCaption != null){
                this.leftCaption.setLocation(this.getLeft(), this.getTop() + topHeight);
                this.leftCaption.setSize(leftWidth, Math.min(target.height - this.getTop() - this.getBottom() - topHeight, this.psHeight_));
            }

            if(this.editors != null && this.editor != null && this.editor.parent == this && this.editor.isVisible){
                var w = this.colWidths[this.editingCol], h = this.rowHeights[this.editingRow],
                    x = this.getColX_(this.editingCol), y = this.getRowY_(this.editingRow);

                if(this.isUsePsMetric){
                    x += this.cellInsetsLeft;
                    y += this.cellInsetsTop;
                    w -= (this.cellInsetsLeft + this.cellInsetsRight);
                    h -= (this.cellInsetsTop + this.cellInsetsBottom);
                }
                this.editor.setLocation(x + this.sman.getSX(), y + this.sman.getSY());
                this.editor.setSize(w, h);
            }
        },

        function kidAdded(index,id,lw){
            this.$super(index, id, lw);
            if(L.TOP == id){
                this.topCaption = lw;
                if (zebra.instanceOf(lw, pkg.GridCaption)) lw.setup(this, L.HORIZONTAL);
            }
            else
                if(L.TEMPORARY == id) this.editor = lw;
                else
                    if(L.LEFT == id){
                        this.leftCaption = lw;
                        if (zebra.instanceOf(lw, pkg.GridCaption)) lw.setup(this, L.VERTICAL);
                    }
                    else if (L.NONE === id) this.stub = lw;
        },

        function kidRemoved(index,lw){
            this.$super(index, lw);
            if(lw == this.editor) this.editor = null;
            else
                if(lw == this.topCaption){
                    if(zebra.instanceOf(lw, pkg.GridCaption)) lw.setup(null, L.HORIZONTAL);
                    this.topCaption = null;
                }
                else
                    if(lw == this.leftCaption){
                        if(zebra.instanceOf(lw, pkg.GridCaption)) lw.setup(null, L.VERTICAL);
                        this.leftCaption = null;
                    }
                    else if(lw == this.stub) this.stub = null;
        },

        function calcPreferredSize(target){
            return { width : this.psWidth_  + ((this.leftCaption != null && this.leftCaption.isVisible) ? this.leftCaption.getPreferredSize().width : 0),
                     height: this.psHeight_ + ((this.topCaption != null && this.topCaption.isVisible) ? this.topCaption.getPreferredSize().height : 0) };
        },

        function setLineSize(s){
            if(ns != this.lineSize){
                this.lineSize = s;
                this.vrp();
            }
        },

        function startEditing(row,col){
            this.stopEditing(true);
            if(this.editors != null){
                var editor = this.editors.getEditor(this, row, col, this.getDataToEdit(row, col));
                if(editor != null){
                    this.editingRow = row;
                    this.editingCol = col;
                    if(this.isExternatEditor(row, col, editor)){
                        var p = L.getAbsLocation(this.getColX(col) + this.sman.getSX(), this.getRowY(row) + this.sman.getSY(), this);
                        editor.setLocation(p[0], p[1]);
                        ui.makeFullyVisible(ui.getDesktop(this), editor);
                        this.editor = editor;
                        ui.getDesktop(this).getLayer(WinLayer.ID).addWin(WinLayer.MODAL, editor, this);
                    }
                    else{
                        this.add(L.TEMPORARY, editor);
                        this.repaintRows(this.editingRow, this.editingRow);
                    }
                    ui.focusManager.requestFocus(editor);
                    return true;
                }
            }
            return false;
        },

        function getEditingCell(){
            return (this.editingRow >= 0 && this.editingCol >= 0) ? [this.editingRow, this.editingCol] : null;
        },

        function winOpened(winLayer,target,b){
            if(this.editor == target &&  !b) this.stopEditing(this.editor.isAccepted());
        },

        function winActivated(winLayer,target,b){},

        function getDataToEdit(row,col){ return this.model.get(row, col); },
        function setEditedData(row,col,value){ this.model.put(row, col, value); },

        function paintNet(g){
            var v = this.visibility, topX = v.fc[1] - this.lineSize, topY = v.fr[1] - this.lineSize,
                botX = v.lc[1] + this.colWidths[v.lc[0]], botY = v.lr[1] + this.rowHeights[v.lr[0]];
            g.setColor(this.lineColor);
            if(this.drawHorLines){
                var y = topY;
                for(var i = v.fr[0];i <= v.lr[0]; i ++ ){
                    g.drawLine(topX, y, botX, y);
                    y += this.rowHeights[i] + this.lineSize;
                }
                g.drawLine(topX, y, botX, y);
            }
            if(this.drawVerLines){
                for(var i = v.fc[0];i <= v.lc[0]; i ++ ){
                    g.drawLine(topX, topY, topX, botY);
                    topX += this.colWidths[i] + this.lineSize;
                }
                g.drawLine(topX, topY, topX, botY);
            }
        },

        function paintData(g){
            var y = this.visibility.fr[1] + this.cellInsetsTop, addW = this.cellInsetsLeft + this.cellInsetsRight,
                addH = this.cellInsetsTop + this.cellInsetsBottom, ts = g.getTopStack(), cx = ts.x, cy = ts.y,
                cw = ts.width, ch = ts.height, res = {};

            //!!!!
            //var desk = zebra.ui.getDesktop(this);
            // var can  = document.createElement("canvas")
            // var gg   = can.getContext("2d"), ggg = g, g = gg;
            // gg.init();
            // can.width  = this.visibility.lc[1] - this.visibility.fc[1];
            // can.height = this.visibility.lr[1] - y;
            // gg.fillStyle = "red";
            // gg.fillRect(0, 0, can.width, can.height);

            for(var i = this.visibility.fr[0];i <= this.visibility.lr[0] && y < cy + ch; i++){
                if(y + this.rowHeights[i] > cy){
                    var x = this.visibility.fc[1] + this.cellInsetsLeft, notSelectedRow = !this.isSelected(i);

                    for(var j = this.visibility.fc[0];j <= this.visibility.lc[0]; j ++ ){
                        if(notSelectedRow){
                            var bg = this.provider.getCellColor(i, j);
                            if(bg != null){
                                g.setColor(bg);
                                g.fillRect(x - this.cellInsetsLeft, y - this.cellInsetsTop, this.colWidths[j], this.rowHeights[i]);
                            }
                        }

                        var v = (i == this.editingRow && j == this.editingCol) ? null
                                                                               : this.provider.getView(i, j, this.dataToPaint(i, j));
                        if(v != null){
                            var w = this.colWidths[j] - addW, h = this.rowHeights[i] - addH;
                            MB.intersection(x, y, w, h, cx, cy, cw, ch, res);
                            if(res.width > 0 && res.height > 0) {
                                if(this.isUsePsMetric) v.paint(g, x, y, w, h, this);
                                else{
                                    var ax = this.provider.getXAlignment(i, j), ay = this.provider.getYAlignment(i, j),
                                        vw = w, vh = h, xx = x, yy = y, ps = (ax != L.NONE || ay != L.NONE) ? v.getPreferredSize()
                                                                                                            : null;
                                    if(ax != L.NONE){
                                        xx = x + L.getXLoc(ps.width, ax, w);
                                        vw = ps.width;
                                    }

                                    if(ay != L.NONE){
                                        yy = y + L.getYLoc(ps.height, ay, h);
                                        vh = ps.height;
                                    }

                                    var id = -1;
                                    if (xx < res.x || yy < res.y || (xx + vw) > (x + w) ||  (yy + vh) > (y + h)) {
                                        id = g.save();
                                        g.clipRect(res.x, res.y, res.width, res.height);
                                    }

                                    v.paint(g, xx, yy, vw, vh, this);

                                    if (id >= 0) {
                                       g.restore();
                                    }
                                 }
                            }
                        }
                        x += (this.colWidths[j] + this.lineSize);
                    }
                }
                y += (this.rowHeights[i] + this.lineSize);
            }
        },

        function paintMarker(g){
            var markerView = this.views["marker"];
            if (markerView != null && this.position != null && this.position.offset >= 0 && this.hasFocus()){
                var offset = this.position.offset, v = this.visibility;
                if(offset >= v.fr[0] && offset <= v.lr[0]){
                    g.clipRect(this.getLeftCaptionWidth() - this.sman.getSX(),
                               this.getTopCaptionHeight() - this.sman.getSY(), this.width, this.height);

                    markerView.paint(g, v.fc[1], this.getRowY(offset),
                                    v.lc[1] - v.fc[1] + this.getColWidth(v.lc[0]),
                                    this.rowHeights[offset], this);
                }
            }
        },

        function paintSelection(g){
            var ts = g.getTopStack(), cx = ts.x, cy = ts.y, cw = ts.width, ch = ts.height;
            try{
                g.clipRect(this.getLeftCaptionWidth() - this.sman.getSX(),
                           this.getTopCaptionHeight() - this.sman.getSY(), this.width, this.height);
                var v = this.views[this.hasFocus()?"onselection":"offselection"];
                for(var j = this.visibility.fr[0];j <= this.visibility.lr[0]; j ++ ){
                    if(this.isSelected(j)){
                        var x = this.visibility.fc[1], y = this.getRowY(j), h = this.rowHeights[j];
                        for(var i = this.visibility.fc[0];i <= this.visibility.lc[0]; i ++ ){
                            if(i != this.editingCol || this.editingRow != j) v.paint(g, x, y, this.colWidths[i], h, this);
                            x += this.colWidths[i] + this.lineSize;
                        }
                    }
                }
            }
            finally { /*!!!! if (cw > 0 && ch > 0) g.setClip(cx, cy, cw, ch);*/ }
        },

        function repaintRows(r1,r2){
            if(r1 < 0) r1 = r2;
            if(r2 < 0) r2 = r1;
            if(r1 > r2){
                var i = r2;
                r2 = r1;
                r1 = i;
            }
            var rows = this.getGridRows();
            if(r1 < rows){
                if(r2 >= rows) r2 = rows - 1;
                var y1 = this.getRowY(r1), y2 = ((r1 == r2) ? y1 : this.getRowY(r2)) + this.rowHeights[r2];
                this.repaint(0, y1 + this.sman.getSY(), this.width, y2 - y1);
            }
        },

        function cellByLocation(x,y){
            this.validate();
            var dx = this.sman.getSX(), dy = this.sman.getSY(), v = this.visibility,
                ry1 = v.fr[1] + dy, rx1 = v.fc[1] + dx, row =  -1, col =  -1,
                ry2 = v.lr[1] + this.rowHeights[v.lr[0]] + dy,
                rx2 = v.lc[1] + this.colWidths[v.lc[0]] + dx;
            if(y > ry1 && y < ry2) {
                for(var i = v.fr[0];i <= v.lr[0]; ry1 += this.rowHeights[i] + this.lineSize,i ++ ){
                    if(y > ry1 && y < ry1 + this.rowHeights[i]) {
                        row = i;
                        break;
                    }
                }
            }
            if(x > rx1 && x < rx2){
                for(var i = v.fc[0];i <= v.lc[0]; rx1 += this.colWidths[i] + this.lineSize, i++ ){
                    if(x > rx1 && x < rx1 + this.colWidths[i]) {
                        col = i;
                        break;
                    }
                }
            }
            return (col >= 0 && row >= 0) ? [row, col] : null;
        },

        function rPsMetric(){
            var cols = this.getGridCols(), rows = this.getGridRows();
            if(this.colWidths == null || this.colWidths.length != cols) this.colWidths = arr(cols, 0);
            if(this.rowHeights == null || this.rowHeights.length != rows) this.rowHeights = arr(rows, 0);
            var addW = this.cellInsetsLeft + this.cellInsetsRight,
                addH = this.cellInsetsTop + this.cellInsetsBottom;

            for(var i = 0;i < cols; i++ ) this.colWidths [i] = 0;
            for(var i = 0;i < rows; i++ ) this.rowHeights[i] = 0;
            for(var i = 0;i < cols; i++ ){
                for(var j = 0;j < rows; j ++ ){
                    var v = this.provider.getView(j, i, this.model.get(j, i));
                    if(v != null){
                        var ps = v.getPreferredSize();
                        ps.width += addW;
                        ps.height += addH;
                        if(ps.width > this.colWidths[i]) this.colWidths [i] = ps.width;
                        if(ps.height > this.rowHeights[j]) this.rowHeights[j] = ps.height;
                    }
                    else {
                        if ( pkg.Grid.DEF_COLWIDTH > this.colWidths [i]) this.colWidths [i] = pkg.Grid.DEF_COLWIDTH;
                        if ( pkg.Grid.DEF_ROWHEIGHT > this.rowHeights[j]) this.rowHeights[j] = pkg.Grid.DEF_ROWHEIGHT;
                    }
                }
            }
        },

        function getPSSize(rowcol,b){
            if(this.isUsePsMetric) return b ? this.getRowHeight(rowcol) : this.getColWidth(rowcol);
            else {
                var max = 0, count = b ? this.getGridCols() : this.getGridRows();
                for(var j = 0;j < count; j ++ ){
                    var r = b ? rowcol : j, c = b ? j : rowcol,
                        v = this.provider.getView(r, c, this.model.get(r, c));

                    if(v != null){
                        var ps = v.getPreferredSize();
                        if(b){
                            if(ps.height > max) max = ps.height;
                        }
                        else {
                            if(ps.width > max) max = ps.width;
                        }
                    }
                }
                return max + this.lineSize * 2 + (b ? this.cellInsetsTop + this.cellInsetsBottom : this.cellInsetsLeft + this.cellInsetsRight);
            }
        },

        function rCustomMetric(){
            var start = 0;
            if(this.colWidths != null){
                start = this.colWidths.length;
                if(this.colWidths.length != this.getGridCols()){
                    var na = arr(this.getGridCols(), 0);
                    zebra.util.arraycopy(this.colWidths, 0, na, 0, Math.min(this.colWidths.length, na.length));
                    this.colWidths = na;
                }
            }
            else this.colWidths = arr(this.getGridCols(), 0);

            for(; start < this.colWidths.length; start ++ ) {
                this.colWidths[start] = pkg.Grid.DEF_COLWIDTH;
            }

            start = 0;
            if(this.rowHeights != null){
                start = this.rowHeights.length;
                if(this.rowHeights.length != this.getGridRows()){
                    var na = arr(this.getGridRows(), 0);
                    zebra.util.arraycopy(this.rowHeights, 0, na, 0, Math.min(this.rowHeights.length, na.length));
                    this.rowHeights = na;
                }
            }
            else this.rowHeights = arr(this.getGridRows(), 0);
            for(; start < this.rowHeights.length; start ++ ) this.rowHeights[start] = pkg.Grid.DEF_ROWHEIGHT;
        },

        function pageSize(d){
            this.validate();
            if(this.visibility.hasVisibleCells()){
                var off = this.position.offset;
                if(off >= 0){
                    var hh = this.visibleArea.height - this.getTopCaptionHeight(), sum = 0, poff = off;
                    for(; off >= 0 && off < this.getGridRows() && sum < hh; sum += this.rowHeights[off] + this.lineSize,off += d);
                    return Math.abs(poff - off);
                }
            }
            return 0;
        },

        function isExternatEditor(row, col, editor){ return zebra.instanceOf(editor, ExternalEditor); },
]);

pkg.GridStretchPan = new Class(ui.Panel, zebra.layout.Layout, [
    function (grid){
        this.$super(this);
        this.heights = [];
        this.widths  = [];
        this.proportions = this.strPs = null;
        this.prevTargetAreaSize = { width:0, height:0 };
        this.add(grid);
    },

    function getScrollManager()  { return this.getGrid().getScrollManager(); },

    function kidAdded(index,constr,l){
        this.proportions = null;
        var cap = l.topCaption;
        if (cap != null) cap._.add(this);
        this.$super(index, constr, l);
    },

    function kidRemoved(i,l){
        this.proportions = null;
        var cap = l.topCaption;
        if(cap != null) cap._.remove(this);
        this.$super(i, l);
    },

    function calcPreferredSize(target){
        this.recalcPS();
        return (target.count() === 0 || !target.get(0).isVisible) ? { width:0, height:0 }
                                                                  : { width:this.strPs.width, height:this.strPs.height };
    },

    function doLayout(target){
        this.recalcPS();
        if(target.count() > 0){
            var grid = this.getGrid();
            if (grid.isVisible){
                grid.setLocation(target.getLeft(), target.getTop());
                grid.setSize(target.width  - target.getLeft() - target.getRight(),
                             target.height - target.getTop()  - target.getBottom());

                for(var i = 0; i < this.widths.length; i++) {
                    grid.setColWidth(i, this.widths[i]);
                }

                if (this.heights != null){
                    for(var i = 0;i < this.heights.length; i++) grid.setRowHeight(i, this.heights[i]);
                }
            }
        }
    },

    function invalidate(){
        this.strPs = null;
        this.$super();
    },

    function getMinWidth(){
        return zebra.instanceOf(this.getGrid().topCaption, pkg.GridCaption) ? this.getGrid().topCaption.minSize
                                                                            : 10;
    },

    function captionResized(src, col, pw){
        var grid = this.getGrid();
        if(col < this.widths.length - 1){
            var w = grid.getColWidth(col), dt = w - pw;
            if (dt < 0) grid.setColWidth(col + 1, grid.getColWidth(col + 1) - dt);
            else {
                var ww = grid.getColWidth(col + 1) - dt, mw = this.getMinWidth();
                if(ww < mw){
                    grid.setColWidth(col, w - (mw - ww));
                    grid.setColWidth(col + 1, mw);
                }
                else grid.setColWidth(col + 1, ww);
            }
            this.proportions = null;
        }
    },

    function calcColProportions(targetAreaW,targetAreaH){
        var g = this.getGrid(), cols = g.getGridCols(), sw = 0;
        for(var i = 0;i < cols; i++){
            var w = g.getColWidth(i);
            if(w === 0) w = g.getColPSWidth(i);
            sw += w;
        }
        var props = Array(cols);
        for(var i = 0;i < cols; i++){
            var w = g.getColWidth(i);
            if(w === 0) w = g.getColPSWidth(i);
            props[i] = w / sw;
        }
        return props;
    },

    function calcRowHeights(targetAreaW,targetAreaH,widths) { return null; },

    function calcColWidths(targetAreaW,targetAreaH){
        var grid = this.getGrid(), w = new Array(grid.getGridCols()),
            ew = targetAreaW - (this.proportions.length + 1) * grid.lineSize, sw = 0;
        for(var i = 0;i < this.proportions.length; i++){
            if(this.proportions.length - 1 == i) w[i] = ew - sw;
            else{
                var cw = (ew * this.proportions[i]);
                w[i] = cw;
                sw += cw;
            }
        }
        return w;
    },

    function getGrid(){ return this.get(0); },

    function recalcPS(){
        if (this.kids.length === 0 || this.kids[0].isVisible === false) return;

        var p = this.parent, isScr = zebra.instanceOf(p, ui.ScrollPan),
            taWidth   = (isScr ? p.width - p.getLeft() - p.getRight() - this.getRight() - this.getLeft()
                               : this.width - this.getRight() - this.getLeft()),
            taHeight = (isScr  ? p.height - p.getTop() - p.getBottom() - this.getBottom() - this.getTop()
                               : this.height - this.getBottom() - this.getTop());

        if (this.strPs != null && this.prevTargetAreaSize.width == taWidth &&
                                  this.prevTargetAreaSize.height == taHeight  ) {
            return;
        }

        var grid = this.kids[0];
        if (this.proportions == null || this.proportions.length != grid.getGridCols()) {
            this.proportions = this.calcColProportions(taWidth, taHeight);
        }

        this.prevTargetAreaSize.width = taWidth;
        this.prevTargetAreaSize.height = taHeight;
        this.widths  = this.calcColWidths (taWidth, taHeight);
        this.heights = this.calcRowHeights(taWidth, taHeight, this.widths);
        this.strPs = this.summarizePS(taWidth, taHeight, this.widths, this.heights);

        if (isScr === true &&
            this.parent.height > 0 && this.parent.getByConstraints(L.VERTICAL) != null)
        {
            var sp = this.parent, vbar = sp.getByConstraints(L.VERTICAL);
            if(taHeight < this.strPs.height){
                taWidth -= vbar.getPreferredSize().width;
                this.widths  = this.calcColWidths(taWidth, taHeight);
                this.heights = this.calcRowHeights(taWidth, taHeight, this.widths);
                this.strPs = this.summarizePS(taWidth, taHeight, this.widths, this.heights);
            }
        }
    },

    function summarizePS(targetAreaW,targetAreaH,widths,heights){
        var ps = { width: targetAreaW, height:0 }, grid = this.getGrid();
        if (heights != null){
            for(var i = 0;i < heights.length; i++) ps.height += heights[i];
            if (grid.topCaption != null && grid.topCaption.isVisible) {
                ps.height += grid.topCaption.getPreferredSize().height;
            }
            ps.height += (grid.getTop() + grid.getBottom());
        }
        else ps.height = grid.getPreferredSize().height;
        return ps;
    }
]);

})(zebra("ui.grid"), zebra.Class, zebra("ui"));

(function(pkg, Class, ui) {

var RasterLayout = zebra.layout.RasterLayout, L = zebra.layout, Layer = zebra.ui.Layer,
    Cursor = ui.Cursor, Panel = zebra.ui.Panel,KeyListener = zebra.ui.KeyListener,
    MouseMotionListener = zebra.ui.MouseMotionListener, FocusListener = zebra.ui.FocusListener,
    MouseListener = zebra.ui.MouseListener, ChildrenListener = zebra.ui.ChildrenListener,
    ComponentListener = zebra.ui.ComponentListener, ContainerListener = zebra.ui.ContainerListener,
    Composite = zebra.ui.Composite, KeyEvent = zebra.ui.KeyEvent, Cursorable = zebra.ui.Cursorable, rgb = zebra.util.rgb;

pkg.DgnComponent = zebra.Interface();

pkg.ShaperBorder = Class(zebra.ui.view.View, Cursorable, [
    function(){
        this.borderColor = rgb.blue;
        this.gap = 7;
    },

    function paint(g,x,y,w,h,d){
        var cx = ~~((w - this.gap)/2), cy = ~~((h - this.gap)/2);
        g.setColor(this.borderColor);
        g.fillRect(x, y, this.gap, this.gap);
        g.fillRect(x + cx, y, this.gap, this.gap);
        g.fillRect(x, y + cy, this.gap, this.gap);
        g.fillRect(x + w - this.gap, y, this.gap, this.gap);
        g.fillRect(x, y + h - this.gap, this.gap, this.gap);
        g.fillRect(x + cx, y + h - this.gap, this.gap, this.gap);
        g.fillRect(x + w - this.gap, y + cy, this.gap, this.gap);
        g.fillRect(x + w - this.gap, y + h - this.gap, this.gap, this.gap);
        g.strokeRect(x + ~~(this.gap / 2), y + ~~(this.gap / 2), w - this.gap, h - this.gap);
    },

    function getCursorType(target,x,y){
        var gap = this.gap, gap2 = gap*2, w = target.width, h = target.height;
        function contains(x, y, gx, gy, ww, hh) {
            return gx <= x && (gx + ww) > x && gy <= y && (gy + hh) > y;
        }

        if(contains(x, y, gap, gap, w - gap2, h - gap2)) return Cursor.MOVE;
        if(contains(x, y, 0, 0, gap, gap)) return Cursor.NW_RESIZE;
        if(contains(x, y, 0, h - gap, gap, gap)) return Cursor.SW_RESIZE;
        if(contains(x, y, w - gap, 0, gap, gap)) return Cursor.NE_RESIZE;
        if(contains(x, y, w - gap, h - gap, gap, gap)) return Cursor.SE_RESIZE;
        var mx = ~~((w-gap)/2);
        if(contains(x, y, mx, 0, gap, gap)) return Cursor.N_RESIZE;
        if(contains(x, y, mx, h - gap, gap, gap)) return Cursor.S_RESIZE;
        var my = ~~((h-gap)/2);
        if(contains(x, y, 0, my, gap, gap)) return Cursor.W_RESIZE;
        return contains(x, y, w - gap, my, gap, gap) ? Cursor.E_RESIZE : -1 ;
    }
]);

pkg.InsetsCursorArea = Class(Cursorable, [
    function $prototype() {
        this.getCursorType = function (target,x,y){
            var areaType = this.getAreaType(target, x, y);
            return (areaType >= 0) ? this.getCursorForArea(areaType) :  -1;
        };

        this.getCursorForArea = function(t){ return this.cursors[t-1]; };

        this.getAreaType = function (c,x,y){
            var t = 0, b1 = false, b2 = false;
            if(x < this.left) t += L.LEFT;
            else
                if(x > (c.width - this.right)) t += L.RIGHT;
                else b1 = true;

            if(y < this.top) t += L.TOP;
            else
                if(y > (c.height - this.bottom)) t += L.BOTTOM;
                else b2 = true;
            return b1 && b2 ? L.CENTER : t;
        };
    },

    function (){
        this.cursors = [];
        this.top = this.right = this.left = this.bottom = 6;
        this.setCursorForArea(L.LEFT, Cursor.W_RESIZE);
        this.setCursorForArea(L.RIGHT, Cursor.E_RESIZE);
        this.setCursorForArea(L.TOP, Cursor.N_RESIZE);
        this.setCursorForArea(L.BOTTOM, Cursor.S_RESIZE);
        this.setCursorForArea(L.TLEFT, Cursor.NW_RESIZE);
        this.setCursorForArea(L.TRIGHT, Cursor.NE_RESIZE);
        this.setCursorForArea(L.BLEFT, Cursor.SW_RESIZE);
        this.setCursorForArea(L.BRIGHT, Cursor.SE_RESIZE);
        this.setCursorForArea(L.CENTER, Cursor.MOVE);
    },

    function setCursorForArea(t,c){ this.cursors[t-1] = c; }
]);


function getRootContainer(target){
    var p = target.parent;
    while(p != null && !zebra.instanceOf(p, Layer)) {
        target = p;
        p = target.parent;
    }
    if (zebra.instanceOf(p, Layer)) return p;
    return zebra.instanceOf(target, Panel) ? target : null;
}

pkg.Shaper = Class(MouseMotionListener, [
    function (){ this.$this(null); },

    function (target){
        this.minHeight = this.minWidth = 12;
        this.topContainer = this.state = null;
        this.px = this.py = 0;
        this.setTarget(target);
    },

    function setTarget(c){
        if(this.target != c){
            var prev = this.target;
            this.target = c;
            this.targetWasChanged(this.target, prev);
        }
    },

    function startDragged(e){
        if(this.target == e.source){
            this.state = this.getBoundsMask();
            if(this.state != null){
                this.topContainer = getRootContainer(this.target);
                this.px = e.absX;
                this.py = e.absY;
            }
        }
    },

    function mouseDragged(e){
        if(this.target == e.source && this.state !== null) {
            var dy = (e.absY - this.py), dx = (e.absX - this.px), t = this.target, s = this.state,
                nw = t.width  - dx * s.left + dx * s.right, nh = t.height - dy * s.top  + dy * s.bottom;
            if(nw >= this.minWidth && nh >= this.minHeight){
                this.px = e.absX;
                this.py = e.absY;
                if ((s.top + s.right + s.bottom + s.left) === 0) t.setLocation(t.x + dx, t.y + dy);
                else {
                    t.setSize(nw, nh);
                    t.setLocation(t.x + dx * s.left, t.y + dy * s.top);
                }
            }
        }
    },

    function endDragged(e) { this.topContainer = null;  },

    function getBoundsMask(){
        var type = ui.cursorManager.cursorType;
        if (type < 0) return null;
        var r = {};
        r.top = r.left = r.right = r.bottom = 0;
        switch(type)
        {
            case Cursor.W_RESIZE : r.left = 1;break;
            case Cursor.E_RESIZE : r.right = 1;break;
            case Cursor.N_RESIZE : r.top = 1;break;
            case Cursor.S_RESIZE : r.bottom = 1;break;
            case Cursor.NW_RESIZE: r.top = r.left  = 1; break;
            case Cursor.NE_RESIZE: r.right = r.top = 1; break;
            case Cursor.SW_RESIZE: r.left = r.bottom = 1; break;
            case Cursor.SE_RESIZE: r.bottom = r.right = 1; break;
            case Cursor.MOVE: r.top = r.left = r.right = r.bottom = 0; break;
            default: return null;
        }
        return r;
    },

    function targetWasChanged(n,o){
        if(o != null){
            ui.events.removeMouseMotionListener(null);
            ui.cursorManager.setCursorable(o, null);
        }
        if(n != null){
            ui.cursorManager.setCursorable(n, zebra.instanceOf(n, Cursorable) ? n : new pkg.InsetsCursorArea());
            ui.events.addMouseMotionListener(this);
        }
    }
]);

pkg.ShaperPan = Class(Panel, Cursorable, Composite, FocusListener, KeyListener, [
    function () {  this.$this(null); },

    function (t){
        this.$super(new L.BorderLayout());
        this.shaperBr = new pkg.ShaperBorder();
        this.shaper = new pkg.Shaper();
        this.hasTarget = false;
        this.colors = [ rgb.lightGray, rgb.blue ];
        this.shaperBr.borderColor = this.colors[0];
        this.setBorder(this.shaperBr);
        if (t != null) this.setTarget(t);
    },

    function setTarget(t){
        if (t != null && this.kids.length > 0) this.setTarget(null);

        var tt = (t == null) ? this.get(0): t,
            p  = tt.parent, tx = tt.x, ty = tt.y, tw = tt.width, th = t.height,
            right = this.getRight(), top = this.getTop(), bottom = this.getBottom(), left = this.getLeft();

        this.setEnabled(false);
        if (t == null) {
            var tx = this.x, ty = this.y;
            if (tp != null)  tp.remove(this);
            this.removeAll();
            if (tp != null) tp.add(tt);

            tt.setLocation(tx + left, ty + top);
            this.shaper.setTarget(null);
            this.hasTarget = false;
            this.setEnabled(true);
        }
        else {
            p.remove(tt);
            this.add(L.CENTER, tt);
            p.add(this);
            this.setLocation(tx - left, ty - top);
            this.setSize(tw + left + right, th + top + bottom);
            this.setEnabled(true);
            this.shaper.setTarget(this);
            this.hasTarget = true;
            ui.focusManager.requestFocus(this);
        }
    },

    function focusGained(e){
        this.shaperBr.borderColor = this.colors[1];
        this.repaint();
    },

    function focusLost(e){
        this.shaperBr.borderColor = this.colors[0];
        this.repaint();
    },

    function getCursorType(t, x ,y) { return this.hasTarget ? this.shaperBr.getCursorType(t, x, y) : -1; },
    function canHaveFocus() { return true; },

    function keyPressed(e){
        if(this.hasTarget){
            var b = (e.mask & KeyEvent.SHIFT) > 0, c = e.code;
            var dx = (c == KeyEvent.VK_LEFT ? -1 : (c == KeyEvent.VK_RIGHT ? 1 : 0));
            var dy = (c == KeyEvent.VK_UP ? -1 : (c == KeyEvent.VK_DOWN ? 1 : 0));
            var w = this.width + dx, h = this.height + dy, x = this.x + dx, y = this.y + dy;

            if (b) {
                if (w > this.shaperBr.gap*2 && h > this.shaperBr.gap*2) this.setSize(w, h);
            }
            else {
                var ww = this.width, hh = this.height, p = this.parent;
                if (x + ww/2 > 0 && y + hh/2 > 0 && x < p.width - ww/2 && y < p.height - hh/2) this.setLocation(x, y);
            }
        }
    }
]);

pkg.FormTreeModel = Class(zebra.data.TreeModel, [
    function $class() {
        this.ComponentItem = Class(zebra.data.Item, [
            function (value,c){
                this.$super(value);
                this.comp = c;
            },
            function getComponent() { return this.comp; }
        ]);
    },

    function $prototype() {
        this.buildModel = function(comp, root){
            var b = this.exclude(comp),item = b ? root : this.createItem(comp);
            if (!b) {
                if(root == null) this.setRoot(item);
                else this.add(root, item);
            }
            for(var i = 0; i < comp.count(); i++) this.buildModel(comp.get(i), item);
        };
    },

    function (target){
        this.$super(null);
        this.buildModel(target, null);
    },

    function getComponentItem(c){ return this.getComponentItem(this.getRoot(), c); },

    function getComponentItem(start,c){
        if(start.getComponent() == c) return start;
        if(this.hasChildren(start)){
            for(var i = 0;i < this.getChildrenCount(start); i ++ ){
                var item = this.getComponentItem(this.getChildAt(start, i), c);
                if(item != null) return item;
            }
        }
        return null;
    },

    function createItem(comp){
        var name  = comp.getClazz().$name;
        if (!name) name = comp.toString();
        var index = name.lastIndexOf('.');
        return new ComponentItem(index > 0 ? name.substring(index + 1) : name, comp);
    },

    function exclude(comp){ return false; }
]);

pkg.DesignPan = Class(Panel, Composite, MouseListener,
                      KeyListener, ChildrenListener, FocusListener, [

    function $clazz() {
        this.COMPONENT_SELECTED = 1;
        this.COMPONENT_MOVED = 2;
        this.COMPONENT_SIZED = 3;
    },

    function $prototype() {
        this.childCompEvent = function(id,c){
            if(!this.freezeCEvHVal){
                if(this.selected != null){
                    if(id == ComponentListener.COMP_MOVED || id == ComponentListener.COMP_SIZED || (id == ComponentListener.COMP_SHOWN && c.isVisible)){
                        this.calcMetric();
                    }
                    else {
                        if(c == this.selectedComp && id == ComponentListener.COMP_SHOWN && !c.isVisible){
                            this.select(null);
                        }
                    }
                }
            }
        };
    },

    function () {
        this.selected = null;
        this.canBeMoved = this.freezeCEvHVal = this.canBeResized = false;
        this.$super(new RasterLayout());
        this.shaper = new pkg.ShaperPan();
        this.colors = [ rgb.black, rgb.gray ];
    },

    function select(c){
        if(this.selected != c){
            this.shaper.setTarget(c);
            this.selected = c;
        }
    },

    function focusGained(e){
//            if (this.selected != null) this.repaint(this.brX, this.brY, this.brW, this.brH);
    },

    function focusLost(e){
//          if(this.selected != null) this.repaint(this.brX, this.brY, this.brW, this.brH);
    },

    function setRectColor(hasFocus,c){
        var i = this.hasFocus() ? 0 : 1;
        if( !this.colors[i].equals(c)){
            this.colors[i] = c;
//            if(this.selectedComp != null) this.repaint(this.brX, this.brY, this.brW, this.brH);
        }
    },


    function childContEvent(id,p,constr,c){
        if (!this.freezeCEvHVal){
            switch(id)
            {
                case ContainerListener.COMP_REMOVED: if(c == this.selected) this.setSelectedComponent(null);break;
                case ContainerListener.LAYOUT_SET:
                    try{
                        this.freezeCEvH();
                    }
                    finally {
                        this.freezeCEvH();
                    }
                    break;
            }
        }
    },

    function paintOnTop(g){
        if(this.selectedComp != null){
            g.setColor(this.colors[this.hasFocus()?0:1]);
            if(this.selectedComp != this) this.borderView.paint(g, this.brX, this.brY, this.brW, this.brH, this);
            else {
                var right = this.getRight(), top = this.getTop(), bottom = this.getBottom(), left = this.getLeft(),
                    ew = width - left - right, eh = height - top - bottom;
                g.strokeRect(left, top, ew - 1, eh - 1);
                g.strokeRect(left + 1, top + 1, ew - 3, eh - 3);
            }
        }
    },

    function mousePressed(e){
        if(e.isActionMask()){
            var xx = e.x, yy = e.y, b = this.contains(xx, yy, 0);
            if (!b || this.hasFocus()) {
                b = (this.selected != this && b);
                var c = this.getComponentAt(xx, yy);
                if (!b || (c != this.selected && L.isAncestorOf(this.selected, c))){
                    this.select(c);
                }
            }
        }
    },

    function canHaveFocus(){ return true; },

    function contains(x,y,gap){
        return this.selectedComp != null && x >= this.brX + gap && x < this.brX + this.brW - gap &&
               y >= this.brY + gap && y < this.brY + this.brH - gap;
    },

    // private class methods
    //!!!!this.Private()
    function moveComponent(){
        try{
            this.freezeCEvH();
            var prevParent = this.selectedComp.parent;
            if(prevParent != null){
                var isVisible = this.selectedComp.isVisible;
                this.selectedComp.setVisible(false);
                var newParent = this.getComponentAt(this.absX, this.absY);
                newParent = (newParent == null) ? this : newParent.parent;
                this.selectedComp.setVisible(isVisible);
                var p = [this.absX, this.absY];
                if (newParent != this) p = L.getRelLocation(this.absX, this.absY, newParent, this);
                if(prevParent != newParent){
                    var constraints = null, newParentLI = null;  //!!!Editors.getLayoutHelper(newParent.layout);
                    if(newParentLI != null){
                        if(newParentLI.canBeAdded(newParent, newParent.layout, this.selectedComp)){
                            constraints = newParentLI.getDefaultConstraints(newParent, newParent.layout);
                        }
                        else return ;
                    }
                    prevParent.remove(this.selectedComp);
                    newParent.add(constraints, this.selectedComp);
                }
                this.selectedComp.setLocation(p[0], p[1]);
                newParent.validate();
                this.calcMetric();
                if(prevParent != newParent) this.updateLayoutHelper();
                this.support.perform(this, pkg.DesignPan.COMPONENT_MOVED, this.selectedComp);
            }
        }
        finally{
            this.freezeCEvH();
        }
    },

    function resizeComponent(){
        var p = L.getRelLocation(this.absX, this.absY, this.selectedComp.parent, this),
            px = this.selectedComp.x, py = this.selectedComp.y, pw = this.selectedComp.width, ph = this.selectedComp.height;
        this.selectedComp.setLocation(p[0], p[1]);
        this.selectedComp.setSize(this.absW, this.absH);
        this.selectedComp.invalidate();
        this.validate();
        this.calcMetric();
        if(px != p[0] || py != p[1]) this.support.perform(this, pkg.DesignPan.COMPONENT_MOVED, this.selectedComp);
        if(pw != this.absW || ph != this.absH) this.support.perform(this, pkg.DesignPan.COMPONENT_SIZED, this.selectedComp);
    },

    function freezeCEvH(){ this.freezeCEvHVal =  this.freezeCEvHVal ^ true; },

    function calcMetric()
    {
          if (this.selectedComp != null)
          {
                var pbrX = brX, pbrY = brY, pbrW = brW, pbrH = brH, p = L.getAbsLocation(this.selectedComp);
                p = L.getRelLocation(p[0], p[1], this);
                this.locX = p[0];
                this.locY = p[1];
                this.brX  = this.locX - this.gap;
                this.brY  = this.locY - this.gap;
                brW  = this.selectedComp.getWidth () + 2*this.gap;
                brH  = this.selectedComp.getHeight() + 2*this.gap;
                if (this.brW > 0)
                {
                  var xx = Math.min(this.brX, pbrX), yy = Math.min(this.brY, pbrY);
                  this.repaint (xx, yy,
                           Math.max(this.brX + this.brW, pbrX + pbrW) - xx,
                           Math.max(this.brY + this.brH, pbrY + pbrH) - yy);
                }
                else this.repaint (this.brX, this.brY, this.brW, this.brH);
          }
          else {
                if (this.brW > 0) this.repaint (this.brX, this.brY, this.brW, this.brH);
                this.brW = 0;
          }
    }
]);

})(zebra("ui.editors"), zebra.Class, zebra("ui"));



})();