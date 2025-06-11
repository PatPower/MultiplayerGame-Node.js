const jwt = require('jsonwebtoken');
const axios = require('axios');

class CloudflareAuth {
    constructor() {
        this.teamDomain = process.env.CLOUDFLARE_TEAM_DOMAIN;
        this.policyAud = process.env.CLOUDFLARE_POLICY_AUD;
        this.certsUrl = process.env.CLOUDFLARE_CERTS_URL;
        this.publicKeys = null;
        this.lastKeyFetch = 0;
        this.keyRefreshInterval = 300000; // 5 minutes
    }

    async getPublicKeys() {
        const now = Date.now();
        if (!this.publicKeys || (now - this.lastKeyFetch) > this.keyRefreshInterval) {
            try {
                const response = await axios.get(this.certsUrl);
                this.publicKeys = response.data.public_certs;
                this.lastKeyFetch = now;
            } catch (error) {
                console.error('Failed to fetch Cloudflare public keys:', error);
                throw new Error('Unable to fetch authentication keys');
            }
        }
        return this.publicKeys;
    }

    async verifyToken(token) {
        try {
            const publicKeys = await this.getPublicKeys();
            
            // Decode the token header to get the key ID
            const decoded = jwt.decode(token, { complete: true });
            if (!decoded || !decoded.header.kid) {
                throw new Error('Invalid token format');
            }

            const keyId = decoded.header.kid;
            const publicKey = publicKeys.find(key => key.kid === keyId);
            
            if (!publicKey) {
                throw new Error('Public key not found');
            }

            // Verify the token
            const payload = jwt.verify(token, publicKey.cert, {
                algorithms: ['RS256'],
                audience: this.policyAud,
                issuer: `https://${this.teamDomain}`
            });

            return {
                valid: true,
                user: {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.name || payload.email.split('@')[0]
                }
            };
        } catch (error) {
            console.error('Token verification failed:', error);
            return { valid: false, error: error.message };
        }
    }

    middleware() {
        return async (req, res, next) => {
            const cfAccessJwt = req.headers['cf-access-jwt-assertion'];
            
            if (!cfAccessJwt) {
                return res.status(401).json({ error: 'No authentication token provided' });
            }

            const result = await this.verifyToken(cfAccessJwt);
            
            if (!result.valid) {
                return res.status(401).json({ error: 'Invalid authentication token' });
            }

            req.user = result.user;
            next();
        };
    }

    // For socket.io authentication
    async authenticateSocket(socket) {
        const token = socket.handshake.auth.token || socket.handshake.headers['cf-access-jwt-assertion'];
        
        if (!token) {
            throw new Error('No authentication token provided');
        }

        const result = await this.verifyToken(token);
        
        if (!result.valid) {
            throw new Error('Invalid authentication token');
        }

        return result.user;
    }
}

module.exports = CloudflareAuth;