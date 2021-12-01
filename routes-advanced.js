const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');
const Hoek = require('@hapi/hoek');
const Joi = require('joi');

const init = async () => {

    const failAction = (_, __, err) => {
        throw err;
    }

    const server = Hapi.server({
        port: 3000,
        host: 'localhost',
        routes: {
            validate: { failAction },
            payload: { failAction },
            response: { failAction }
        }
    });

    /**
     * Lifecycle methods are, as defined by Hapi typings, a method
     * that takes a request, a response toolkit, and optionally an
     * error when referring to a failAction lifecycle method.
     *
     * type Lifecycle.Method = (request: Request, h: ResponseToolkit, err?: Error) => ReturnValue;
     */

    server.ext('onPreResponse', (request, h) => {

        console.log(request.method, request.path, {
            query: request.query,
            payload: request.payload,
            params: request.params,
            pre: request.pre,
            app: request.app,
            auth: request.auth
        });

        return h.continue;
    });

    /**
     * Prerequests are functions that need to run and process
     * information before they reach the actual handler. They
     * are used to gather data that will be later used in the
     * handler and are TYPICALLY reusable. Examples usage of
     * a pre-request are:
     *
     * - Authorization (is a user allowed?)
     * - Fetch user from DB based on auth
     * - Fetch from a 3rd party service
     */

    server.route({

        method: 'GET',
        path: '/pres',
        handler: (request) => {

            return request.pre;
        },
        options: {
            pre: [
                {
                    assign: 'nameThatIWantToAssign',
                    method: (request, h) => {

                        return 'the value that I want'
                    }
                },

                {
                    assign: 'otherName',
                    method: (request, h) => {

                        return 'weewooweewoo'
                    },
                    failAction: console.log
                },

                {
                    assign: 'willFail',
                    method: (request, h) => {

                        throw Error('oops')
                    },
                    failAction: 'log'
                },
            ]
        }
    });

    // request.app

    /**
     * The `app` variable is a volatile, mutable object used to
     * carry information across the lifecycle of a request. It
     * can be used in any extensions, pres, or plugins that gain
     * access to a request object in the request lifecycle.
     */

    const sampleExtHelper = (name) => ({
        method: (request, h) => {

            // Attaches `name` to request app
            request.app[name] = true;


            return h.continue;
        }
    });

    server.route({
        method: 'get',
        path: '/request/app',
        handler: (request) => {

            return request.app;
        },
        options: {

            ext: {
                onPreResponse: sampleExtHelper('onPreResponse'),
                onPreAuth: sampleExtHelper('onPreAuth'),
                onPreHandler: sampleExtHelper('onPreHandler'),
                onCredentials: sampleExtHelper('onCredentials'),
            },
            pre: [
                {
                    method: (request) => {

                        request.app.pre = true;
                        return true
                    }
                }
            ]
        }
    })

    // auth

    /**
     * The auth object is a namespace that should be reserved
     * for the authenticated user or entity that is making the
     * current request. The way you gather this information
     * varies depending on the authentication protocol you are
     * using. Auth will only be available AFTER authentication
     * lifecycle event has been called.
     */

    // sample scheme
    server.auth.scheme('whatever', (server, options) => ({

        // This will always authenticate
        authenticate(_, h) {

            return h.authenticated({
                credentials: {
                    whateverUser: true
                }
            })
        }
    }));

    server.auth.strategy('wee', 'whatever');

    const sampleAuthExtHelper = ext => ({
        method: (request, h) => {

            request.app[ext] = { auth: Hoek.clone(request.auth) };

            return h.continue;
        }
    });

    server.route({
        method: 'get',
        path: '/auth',
        handler: (request) => {

            return {
                auth: request.auth,
                exts: request.app
            };
        },
        options: {
            auth: 'wee',
            ext: {
                onPreResponse: sampleAuthExtHelper('onPreResponse'),
                onPreAuth: sampleAuthExtHelper('onPreAuth'),
                onPreHandler: sampleAuthExtHelper('onPreHandler'),
                onCredentials: sampleAuthExtHelper('onCredentials')
            },
        }
    });


    // timeout

    /**
     * Routes are defaulted to NodeJS's 2 minute request timeout,
     * but can be configured to wait much longer times if needed.
     */

    server.route({
        method: 'get',
        path: '/delay',
        handler() {

            return new Promise(resolve => {

                setTimeout(() => resolve('ok'), 3 * 1000);
            });
        }
    });

    server.route({
        method: 'get',
        path: '/will-timeout',
        async handler() {

            const { result } = await server.inject({
                method: 'get',
                url: '/delay'
            });

            return result;
        },
        options: {
            timeout: {
                socket: 2 * 1000,
                server: 2 * 1000,
            }
        }
    });

    server.route({
        method: 'get',
        path: '/will-not-timeout',
        async handler() {

            const { result } = await server.inject({
                method: 'get',
                url: '/delay'
            });

            return result;
        }
    });

    // validations

    /**
     * One of the more powerful things in hapi is the way it
     * handles Route validations. Everything is done in a very
     * consistent way using @hapi/validator or joi. They are
     * both essentially the same library and have an almost
     * identical API. The good thing is, this is how all validations
     * are done in Hapi, so you only learn it once.
     */

    // ! Because Hapi uses @hapi/validator, you have to explicitly
    // ! tell it to use Joi. This is true on a per-realm (plugin) basis.
    server.validator(Joi);

    /**
     *
     * @param {string} method
     * @param {string} path
     * @param {import('@hapi/hapi').RouteOptions} options
     * @returns
     */
    const someRoute = (method, path, options) => ({
        path,
        options,
        method,
        handler: () => 'ok!',
    });

    server.route(someRoute('get', '/validate/query', {
        validate: {
            query: Joi.object({
                test: Joi.boolean().required(),
                toast: Joi.number().required(),
                taste: Joi.string().required(),
            }).required()
        }
    }));

    server.route(someRoute('post', '/validate/payload', {
        validate: {
            payload: Joi.object({
                test: Joi.boolean().required(),
                toast: Joi.number().required(),
                taste: Joi.string().required(),
            }).required()
        }
    }));

    server.route(someRoute('get', '/validate/params/{email}/{id}', {
        validate: {
            params: Joi.object({
                email: Joi.string().email().required(),
                id: Joi.string().uuid().required()
            }).required()
        }
    }));

    /**
     * Lifecycle methods all come with a repsonse toolkit.
     * Hapi's response toolkit allows us to do things with
     * the response that override the way Hapi would have
     * default handled that response.
     */

    const responseExtHelper = (ext, code) => ({

        /**
         *
         * @param {import('@hapi/hapi').Request} request
         * @param {import('@hapi/hapi').ResponseToolkit} h
         */
        method: (request, h) => {

            const response = h.response(ext).code(code);

            return response.takeover();
        }
    });

    server.route({
        method: 'get',
        path: '/response/takeover',
        handler: () => {

            return 'handler'
        },
        options: {
            auth: 'wee',
            ext: {
                onPreResponse: responseExtHelper('onPreResponse', 200),
                onPreAuth: responseExtHelper('onPreAuth', 400),
                onCredentials: responseExtHelper('onCredentials', 444),
                onPreHandler: responseExtHelper('onPreHandler', 401),
            },
        }
    });

    /**
     * One of the best features that Hapi has is a standardized
     * libray of response  errors. They follow HTTP error code
     * specification and can have data attached to them. All the
     * Boom error responses are JSON objects with information about
     * that error.
     */

    // boom errors
    server.route({
        method: 'get',
        path: '/boom/notFound',
        handler: () => {

            return Boom.notFound('oops not found')
        }
    });

    server.route({
        method: 'get',
        path: '/boom/badData',
        handler: () => {

            return Boom.badData('your data is bad', {
                some: 'data',
                that: 'is',
                bad: true
            })
        }
    });


    server.route({
        method: 'get',
        path: '/boom/throw',
        handler: () => {

            throw Boom.paymentRequired('gibs me moneys', {
                howMuch: 'millions'
            });
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();