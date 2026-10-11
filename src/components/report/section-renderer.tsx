import React from 'react';
import { useWatch, Control } from 'react-hook-form';
import {
    TemplateConfig,
    SectionConfig,
    StaffRole,
    StaffMember,
    AppSettings,
    form_dataRecord,
    form_dataValue,
} from '@/lib/types';
import { evaluateCondition } from '@/lib/template-parser';
import { RepeatableSectionRenderer } from './sections/repeatable-section-renderer';
import { SingleSectionRenderer } from './sections/single-section-renderer';

export interface SectionRendererProps {
    section: SectionConfig;
    config: TemplateConfig;
    control: Control<any>; // Keep Control<any> for react-hook-form generic flexibility
    disabled?: boolean;
    roles: StaffRole[];
    rolesLoaded: boolean;
    activeGuardStaff: StaffMember[];
    predefinedValues: form_dataRecord;
    units: string[];
    setValue: (
        name: string,
        value: form_dataValue,
        options?: { shouldValidate?: boolean; shouldDirty?: boolean }
    ) => void;
    settings: AppSettings | null;
    isNested?: boolean;
    pathPrefix?: string;
    /** If provided, this value is used directly for condition evaluation instead of internal useWatch */
    conditionValue?: form_dataValue;
    targetConditionValue?: form_dataValue;
    wrapperClassName?: string;
}

