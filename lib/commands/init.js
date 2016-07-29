'use strict';

var execSync = require('child_process').execSync;
var replaceStream = require('replacestream');
var inquirer = require('inquirer');
var Manager = require('../modules/manager.js');

exports.usage = "项目初始化";

exports.setOptions = function (optimist) {};

exports.run = function (options) {
    Manager.reloadRC();

    var cwd = options.cwd,
        projectName = options._[1],
        defaultName = '';

    if (fileExists('./package.json')) {
        defaultName = JSON.parse(fs.readFileSync('./package.json')).name;
    } else {
        defaultName = sysPath.basename(cwd);
    }

    var questions = [{
        type: 'input',
        name: 'name',
        message: 'project name(' + defaultName + '):'
    }, {
        type: 'list',
        name: 'type',
        message: 'config type:',
        choices: ['qunar', 'hy']
    }];

    inquirer.prompt(questions).then(function (answers) {
        answers.name = answers.name || defaultName;

        var initTmplPath = sysPath.resolve(__dirname, '../config/initTmpl/');
        var configFileName = 'ykit.' + answers.type + '.js';
        var writePackageJsonStream = void 0;

        // 如果没有package.json，先添加package.json
        if (answers.name) {
            writePackageJsonStream = createPakcageJson();
        }

        if (!writePackageJsonStream) {
            createConfigFile();
            installDependencies();
        } else {
            writePackageJsonStream.on('finish', function () {
                log('Successfully created package.json file in ' + cwd);

                createConfigFile();
                installDependencies();
            });
        }

        function createPakcageJson() {
            return fs.createReadStream(sysPath.resolve(initTmplPath, 'package.json')).pipe(replaceStream('#_name', answers.name)).pipe(fs.createWriteStream(sysPath.resolve(cwd, 'package.json')));
        }

        function createConfigFile() {
            if (!fileExists('./' + configFileName)) {
                var stream = fs.createReadStream(sysPath.resolve(initTmplPath, 'ykit.common.js')).pipe(replaceStream('#_name', answers.name)).pipe(fs.createWriteStream(sysPath.resolve(cwd, configFileName)));

                stream.on('finish', function () {
                    log('Successfully created ' + configFileName + ' file in ' + cwd);
                });
            }
        }

        function installDependencies() {
            var packageName = 'ykit-config-' + answers.type,
                installConfigPackageCmd = 'npm i --save git+ssh://git@gitlab.corp.qunar.com:mfe/ykit-config-' + answers.type + '.git';

            log('Installing ' + packageName + '...');
            execSync(installConfigPackageCmd);
        }
    });
};

function fileExists(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch (err) {
        return false;
    }
}