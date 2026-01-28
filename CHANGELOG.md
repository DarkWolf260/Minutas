# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-28

### Added
- **Multi-role reporting**: Users can now select and prioritize multiple roles for the `[Reporta]` tag in App Settings.
- **RxDB Migration (v1)**: Automated migration from version 0 to 1 for the `settings` collection.
- **Improved Validation**: Smart identification for "Hora" and "Cédula" fields in dynamic forms even without explicit type definitions.
- **Advanced Regex**: Support for "HLV" time format and ranges in `TimeHlvInput`.
- **Advanced Regex**: Support for Venezuelan ID format (`V-XX.XXX.XXX`) in `CedulaInput`.
- **Detailed Logging**: Detailed error messages and stack traces for template rendering and form validation failures.

### Changed
- **Report Generator**: Refactored logic to inject personnel based on a prioritized list of roles and the active guard.
- **Template Renderer**: Now clones configuration objects before processing to prevent mutation errors with read-only database objects.
- **Report Form**: Restored the 'Analista' field's flexibility, removing its deprecated status to keep templates fully dynamic.

### Fixed
- **TypeError in Renderer**: Resolved "Cannot assign to read only property 'type'" when rendering reports.
- **Settings Persistence**: Fixed "Failed to save settings" error caused by schema mismatch in RxDB.
- **Validation Errors**: Fixed "Formato de hora inválido" and "Formato de cédula inválido" errors in dynamic forms.

## [1.0.0] - 2026-01-27

### Added
- Initial implementation of the template-based reporting system.
- Personnel management and guard scheduling.
- Offline-first support with RxDB and Firebase sync.
- Sentry integration for error tracking.
- Modular template engine (Lexer, Parser, Evaluator, Renderer).
- Comprehensive test suite for core utilities and template logic.
