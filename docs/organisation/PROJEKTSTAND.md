# Projektstand – Organisationstool / Erhard Organisationszentrale

Stand: 04.10.2026. Technische Übergabe; historische Releases und Prüfungen sind unten datiert. Diese Aktualisierung betrifft ausschließlich Dokumentation.

## Verantwortungsbereich

Admin-Bereich `/organization`: Zeit, Planung, Finanzen, Rücklagen, Familie, E-Mail-Konten und Dokumentauslesung. Fachliche Schadensbearbeitung bleibt im [Schadensmanagement](../schadensmanagement/PROJEKTSTAND.md). Keine Gleichsetzung mit der ECG-App oder einem Pizzeria-Lagersystem.

Code: `components/organization/OrganizationHub.tsx`, `lib/organization.ts`, `app/api/organization/*`. Zeitdaten enthalten Tätigkeiten, Kunden-/Ortsangaben, Entwurf/bestätigt, Abrechenbarkeit, Stunden- und Fahrtpauschalen. Dies ist kein Nachweis einer automatischen Rechnungsstellung.

## Schnittstellenvertrag ECG → Organisation

Empfänger: `POST /api/organization/ecg-sync`; gemeinsamer Bearer-Schlüssel `ORGANIZATION_SYNC_TOKEN`. Sender wird in ECG über `ORGANIZATION_API_URL` und `ORGANIZATION_SYNC_USER_EMAIL` konfiguriert.

- Payload `{ownerEmail,entries:[...]}`; Felder `id`, `start`, `end`, `workLabel`, `note`, `volunteer`.
- Höchstens 1000 Einträge pro Request; ungültige Einträge ohne ID/Start übersprungen.
- Speicherung in `org_time_entries` als `source=ecg`, `area=ecg`.
- Zuordnung ausschließlich zu einem aktiven Konto mit der explizit übermittelten Eigentümer-E-Mail; kein Fallback zum ersten Administrator.
- Idempotenz durch `(owner_id,source,external_id)`; wiederholte Übertragung aktualisiert Inhalt.
- Keine Löschweitergabe allein aufgrund fehlender Quelleinträge; kein Rückkanal nach ECG.
- Fehler: ungültiger Schlüssel 401; kein passendes Konto 503; sonstiger Verarbeitungsfehler 500. Sender prüft HTTP-Status und bestätigte Anzahl.
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

## Datenpflege und Übergabe – 23.09.2026

Bestehende Produktionsdatenbanken wurden getrennt zugeordnet und autorisierte fehlende Zeitbuchungen nach Abgleich ergänzt. ECG-Übernahmen behalten source=ecg und die ursprüngliche external_id; Kundeneinsätze liegen unter source=organization im Organisationssystem. Wiederholungen werden über externe Kennungen und Abgleich vorhandener Zeiträume abgefangen. Datenänderungen sind in org_audit_log protokolliert. Einzelbuchungen, Kundenangaben, Infrastrukturkennungen und Zugangsdaten gehören nicht in dieses öffentliche Repository.

Nachübertragene Daten wurden per Datenbankabfrage geprüft; aktualisierte ECG-Wochensummen und nachgetragene Kundeneinträge zusätzlich in der angemeldeten Organisationsoberfläche gesehen. Spätere einzelne Ergänzungen wurden durch Datenbankergebnisse bestätigt. Dies belegt die Datenpflege, nicht einen automatischen End-to-End-Synchronisationslauf.

Wichtig: Direkte SQL-Ergänzungen in der ECG-Datenbank lösen den API-basierten Zeit-Sync nicht aus. Nach einer solchen Ergänzung die autorisierte Übertragung gesondert ausführen und den Empfänger prüfen. Automatischen Sync und echten Sprach-/Mikrofonablauf weiterhin gesondert testen. Keine Rechnung wurde durch die Zeitnachträge erzeugt.

AGENTS.md verlangt jetzt ausdrücklich die Pflege dieses Projektstands vor Abschluss technischer Änderungen, auch in neuen Chats. Reine Zeitbuchungen bleiben in der Datenbank und benötigen keinen öffentlichen Commit pro Einsatz. Kein Hintergrunddienst zur Erkennung externer Änderungen eingerichtet.


## Diagnose ECG-Zeitübertragung – 04.10.2026

Produktionslogs des Organisationsempfängers zeigen wiederholte POST /api/organization/ecg-sync mit HTTP 503. Der zugehörige veröffentlichte Empfängercode und die Middleware wurden anhand des Produktionscommits gelesen: Die Route ist von der normalen Sitzungsprüfung ausgenommen; ihr expliziter 503-Pfad bedeutet, dass kein aktives app_users-Konto zur übermittelten ownerEmail gefunden wurde. Dies grenzt den Fehler auf die Eigentümerzuordnung ein; ob die E-Mail fehlt, abweicht oder das Konto inaktiv ist, wurde nicht durch Datenbankabgleich bestätigt. Andere Route-Fehler liefern 401 oder 500.

