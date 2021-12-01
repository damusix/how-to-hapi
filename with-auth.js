const Hapi = require('@hapi/hapi');
const BasicAuth = require('@hapi/basic');
const JwtAuth = require('@hapi/jwt');

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

    await server.register(JwtAuth);
    await server.register(BasicAuth);

    server.auth.strategy('http', 'basic', {
        validate: (req, user, pass, h) => {

            if (user === 'pepe' && pass === 'papa') {

                return {
                    credentials: { user },
                    isValid: true
                };
            }

            return { isValid: false, credentials: {} };
        }
    });

    const VerifyConf = {
        aud: 'urn:audience:weee',
        iss: 'urn:issuer:weee',
        sub: false,
        maxAgeSec: 14400
    };

    server.auth.strategy('jwt', 'jwt', {

        keys: 'secret',
        verify: VerifyConf,
        validate: (artifacts, request, h) => {

            return {
                isValid: true,
                credentials: { user: artifacts.decoded.payload.user }
            };
        }
    });

    const token = JwtAuth.token.generate(
        VerifyConf,
        { key: 'secret', algorithm: 'HS512' },
        { ttlSec: 14400 } // 4 hours
    );

    console.log(' ------------ ');
    console.log('User this token in your headers');
    console.log(' ------------ ');
    console.log(token);
    console.log(' ------------ ');

    server.route({

        method: 'GET',
        path: '/basic',
        handler: (req) => {

            return req.auth;
        },
        options: { auth: 'http' }
    });

    // * Set request header:
    // * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoiUGVwaXRvIEZsYXV0YSJ9.9PqZScCtEJLgyvQZCyDP_gzwYfmJ5X5grZSzy7TY3xc
    server.route({

        method: 'GET',
        path: '/jwt',
        handler: (req) => {

            return req.auth;
        },
        options: { auth: 'jwt' }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();