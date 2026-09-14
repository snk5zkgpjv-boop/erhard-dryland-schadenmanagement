# Projektstand – Organisationstool / Erhard Organisationszentrale

Stand: 14.09.2026. Code-Grundlage main `470a3ab`; keine neue funktionale Veröffentlichung durch diese Dokumentationsarbeit.

## Verantwortungsbereich

Admin-Bereich `/organization`: Zeit, Planung, Finanzen, Rücklagen, Familie, E-Mail-Konten und Dokumentauslesung. Fachliche Schadensbearbeitung bleibt im [Schadensmanagement](../schadensmanagement/PROJEKTSTAND.md). Keine Gleichsetzung mit der ECG-App oder einem Pizzeria-Lagersystem.

Code: `components/organization/OrganizationHub.tsx`, `lib/organization.ts`, `app/api/organization/*`. Zeitdaten enthalten Tätigkeiten, Kunden-/Ortsangaben, Entwurf/bestätigt, Abrechenbarkeit, Stunden- und Fahrtpauschalen. Dies ist kein Nachweis einer automatischen Rechnungsstellung.

## Schnittstellenvertrag ECG → Organisation

Empfänger: `POST /api/organization/ecg-sync`; gemeinsamer Bearer-Schlüssel `ORGANIZATION_SYNC_TOKEN`. Sender wird in ECG über `ORGANIZATION_API_URL` und `ORGANIZATION_SYNC_USER_EMAIL` konfiguriert.

- Payload `{entries:[...]}`; Felder `id`, `start`, `end`, `workLabel`, `note`, `volunteer`.
- Höchstens 1000 Einträge pro Request; ungültige Einträge ohne ID/Start übersprungen.
- Speicherung in `org_time_entries` als `source=ecg`, `area=ecg`.
- Zuordnung aktuell zum zuerst angelegten aktiven Administrator des Empfängers; diese Einschränkung vor Mehrmandantenbetrieb klären.
- Idempotenz durch `(owner_id,source,external_id)`; wiederholte Übertragung aktualisiert Inhalt.
- Keine Löschweitergabe allein aufgrund fehlender Quelleinträge; kein Rückkanal nach ECG.
- Fehler: ungültiger Schlüssel 401; kein Administrator 503; sonstiger Verarbeitungsfehler 500. Sender prüft HTTP-Fehler derzeit nicht ausdrücklich.
- Konfiguration und reale Synchronisation nicht Ende-zu-Ende geprüft.

## Weitere Verbindungen und Abgrenzungen

Private ChatGPT-Zeiterfassung ist laut main-Commit integriert; Routen unter `app/mcp` und `app/oauth` vorhanden. Authentifizierung und aktuelle Verbindung nicht erneut getestet. Sprach-Endpunkt `/api/organization/voice`, Dokumentanalyse und Mail-Sync sind im Code vorhanden; Zugangsdaten niemals dokumentieren.

Überlieferte Ausbauziele: Wochen-/Kundenauswertung, Rechnungsvorschläge, globale Nummernfolge und gemeinsame Kundenverwaltung. Nicht als fertige modulübergreifende Automatik markieren, bevor API, Datenmodell und Ergebnis geprüft wurden.

## Tests / Status

Am 14.09.2026 Quellcode des ECG-Empfängers, Organisationsdaten-Endpunkts, UI-Felder und README geprüft. Kein neuer Next.js-Build oder Benutzer-/Datenbanktest für die reine Dokumentationsänderung. Vorschau und Produktionsdeployment bei zukünftigen Funktionsänderungen separat nachweisen.

## Fortsetzung

Zeit-Sync inklusive Fehlern, Benutzerzuordnung und Löschverhalten testen. Angebots-/Rechnungsübergabe und Artikel-KI als eigenen Auftrag mit dem Fachmodul abstimmen. Nach bestätigten Änderungen diese Datei aktualisieren.
