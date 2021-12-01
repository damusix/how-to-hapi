const Hapi = require('@hapi/hapi');
const Hoek = require('@hapi/hoek');
const CatboxRedis = require('@hapi/catbox-redis');
const CatboxMemory = require('@hapi/catbox-memory');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',

        // Raw instantiation of a hapi server requires you to
        // pre-determine what caches will be used throughout
        // your application. You do that here in the server
        // cache option.
        cache: [
            {
                name: 'ram',
                provider: {
                    constructor: CatboxMemory
                }
            },
            {
                name: 'redis',
                provider: {
                    constructor: CatboxRedis,
                    options: {
                        host: 'localhost',
                        port: 6379,
                        db: 0
                    }
                }
            }
        ]
    });


    /**
     * Hapi has a concept of server method which allow us to extend
     * our server's API while giving us a robust set of tools along
     * with it. Before we understand caching, we should understand
     * server methods.
     */

    server.method('myMethodName', (...args) => {

        console.log('my method was called');

        return { args };
    });


    server.route({

        method: 'GET',
        path: '/myMethodName',
        handler: () => {

            return server.methods.myMethodName(1,2,3);
        }
    });

    /**
     * https://hapi.dev/api?v=20.2.0#-servercacheoptions
     * Next, lets take a look at how we can create a cache
     */

    // before we can continue with caching examples, the server
    // must be initialized
    await server.initialize();

    /**
     * We are going to use RAM for this example but you can use
     * any cache that is provisioned. RAM will not survive restarts
     * due to the fact that data is stored in memory and is
     * garbage collected on process exit.
     */

    const memoryCache = server.cache({
        cache: 'ram',
        segment: 'memoryCache',
        expiresIn: 60 * 60 * 1000
    });

    // This will return null
    console.log(`memoryCache.get('someKey')`, await memoryCache.get('someKey'));

    await memoryCache.set('someKey', { memory: true });

    // Now it returns the object we set it.
    console.log(`memoryCache.get('someKey')`, await memoryCache.get('someKey'));


    /**
     * Additionally, we will do the same thing, but in redis.
     * If you have Redis Commander, open it so you can see
     * how Hapi stores values in there. Otherwise, pop open
     * redis-cli and take a peek. This data DOES survive restarts
     * because redis acts as the application's distributed memory.
     * This is how the state of the server can be replicated across
     * a horizontally scaled app.
     */

    const redisCache = server.cache({
        cache: 'redis',
        segment: 'redisCache',
        expiresIn: 60 * 60 * 1000
    });

    // This will return null initially, but then will be a real object
    console.log(`redisCache.get('someKey')`, await redisCache.get('someKey'));

    await redisCache.set('someKey', { redis: true });

    // Now it returns the object we set it.
    console.log(`redisCache.get('someKey')`, await redisCache.get('someKey'));



    /**
     * Using this same implmementation, Hapi under the hood applies
     * these cache strategies to server methods allowing us to create
     * computationally expensive functionality and cross-server
     * functionality that only take long once.
     */

    // This method will take 5 seconds on purpose, only the first time

    /**
     *
     * @param  {...any} args
     * @returns {Array} [Date, ...args]
     */
    const theSlowMethod = (...args) => {

        console.log('generating', ...args);
        return new Promise(resolve => {

            setTimeout(() => resolve([new Date(), ...args]), 5000);
        })
    };

    server.method('reallySlowQuery', theSlowMethod, {
        cache: {
            cache: 'redis',
            generateTimeout: 6 * 1000, // it should not take longer than 6 seconds
            expiresIn: 30 * 1000, //expires in 30 seconds
            staleIn: 2 * 1000, // is stale in 2 seconds and will re-run,
            staleTimeout: 50 // if re-running takes longer than 50ms, return cached
        },
        generateKey: (...args) => {

            // we will generate a redis key based on the args passed
            return args.join('-');
        }
    });

    // This will take 5 seconds
    console.log('server.methods.reallySlowQuery(1)', await server.methods.reallySlowQuery(1));

    // This will be instantaneous
    console.log('server.methods.reallySlowQuery(1)', await server.methods.reallySlowQuery(1));

    // This will take 5 seconds
    console.log('server.methods.reallySlowQuery(`another arg`)', await server.methods.reallySlowQuery('another arg'));

    // This will be instantaneous
    console.log('server.methods.reallySlowQuery(`another arg`)', await server.methods.reallySlowQuery('another arg'));

    // Lets wait 2 seconds to trigger a stale cache
    await Hoek.wait(2000);

    // The cached version will be returned
    console.log('server.methods.reallySlowQuery(1)', await server.methods.reallySlowQuery(1));

    // Lets wait 5 seconds to allow the running cache to regenerate
    await Hoek.wait(5000);

    // Stale version should have been update with latest version
    console.log('server.methods.reallySlowQuery(1)', await server.methods.reallySlowQuery(1));

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();