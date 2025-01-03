import { InternalRouter } from '../helpers/routeHandler';

const serverUrl = process.env.SERVER_URL || '/';

export default ({ app }: InternalRouter): void => {
    app.get('/auth/logout', (req, res) => {
        req.logout(() => null);
        res.redirect(serverUrl);
    });

    app.post('/auth/logout', (req, res) => {
        req.logout(() => null);
        res.json({ success: true });
    });
};
