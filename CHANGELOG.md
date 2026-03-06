# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2026-01-29

### Added
- **Smart Mapping (Key=Value)**: Mapping blocks `[?{Field}] Key=Value [/]` now define dropdown options where Key is for the UI and Value is for the report.
- **Automatic Translation**: Field tags `{Field}` now automatically use the mapped long text if a matching mapping block exists.
- **Visual Separators**: Support for dedicated separator sections `[""]` in templates to improve form organization.
np
### Changed
- **Silent Mapping Blocks**: Mapping definition blocks are now invisible in the final report to prevent text duplication.
- **Global Deduplication**: Form fields are now globally deduplicated across multiple sections to prevent React key collisions and redundant inputs.
- **UI Cleanup**: Removed technical labels for conditional sections in the report form for a cleaner user experience.

### Fixed
- **Mapping Preview**: Fixed a bug where mapped values were not appearing in the report preview.
- **Cascading Sections**: Fixed UI issues with nested sections appearing in the wrong order or duplicate positions.
- **Recursive Initialization**: Improved form initialization for deeply nested template structures.

## [1.6.0] - 2026-01-28

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
