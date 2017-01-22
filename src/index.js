import tail from 'lodash/tail';
import filter from 'lodash/filter';
import intersection from 'lodash/intersection';
import difference from 'lodash/difference';
import keys from 'lodash/keys';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import uniq from 'lodash/uniq';
import co from 'co';

import {
    ERROR_CLUSTER_NO_NAME,
    ERROR_CLUSTER_CANT_RUN_SKILL,
    ERROR_CLUSTER_SKILL_NAME_EXISTS,
    ERROR_CLUSTER_PARAMS_GETTER,
    ERROR_CLUSTER_PARAMS_SKILLS_ARRAY,
    ERROR_CLUSTER_NO_EXISTING_SKILL
} from './errors';

export default class Cluster {
    constructor(name, params) {
        if (!name) {
            throw new Error(ERROR_CLUSTER_NO_NAME);
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
    buildDecisionTree(builder) {
        return co(builder);
    }

    /**
     * Get only existing skills in current cluster instance
     * @param skills array of skills in shape [{ name: string, lambda: function/generator }]
     * @returns array of skills in shape [{ name: string, lambda: function/generator }]
     */
    filterExistingSkills(skills) {
        return intersection(skills, keys(this.skills));
    }

    /**
     * Get only unexistent skills in current cluster instance
     * @param skills array in shape [{ name: string, lambda: function/generator }]
     * @returns array of skills in shape
     */
    filterNonexistentSkills(skills) {
        return difference(skills, keys(this.skills));
    }

    /**
     * Run queue traversal process
     * @param queue
     * @param params can be any object, that you want to pass between skills; usually there are rules, like { silent: false }; better to use immutable structures
     * @returns Promise
     */
    traverse(queue, params = {}) {
        if (queue.length) {
            return this.run(queue[0], params)
                .then(newParams => {
                    const { rules } = newParams;
                    if (!rules || !rules.get || !rules.set) {
                        throw new Error(ERROR_CLUSTER_PARAMS_GETTER);
                    }

                    const skillsToAdd = rules.get('skills') || [];
                    if (!isArray(skillsToAdd)) {
                        throw new Error(ERROR_CLUSTER_PARAMS_SKILLS_ARRAY);
                    }

                    const skillsToSkip = rules.get('skip');

                    // Add to queue only existing skills
                    const existingSkillsToAdd = this.filterExistingSkills(skillsToAdd);
                    let newQueue = uniq(existingSkillsToAdd.concat(tail(queue)));

                    // And save unexistent skills for the future skills clusters traversal
                    rules.set({
                        skills: this.filterNonexistentSkills(skillsToAdd)
                    });

                    if (Boolean(skillsToSkip)) {
                        if (skillsToSkip === '*') {
                            newQueue = [];
                        }
                        if (isArray(skillsToSkip)) {
                            newQueue = uniq(filter(tail(queue), skillName => !~skillsToSkip.indexOf(skillName)));
                        }
                    }

                    return this.traverse(newQueue, Object.assign({}, newParams, { rules }));
                })
                .catch(error => {
                    if (this.params.errorHandler && isFunction(this.params.errorHandler)) {
                        this.params.errorHandler(error);
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
    run(skillName, params) {
        if (skillName && typeof skillName === 'string') {
            if (!this.skills[skillName]) {
                throw new Error(`${ERROR_CLUSTER_NO_EXISTING_SKILL} Skill name: ${skillName}`);
            }
            return this.skills[skillName].call(this, params);
        }

        if (skillName && typeof skillName === 'function') {
            return skillName.call(this, params);
        }

        throw new Error(ERROR_CLUSTER_CANT_RUN_SKILL);
    }

    /**
     * Add skill (function/generator) to the current cluster
     * @param skill with shape { name: string, lambda: function/generator }
     * lambda should always return Promise
     */
    plugSkill(skill) {
        const {
            name,
            lambda
        } = skill;

        if (this.skills[name]) {
            throw new Error(ERROR_CLUSTER_SKILL_NAME_EXISTS);
        }

        this.skills[name] = co.wrap(lambda);
    }

    /**
     * Add array of skills to the current skills cluster
     * @param skills
     */
    plug(skills) {
        if (isArray(skills)) {
            skills.forEach(this.plugSkill);
        } else {
            this.plugSkill(skills);
        }
    }
}
