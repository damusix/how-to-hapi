const Hapi = require('@hapi/hapi');
const Boom = require('@hapi/boom');

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

    server.ext('onPreHandler', (request, h) => {

        console.log(request.method, request.path, {
            query: request.query,
            payload: request.payload,
            headers: request.headers,
            params: request.params,
            auth: request.auth
        });

        return h.continue;
    })

    /**
     * One of the really cool things that Hapi gives you that
     * frameworks like Express don't is an API to create
     * different types of authentication. You can have one or
     * many auth mechanisms and even reuse them under different
     * names and different configurations. The way it works is
     * via route configuration, a scheme, and an implemented
     * strategy (of said scheme).
     */

    /**
     * This sample custom authentication. To use it, go to the
     * configured route with the query param `user`, or whatever
     * is required by `options.queryParam`.
     *
     * EG: http://localhost:3000/?user=pepe
     *
     * @param {import('@hapi/hapi').Server} server
     * @param {StrategyOptions} options
     * @returns
     */
    const MyLoginScheme = (server, options) => ({

        /**
         *
         * @param {import('@hapi/hapi').Request} request
         * @param {import('@hapi/hapi').ResponseToolkit} h
         * @returns
         */
        authenticate(request, h) {

            // If an option to use a custom parameter is set
            // then use that parameter instead of the default
            // which is `user`
            const { queryParameter } = options;

            let { user } = request.query;

            if (queryParameter) {
                user = request.query[queryParameter];
            }

            if (!user) {

                return Boom.unauthorized('you must provide a user in your request');
            }

            return h.authenticated({ credentials: { user } });
        }
    });

    server.auth.scheme('myLoginScheme', MyLoginScheme);

    // We're going to instantiate an auth strategy using
    // the defaults called 'user-param'
    server.auth.strategy('user-param', 'myLoginScheme');

    // And another with a custom query param called 'custom-param'
    server.auth.strategy('custom-param', 'myLoginScheme', {
        queryParameter: 'yuser'
    });

    server.route({

        method: 'GET',
        path: '/user-param',
        handler: (request) => {

            return request.auth;
        },
        options: { auth: 'user-param' }
    });

    server.route({

        method: 'GET',
        path: '/custom-param',
        handler: (request) => {

            return request.auth;
        },
        options: { auth: 'custom-param' }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();