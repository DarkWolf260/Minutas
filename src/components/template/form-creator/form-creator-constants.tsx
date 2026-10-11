import React from 'react';
import {
  Type,
  AlignLeft,
  Calendar,
  Clock,
  Fingerprint,
  ListFilter,
  CircleDot,
  CheckSquare,
  Minus,
  Folder,
  Layers,
} from 'lucide-react';
import type { CollisionDetection } from '@dnd-kit/core';
import { pointerWithin, closestCorners } from '@dnd-kit/core';
import type { FormCreatorField, FormCreatorFieldType } from './template-compiler';
import { getAllFieldsFlat } from './template-compiler';

export interface SpecialSystemTag {
  tag: string;
  label: string;
  badge: string;
  description: string;
}

export const SPECIAL_SYSTEM_TAGS: SpecialSystemTag[] = [
  {
    tag: '{Enc}',
    label: 'Encargado (E)',
    badge: '(E)',
    description: 'Se sustituye automáticamente por "(E)" si el Jefe de los Servicios es encargado.',
  },
  {
    tag: '{pie}',
    label: 'Pie Institucional',
    badge: 'Pie',
    description: 'Inserta el pie de página institucional configurado en la app.',
  },
  {
    tag: '{usuario}',
    label: 'Usuario Activo',
    badge: 'Usr',
    description: 'Inserta el nombre del funcionario que genera la minuta.',
  },
  {
    tag: '{Estatus}',
    label: 'Estatus Reporte',
    badge: 'Est',
    description: 'Muestra si la minuta está "En proceso" o "Finalizado".',
  },
  {
    tag: '{photos}',
    label: 'Galería de Fotos',
    badge: 'Img',
    description: 'Habilita la sección para adjuntar fotografías en este reporte.',
  },
];

export interface AvailableField {
  type: FormCreatorFieldType | 'section';
  label: string;
  badgeLabel: string;
  icon?: React.ReactNode;
  iconText?: string;
  iconBg: string;
  iconColor: string;
  defaultLabel: string;
  defaultOptions?: string[];
  isRepeatable?: boolean;
}

export const AVAILABLE_FIELDS: AvailableField[] = [
  {
    type: 'text',
    label: 'Texto corto',
    badgeLabel: 'Texto corto',
    icon: <Type className="h-3.5 w-3.5" />,
    iconText: 'Aa',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    defaultLabel: 'Pregunta',
  },
  {
    type: 'textarea',
    label: 'Texto largo',
    badgeLabel: 'Texto largo',
    icon: <AlignLeft className="h-3.5 w-3.5" />,
    iconText: '¶',
    iconBg: 'bg-violet-50 dark:bg-violet-950/60',
    iconColor: 'text-violet-600 dark:text-violet-400',
    defaultLabel: 'Descripción detallada',
  },
  {
    type: 'dropdown',
    label: 'Opción única',
    badgeLabel: 'Opción única',
    icon: <CircleDot className="h-3.5 w-3.5" />,
    iconText: '○',
    iconBg: 'bg-teal-50 dark:bg-teal-950/60',
    iconColor: 'text-teal-600 dark:text-teal-400',
    defaultLabel: 'Selecciona una opción',
    defaultOptions: ['Opción 1', 'Opción 2'],
  },
  {
    type: 'dropdown',
    label: 'Opción múltiple',
    badgeLabel: 'Opción múltiple',
    icon: <CheckSquare className="h-3.5 w-3.5" />,
    iconText: '□',
    iconBg: 'bg-sky-50 dark:bg-sky-950/60',
    iconColor: 'text-sky-600 dark:text-sky-400',
    defaultLabel: 'Selecciona opciones',
    defaultOptions: ['Opción A', 'Opción B', 'Opción C'],
  },
  {
    type: 'date',
    label: 'Fecha',
    badgeLabel: 'Fecha',
    icon: <Calendar className="h-3.5 w-3.5" />,
    iconText: '📅',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    defaultLabel: 'Fecha',
  },
  {
    type: 'time-hlv',
    label: 'Hora',
    badgeLabel: 'Hora',
    icon: <Clock className="h-3.5 w-3.5" />,
    iconText: '🕒',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
    defaultLabel: 'Hora',
  },
  {
    type: 'cedula',
    label: 'Cédula / DNI',
    badgeLabel: 'Cédula',
    icon: <Fingerprint className="h-3.5 w-3.5" />,
    iconText: '🪪',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    defaultLabel: 'Número de cédula',
  },
  {
    type: 'separator',
    label: 'Separador / Divisor',
    badgeLabel: 'Separador',
    icon: <Minus className="h-3.5 w-3.5" />,
    iconText: '―',
    iconBg: 'bg-slate-100 dark:bg-slate-800',
    iconColor: 'text-slate-600 dark:text-slate-300',
    defaultLabel: 'Separador',
  },
  {
    type: 'section',
    label: 'Sección',
    badgeLabel: 'Sección',
    icon: <Folder className="h-3.5 w-3.5" />,
    iconText: '🗂️',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    defaultLabel: 'Nueva Sección',
    isRepeatable: false,
  },
  {
    type: 'section',
    label: 'Sección repetible',
    badgeLabel: 'Sección repetible',
    icon: <Layers className="h-3.5 w-3.5" />,
    iconText: '≡',
    iconBg: 'bg-indigo-50 dark:bg-indigo-950/60',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    defaultLabel: 'Grupo repetible',
    isRepeatable: true,
  },
];

