steal.config({
	"map": {
		"*": {
			"jquery/jquery.js" : "jquery"
		}
	},
	paths: {
		"jquery": "shadow/lib/jquery.1.10.2.js",
		"mutationobserver/": "shadow/bower_components/mutationobserver/"
	},
	shim: {
		jquery: {
			exports: "jQuery"
		}
	},
	ext: {
		js: "js"
	},
	root: steal.config('root').join('../../')
});
