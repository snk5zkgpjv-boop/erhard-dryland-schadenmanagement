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


## ECG-Mängelplanung – 23.09.2026

Feature-Branch ergänzt `org_ecg_issue_plans` und den Bearer-geschützten Empfänger `POST /api/organization/ecg-planning-sync`. Private ECG-Aufwandsschätzungen werden dem Organisationskonto über die konfigurierte Eigentümer-E-Mail zugeordnet und auf „Heute“ als offene ECG-Aufgaben samt geplanter Gesamtdauer und Anzahl ungeschätzter Aufgaben angezeigt. Sie bleiben von `org_time_entries` getrennt und zählen daher erst nach tatsächlicher Zeiterfassung als geleistete Wochenzeit. Der bestehende ECG-Zeitimport wurde ebenfalls von „erster aktiver Administrator“ auf explizite E-Mail-Zuordnung umgestellt.

Feature-Branch noch nicht als Live-Stand behaupten; Build, Vorschau und Produktionsfreigabe separat nachweisen.


## Direkte Spracheingabe in ECG – 23.09.2026

ECG ergänzt Aufnahme/Text → bearbeitbare Vorschau → explizite Bestätigung → eigene Zeitbuchungen. Der Organisations-Empfänger bleibt unverändert. Der aktuelle Vertrag enthält `{ownerEmail,entries}` und ordnet anhand der expliziten Eigentümer-E-Mail zu; kein Fallback zum ersten Administrator. Diese Angaben ersetzen die ältere Zuordnungsbeschreibung oben.

Der neue ECG-Sender verwendet den bestehenden Bearer-Kanal, prüft HTTP-Erfolg und `{ok:true,synced}` auf vollständige Übernahme und sendet große Listen in 500er-Blöcken. Speicherung in ECG bleibt bei Übertragungsfehlern erhalten; die ECG-Maske unterscheidet bestätigt, offen, nicht eingerichtet und nicht zuständig. Wiederholen ist manuell und beim nächsten normalen ECG-Speichern möglich, nicht über einen dauerhaften Hintergrundjob. Bestehende externe IDs ermöglichen idempotente Wiederholung. Weiterhin kein automatischer Löschabgleich oder Rückkanal.

Prüfung: Empfängercode auf main gelesen; Vertrag und Fehlerpfade im ECG-Projekt mit synthetischen Tests geprüft. Keine echten Testbuchungen und kein angemeldeter End-to-End-Test mit beiden Produktivsystemen. Veröffentlichung des Sprachfeatures siehe ECG-PROJEKTSTAND.md. Dieser Nachtrag ändert ausschließlich Dokumentation.