Sendercode auf main geprüft: Synchronisation erfolgt nach API-Speicherungen, direkte SQL-Zeitnachträge lösen sie nicht aus. Kein dauerhafter Hintergrundabgleich oder Löschabgleich vorhanden. Die benötigten Produktions-Konfigurationsnamen sind in Vercel vorhanden; geschützte Werte wurden vom Connector nicht ausgegeben. Der verfügbare Neon-Connector verlangt eine konkrete Projekt-ID und bietet keine Projektauflistung; kein authentifizierter Neon-CLI-Zugang vorhanden. Deshalb keine Prüfung der konkreten Zeitlisten, kein Kontofix und keine Nachübertragung ausgeführt. Kein neuer Funktionsstand veröffentlicht; dies ist ausschließlich ein Diagnose-/Dokumentationsnachtrag.

Nächster Schritt: Projektzuordnung der Produktionsdatenbanken herstellen, konfigurierte Eigentümer-E-Mail mit aktivem Organisationskonto abgleichen, fehlende Quellkennungen idempotent nachübertragen und automatische API-Übertragung Ende-zu-Ende prüfen. Für direkte Datenbanknachträge bleibt zusätzlich ein verlässlicher Abgleich erforderlich. Keine privaten Betriebsdaten oder Zugangsdaten in dieser Dokumentation.


## ECG-Abruf beim Öffnen – 04.10.2026

Implementiert: Organisation wartet in der Wochenübersicht auf einen serverseitigen ECG-Abgleich; die Oberfläche lädt die Zeitliste erst danach. Ein fehlgeschlagener Abruf zeigt eine Fehlermeldung und erhält den bisherigen Datenstand. Serverinstanzen versuchen beim Start ebenfalls den Abgleich der bereits verknüpften Quelle, damit fehlende Einträge nachgetragen werden. Der Abruf verwendet ECG_API_URL und den bestehenden gemeinsamen Synchronisationsschlüssel ausschließlich serverseitig.

ECG ergänzt GET /api/state?organizationExport=1: Bearer-Prüfung vor dem Datenlesen, no-store, nur abgeschlossene Einträge des eindeutig konfigurierten aktiven ECG-Eigentümers, keine anderen Benutzer, laufenden Timer, Fotos oder übrigen App-Daten. Organisation prüft vollständige Zeitliste und externe Kennungen vor dem Schreiben. Wiederholungen sind idempotent; unveränderte Einträge erzeugen keine zusätzlichen Audit-Einträge. Kein Löschabgleich.

Kontozuordnung: exakter aktiver E-Mail-Treffer oder eindeutiger aktiver Eigentümer bereits vorhandener ECG-Importe mit übereinstimmenden externen Quellkennungen. Widersprüchliche oder mehrdeutige Zuordnungen werden abgewiesen; kein Fallback auf den ersten Administrator. Beim angemeldeten Abruf darf nur das verknüpfte Konto importieren. Der bestehende Push nutzt dieselbe Prüfung.

Tatsächlich geprüft: synthetische Node-Prüfungen für Schlüssel, Quellfilter/Datenschutz, aktiven/eindeutigen Eigentümer, historische Zuordnung, widersprüchliche Eigentümer sowie ungültige/doppelte Zeiträume bestanden; ECG-State-Syntax bestanden. Veröffentlichung und Produktionsnachtrag werden anschließend separat verifiziert. Keine privaten Betriebsdaten oder Zugangsdaten dokumentiert.

Produktionsnachweis: Beide Funktionsstände am Produktivalias READY. Organisation-Build einschließlich TypeScript-Prüfung bestanden. Produktiver Instanzstart meldete erfolgreichen ECG-Abgleich; fehlende bzw. geänderte Buchungen wurden übernommen. Node-Integrationstest des tatsächlichen Synchronisationsmoduls mit synthetischer Datenbank bestätigt historische Verknüpfung, Import/Rücklesen, unveränderte Wiederholung ohne doppeltes Audit, Ausschluss fremder Eigentümer und Datenerhalt bei HTTP-Fehler. Der Import liest zur Bestätigung die betroffenen Quellkennungen und Inhalte aus der Empfängerdatenbank zurück. Persönliche Mengen/Zeitinhalte bleiben außerhalb dieser öffentlichen Dokumentation.
