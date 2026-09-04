// Nutzt denselben Host, ueber den das Frontend selbst aufgerufen wurde (localhost oder LAN-IP),
// damit die App unveraendert vom Handy im selben WLAN erreichbar ist.
export const API_BASE = `${location.protocol}//${location.hostname}:8080/api`;
