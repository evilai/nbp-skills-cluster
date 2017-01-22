'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _tail = require('lodash/tail');

var _tail2 = _interopRequireDefault(_tail);

var _filter = require('lodash/filter');

var _filter2 = _interopRequireDefault(_filter);

var _intersection = require('lodash/intersection');

var _intersection2 = _interopRequireDefault(_intersection);

var _difference = require('lodash/difference');

var _difference2 = _interopRequireDefault(_difference);

var _keys = require('lodash/keys');

var _keys2 = _interopRequireDefault(_keys);

var _isArray = require('lodash/isArray');

var _isArray2 = _interopRequireDefault(_isArray);

var _isFunction = require('lodash/isFunction');

var _isFunction2 = _interopRequireDefault(_isFunction);

var _uniq = require('lodash/uniq');

var _uniq2 = _interopRequireDefault(_uniq);

var _co = require('co');

var _co2 = _interopRequireDefault(_co);

var _errors = require('./errors');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Cluster = function () {
    function Cluster(name, params) {
        _classCallCheck(this, Cluster);

        if (!name) {
            throw new Error(_errors.ERROR_CLUSTER_NO_NAME);
        }
        this.params = params || {};
        this.name = name;
        this.skills = {};

        this.plugSkill = this.plugSkill.bind(this);
    }

    /**
     * Run provided builder function/generator that build a queue of skills.
     * @param builder is function/generator to build a queue of skills
     * @returns Promise, resolve array of skill names
     */


    _createClass(Cluster, [{
        key: 'buildDecisionTree',
        value: function buildDecisionTree(builder) {
            return (0, _co2.default)(builder);
        }

        /**
         * Get only existing skills in current cluster instance
         * @param skills array of skills in shape [{ name: string, lambda: function/generator }]
         * @returns array of skills in shape [{ name: string, lambda: function/generator }]
         */

    }, {
        key: 'filterExistingSkills',
        value: function filterExistingSkills(skills) {
            return (0, _intersection2.default)(skills, (0, _keys2.default)(this.skills));
        }

        /**
         * Get only unexistent skills in current cluster instance
         * @param skills array in shape [{ name: string, lambda: function/generator }]
         * @returns array of skills in shape
         */

    }, {
        key: 'filterNonexistentSkills',
        value: function filterNonexistentSkills(skills) {
            return (0, _difference2.default)(skills, (0, _keys2.default)(this.skills));
        }

        /**
         * Run queue traversal process
         * @param queue
         * @param params can be any object, that you want to pass between skills; usually there are rules, like { silent: false }; better to use immutable structures
         * @returns Promise
         */

    }, {
        key: 'traverse',
        value: function traverse(queue) {
            var _this = this;

            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

            if (queue.length) {
                return this.run(queue[0], params).then(function (newParams) {
                    var rules = newParams.rules;

                    if (!rules || !rules.get || !rules.set) {
                        throw new Error(_errors.ERROR_CLUSTER_PARAMS_GETTER);
                    }

                    var skillsToAdd = rules.get('skills') || [];
                    if (!(0, _isArray2.default)(skillsToAdd)) {
                        throw new Error(_errors.ERROR_CLUSTER_PARAMS_SKILLS_ARRAY);
                    }

                    var skillsToSkip = rules.get('skip');

                    // Add to queue only existing skills
                    var existingSkillsToAdd = _this.filterExistingSkills(skillsToAdd);
                    var newQueue = (0, _uniq2.default)(existingSkillsToAdd.concat((0, _tail2.default)(queue)));

                    // And save unexistent skills for the future skills clusters traversal
                    rules.set({
                        skills: _this.filterNonexistentSkills(skillsToAdd)
                    });

                    if (Boolean(skillsToSkip)) {
                        if (skillsToSkip === '*') {
                            newQueue = [];
                        }
                        if ((0, _isArray2.default)(skillsToSkip)) {
                            newQueue = (0, _uniq2.default)((0, _filter2.default)((0, _tail2.default)(queue), function (skillName) {
                                return !~skillsToSkip.indexOf(skillName);
                            }));
                        }
                    }

                    return _this.traverse(newQueue, Object.assign({}, newParams, { rules: rules }));
                }).catch(function (error) {
                    if (_this.params.errorHandler && (0, _isFunction2.default)(_this.params.errorHandler)) {
                        _this.params.errorHandler(error);
                    }
                });
            }

            return Promise.resolve(params);
        }

        /**
         * Run skill with provided name in current cluster
         * @param skillName
         * @param params
         * @returns Promise
         */

    }, {
        key: 'run',
        value: function run(skillName, params) {
            if (skillName && typeof skillName === 'string') {
                if (!this.skills[skillName]) {
                    throw new Error(_errors.ERROR_CLUSTER_NO_EXISTING_SKILL + ' Skill name: ' + skillName);
                }
                return this.skills[skillName].call(this, params);
            }

            if (skillName && typeof skillName === 'function') {
                return skillName.call(this, params);
            }

            throw new Error(_errors.ERROR_CLUSTER_CANT_RUN_SKILL);
        }

        /**
         * Add skill (function/generator) to the current cluster
         * @param skill with shape { name: string, lambda: function/generator }
         * lambda should always return Promise
         */

    }, {
        key: 'plugSkill',
        value: function plugSkill(skill) {
            var name = skill.name;
            var lambda = skill.lambda;


            if (this.skills[name]) {
                throw new Error(_errors.ERROR_CLUSTER_SKILL_NAME_EXISTS);
            }

            this.skills[name] = _co2.default.wrap(lambda);
        }

        /**
         * Add array of skills to the current skills cluster
         * @param skills
         */

    }, {
        key: 'plug',
        value: function plug(skills) {
            if ((0, _isArray2.default)(skills)) {
                skills.forEach(this.plugSkill);
            } else {
                this.plugSkill(skills);
            }
        }
    }]);

    return Cluster;
}();

exports.default = Cluster;