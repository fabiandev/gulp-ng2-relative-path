"use strict";

var clone = require('clone');
var extend = require('extend');
var isarray = require('isarray');
var join = require('path').join;
var dirname = require('path').dirname;
var basename = require('path').basename;

var defaults = {
    base: './',
    appBase: '/',
    templateExtension: '.html',
    processTemplatePaths: true,
    processStylePaths: true,
    modifyPath: false,
    modifyTemplatePath: false,
    modifyStylePath: false
};

var htmlOptions = function(opts) {
    return {
        type: 'html',
        prop_url: 'templateUrl',
        prop: 'templateUrl',
        start_pattern: /templateUrl\s*:.*/,
        end_pattern: new RegExp('.*\\' + opts.templateExtension + '\s*(\'\\)|\')|.*\\' + opts.templateExtension + '\s*("\\)|")'),
        oneliner_pattern: new RegExp('templateUrl.*(\\' + opts.templateExtension + '\s*(\'\\)|\')|\\' + opts.templateExtension + 's*("\\)|"))')
    };
};

var cssOptions = function() {
    return {
        type: 'css',
        prop_url: 'styleUrls',
        prop: 'styleUrls',
        start_pattern: /styleUrls\s*:.*/,
        end_pattern: /.*]/,
        oneliner_pattern: /styleUrls(.*?)]/
    };
};


module.exports = function parser(file, options) {
    var opts = extend({}, defaults, (options || {}));
    var lines = file.contents.toString().replace(/\r/g, '').split('\n');
    var start_line_idx, end_line_idx, frag;

    var base = join(process.cwd(), opts.base);
    var pattern = new RegExp('^(' + base + '/?)');

    if (opts.processTemplatePaths) {
        extend(opts, htmlOptions(opts));
        execute();
        reset();
    }
    if (opts.processStylePaths) {
        extend(opts, cssOptions());
        execute();
        reset();
    }

    return lines.join('\n');


    function execute() {
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            getIndexes(line, i);
            if (i === end_line_idx && start_line_idx) {
                getFragment();
                replaceFrag();
            }
        }
    }

    function getIndexes(line, i) {
        if (opts.start_pattern.test(line)) {
            start_line_idx = i;
        }

        if (opts.end_pattern.test(line)) {
            if (start_line_idx <= end_line_idx) {
                return;
            }
            end_line_idx = i;
        }
    }

    function getFragment() {
        var fragStart, fragEnd;

        if (start_line_idx < 0 || end_line_idx < 0) {
            return;
        }

        if (start_line_idx === end_line_idx) {
            frag = opts.oneliner_pattern.exec(lines[start_line_idx])[0];
        }

        if (start_line_idx < end_line_idx) {
            fragStart = opts.start_pattern.exec(lines[start_line_idx])[0];
            fragEnd = opts.end_pattern.exec(lines[end_line_idx])[0];
            frag = concatLines();
        }

        function concatLines() {
            var _lines = clone(lines);
            _lines[start_line_idx] = fragStart;
            _lines[end_line_idx] = fragEnd;
            return _lines.splice(start_line_idx, end_line_idx - start_line_idx + 1).join('');
        }
    }

    function replaceFrag() {
        var _urls = eval('({' + frag + '})')[opts.prop_url];

        var urls = isarray(_urls) ? _urls : [_urls];
        var line = lines[start_line_idx];
        var assetFiles = '';

        var finalUrls = [],
            finalString = '';

        urls.forEach(function(url) {
            var finalUrl = adjustPath(url);
            if (opts.modifyPath) {
                finalUrl = opts.modifyPath(finalUrl);
            }

            if (opts.type === 'html' && opts.modifyTemplatePath) {
                finalUrl = opts.modifyTemplatePath(finalUrl);
            }

            if (opts.type === 'css' && opts.modifyStylePath) {
                finalUrl = opts.modifyStylePath(finalUrl);
            }

            finalUrls.push(finalUrl);
        });

        if (opts.type === 'html') {
            finalString = '"' + finalUrls.pop() + '"';
        } else {
            finalString = JSON.stringify(finalUrls);
        }

        assetFiles = opts.prop + ': ' + finalString;

        if (start_line_idx === end_line_idx) {
            lines[start_line_idx] = line.replace(opts.oneliner_pattern, assetFiles);
        }

        if (start_line_idx < end_line_idx) {
            if (/(,)$/.test(lines[end_line_idx])) assetFiles += ',';
            lines[start_line_idx] = line.replace(opts.start_pattern, assetFiles);
            lines.splice(start_line_idx + 1, end_line_idx - start_line_idx);
        }
    }

    function adjustPath(path) {
        var filename = basename(path);
        var path = dirname(file.path).replace(pattern, opts.appBase + '/');
        path += '/' + filename;

        // Angular2 issue: https://github.com/angular/angular/issues/4974
        if (opts.type === 'css') {
            path = '..' + path;
        }

        return path;
    }

    function reset() {
        start_line_idx = undefined;
        end_line_idx = undefined;
        frag = undefined;
    }
};
