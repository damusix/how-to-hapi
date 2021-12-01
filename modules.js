/**
 * Hapi comes with a series of very useful modules to do
 * many things that are commonly availabe in other frameworks.
 * Here are some of the most useful ones:
 */

/**
 * ! Error Handling
 */

const Boom = require('@hapi/boom');

Boom.notFound(); // 404
Boom.badData(); // 422
Boom.badRequest(); // 400
Boom.unauthorized(); // 401
Boom.forbidden(); // 403
Boom.badGateway(); // 502
Boom.badImplementation(); // 500


/**
 * ! Utility
 */

const Hoek = require('@hapi/hoek');

const clone1 = Hoek.clone({ some: { object: true }});
const clone2 = Hoek.clone(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

const somedefaults = {
    a: 1,
    b: 2,
    c: 3
};

const someconfig = Hoek.applyToDefaults(somedefaults, {
    a: 10,
    otherProp: 11
});

console.log(someconfig);

const waitForIt = async () => await Hoek.wait(1000 * 10);

Hoek.merge({ a: 1 }, { b: 2 });

Hoek.deepEqual([[0]], [[0]]);
Hoek.deepEqual({ a: 1, b: 2 }, { a: 1, b: 2 });
Hoek.deepEqual(new Map([['a', 1]]), new Map([['a', 1]]));
Hoek.deepEqual(new Set(1,2,3), new Set(1,2,3));
Hoek.deepEqual(Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72]));

const nestedObject = {
    apple: {
        banana: {
            carrot: {
                dates: {
                    eggplant: 0,
                    fig: 1
                }
            }
        }
    }
}

Hoek.reach(nestedObject, 'apple.banana.carrot.dates.fig');


// https://hapi.dev/module/teamwork
// https://hapi.dev/module/wreck
// https://hapi.dev/module/yar
// https://hapi.dev/module/podium