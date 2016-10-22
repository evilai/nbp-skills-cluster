# Skills Cluster
This is a Skills Cluster for [Node.js Bot Platform](https://github.com/evilai/nodejs-bot-platform). Abilities of this Cluster:
* plug different Skills;
* build part of decision tree (a queue) of skills;
* run traverse.

## Skill
You can define a skill as an object with _name_ and _lambda_ fields:
```js
const skill = {
    name: 'skillName',
    lambda: function(context) {
        return Promise.resolve(context);
    }
};
```

Skill always should return a Promise, which resolve a context. Context is usually consist of services, that current bot used, and rules:
 
 ```js
 const skillLambda = function({ bot, rules }) {
    // The list of services is dependent on route-builder.js in Node.js Bot Platform repository 
    // bot.storage
    // bot.memcached
    // bot.messenger
    return Promise.resolve({ bot, rules });
 }
 ```
 
 Please, look at [usage example](https://github.com/evilai/nodejs-bot-platform/blob/master/src/bot/skills/clusters/happy-path/index.js).