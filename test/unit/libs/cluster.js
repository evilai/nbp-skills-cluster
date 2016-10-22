import Cluster from '../../../src/index';
import { expect } from 'chai';

import { skill, skillDelayed } from './fixtures/skills';
import { rules, rulesWithNonexistingSkills, rulesWithExistingSkills } from './fixtures/rules';

import {
    ERROR_CLUSTER_NO_NAME,
    ERROR_CLUSTER_CANT_RUN_SKILL,
    ERROR_CLUSTER_SKILL_NAME_EXISTS,
    ERROR_CLUSTER_PARAMS_GETTER,
    ERROR_CLUSTER_PARAMS_SKILLS_ARRAY,
    ERROR_CLUSTER_NO_EXISTING_SKILL
} from '../../../src/errors';

describe('Cluster', () => {
    let cluster;

    beforeEach(() => {
        cluster = new Cluster('testCluster');
    });

    describe('instance', () => {
        it('should have basic fields', () => {
            const requiredKeys = ['name', 'skills', 'plugSkill', 'params'];
            expect(cluster).to.have.keys(requiredKeys);
        });

        it('should have basic methods', () => {
            expect(cluster).to.have.property('plug');
            expect(cluster.plug).to.be.a('function');

            expect(cluster).to.have.property('traverse');
            expect(cluster.traverse).to.be.a('function');

            expect(cluster).to.have.property('run');
            expect(cluster.run).to.be.a('function');
        });

        it('should add skills to the cluster one by one', () => {
            cluster.plugSkill(skill);
            cluster.plugSkill(skillDelayed);
            expect(cluster.skills).to.have.keys(['skill', 'delayedSkill']);
        });

        it('should add array of skills to the cluster', () => {
            cluster.plug([skill, skillDelayed]);
            expect(cluster.skills).to.have.keys(['skill', 'delayedSkill']);
        });

        it('should run a paticular skill', (done) => {
            cluster.plug([skill, skillDelayed]);
            cluster.run('delayedSkill', { rules, done });
        });

        it('should build a decision tree', (done) => {
            const builder = cluster.buildDecisionTree(() => Promise.resolve(['skill', 'delayedSkill']));
            builder.then(tree => tree.length === 2 ? done() : null);
        });

        it('should run tree traverse', (done) => {
            cluster.plug([skill, skillDelayed]);
            const builder = cluster.buildDecisionTree(() => Promise.resolve(['skill', 'delayedSkill']));
            builder.then(tree => cluster.traverse(tree, { rules, done }));
        });

        it('should run return not existing skills in rules', (done) => {
            cluster.plug([skill, skillDelayed]);
            const builder = cluster.buildDecisionTree(() => Promise.resolve(['skill']));
            builder.then(tree => cluster.traverse(tree, { rules: rulesWithNonexistingSkills }).then(context => {
                context.rules.get('skills')[0] === 'nonExistingSkill' ? done() : null;
            }));
        });

        it('should run add existing skills to the tree from rules', (done) => {
            cluster.plug([skill, skillDelayed]);
            const builder = cluster.buildDecisionTree(() => Promise.resolve(['skill']));
            builder.then(tree => cluster.traverse(tree, { rules: rulesWithExistingSkills, done }));
        });
    });
});
