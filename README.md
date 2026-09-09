# Erhard Organisationszentrale

Das bestehende Schadenmanagement ist ein Fachmodul der persönlichen Organisationszentrale. Der neue, nur für Administratoren sichtbare Bereich bündelt Zeit, Planung, Finanzen, Rücklagen, Familie, Dokumentauslesung und E-Mail-Konten.

## Zusätzliche Konfiguration

- `ORGANIZATION_ENCRYPTION_KEY`: verschlüsselt IMAP-App-Passwörter serverseitig.
- `ORGANIZATION_VOICE_TOKEN`: schützt den iPhone-Kurzbefehl-Endpunkt.
- `ORGANIZATION_SYNC_TOKEN`: gemeinsamer Schlüssel zur ECG-App.
- In der ECG-App zusätzlich `ORGANIZATION_API_URL`, `ORGANIZATION_SYNC_TOKEN` und `ORGANIZATION_SYNC_USER_EMAIL` setzen.

Die Organisationstabellen werden beim ersten Aufruf sicher angelegt. Original-E-Mails werden nie gelöscht; beim Entfernen eines Kontos verschwindet nur die interne Verknüpfung.
