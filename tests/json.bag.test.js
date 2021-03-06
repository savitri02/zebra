
if (typeof(zebra) === "undefined") {
    load(arguments[0] + '/lib/gravity/zebra/easyoop.js');
    load(arguments[0] + '/lib/gravity/zebra/assert.js');
    load(arguments[0] + '/lib/gravity/zebra/util.js');
}

var assert = zebra.assert, Class = zebra.Class, Bag = zebra.util.Bag, assertException = zebra.assertException;

zebra.runTests("Zebra util objects bag",
    function test_emptybag() {
        var b = new Bag();
        b.load("{}");
        assert(b.get("ds") === undefined, true);
        assertException(function() { b.load(""); });
        assertException(function() { b.get(null); });
        assertException(function() { b.get(undefined); });
    },

    function test_simple_load() {
        var b = new Bag();
        b.load('{ "a":1, "b":{ "b1":"abc" }, "c": [1,2,3], "d":null }');
        assert(b.get("a") === 1, true);
        assert(b.get("d") === null, true);
        zebra.assertObjEqual(b.get("b"), {b1:"abc"});
        zebra.assertObjEqual(b.get("c"), [1,2,3]);
        assert(typeof b.get("cc") === "undefined", true);
        zebra.assert(b.get("b.b1") === "abc", true);
    },

    function test_obj_merge() {
        var o = {a:2, b: {b2:100}, c:[-2,-1, 0], x:{ ll:100 }, k: { k: 100 }, dd:null, ddd:[1,2,3], pp: { pp: { } } }, b = new Bag(o);
        b.load('{ "a":1, "b":{ "b1":"abc" }, "c": [1,2,3], "d":null, "x":null, "k": { "k": { "k":100 }, "kk":99 }, "dd":[1,2,3] , "ddd":null, "pp": { "pp": { "pp": [1,2]} } }');
        assert(b.get("a") === 1, true, "1");
        assert(b.get("d") === null, true, "2");
        zebra.assertObjEqual(b.get("b"), {b1:"abc", b2:100}, "3");
        zebra.assertObjEqual(b.get("c"), [-2, -1, 0, 1, 2, 3], "4");
        assert(typeof b.get("cc") === "undefined", true, "5");
        zebra.assert(b.get("b.b1"), "abc", "6");
        zebra.assert(b.get("b.b2") , 100, "7");
        zebra.assert(b.get("x"), null, "8");

        zebra.assert(b.get("k.k.k"), 100, "9");
        zebra.assert(b.get("k.kk"), 99, "10");
        zebra.assert(b.get("ddd"), null, "11");
        zebra.assertObjEqual(b.get("dd"), [1,2,3], "12");
    },

    function test_class_instantiation() {
        var o = {}, bag = new Bag(o), l = '{ "a": { "$A":[], "c": { "$A":[] } }, "b":{ "$A":["abc"] }, "c":{ "$A":true }, "d": {"$ *A": "xxx" } }';

        A = Class([
            function() {
                this.$this("test");
            },

            function(c) {
                this.c = c;
                this.$mmm = 22;
            }
        ]);
        bag.load(l);
        var a = bag.get("a");
        var b = bag.get("b");
        var c = bag.get("c");
        var d = bag.get("d");
        assert(zebra.instanceOf(a, A), true, "a is ok");
        assert(zebra.instanceOf(b, A), true, "b is ok");
        assert(zebra.instanceOf(c, A), true, "c is ok");

        assert(zebra.instanceOf(a.c, A), true, "a.c is ok");
        assert(zebra.instanceOf(d, A), true, "d is ok");

        assert(bag.get("a") === bag.get("a"), true, "get(a) === get(a)");
        assert(bag.get("b") === bag.get("b"), true, "get(b) === get(b)");
        assert(bag.get("c") === bag.get("c"), true, "get(c) === get(c)");
        assert(bag.get("b") !== bag.get("a"), true, "get(b) !== get(a)");
        assert(bag.get("c") !== bag.get("a"), true, "get(c) !== get(a)");
        assert(bag.get("a.c") !== bag.get("a"), true, "get(a.c) !== get(a)");
        assert(bag.get("d") !== bag.get("d"), true, "get(d) !== get(d)");

        assert(a.c.c, "test", "a.c.c is valid");
        assert(b.c, "abc", "b.c is valid");
        assert(c.c, true,  "c.c is valid");
        assert(d.c, "xxx",  "d.c is valid");
        assert(a.$mmm, 22,  "a.$mmm is valid");
        assert(a.c.$mmm, 22, "a.c.$mmm is valid");
        assert(b.$mmm, 22, "b.$mmm is valid");
        assert(c.$mmm, 22, "c.$mmm is valid");
        assert(d.$mmm, 22, "d.$mmm is valid");

        var o = {}, bag = new Bag(o), l = '{ "a": { "$A":[], "c": { "$A":[] } }, "b":{ "$A":["abc"], "dd":"@a", "mm":"@a.c" }, "d":"@a.c" }';
        bag.load(l);
        var r = bag.objects;

        assert(zebra.instanceOf(r.a, A), true);
        assert(zebra.instanceOf(r.b, A), true);
        assert(zebra.instanceOf(r.d, A), true);
        assert(zebra.instanceOf(r.a.c, A), true);
        assert(zebra.instanceOf(r.b.dd, A), true);
        assert(zebra.instanceOf(r.b.mm, A), true);

        assert(r.b.dd, r.a);
        assert(r.a !== r.a.c, true);
        assert(r.b.mm, r.a.c);
        assert(r.d, r.a.c);

        assert(r.b.c, "abc");
    },

    function test_refs() {
        var o = {p1: { "p222":333  }}, bag = new Bag(o), l = '{ "p1": { "p11": { "p111": 100, "p12":"@p1.p11.p111" } }, "p2": { "p11": { "p22":"@p1.p11.p111" } }  }';
        bag.load(l);

        assert(bag.get("p1.p11.p111"), 100, "1");
        assert(bag.get("p1.p11.p12"), 100, "2");

    },

    function test_load_merge() {
        var o = { p1: { "p1":333, "p2": [1,2,3]  }, p2:[0]},
            bag = new Bag(o),
            l1 = '{ "p1": { "p1": { "p1": 100, "p2":true  } }, "p2": [4,5,6], "p33":["a", "b"],  "p3": { "p3":["a", "b"], "p4": { "p4": 1} } }';
            l2 = '{ "p1": { "p1": { "p1": 200, "p3":false } }, "p2": [7,8,9], "p33":["a", "b"],  "p3": { "p3":["c", "d"], "p4": { "p4": 12, "p5":122 } } }';
        bag.load(l1, false).load(l2);
        var r = bag.objects;

        assert(r.p1.p1.p1, 200);
        assert(r.p1.p1.p2, true);
        assert(r.p1.p1.p3, false);
        zebra.assertObjEqual(r.p1.p2, [1,2,3]);
        zebra.assertObjEqual(r.p2, [0,4,5,6,7,8,9]);

        zebra.assertObjEqual(r.p3.p3, ["a", "b", "c", "d"]);
        zebra.assertObjEqual(r.p33, ["a", "b", "a", "b"]);
        zebra.assert(r.p3.p4.p4, 12);
        zebra.assert(r.p3.p4.p5, 122);
    },

    function test_inherit() {
        var o = {}, bag = new Bag(o), l = '{ "p": { "p1": 100, "p2": 200  }, "b": { "b1": { "$inherit":["p"], "p2":300 } }  }';
        bag.load(l);

        var r = bag.objects;
        assert(r.b.b1.p2, 300);
        assert(r.b.b1.p1, 100);

        var o = { d: { k: "str", d:[1,2, { s: { } } ] } }, bag = new Bag(o), l = '{ "p": { "p1": 100, "p2": 200  }, "b": { "b1": { "$inherit":["p", "d.d"], "p2":300 } }  }';
        bag.load(l);
        var r = bag.objects;

        assert(r.b.b1.p2, 300);
        assert(r.b.b1.p1, 100);
        zebra.assertObjEqual(r.b.b1.d, [1,2, { s: { } } ]);
    }
);








