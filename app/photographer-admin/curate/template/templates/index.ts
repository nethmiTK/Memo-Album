import { template1 } from './template1';
import { template2 } from './template2';
import { template3 } from './template3';
import { template4 } from './template4';
import { template5 } from './template5';

export const TEMPLATE_CHOICES = [template1, template2, template3, template4, template5] as const;

export type TemplateChoice = (typeof TEMPLATE_CHOICES)[number];
export type TemplateId = TemplateChoice['id'];
