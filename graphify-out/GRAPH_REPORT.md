# Graph Report - Minutas  (2026-05-31)

## Corpus Check
- 340 files · ~204,854 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1567 nodes · 4928 edges · 81 communities (74 shown, 7 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `f6eaf277`
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
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 140 edges
2. `Button` - 108 edges
3. `useWorkspaceManager()` - 79 edges
4. `ScrollArea` - 53 edges
5. `Card` - 47 edges
6. `CardContent` - 46 edges
7. `CardHeader` - 43 edges
8. `CardTitle` - 43 edges
9. `StaffRole` - 42 edges
10. `useSettings()` - 41 edges

## Surprising Connections (you probably didn't know these)
- `SortableStaffItem()` --calls--> `cn()`  [EXTRACTED]
  src/components/guards/guard-staff-editor.tsx → src/lib/utils.ts
- `CsvImportButtonProps` --references--> `StaffMember`  [EXTRACTED]
  src/components/personnel/csv-import-button.tsx → src/lib/types/index.ts
- `CSVManager()` --calls--> `useWorkspaceManager()`  [EXTRACTED]
  src/components/personnel/csv-manager.tsx → src/lib/db/db-context.tsx
- `RepeatableSectionRenderer()` --calls--> `cn()`  [EXTRACTED]
  src/components/report/section-renderer.tsx → src/lib/utils.ts
- `SingleSectionRenderer()` --calls--> `cn()`  [EXTRACTED]
  src/components/report/section-renderer.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (81 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.05
Nodes (70): LoadingScreen(), LoadingScreenProps, closeDatabase(), ConfigItem, ConfigsCollection, DatabaseContextType, created_atabase(), ensureDevMode() (+62 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (50): MobileHeader(), MobileHeaderProps, NovedadItem, NovedadItemProps, NovedadMainContent(), NovedadMainContentProps, NovedadModals, groupReportsByDay() (+42 more)

### Community 2 - "Community 2"
Cohesion: 0.12
Nodes (31): CHANGE_TYPE_CONFIG, ChangeEntry, CHANGELOG, ChangelogEntry, ChangeType, WORKFLOW_STEPS, TEMPLATE_LIST, NavCard() (+23 more)

### Community 3 - "Community 3"
Cohesion: 0.04
Nodes (47): [1.0.0] - 2026-04-07, [1.0.1] - 2026-04-22, [1.1.0] - 2026-04-23, [1.1.1] - 2026-04-23, [1.2.0] - 2026-04-24, [1.3.0] - 2026-04-28, [1.3.1] - 2026-04-28, [1.3.2] - 2026-05-11 (+39 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (30): DEFAULT_STATISTICS_CATEGORIES, STATISTICS_SECTIONS, StatisticsSection, calcularEstadisticasMensuales(), MonthlyStats, findPointsWithTypes(), obtenerBaseIdYVirtual(), obtenerCategoriasReporte() (+22 more)

### Community 5 - "Community 5"
Cohesion: 0.04
Nodes (47): dependencies, class-variance-authority, clsx, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities, docx (+39 more)

### Community 6 - "Community 6"
Cohesion: 0.08
Nodes (23): ReporteGenerarProps, DatePicker, TimeHlvInput, TimeHlvInputProps, GuardStaffEditor, GuardStaffEditorProps, SortableStaffItem(), StaffListEditor (+15 more)

### Community 7 - "Community 7"
Cohesion: 0.10
Nodes (25): AddressInput, MultiInput, calcularEstadisticasDia(), formatearEstadisticasDia(), useActiveGuard(), useOrdenDelDiaPagina(), useReporteFinal(), findValueInform_data() (+17 more)

### Community 8 - "Community 8"
Cohesion: 0.10
Nodes (26): AboutAppPage(), PlantillasHeader(), PlantillasSidebar(), ReporteGenerar(), ReporteHeader(), ReporteHeaderProps, ReporteModals(), cn() (+18 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (23): MultiInputProps, QuickChatSelectorProps, DebouncedFunction, getTemplateIcon(), RANK_HIERARCHY, COMING_SOON_MODULES, matchesPreset(), MODULE_DEFS (+15 more)

### Community 10 - "Community 10"
Cohesion: 0.10
Nodes (22): ScheduledMessagesWorker(), SyncWhatsApp(), useDatabase(), NotificationItem, useGuardHistory(), ScheduledMessage, useScheduledMessages(), useSyncTemplates() (+14 more)

### Community 11 - "Community 11"
Cohesion: 0.06
Nodes (35): 10. Escapado, 11. Orden de resolución de valores, 12. Limpieza final del reporte, 1. Campos `{FieldName}`, 2. Acceso a propiedades de personal `{Campo.propiedad}`, 3. Campos Repetibles `{Campo}*`, 4. Secciones `[Label]...[/]`, 5. Secciones Auto-contenidas `["Título" {Campo}]` (+27 more)

### Community 12 - "Community 12"
Cohesion: 0.06
Nodes (28): OnboardingTour(), TOUR_STEPS, TourStep, tryRemove(), trySet(), ALL_NAV_ITEMS, BottomNav(), AboutAppPage (+20 more)

### Community 13 - "Community 13"
Cohesion: 0.10
Nodes (17): SyncHeader(), SyncHeaderProps, SyncSetup(), SyncSetupProps, WorkspaceItem(), WorkspaceItemProps, WorkspacesHeader(), DatePickerProps (+9 more)

### Community 14 - "Community 14"
Cohesion: 0.13
Nodes (22): GuardConfigCardProps, StatsHeader(), StatsHeaderProps, AddressInputProps, LOCATION_TYPE_BADGE, LOCATION_TYPES, GuardSelectorProps, NoGuardBannerProps (+14 more)

### Community 15 - "Community 15"
Cohesion: 0.07
Nodes (28): Additional Resources, As a Reviewer, As an Author, Before Submitting, Branch Naming, Code Review Guidelines, Code Style, Commit Messages (+20 more)

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (23): PersonnelFormFields(), PersonnelFormFieldsProps, usePersonnelForm(), UsePersonnelFormProps, StaffListEditorProps, AddEditPersonnelDialog(), AddEditPersonnelDialogProps, CSVManagerProps (+15 more)

### Community 17 - "Community 17"
Cohesion: 0.21
Nodes (18): AdminRoute(), ProtectedRoute(), useWorkspaceManager(), useDepartments(), usePersonal(), useRoles(), defaultSettings, useSettings() (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.15
Nodes (20): parseCache, renderContent(), extractFieldToken(), extractSectionToken(), tokenize(), AUTOMATIC_FIELD_TYPES, parse(), parseFieldTag() (+12 more)

### Community 19 - "Community 19"
Cohesion: 0.08
Nodes (22): InferredType, AddressSchema, AppSettingsSchema, cedulaValidator, dateValidator, DepartmentSchema, FieldConfigSchema, FieldTypeSchema (+14 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (27): devDependencies, @babel/core, babel-plugin-react-compiler, eslint, eslint-config-prettier, jsdom, postcss, prettier (+19 more)

### Community 21 - "Community 21"
Cohesion: 0.16
Nodes (18): DatabaseContext, useDirecciones(), OrdenDelDiaDraft, useOrdenDelDia(), ActivityItemProps, AddActivityFormProps, OrdenDelDiaFormProps, useOrdenDelDiaActivities() (+10 more)

### Community 22 - "Community 22"
Cohesion: 0.15
Nodes (14): SetupPage(), PasoBienvenida(), PasoAreaTrabajo(), PasoPreferencias(), DEF_MODULOS, PasoModulos(), PRESET_ESCRITORIO, PRESET_MOVIL (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.21
Nodes (15): DEFAULT_ADDRESSES, useAddresses(), useConfigRepo(), ModoEstadistica, useEstadisticas(), defaultDefinitions, useFieldDefinitions(), useNovedades() (+7 more)

### Community 24 - "Community 24"
Cohesion: 0.19
Nodes (15): PlantillasModals(), PlantillasModalsProps, useCloudTemplates(), BRUSH_SIZES, COLORS, PhotoEditor(), PhotoEditorProps, CloudTemplatesDialog() (+7 more)

### Community 25 - "Community 25"
Cohesion: 0.19
Nodes (16): StatsSectionRow(), StatsSectionRowProps, StatsTable(), StatsTableProps, StatsTotalRow(), StatsTotalRowProps, PersonnelTable(), Checkbox (+8 more)

### Community 26 - "Community 26"
Cohesion: 0.16
Nodes (18): FormLayout(), FormLayoutProps, UseReportFormProps, resolveTemplateTitle(), debounce(), validateTimeHlv(), FieldRenderer, ReportFormProps (+10 more)

### Community 27 - "Community 27"
Cohesion: 0.24
Nodes (13): useReportForm(), useReportGenerator(), useDrafts(), defaultGuards, useGuards(), useOrdenDelDiaDraft(), usePersonnelHistory(), usePersonnel() (+5 more)

### Community 28 - "Community 28"
Cohesion: 0.23
Nodes (15): NovedadModalsProps, ReporteModalsProps, ResponsiveModalProps, ResultDialog(), ResultDialogProps, ReportPreviewProps, DialogDescription, SheetContent (+7 more)

### Community 29 - "Community 29"
Cohesion: 0.17
Nodes (13): useAdmin(), useAuth(), usePlantillas(), useSyncPagina(), useUploadTemplate(), UserStatus, useUserStatus(), AuthContext (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.16
Nodes (15): CedulaInput, CedulaInputProps, AdminUser, useAdminUsers(), NavUserMenuProps, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem (+7 more)

### Community 31 - "Community 31"
Cohesion: 0.17
Nodes (14): formatStaffReporta(), applyModifiers(), coerceForComparison(), evaluateCondition(), escapeRegExp(), findValueForField(), getSectionRegex(), renderContent() (+6 more)

### Community 32 - "Community 32"
Cohesion: 0.12
Nodes (10): FeatureErrorBoundary, Props, State, MassActionsBar(), MassActionsBarProps, PersonnelHeader(), PersonnelModals(), PersonnelModalsProps (+2 more)

### Community 33 - "Community 33"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, isolatedModules, jsx, lib, module, moduleResolution (+11 more)

### Community 34 - "Community 34"
Cohesion: 0.14
Nodes (9): NovedadFilters(), NovedadFiltersProps, WorkspaceControls(), WorkspaceControlsProps, SearchInput(), SearchInputProps, Input, UnitForm() (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.16
Nodes (15): GENDER_OPTIONS, PERSONNEL_STATUS, RANK_OPTIONS, STATUS_OPTIONS, CSVManager(), CSVPersonnelRow, CSVPersonnelRowSchema, formatZodError() (+7 more)

### Community 36 - "Community 36"
Cohesion: 0.16
Nodes (15): ConfirmDialog(), ResponsiveModal(), useIsMobile(), PersonnelHistoryDialog(), AddressFormDialog(), ResponsiveModal(), RoleRow, SortableDeptItem (+7 more)

### Community 37 - "Community 37"
Cohesion: 0.11
Nodes (18): typedoc, categorizeByGroup, categoryOrder, entryPoints, entryPointStrategy, exclude, excludeInternal, excludePrivate (+10 more)

### Community 38 - "Community 38"
Cohesion: 0.11
Nodes (17): aliases, components, hooks, lib, ui, utils, iconLibrary, rsc (+9 more)

### Community 39 - "Community 39"
Cohesion: 0.12
Nodes (17): scripts, bot, build, build:dev, caddy, caddy:reload, dev, docs:generate (+9 more)

### Community 40 - "Community 40"
Cohesion: 0.23
Nodes (13): SyncModals(), SyncModalsProps, ConfirmDialogProps, QRScanner(), QRScannerProps, AlertDialogAction, AlertDialogCancel, AlertDialogContent (+5 more)

### Community 41 - "Community 41"
Cohesion: 0.12
Nodes (15): 1. Variables Básicas, 2. Tipos de Campos, 3. Dropdowns (Listas Desplegables), 4. Secciones, 5. Lógica Condicional, 6. Resumen Automático, 7. Separadores, 8. Reglas Estadísticas y Etiquetas Especiales (`*` y ` (1)`) (+7 more)

### Community 42 - "Community 42"
Cohesion: 0.21
Nodes (11): DEPARTMENT_IDS, DEPARTMENT_NAMES, LEADER_ROLES, OPERATIONAL_ROLES, SPECIAL_ROLES, STATUS_ROLES, DEFAULT_DEPARTMENTS, DEFAULT_ROLES (+3 more)

### Community 43 - "Community 43"
Cohesion: 0.18
Nodes (12): addressSchema, LOCATION_TYPES, FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem (+4 more)

### Community 44 - "Community 44"
Cohesion: 0.24
Nodes (11): renderFinalReport(), TemplateRenderConfig, FieldConfig, ParseResult, generateMockData(), previewRender(), buildConfig(), render() (+3 more)

### Community 45 - "Community 45"
Cohesion: 0.19
Nodes (9): GuardConfigCard(), OrdenEmptyState(), OrdenEmptyStateProps, OrdenHeader(), OrdenHeaderProps, ReporteHistorial(), ReporteHistorialProps, OrdenDelDiaForm (+1 more)

### Community 46 - "Community 46"
Cohesion: 0.22
Nodes (11): ATTENDANCE_STATUS_CONFIG, StatusBadge, StatusBadgeProps, AttendanceManagerProps, AttendanceStatus, DefinitionSection, PersonnelStatus, StatisticOperator (+3 more)

### Community 47 - "Community 47"
Cohesion: 0.15
Nodes (12): 1. El Asterisco (`*`) - Evaluación Secuencial Repetible, 2. El Paréntesis Uno (` (1)`) - Primera Coincidencia, 3. El Sufijo Virtual de Origen (`-Origen*`) - Evaluación de Trayectos o Rutas, Correlación con condiciones secundarias (Y / O), ¿Cómo funciona?, ¿Cómo funciona?, ¿Cómo funciona?, Ejemplo de Caso de Uso (+4 more)

### Community 48 - "Community 48"
Cohesion: 0.19
Nodes (11): ALL_NAV_ITEMS, SideNav(), getInitials(), initialState, Theme, ThemeProvider(), ThemeProviderContext, ThemeProviderProps (+3 more)

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
Cohesion: 0.25
Nodes (8): AdminDashboardPage(), AdminConfigPage(), DatabaseProvider(), useCloudWorkspaces(), useGlobalConfig(), LoginPage(), RegisterPage(), AdminWorkspacesPage()

### Community 53 - "Community 53"
Cohesion: 0.28
Nodes (5): TemplatePreviewProps, Alert, AlertDescription, AlertTitle, alertVariants

### Community 54 - "Community 54"
Cohesion: 0.22
Nodes (8): css.lint.compatibleVendorPrefixes, css.lint.propertyIgnoredByDisplay, css.lint.unknownAtRules, css.lint.validProperties, css.lint.vendorPrefix, html.validate.scripts, html.validate.styles, vscode-edge-devtools.webhint.ignore

### Community 55 - "Community 55"
Cohesion: 0.25
Nodes (7): 1. El Problema: Rebote de Estado (Flickering), 2. Solución: Estado Local Optimista, 3. Prevención de Re-renderizados Causales, 4. Check-list para Nuevas Interfaces, Funciones Estables (useCallback), Guía de Rendimiento y Unificación de Interfaces (RxDB + DnD), Memoización Obligatoria

### Community 56 - "Community 56"
Cohesion: 0.25
Nodes (7): extends, rules, no-console, no-var, prefer-const, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars

### Community 57 - "Community 57"
Cohesion: 0.32
Nodes (6): tryGet(), PWAStatus(), PwaContext, PwaContextType, PwaProvider(), usePwa()

### Community 58 - "Community 58"
Cohesion: 0.32
Nodes (4): parseTemplate(), recordReportAudit(), result, renderFinalReport()

### Community 59 - "Community 59"
Cohesion: 0.57
Nodes (4): buildFullStaffName(), formatStaffMember(), formatStaffMemberForAutocomplete(), formatStaffMemberForDisplay()

### Community 61 - "Community 61"
Cohesion: 0.29
Nodes (3): ErrorBoundary, Props, State

### Community 62 - "Community 62"
Cohesion: 0.33
Nodes (5): MobileNav(), NotificationBell(), useNotifications(), NavBrand(), NavUserMenu()

### Community 63 - "Community 63"
Cohesion: 0.40
Nodes (3): AboutHeader(), AboutHeaderProps, AboutModuleList()

### Community 64 - "Community 64"
Cohesion: 0.47
Nodes (4): defaultProfile, useProfile(), UserProfile, useMobileNav()

### Community 66 - "Community 66"
Cohesion: 0.40
Nodes (4): AuditRecord, DataPoint, FixedDataCatalog, SemanticMapping

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (3): eslintConfig, nextCoreWebVitals, require

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (3): Reporting a Vulnerability, Security Policy, Supported Versions

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): validation, invalidLink, notDocumented, notExported

## Knowledge Gaps
- **550 isolated node(s):** `extends`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars`, `no-console`, `prefer-const` (+545 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 8` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 12`, `Community 13`, `Community 14`, `Community 16`, `Community 17`, `Community 22`, `Community 24`, `Community 25`, `Community 26`, `Community 28`, `Community 30`, `Community 34`, `Community 35`, `Community 36`, `Community 40`, `Community 43`, `Community 45`, `Community 46`, `Community 48`, `Community 53`, `Community 62`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **Why does `Button` connect `Community 13` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 6`, `Community 7`, `Community 8`, `Community 9`, `Community 12`, `Community 14`, `Community 16`, `Community 17`, `Community 22`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 30`, `Community 32`, `Community 34`, `Community 35`, `Community 36`, `Community 40`, `Community 43`, `Community 45`, `Community 52`, `Community 57`, `Community 61`, `Community 63`, `Community 65`?**
  _High betweenness centrality (0.052) - this node is a cross-community bridge._
- **Why does `useWorkspaceManager()` connect `Community 17` to `Community 0`, `Community 1`, `Community 2`, `Community 6`, `Community 7`, `Community 8`, `Community 10`, `Community 12`, `Community 14`, `Community 23`, `Community 24`, `Community 27`, `Community 29`, `Community 30`, `Community 34`, `Community 35`, `Community 48`, `Community 52`, `Community 62`, `Community 64`, `Community 65`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `extends`, `@typescript-eslint/no-explicit-any`, `@typescript-eslint/no-unused-vars` to the rest of the system?**
  _550 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05095839177185601 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05009920634920635 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.11530054644808743 - nodes in this community are weakly interconnected._