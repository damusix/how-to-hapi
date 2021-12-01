const Hapi = require('@hapi/hapi');

const html = (title, path, json) => `
    <html>
        <head>

            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css" integrity="sha512-NmLkDIU1C/C88wi324HBc+S2kLhi08PN5GDeUVVVC/BVt/9Izdsc9SVeVfA1UZbY3sHUlDSyRXhCzHfr6hmPPw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/default.min.css">
            <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js"></script>

            <style>
                body { font-size: 20px; padding: 2rem; }
            </style>
        </head>
        <body>
            <h1>Path: ${path}</h1>
            <h2>${title}</h2>
            <pre>
                <code class="language-json">${JSON.stringify(json, null, 4)}</code>
            </pre>

            <script>hljs.highlightAll();</script>
        </body>
    </html>
`;


const home = `

<html>
<head>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css" integrity="sha512-NmLkDIU1C/C88wi324HBc+S2kLhi08PN5GDeUVVVC/BVt/9Izdsc9SVeVfA1UZbY3sHUlDSyRXhCzHfr6hmPPw==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/styles/default.min.css">
    <script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/11.3.1/highlight.min.js"></script>

    <style>
        body { font-size: 20px; padding: 2rem; }
    </style>
</head>
<body>
    <h1>Home Page</h1>

    <h3>Test these pages:</h3>
    <ul>
        <li><a href='/query?my=sample&query=string&where=I&where=can&where=have&where=arrays'>Query Params</a></li>
        <li><a href='/param1/one-param'>URL Params</a></li>
        <li><a href='/param-optional/param1/this-is-optional'>Optional URL Params</a></li>
        <li><a href='/param-split/a-one/a-two'>Split URL Params</a></li>
        <li><a href='/param-many/i/can/have/as/many/params/as/i/want'>Many URL Params</a></li>
        <li><a href='/weewoooweewoo'>Default / Not Found</a></li>
    </ul>

    <h3>Payloads with Forms:</h3>

    <form name='method1' action='/payload' method='post'>
        <div class="mb-3">
            <label for="exampleInputEmail1" class="form-label">Email address</label>
            <input type="email" name="email" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
        </div>

        <div class="mb-3">
            <label for="exampleInputPassword1" class="form-label">How much wood?</label>
            <input type="text" name="how-much-wood" class="form-control" id="exampleInputPassword1" />
        </div>

        <div class="mb-3">
            <label for="noods" class="form-label">Send noods</label>
            <input type="file" name="noods" class="form-control" id="noods" />
        </div>

        <div class="mb-3 form-check">
            <input type="checkbox" class="form-check-input" id="exampleCheck1" name='pptouch'  value='yes' />
            <label class="form-check-label" for="exampleCheck1">PP Touch?</label>
        </div>

        <button type="submit" class="btn btn-primary">Submit</button>
    </form>

</body>
</html>
`

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    server.ext('onPreHandler', (request, h) => {

        console.log(request.method, request.path, {
            query: request.query,
            payload: request.payload,
            headers: request.headers,
            params: request.params
        });

        return h.continue;
    })


    server.route({

        method: 'GET',
        path: '/',
        handler: () => {

            return home
        }
    });

    server.route({

        method: 'GET',
        path: '/query',
        handler: (request) => {

            return html(`Query param parsers can be customized. These are your query params:`, request.path, request.query)
        }
    });

    server.route({

        method: 'POST',
        path: '/payload',
        handler: (request) => {

            return html('Payloads can be sent via forms, ajax jsons, and byte data. Payload content types are configuration. This is your payload:', request.path, request.payload)
        }
    });

    server.route({

        method: ['PUT', 'POST'],
        path: '/methods1',
        handler: (request) => {

            return html('Hiii. This is your method:', request.path, request.method);
        }
    });

    server.route({

        method: '*',
        path: '/methods2',
        handler: (request) => {

            return html('Hiii. This is your method:', request.path, request.method);
        }
    });

    server.route({

        method: 'GET',
        path: '/param1/{p1}',
        handler: (request) => {

            return html('Param. Here are your params:', request.path, request.params);
        }
    });

    server.route({

        method: 'GET',
        path: '/param-optional/{p1}/{optional?}',
        handler: (request) => {

            return html('Param. Here are your params:', request.path, request.params);
        }
    });

    server.route({

        method: 'GET',
        path: '/param-split/{params*2}',
        handler: (request) => {

            return html('Param. Here are your params:', request.path, request.params);
        }
    });

    server.route({

        method: 'GET',
        path: '/param-many/{params*}',
        handler: (request) => {

            return html('Param. Here are your params:', request.path, request.params);
        }
    });

    server.route({
        method: '*',
        path: '/{any*}',
        handler: function (request, h) {

            return html(
                'This is the default landing page, which will always return a 200 because we specified it. Otherwise, it would return a Boom JSON response with a 404 status error. Normally, you would output an 404 HTML page, or redirect the user to a valid page.',
                request.path,
                null
            );
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