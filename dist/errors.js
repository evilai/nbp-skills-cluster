'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var ERROR_CLUSTER_NO_NAME = exports.ERROR_CLUSTER_NO_NAME = 'You didn\'t specify the name of the skills cluster.';
var ERROR_CLUSTER_NO_EXISTING_SKILL = exports.ERROR_CLUSTER_NO_EXISTING_SKILL = 'Can\'t find skill with this name in current skills cluster.';
var ERROR_CLUSTER_CANT_RUN_SKILL = exports.ERROR_CLUSTER_CANT_RUN_SKILL = 'Skills cluster> can\'t run skill. Please check if skill with such name exists.';
var ERROR_CLUSTER_SKILL_NAME_EXISTS = exports.ERROR_CLUSTER_SKILL_NAME_EXISTS = 'Skill with this name already exists in current skills cluster.';
var ERROR_CLUSTER_PARAMS_GETTER = exports.ERROR_CLUSTER_PARAMS_GETTER = 'Passed params (rules) to the traversal should have <get> and <set> methods, that returns current params/rules.';
var ERROR_CLUSTER_PARAMS_SKILLS_ARRAY = exports.ERROR_CLUSTER_PARAMS_SKILLS_ARRAY = 'Passed <skills> param inside rules should be an array.';