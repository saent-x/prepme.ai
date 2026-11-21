import { z } from 'zod';
import { isVoice } from '$lib/templates';

export const InterviewerForm = z.object({
  name: z.string().trim().min(2, 'Give the interviewer a name').max(80),
  instructions: z
    .string()
    .trim()
    .min(20, 'Describe how the interview should go (at least a sentence or two)')
    .max(8000),
  voice: z.string().refine(isVoice, 'Pick a voice'),
  template: z.string().max(60).optional().nullable()
});
