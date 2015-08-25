'use strict';

module.exports = function(grunt) {
  var CI = grunt.option('ci');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    project: {
      lib: 'lib',
      test: 'test',
      dist: 'dist',
      name: 'charAPI'
    },
    concat: {
      options: {
        separator: ';\n'
      },
      dist: {
        options: {
          banner: '(function() {\nthis.charAPI = {};\n',
          footer: '\n}).call(typeof exports !== \'undefined\' ? exports : typeof window !== \'undefined\' ? window : this);',
          process: function(src) {
            return src.replace(/var (?!_)(.*?) = (?=\(?function \w*?\([^)]*\) \{)/g, 'var $1 = this.charAPI.$1 = ');
          }
        },
        src: ['<%= project.dist %>/*.js'],
        dest: '<%= project.dist %>/<%= project.name %>.js'
      }
    },
    uglify: {
      dist: {
        files: [
          {
            dest: '<%= project.dist %>/<%= project.name %>.min.js',
            src: ['<%= project.dist %>/<%= project.name %>.js']
          }
        ]
      }
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc',
        reporter: CI && 'checkstyle',
        reporterOutput: CI && 'jshint.xml'
      },
      all: {
        src: [
          'Gruntfile.js',
          '<%= project.test %>/*.js',
          '<%= project.lib %>/*.js'
        ]
      }
    },
    gjslint: {
      options: {
        flags: [
          '--disable 110,10',
          '--nojsdoc'
        ],
        reporter: {
          name: CI ? 'gjslint_xml' : 'console',
          dest: CI ? 'gjslint.xml' : undefined
        }
      },
      all: {
        src: ['<%= jshint.all.src %>']
      }
    },
    lint_pattern: {
      options: {
        rules: [
          { pattern: /(describe|it)\.only/, message: 'Must not use .only in tests' }
        ]
      },
      all: {
        src: ['<%= jshint.all.src %>']
      }
    },
    mochacli: {
      options: {
        require: ['chai'],
        reporter: 'spec',
        timeout: 3000
      },
      all: ['<%= project.test %>/*.js']
    },
    watch: {
      files: ['<%= jshint.all.src %>'],
      tasks: ['test']
    },

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '<%= project.dist %>/*',
            '!<%= project.dist %>/.git*'
          ]
        }]
      }
    },

    babel: {
      dist: {
        files: [{
          expand: true,
          dest: '<%= project.dist %>',
          src: ['<%= project.lib %>/*.js'],
          ext: '.js'
        }]
      }
    },

    karma: {
      unit: {
        singleRun: true,
        browsers: ['PhantomJS'],
        frameworks: ['mocha'],
        colors: true,
        autoWatch: true,
        files: {
          src: ['node_modules/chai/chai.js', 'bower_components/angular/angular.js', 'bower_components/angular-mocks/angular-mocks.js', 'lib/charAPI.js', 'test/*.js']
        }
      }
    }
  });

  require('load-grunt-tasks')(grunt);
  grunt.registerTask('compile', 'Compile from ES6 to ES5', ['clean:dist', 'babel', 'concat:dist', 'uglify']);
  grunt.registerTask('dist', ['test']);
  grunt.registerTask('linters', 'Check code for lint', ['jshint:all', 'gjslint:all', 'lint_pattern:all']);
  grunt.registerTask('test', 'Lint, compile and launch test suite', ['linters', 'compile', 'karma']);
  grunt.registerTask('dev', 'Launch tests then for each changes relaunch it', ['test', 'watch']);

  grunt.registerTask('default', ['test']);

};
