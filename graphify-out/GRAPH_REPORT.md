# Graph Report - Minutas  (2026-07-03)

## Corpus Check
- 373 files · ~239,492 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1969 nodes · 5635 edges · 109 communities (101 shown, 8 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `af5e4b9a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]
- [[_COMMUNITY_Community 87|Community 87]]
- [[_COMMUNITY_Community 88|Community 88]]
- [[_COMMUNITY_Community 89|Community 89]]
- [[_COMMUNITY_Community 90|Community 90]]
- [[_COMMUNITY_Community 91|Community 91]]
- [[_COMMUNITY_Community 92|Community 92]]
- [[_COMMUNITY_Community 93|Community 93]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 95|Community 95]]
- [[_COMMUNITY_Community 96|Community 96]]
- [[_COMMUNITY_Community 97|Community 97]]
- [[_COMMUNITY_Community 98|Community 98]]
- [[_COMMUNITY_Community 99|Community 99]]
- [[_COMMUNITY_Community 100|Community 100]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 157 edges
2. `Button` - 112 edges
3. `useWorkspaceManager()` - 89 edges
4. `ScrollArea` - 53 edges
5. `Card` - 48 edges
6. `CardContent` - 47 edges
7. `useSettings()` - 45 edges
8. `useDatabase()` - 45 edges
9. `StaffRole` - 45 edges
10. `CardHeader` - 43 edges

## Surprising Connections (you probably didn't know these)
- `CsvImportButtonProps` --references--> `StaffMember`  [EXTRACTED]
  src/components/personnel/csv-import-button.tsx → src/lib/types/index.ts
- `CSVManager()` --calls--> `useWorkspaceManager()`  [EXTRACTED]
  src/components/personnel/csv-manager.tsx → src/lib/db/db-context.tsx
- `ReportPhotosProps` --references--> `ReportPhoto`  [EXTRACTED]
  src/components/report/report-photos.tsx → src/lib/types/index.ts
- `ReportViewerProps` --references--> `Report`  [EXTRACTED]
  src/components/report/report-viewer.tsx → src/lib/types/index.ts
- `UseReportViewerProps` --references--> `Report`  [EXTRACTED]
  src/components/report/viewer/use-report-viewer.ts → src/lib/types/index.ts

## Import Cycles
- None detected.

## Communities (109 total, 8 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (33): closeDatabase(), ConfigItem, ConfigsCollection, created_atabase(), ensureDevMode(), getInternalState(), getStorage(), _global (+25 more)

### Community 1 - "Community 1"
Cohesion: 0.14
Nodes (17): GENDER_OPTIONS, PERSONNEL_STATUS, RANK_OPTIONS, STATUS_OPTIONS, CedulaInput, PersonnelFormFields(), CSVManager(), CSVPersonnelRow (+9 more)

### Community 2 - "Community 2"
Cohesion: 0.10
Nodes (26): ABOUT_MODULES, PersonnelTabsProps, ReporteHistorialProps, SyncInbox(), SyncInboxProps, SyncQRDisplay(), SyncQRDisplayProps, useSyncPagina() (+18 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (47): [1.0.0] - 2026-04-07, [1.0.1] - 2026-04-22, [1.1.0] - 2026-04-23, [1.1.1] - 2026-04-23, [1.2.0] - 2026-04-24, [1.3.0] - 2026-04-28, [1.3.1] - 2026-04-28, [1.3.2] - 2026-05-11 (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (25): AboutAppPage(), NovedadFilters(), NovedadFiltersProps, PlantillasSidebar(), PlantillasSidebarProps, WorkspaceItem(), WorkspaceItemProps, ReportFormField() (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (47): dependencies, class-variance-authority, clsx, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, docx (+39 more)

### Community 6 - "Community 6"
Cohesion: 0.21
Nodes (12): DatabaseContext, useOrdenDelDiaDraft(), useOrdenDelDia(), defaultProfile, UserProfile, areEqual(), stableStringify(), useOrdenDelDiaActivities() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (25): AdminUser, NavUserMenu(), NavUserMenuProps, getDateStatus(), getLocalTodayString(), initialState, Theme, ThemeProvider() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.36
Nodes (6): ReportViewerProps, ViewerContent(), ViewerEmpty(), ViewerError(), ViewerErrorProps, ViewerLoading()

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (22): ProtectedRoute(), useWorkspaceManager(), useReportForm(), useReportGenerator(), useDepartments(), useDrafts(), defaultGuards, useGuards() (+14 more)

### Community 10 - "Community 10"
Cohesion: 0.11
Nodes (24): AddressInput, MultiInput, useDatabase(), NotificationItem, calcularEstadisticasDia(), formatearEstadisticasDia(), EstadisticasField(), useActiveGuard() (+16 more)

### Community 11 - "Community 11"
Cohesion: 0.05
Nodes (35): 10. Escapado, 11. Orden de resolución de valores, 12. Limpieza final del reporte, 1. Campos `{FieldName}`, 2. Acceso a propiedades de personal `{Campo.propiedad}`, 3. Campos Repetibles `{Campo}*`, 4. Secciones `[Label]...[/]`, 5. Secciones Auto-contenidas `["Título" {Campo}]` (+27 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (27): AdminRoute(), tryRemove(), trySet(), UserProvider(), AboutAppPage, AboutChangelogPage, AboutGuidePage, AboutTemplatesPage (+19 more)

### Community 13 - "Community 13"
Cohesion: 0.12
Nodes (25): useAddresses(), useDirecciones(), ModoEstadistica, useEstadisticas(), useFieldDefinitions(), useGuardHistory(), useNovedades(), usePrecacheImages() (+17 more)

### Community 14 - "Community 14"
Cohesion: 0.50
Nodes (3): AuthContext, AuthContextType, AuthProvider()

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (28): Additional Resources, As a Reviewer, As an Author, Before Submitting, Branch Naming, Code Review Guidelines, Code Style, Commit Messages (+20 more)

### Community 16 - "Community 16"
Cohesion: 0.10
Nodes (26): PlantillasHeader(), ReporteHeaderProps, StatsHeader(), StatsHeaderProps, AddressMap, ListaDirecciones(), LOCATION_TYPE_CONFIG, MapaDirecciones() (+18 more)

### Community 17 - "Community 17"
Cohesion: 0.23
Nodes (11): DEPARTMENT_IDS, DEPARTMENT_NAMES, LEADER_ROLES, OPERATIONAL_ROLES, SPECIAL_ROLES, STATUS_ROLES, DEFAULT_DEPARTMENTS, DEFAULT_ROLES (+3 more)

### Community 18 - "Community 18"
Cohesion: 0.05
Nodes (60): buildFullStaffName(), formatDateToPeriod(), formatStaffMember(), formatStaffMemberForAutocomplete(), formatStaffMemberForDisplay(), formatStaffReporta(), parseCache, parseTemplate() (+52 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (22): InferredType, AddressSchema, AppSettingsSchema, cedulaValidator, dateValidator, DepartmentSchema, FieldConfigSchema, FieldTypeSchema (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (29): devDependencies, autoprefixer, @babel/core, babel-plugin-react-compiler, eslint, eslint-config-prettier, jsdom, postcss (+21 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (11): Calidad y Pruebas (Gates de Calidad), Constitución de Minutas, Contexto Operativo y Estándares de Protección Civil Venezuela, Core Principles, Gobernanza, I. Arquitectura Local-First, II. Claridad de Interfaz, Ergonomía y Contraste, III. Privacidad por Defecto (Privacidad Visible) (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.17
Nodes (14): ConfirmDialog(), ResponsiveModal(), useIsMobile(), PersonnelHistoryDialog(), AddressFormDialog(), ResponsiveModal(), RoleRow, SortableDeptItem (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.14
Nodes (19): SyncContext, SyncContextValue, useSyncContext(), createChannel(), deleteChannel(), fetchPendingReports(), generateChannelCode(), joinChannelByCode() (+11 more)

### Community 24 - "Community 24"
Cohesion: 0.04
Nodes (47): [1.0.0] - 2026-04-07, [1.0.1] - 2026-04-22, [1.1.0] - 2026-04-23, [1.1.1] - 2026-04-23, [1.2.0] - 2026-04-24, [1.3.0] - 2026-04-28, [1.3.1] - 2026-04-28, [1.3.2] - 2026-05-11 (+39 more)

### Community 25 - "Community 25"
Cohesion: 0.08
Nodes (19): CHANGE_TYPE_CONFIG, ChangeEntry, CHANGELOG, ChangelogEntry, ChangeType, WORKFLOW_STEPS, Code(), SectionHeader() (+11 more)

### Community 26 - "Community 26"
Cohesion: 0.23
Nodes (13): SyncModals(), SyncModalsProps, ConfirmDialogProps, QRScanner(), QRScannerProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent (+5 more)

### Community 27 - "Community 27"
Cohesion: 0.25
Nodes (14): DEFAULT_STATISTICS_CATEGORIES, STATISTICS_SECTIONS, StatisticsSection, MonthlyStats, findPointsWithTypes(), obtenerBaseIdYVirtual(), obtenerCategoriasReporte(), obtenerValoresConSoporteVirtual() (+6 more)

### Community 28 - "Community 28"
Cohesion: 0.11
Nodes (23): AddressInputProps, LOCATION_TYPE_BADGE, LOCATION_TYPES, CedulaInputProps, MultiInputProps, SearchInput(), SearchInputProps, GuardStaffEditor (+15 more)

### Community 29 - "Community 29"
Cohesion: 0.18
Nodes (12): addressSchema, LOCATION_TYPES, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.22
Nodes (18): DatabaseContextType, MinutasDatabase, safeWrite(), SafeWriteOptions, silentWrite(), ConfigRepository, createHistoryRepository(), HistoryRepository (+10 more)

### Community 32 - "Community 32"
Cohesion: 0.14
Nodes (13): GuardConfigCard(), MobileHeader(), MobileHeaderProps, NovedadMainContent(), NovedadMainContentProps, NovedadModals, NovedadSidebar(), GuardSelector() (+5 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (23): PersonnelFormFieldsProps, usePersonnelForm(), UsePersonnelFormProps, StaffListEditorProps, AddEditPersonnelDialog(), AddEditPersonnelDialogProps, CSVManagerProps, GuardAssignmentPanelProps (+15 more)

### Community 35 - "Community 35"
Cohesion: 0.17
Nodes (11): 1. Configuración Inicial (Una sola vez), 2. Flujo de Trabajo en Desarrollo, 3. Gestión de Esquemas y Migraciones, Arrancar la base de datos local, Crear una nueva migración, Detener la base de datos local, Guía de Desarrollo Local con Supabase CLI, Obtener el esquema actual de producción (DB Pull) (+3 more)

### Community 36 - "Community 36"
Cohesion: 0.10
Nodes (11): ScheduledMessagesWorker(), useOfflineUpload(), ScheduledMessage, useScheduledMessages(), BotState, listeners, WhatsAppChat, WhatsAppStatus (+3 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (18): typedoc, categorizeByGroup, categoryOrder, entryPoints, entryPointStrategy, exclude, excludeInternal, excludePrivate (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.09
Nodes (23): scripts, bot, build, build:dev, caddy, caddy:reload, dev, docs:generate (+15 more)

### Community 40 - "Community 40"
Cohesion: 0.29
Nodes (7): ARRAY_KEYS, BOOLEAN_KEYS, GlobalConfig, GlobalConfigContext, GlobalConfigContextProps, GlobalConfigProvider(), AppModuleId

### Community 41 - "Community 41"
Cohesion: 0.11
Nodes (21): 1. Variables Básicas, 2. Tipos de Campos, 3. Dropdowns (Listas Desplegables), 4. Secciones, 5. Lógica Condicional, 6. Resumen Automático, 7. Separadores, 8. Reglas Estadísticas y Etiquetas Especiales (`*` y ` (1)`) (+13 more)

### Community 43 - "Community 43"
Cohesion: 0.22
Nodes (14): StatsSectionRow(), StatsSectionRowProps, StatsTable(), StatsTableProps, StatsTotalRow(), StatsTotalRowProps, Table, TableBody (+6 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (10): LoadingScreen(), LoadingScreenProps, getDatabase(), DatabaseProviderProps, globalPullTrigger$, startCollectionReplication(), startWorkspaceReplication(), triggerCloudSync() (+2 more)

### Community 46 - "Community 46"
Cohesion: 0.06
Nodes (35): Props, State, GuardConfigCardProps, ReporteGenerarProps, WorkspaceControls(), WorkspaceControlsProps, WorkspacesHeader(), DatePicker (+27 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): 1. El Asterisco (`*`) - Evaluación Secuencial Repetible, 2. El Paréntesis Uno (` (1)`) - Primera Coincidencia, 3. El Sufijo Virtual de Origen (`-Origen*`) - Evaluación de Trayectos o Rutas, Correlación con condiciones secundarias (Y / O), ¿Cómo funciona?, ¿Cómo funciona?, ¿Cómo funciona?, Ejemplo de Caso de Uso (+4 more)

### Community 49 - "Community 49"
Cohesion: 0.15
Nodes (10): allowedOrigins, app, client, { Client, LocalAuth, MessageMedia }, cors, express, fs, path (+2 more)

### Community 50 - "Community 50"
Cohesion: 0.17
Nodes (11): dependencies, cors, express, qrcode-terminal, whatsapp-web.js, description, main, name (+3 more)

### Community 51 - "Community 51"
Cohesion: 0.22
Nodes (8): name, overrides, ajv, esbuild, serialize-javascript, private, type, version

### Community 52 - "Community 52"
Cohesion: 0.15
Nodes (12): skills, supabase, supabase-postgres-best-practices, computedHash, computedHash, skillPath, source, sourceType (+4 more)

### Community 54 - "Community 54"
Cohesion: 0.36
Nodes (8): css.lint.compatibleVendorPrefixes, css.lint.propertyIgnoredByDisplay, css.lint.unknownAtRules, css.lint.validProperties, css.lint.vendorPrefix, html.validate.scripts, html.validate.styles, vscode-edge-devtools.webhint.ignore

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): 1. El Problema: Rebote de Estado (Flickering), 2. Solución: Estado Local Optimista, 3. Prevención de Re-renderizados Causales, 4. Check-list para Nuevas Interfaces, Funciones Estables (useCallback), Guía de Rendimiento y Unificación de Interfaces (RxDB + DnD), Memoización Obligatoria

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): extends, rules, no-console, no-var, prefer-const, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars

### Community 57 - "Community 57"
Cohesion: 0.05
Nodes (38): canonical, displayName, role, tonalRamp, displayName, purpose, background-dark, primary (+30 more)

### Community 58 - "Community 58"
Cohesion: 0.07
Nodes (28): Additional Resources, As a Reviewer, As an Author, Before Submitting, Branch Naming, Code Review Guidelines, Code Style, Commit Messages (+20 more)

### Community 59 - "Community 59"
Cohesion: 0.32
Nodes (6): tryGet(), PWAStatus(), PwaContext, PwaContextType, PwaProvider(), usePwa()

### Community 61 - "Community 61"
Cohesion: 0.16
Nodes (19): NovedadGroupItem, NovedadGroupItemProps, formatReportDate(), NovedadItem, NovedadItemProps, getReportTimeStr(), getTimeRange(), groupContiguousReports() (+11 more)

### Community 63 - "Community 63"
Cohesion: 0.38
Nodes (6): ErrorContext, ErrorSeverity, getUserFriendlyErrorMessage(), isQuotaExceededError(), logError(), logOperationError()

### Community 64 - "Community 64"
Cohesion: 0.14
Nodes (14): SetupPage(), PasoBienvenida(), PasoAreaTrabajo(), DEF_MODULOS, PasoModulos(), PRESET_ESCRITORIO, PRESET_MOVIL, PasoEstructura() (+6 more)

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): AuditRecord, DataPoint, FixedDataCatalog, SemanticMapping

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (3): eslintConfig, nextCoreWebVitals, require

### Community 69 - "Community 69"
Cohesion: 0.13
Nodes (16): AdminDashboardPage(), NavCard(), NavCardProps, Separator(), DatabaseProvider(), useAdminUsers(), CloudTemplate, CloudWorkspace (+8 more)

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): Reporting a Vulnerability, Security Policy, Supported Versions

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): validation, invalidLink, notDocumented, notExported

### Community 81 - "Community 81"
Cohesion: 0.09
Nodes (21): categorizeByGroup, categoryOrder, entryPoints, entryPointStrategy, exclude, excludeInternal, excludePrivate, excludeProtected (+13 more)

### Community 82 - "Community 82"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 83 - "Community 83"
Cohesion: 0.40
Nodes (3): AboutHeader(), AboutHeaderProps, AboutModuleList()

### Community 84 - "Community 84"
Cohesion: 0.10
Nodes (19): 1. Overview, 2. Colors, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don'ts, Buttons, Cards / Containers (+11 more)

### Community 85 - "Community 85"
Cohesion: 0.19
Nodes (18): PlantillasModals(), PlantillasModalsProps, ResponsiveModalProps, useCloudTemplates(), ResultDialogProps, BRUSH_SIZES, COLORS, PhotoEditorProps (+10 more)

### Community 86 - "Community 86"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 87 - "Community 87"
Cohesion: 0.21
Nodes (7): MassActionsBar(), MassActionsBarProps, PersonnelHeader(), PersonnelModals(), PersonnelModalsProps, PersonnelTabs(), PersonnelPageContent()

### Community 88 - "Community 88"
Cohesion: 0.10
Nodes (21): 1. Variables Básicas, 2. Tipos de Campos, 3. Dropdowns (Listas Desplegables), 4. Secciones, 5. Lógica Condicional, 6. Resumen Automático, 7. Separadores, 8. Reglas Estadísticas y Etiquetas Especiales (`*` y ` (1)`) (+13 more)

### Community 89 - "Community 89"
Cohesion: 0.19
Nodes (17): TemplateListProps, FormLayout(), FormLayoutProps, UseReportFormProps, UseReportGeneratorProps, resolveTemplateTitle(), validateTimeHlv(), ReportFormProps (+9 more)

### Community 90 - "Community 90"
Cohesion: 0.15
Nodes (12): Anti-Patterns (Do NOT Use), Buttons, Cards / Containers, Color Palette, Component Specs, Design System Master File (Original: Minutas), Global Rules, Inputs (+4 more)

### Community 91 - "Community 91"
Cohesion: 0.22
Nodes (11): ATTENDANCE_STATUS_CONFIG, StatusBadge, StatusBadgeProps, AttendanceManagerProps, AttendanceStatus, DefinitionSection, PersonnelStatus, StatisticOperator (+3 more)

### Community 93 - "Community 93"
Cohesion: 0.50
Nodes (3): OnboardingTour(), TOUR_STEPS, TourStep

### Community 94 - "Community 94"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 95 - "Community 95"
Cohesion: 0.25
Nodes (7): extends, rules, no-console, no-var, prefer-const, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars

### Community 96 - "Community 96"
Cohesion: 0.24
Nodes (11): EstadisticasFieldProps, ReportFormFieldProps, EstadisticasFieldProps, FieldRenderer, FieldRendererProps, RepeatableSectionRenderer(), ReportFormFieldProps, SectionRendererProps (+3 more)

### Community 97 - "Community 97"
Cohesion: 0.09
Nodes (23): OrdenEmptyState(), OrdenEmptyStateProps, OrdenHeader(), StaffListEditor, OrdenDelDiaDraft, useOrdenDelDiaPagina(), ActivityItem, ActivityItemProps (+15 more)

### Community 98 - "Community 98"
Cohesion: 0.10
Nodes (35): SyncWhatsApp(), AdminConfigPage(), useAdmin(), useAuth(), useGlobalConfig(), usePlantillas(), useProfile(), defaultSettings (+27 more)

### Community 99 - "Community 99"
Cohesion: 0.16
Nodes (15): NovedadModalsProps, ReporteGenerar(), ReporteHeader(), ReporteHistorial(), ReporteModals(), ReporteModalsProps, TemplateList(), ReporteFinalPage() (+7 more)

### Community 100 - "Community 100"
Cohesion: 0.14
Nodes (8): DEFAULT_ADDRESSES, calcularEstadisticasMensuales(), resolverCategoriaTraslado(), resolverTipoDesdeDirectorio(), TRANSFER_TYPE_MAP, AddressFormDialogProps, AddressMapProps, Address

### Community 101 - "Community 101"
Cohesion: 0.40
Nodes (4): commentSyntax, cspChecked, files, insertBefore

### Community 102 - "Community 102"
Cohesion: 0.18
Nodes (4): PhotoEditor(), ReportImageProps, ReportPhotos(), ReportPhotosProps

### Community 103 - "Community 103"
Cohesion: 0.50
Nodes (3): Reporting a Vulnerability, Security Policy, Supported Versions

### Community 108 - "Community 108"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 110 - "Community 110"
Cohesion: 0.40
Nodes (4): categories, mockConfig, mockReport, mockTemplate

## Knowledge Gaps
- **777 isolated node(s):** `extends`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `no-console`, `prefer-const` (+772 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 4` to `Community 1`, `Community 2`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 16`, `Community 17`, `Community 18`, `Community 22`, `Community 25`, `Community 26`, `Community 28`, `Community 29`, `Community 32`, `Community 34`, `Community 36`, `Community 43`, `Community 45`, `Community 46`, `Community 61`, `Community 64`, `Community 69`, `Community 85`, `Community 89`, `Community 91`, `Community 93`, `Community 96`, `Community 98`, `Community 99`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 46` to `Community 1`, `Community 2`, `Community 4`, `Community 7`, `Community 8`, `Community 9`, `Community 10`, `Community 12`, `Community 16`, `Community 22`, `Community 25`, `Community 26`, `Community 28`, `Community 29`, `Community 32`, `Community 34`, `Community 45`, `Community 59`, `Community 61`, `Community 64`, `Community 83`, `Community 85`, `Community 87`, `Community 93`, `Community 96`, `Community 97`, `Community 98`, `Community 99`, `Community 102`, `Community 108`, `Community 109`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Why does `obtenerCategoriasReporte()` connect `Community 27` to `Community 89`, `Community 100`, `Community 110`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `extends`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars` to the rest of the system?**
  _777 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08571428571428572 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.10338345864661654 - nodes in this community are weakly interconnected._