export function SectionRenderer(props: SectionRendererProps) {
    const { section, config, control, pathPrefix = '', conditionValue, targetConditionValue } = props;
    
    if (!control || !control.register) {
        return null;
    }

    const condition = section.condition;
    const condition_mode = condition?.condition_mode || 'hide';

    const targetFieldId = condition?.target_field_id || (
        condition?.value.startsWith('{') && condition?.value.endsWith('}')
            ? condition.value.slice(1, -1).trim()
            : undefined
    );

    // For dotted condition field IDs like "Director.sex", we need to watch
    // the BASE field ("Director") and derive the property at evaluation time.
    const isDottedCondition = condition ? condition.field_id.includes('.') : false;
    const baseConditionfield_id = isDottedCondition && condition
        ? condition.field_id.slice(0, condition.field_id.indexOf('.'))
        : condition?.field_id;
    const conditionProp = isDottedCondition && condition
        ? condition.field_id.slice(condition.field_id.indexOf('.') + 1)
        : null;

    const watchPath = condition
        ? pathPrefix
            ? `${pathPrefix}.${baseConditionfield_id}`
            : (baseConditionfield_id ?? 'dummy_no_condition')
        : 'dummy_no_condition';

    // By passing the 'control' prop explicitly, we avoid potential context mismatches
    // during rapid re-renders or when components are rendered in different trees.
    const watchedFieldValue = useWatch({
        control,
        name: watchPath,
        disabled: !condition
    });

    // Right field watching (when comparing two fields)
    const isDottedTarget = targetFieldId ? targetFieldId.includes('.') : false;
    const baseTargetFieldId = isDottedTarget && targetFieldId
        ? targetFieldId.slice(0, targetFieldId.indexOf('.'))
        : targetFieldId;
    const targetConditionProp = isDottedTarget && targetFieldId
        ? targetFieldId.slice(targetFieldId.indexOf('.') + 1)
        : null;

    const targetWatchPath = targetFieldId
        ? pathPrefix
            ? `${pathPrefix}.${baseTargetFieldId}`
            : (baseTargetFieldId ?? 'dummy_no_target_condition')
        : 'dummy_no_target_condition';

    const watchedTargetValue = useWatch({
        control,
        name: targetWatchPath,
        disabled: !targetFieldId
    });

    // If the condition uses dot-notation (e.g. Director.sex), resolve the property
    // from the watched base value (e.g. Director[0].sex)
    let resolvedWatchValue = conditionValue !== undefined ? conditionValue : watchedFieldValue;
    if (isDottedCondition && conditionProp && resolvedWatchValue !== undefined) {
        if (Array.isArray(resolvedWatchValue) && resolvedWatchValue.length > 0) {
            const first = resolvedWatchValue[0];
            if (first && typeof first === 'object') {
                resolvedWatchValue = (first as Record<string, unknown>)[conditionProp] as form_dataValue ?? undefined;
            } else {
                resolvedWatchValue = undefined;
            }
        } else {
            resolvedWatchValue = undefined;
        }
    }

    // Fallback for 'sex' property when empty or undefined (e.g. when the field is cleared)
    if (isDottedCondition && conditionProp === 'sex') {
        if (resolvedWatchValue === undefined || resolvedWatchValue === null || resolvedWatchValue === '') {
            resolvedWatchValue = 'M';
        }
    }

    // Resolve target value (when comparing against another field)
    let resolvedTargetValue = targetConditionValue !== undefined ? targetConditionValue : watchedTargetValue;
    if (targetFieldId && isDottedTarget && targetConditionProp && resolvedTargetValue !== undefined) {
        if (Array.isArray(resolvedTargetValue) && resolvedTargetValue.length > 0) {
            const first = resolvedTargetValue[0];
            if (first && typeof first === 'object') {
                resolvedTargetValue = (first as Record<string, unknown>)[targetConditionProp] as form_dataValue ?? undefined;
            } else {
                resolvedTargetValue = undefined;
            }
        } else {
            resolvedTargetValue = undefined;
        }
    }
    if (targetFieldId && isDottedTarget && targetConditionProp === 'sex') {
        if (resolvedTargetValue === undefined || resolvedTargetValue === null || resolvedTargetValue === '') {
            resolvedTargetValue = 'M';
        }
    }

    let actualValueToEvaluate = resolvedWatchValue;
    let actualTargetValue = targetFieldId ? (resolvedTargetValue ?? '') : (condition?.value ?? '');

    let conditionMet = true;
    if (condition) {
        // If the field has snippet options (dropdown), check if we need to compare
        // against the value or the label. 'actualValueToEvaluate' might be the label.
        const fieldConfigKey = Object.keys(config.fields).find(k => k.toLowerCase() === condition.field_id.toLowerCase());
        const fieldConfig = fieldConfigKey ? config.fields[fieldConfigKey] : config.fields[condition.field_id];

        if (fieldConfig?.snippet_options?.length) {
            const options = fieldConfig.snippet_options;
            const targetValStr = String(actualTargetValue);
            const matchedOpt = options.find(
                (opt: any) => opt.value === targetValStr || opt.label === targetValStr
            );

            if (matchedOpt) {
                if (actualValueToEvaluate === matchedOpt.label || actualValueToEvaluate === String(matchedOpt.value)) {
                    actualValueToEvaluate = targetValStr;
                }
            }
        }

        // If target field is a dropdown, resolve its option label
        if (targetFieldId) {
            const targetConfigKey = Object.keys(config.fields).find(k => k.toLowerCase() === targetFieldId.toLowerCase());
            const targetConfig = targetConfigKey ? config.fields[targetConfigKey] : config.fields[targetFieldId];

            if (targetConfig?.snippet_options?.length) {
                const options = targetConfig.snippet_options;
                const matchedOpt = options.find(
                    (opt: any) => opt.value === actualTargetValue || opt.label === actualTargetValue
                );
                if (matchedOpt) {
                    actualTargetValue = matchedOpt.label;
                }
            }
        }

        // When comparing two fields, if both are empty/unset, condition between two fields is not satisfied
        if (targetFieldId) {
            const leftEmpty = actualValueToEvaluate === undefined || actualValueToEvaluate === null || String(actualValueToEvaluate).trim() === '';
            const rightEmpty = actualTargetValue === undefined || actualTargetValue === null || String(actualTargetValue).trim() === '';
            if (leftEmpty && rightEmpty) {
                conditionMet = false;
            } else {
                conditionMet = evaluateCondition(
                    actualValueToEvaluate,
                    condition.operator || '=',
                    String(actualTargetValue)
                );
            }
        } else {
            conditionMet = evaluateCondition(
                actualValueToEvaluate,
                condition.operator || '=',
                String(actualTargetValue)
            );
        }

        // hide mode (default): fields disappear from form when condition not met
        if (!conditionMet && condition_mode === 'hide') {
            return null;
        }
    }

    const inner = section.is_repeatable
        ? <RepeatableSectionRenderer {...props} />
        : <SingleSectionRenderer {...props} />;

    // show mode: always render — no wrapper, just like a normal section
    return inner;
}

