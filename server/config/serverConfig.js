// Configuration du serveur
export const SERVER_CONFIG = {
    HOST: 'localhost',
    PORTS: {
        MAIN: 5183,          // Port principal pour l'API
        FILE: 5183,          // Port pour le service de fichiers
        WEBSOCKET: 5183,     // Port pour les WebSockets
        TEMP: 5183           // Port pour les fichiers temporaires
    },
    get BASE_URL() {
        return `http://${this.HOST}:${this.PORTS.MAIN}`;
    },
    get FILE_URL() {
        return `http://${this.HOST}:${this.PORTS.FILE}`;
    },
    get WS_URL() {
        return `ws://${this.HOST}:${this.PORTS.WEBSOCKET}`;
    },
    get TEMP_URL() {
        return `http://${this.HOST}:${this.PORTS.TEMP}`;
    }
};

export default SERVER_CONFIG;