export const INITIAL_FIELDS: FormCreatorField[] = [
  {
    id: 'f_init_1',
    label: 'Pregunta 1',
    type: 'text',
    required: false,
    isFullWidth: false,
    modifier: 'none',
  },
];

export function getNextFieldLabel(
  item: AvailableField,
  currentFields: FormCreatorField[]
): string {
  const allFlat = getAllFieldsFlat(currentFields);

  if (item.type === 'separator') {
    const sepCount = currentFields.filter((f) => f.type === 'separator').length + 1;
    return sepCount === 1 ? 'Separador' : `Separador ${sepCount}`;
  }

  if (item.type === 'section') {
    const isRep = item.isRepeatable !== false;
    const secCount = currentFields.filter((f) => f.type === 'section' && (f.isRepeatable !== false) === isRep).length + 1;
    return isRep ? `Grupo repetible ${secCount}` : `Sección ${secCount}`;
  }

  if (item.type === 'text') {
    const existingNumbers = allFlat
      .map((f) => {
        const match = f.label.trim().match(/^(?:Pregunta|Nueva pregunta)\s*(\d+)$/i);
        return match && match[1] ? parseInt(match[1], 10) : null;
      })
      .filter((n): n is number => n !== null);

    let nextNum =
      existingNumbers.length > 0
        ? Math.max(...existingNumbers) + 1
        : allFlat.filter((f) => f.type !== 'separator' && f.type !== 'section').length + 1;

    while (
      allFlat.some(
        (f) => f.label.trim().toLowerCase() === `pregunta ${nextNum}`.toLowerCase()
      )
    ) {
      nextNum++;
    }
    return `Pregunta ${nextNum}`;
  }

  const baseLabel = item.defaultLabel;
  const hasExact = allFlat.some(
    (f) => f.label.trim().toLowerCase() === baseLabel.trim().toLowerCase()
  );

  if (!hasExact) {
    return baseLabel;
  }

  let counter = 2;
  while (
    allFlat.some(
      (f) => f.label.trim().toLowerCase() === `${baseLabel} ${counter}`.toLowerCase()
    )
  ) {
    counter++;
  }
  return `${baseLabel} ${counter}`;
}

export function findFieldInTree(fields: FormCreatorField[], id: string | null): FormCreatorField | null {
  if (!id) return null;
  for (const f of fields) {
    if (f.id === id) return f;
    if (f.type === 'section' && f.fields) {
      for (const inner of f.fields) {
        if (inner.id === id) return inner;
      }
    }
  }
  return null;
}

