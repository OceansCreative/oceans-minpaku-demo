import { seedCancellationPolicy, seedReminderTemplates } from '@/lib/seed';

import type { SliceCreator } from './types';
import type { CancellationPolicy, ReminderTemplate } from '@/types';


export interface PolicySlice {
  cancellationPolicy: CancellationPolicy[];
  reminderTemplates: ReminderTemplate[];

  upsertCancellationStep: (step: CancellationPolicy) => void;
  removeCancellationStep: (id: string) => void;

  upsertReminderTemplate: (template: ReminderTemplate) => void;
  removeReminderTemplate: (id: string) => void;
  toggleReminderTemplate: (id: string, enabled: boolean) => void;

  resetPolicySlice: () => void;
}

export const createPolicySlice: SliceCreator<PolicySlice> = (set) => ({
  cancellationPolicy: seedCancellationPolicy,
  reminderTemplates: seedReminderTemplates,

  upsertCancellationStep: (step) =>
    set((state) => {
      const exists = state.cancellationPolicy.some((s) => s.id === step.id);
      return {
        cancellationPolicy: exists
          ? state.cancellationPolicy.map((s) => (s.id === step.id ? step : s))
          : [...state.cancellationPolicy, step],
      };
    }),

  removeCancellationStep: (id) =>
    set((state) => ({
      cancellationPolicy: state.cancellationPolicy.filter((s) => s.id !== id),
    })),

  upsertReminderTemplate: (template) =>
    set((state) => {
      const exists = state.reminderTemplates.some((t) => t.id === template.id);
      return {
        reminderTemplates: exists
          ? state.reminderTemplates.map((t) => (t.id === template.id ? template : t))
          : [...state.reminderTemplates, template],
      };
    }),

  removeReminderTemplate: (id) =>
    set((state) => ({
      reminderTemplates: state.reminderTemplates.filter((t) => t.id !== id),
    })),

  toggleReminderTemplate: (id, enabled) =>
    set((state) => ({
      reminderTemplates: state.reminderTemplates.map((t) => (t.id === id ? { ...t, enabled } : t)),
    })),

  resetPolicySlice: () =>
    set({
      cancellationPolicy: seedCancellationPolicy,
      reminderTemplates: seedReminderTemplates,
    }),
});
