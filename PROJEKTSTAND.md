# Projektstand – fachliche Trennung

Stand: 14.09.2026. Dieses Repository enthält technisch eine Anwendung mit zwei getrennt dokumentierten Verantwortungsbereichen:

- [Organisationstool](docs/organisation/PROJEKTSTAND.md): übergreifende Organisation und persönliche Zeit-/Finanzplanung.
- [Schadensmanagement](docs/schadensmanagement/PROJEKTSTAND.md): Schäden, Geräte, Fachberichte, Angebote und Rechnungen.
- [ECG Gebäudeverwaltungs-App](https://github.com/snk5zkgpjv-boop/ecg-gebaeudeverwaltung/blob/main/PROJEKTSTAND.md): eigenständiges Repository und Deployment.

Die Dokumentation teilt keine Datenbank auf und erzeugt kein neues Repository. Ausgangsstand bei Prüfung: main `470a3abcd7e7c69d6c8fc33d0781d93dbecbf126`. Diese Änderung betrifft ausschließlich Dokumentation, keine neue Funktionsfreigabe der Organisationszentrale.

## Schnittstellenübersicht

| Richtung | Inhalt | Stand |
|---|---|---|
| Google Kalender → ECG | Termine und Küchenhinweise | ECG-Import; Status im ECG-Projektstand |
| ECG → Organisationstool | persönliche Zeitbuchungen; Bearer-POST `/api/organization/ecg-sync` | Sender und Empfänger im Code geprüft; Live-End-to-End-Test offen |
| Organisationstool → ECG | Rückschreiben | in geprüfter Sync-Strecke nicht vorhanden |
| Organisationstool → Schadensmanagement | Zeiten als Rechnungsvorschlag / gemeinsame Nummernvergabe | Zielanforderung; durch diese Prüfung keine vollständige automatische Übergabe belegt |
| Schadensmanagement → Organisationstool | Auftrags-/Rechnungsstatus zur Planung | fachliches Ziel; konkreten Datenaustausch vor Umsetzung prüfen |

## Pflege

Die jeweilige Bereichsdatei bei bestätigten Änderungen mitpflegen. Gemeinsame Schnittstellen hier nur zusammenfassend; den exakten Vertrag beim verantwortlichen Bereich halten. Keine persönlichen Betriebsdaten oder Geheimnisse veröffentlichen.
