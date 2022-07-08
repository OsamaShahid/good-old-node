// TODO: routing, engines are beyond the scope of requirements...
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';


const HTTP_STATUS_CODES = {
    OK: 200,
    INTERNAL_SERVER_ERROR: 500,
}

// Ports
const HTTP_PORT = process.env.HTTP_PORT || 8080
const HTTPS_PORT = process.env.HTTPS_PORT || 443

// Server Options
const httpsCertBasePath = join(dirname( fileURLToPath(import.meta.url) ), 'cert');

// Request Handler
const requestHandler = (req, res) => {
    try {
        console.log({
            'ip': req.ip,
            req: {
                method: req.method,
                url: req.url,
                remoteAddress: req.ip
            },
            res: {statusCode: res.statusCode}
        });
        res.statusCode = HTTP_STATUS_CODES.OK;
        res.setHeader('Content-Type', 'application/json');
        res.write(`{ 'success': true, 'message': 'Request was served...' }`);
        res.end();
    } catch (error) {
        console.error(`Error Occurred while processing this request, error`, error);
        req.statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
        res.setHeader('Content-Type', 'application/json');
        res.write(`{ 'success': false, 'message': 'Oops! Couldn't process your request' }`)
        res.end();
    }
}
// WebSocket Handler
const serverWebSocket = (server) => {
    import('ws')
    .then(ws => {
        console.log('Starting WebSocket at ', server.address().port)
        const { WebSocketServer } = ws;
        const wss = new WebSocketServer({server: server});
        wss.on('connection',(ws) => {
            console.info('Socket Server:: A new client connected');
            ws.send('Welcome new client!!');
            ws.on('message', (message) => {
                console.info('received: %s', message);
                ws.send(`Socket server received your message:: ` + message);
            });
        });
    })
}

const init = () => {
    // Starting HTTP Server;
    import('http')
    .then((http) => {
        const { createServer } = http
        const httpServer = createServer({port: HTTP_PORT}, requestHandler);
        httpServer.listen(HTTP_PORT, () => console.info(`Server running at http://localhost:${HTTP_PORT}`));
        // Starting websocket over http
        serverWebSocket(httpServer)
    });

    // If Certificate found start HTTPS server
    if(existsSync(join(httpsCertBasePath, '/key.pem')) && existsSync(join(httpsCertBasePath, '/certificate.pem'))) {
        import('https')
        .then((https) => {
            const { createServer } = https
            const httpsServerOptions = {
                port: HTTPS_PORT,
                key: readFileSync(join(httpsCertBasePath, '/key.pem')),
                cert: readFileSync(join(httpsCertBasePath, '/certificate.pem')),
            }
            const httpsServer = createServer(httpsServerOptions, requestHandler);
            // Server Listen
            httpsServer.listen({port: HTTPS_PORT}, () => console.info(`Server running at https://localhost:${HTTPS_PORT}`));
        });

    }
}

init();