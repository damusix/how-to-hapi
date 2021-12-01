const Hapi = require('@hapi/hapi');

/**
 * This route will be shared by the outer realm and plugin realm.
 * Even though it has the same configuration, it will be able to
 *
 */
const SomeRoute = {
    method: 'get',
    path: '/some-route',
    handler(request) {

        return 'ok!';
    }
}

/**
 * Plugins are nothing more than an encapsulation of functionality;
 * they are simply a way to organize code into sections. The difference
 * is that Hapi allows us to give some special configuration to plugins,
 * such as route configs, which will make this configuration only available
 * in the `realm` of that plugin.
 */
const SomePlugin = {

    name: 'some-plugin',
    version: '1',
    register: (server, options) => {

        console.log(options);

        server.route(SomeRoute);
    }
}

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
            auth: request.auth,
        });

        return h.continue;
    })

    // ! Even though this is a valid way of registering a plugin,
    // ! it will throw an error because of conflicting routes.
    // ? await server.register(SomePlugin)

    // * In order to pass plugin options, and registration options,
    // * a plugin must be registered as follows:
    await server.register(
        {
            plugin: SomePlugin,
            options: {
                pepe: true,
                cazzo: true,
                popo: '12345'
            }
        },
        {
            routes: {
                prefix: '/plugin'
            }
        }
    )

    server.route(SomeRoute);

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();