export function updateFieldInTree(
  fields: FormCreatorField[],
  id: string,
  updates: Partial<FormCreatorField>
): FormCreatorField[] {
  return fields.map((f) => {
    if (f.id === id) {
      return { ...f, ...updates };
    }
    if (f.type === 'section' && f.fields) {
      return {
        ...f,
        fields: f.fields.map((inner) =>
          inner.id === id ? { ...inner, ...updates } : inner
        ),
      };
    }
    return f;
  });
}

export function deleteFieldFromTree(
  fields: FormCreatorField[],
  id: string
): FormCreatorField[] {
  return fields
    .filter((f) => f.id !== id)
    .map((f) => {
      if (f.type === 'section' && f.fields) {
        return {
          ...f,
          fields: f.fields.filter((inner) => inner.id !== id),
        };
      }
      return f;
    });
}

export interface ItemLocation {
  container: 'root' | string; // 'root' or sectionId
  index: number;
  field: FormCreatorField;
  parentSection?: FormCreatorField;
}

export function findLocation(tree: FormCreatorField[], id: string): ItemLocation | null {
  const rootIdx = tree.findIndex((f) => f.id === id);
  if (rootIdx !== -1) {
    return { container: 'root', index: rootIdx, field: tree[rootIdx]! };
  }
  for (const sec of tree) {
    if (sec.type === 'section' && sec.fields) {
      const innerIdx = sec.fields.findIndex((inner) => inner.id === id);
      if (innerIdx !== -1) {
        return {
          container: sec.id,
          index: innerIdx,
          field: sec.fields[innerIdx]!,
          parentSection: sec,
        };
      }
    }
  }
  return null;
}

export const customCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

export function getFieldPillDisplay(field: FormCreatorField): { icon: React.ReactNode; text: string; hasCustomValue: boolean } {
  const hasCustomValue = Boolean(field.defaultValue && field.defaultValue.trim());
  const customVal = field.defaultValue?.trim() || '';

  switch (field.type) {
    case 'text':
      return {
        icon: null,
        text: hasCustomValue ? customVal : 'Texto o valor...',
        hasCustomValue,
      };
    case 'textarea':
      return {
        icon: null,
        text: hasCustomValue ? customVal : 'Descripción detallada...',
        hasCustomValue,
      };
    case 'date':
      return {
        icon: <Calendar className="h-3 w-3 text-emerald-500 shrink-0" />,
        text: hasCustomValue ? customVal : 'dd/mm/aaaa',
        hasCustomValue,
      };
    case 'time-hlv':
      return {
        icon: <Clock className="h-3 w-3 text-blue-500 shrink-0" />,
        text: hasCustomValue ? customVal : '00:00 (HLV)',
        hasCustomValue,
      };
    case 'cedula':
      return {
        icon: <Fingerprint className="h-3 w-3 text-amber-500 shrink-0" />,
        text: hasCustomValue ? (customVal.startsWith('V-') ? customVal : `V-${customVal}`) : 'V-00.000.000',
        hasCustomValue,
      };
    case 'dropdown': {
      const firstOpt = field.options?.[0];
      return {
        icon: <ListFilter className="h-3 w-3 text-orange-500 shrink-0" />,
        text: hasCustomValue ? customVal : (firstOpt ?? 'Seleccionar opción...'),
        hasCustomValue,
      };
    }
    default:
      return {
        icon: null,
        text: hasCustomValue ? customVal : 'Campo...',
        hasCustomValue,
      };
  }
}

export function getBadgeLabel(type: FormCreatorFieldType, isRepeatable?: boolean): string {
  if (type === 'separator') return 'Separador';
  if (type === 'section') return isRepeatable === false ? 'Sección' : 'Sección repetible';
  const found = AVAILABLE_FIELDS.find((f) => f.type === type);
  return found ? found.badgeLabel : type;
}
