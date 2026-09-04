# fittrack
Mit diesem Projekt möchte ich meine Hobbys und meine Arbeit verbinden. Fokus auf Gym

## API

Backend: Spring Boot, JWT-Auth, PostgreSQL. Deckt Kraft- (`Satz`) und Ausdauertraining (`AusdauerEinheit`) über dieselbe `Uebung`/`Training`/`TrainingAusfuehrung`-Struktur ab (`Uebung.typ` = `KRAFT` oder `AUSDAUER`).

Interaktive API-Doku (Swagger UI), sobald das Backend läuft:

```
http://localhost:8080/swagger-ui.html
```

OpenAPI-Spec (z.B. für lokale AI-Tools mit Function/Tool-Calling): `http://localhost:8080/v3/api-docs`

Ablauf für programmatischen Zugriff (auch für lokale AI-Agenten):
1. `POST /api/auth/login` mit Username/Passwort → liefert JWT.
2. JWT als `Authorization: Bearer <token>` bei allen weiteren Requests mitschicken.
3. Trainings/Uebungen anlegen, Workouts über `POST /api/training-ausfuehrungen` loggen.

### Wichtigste Endpoints

| Endpoint | Zweck |
|---|---|
| `/api/uebungen` | Uebungsdefinitionen (Kraft oder Ausdauer) |
| `/api/trainings` | Trainingspläne (Uebungen + Zielwerte) |
| `/api/training-ausfuehrungen` | Geloggte, tatsächlich durchgeführte Trainings |
